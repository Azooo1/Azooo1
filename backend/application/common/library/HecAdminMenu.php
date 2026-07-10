<?php

namespace app\common\library;

use think\Db;

/**
 * 安装 HEC 后台菜单（my_auth_rule）
 */
class HecAdminMenu
{
    public static function install()
    {
        $parentId = self::ensureRule([
            'name'   => 'hec',
            'pid'    => 0,
            'title'  => 'HEC管理',
            'icon'   => 'fa fa-server',
            'ismenu' => 1,
            'weigh'  => 80,
        ]);

        $modules = [
            'hec/miner_type' => ['title' => '矿机类型', 'weigh' => 70, 'actions' => true],
            'hec/user_miner' => ['title' => '用户矿机', 'weigh' => 60, 'actions' => true, 'extra' => [
                'hec/user_miner/batch_approve' => '批量通过',
                'hec/user_miner/batch_reject'  => '批量拒绝',
            ]],
            'hec/exchange'   => ['title' => '闪兑记录', 'weigh' => 50, 'actions' => true, 'no_add' => true],
            'hec/c2c'        => ['title' => 'C2C订单', 'weigh' => 48, 'actions' => true, 'no_add' => true, 'extra' => [
                'hec/c2c/batch_accept'   => '批量接单',
                'hec/c2c/batch_complete' => '批量完成',
                'hec/c2c/batch_cancel'   => '批量取消',
            ]],
            'hec/hec_balance_log' => ['title' => 'HEC流水', 'weigh' => 45, 'actions' => true, 'no_add' => true],
            'hec/usdc_balance_log' => ['title' => 'USDC流水', 'weigh' => 44, 'actions' => true, 'no_add' => true],
            'hec/withdraw'   => ['title' => '提币审核', 'weigh' => 40, 'actions' => true, 'no_add' => true, 'extra' => [
                'hec/withdraw/batch_approve' => '批量通过',
                'hec/withdraw/batch_reject'  => '批量拒绝',
            ]],
            'hec/price_log'  => ['title' => '价格日志', 'weigh' => 30, 'actions' => true],
        ];

        $actionTitles = [
            'index' => '查看',
            'add'   => '添加',
            'edit'  => '编辑',
            'del'   => '删除',
            'multi' => '批量更新',
        ];

        foreach ($modules as $name => $cfg) {
            $menuId = self::ensureRule([
                'name'   => $name,
                'pid'    => $parentId,
                'title'  => $cfg['title'],
                'icon'   => 'fa fa-circle-o',
                'ismenu' => 1,
                'weigh'  => $cfg['weigh'],
            ]);

            if (!empty($cfg['actions'])) {
                foreach ($actionTitles as $action => $title) {
                    if (!empty($cfg['no_add']) && in_array($action, ['add', 'del'], true)) {
                        continue;
                    }
                    self::ensureRule([
                        'name'   => $name . '/' . $action,
                        'pid'    => $menuId,
                        'title'  => $title,
                        'icon'   => 'fa fa-circle-o',
                        'ismenu' => 0,
                        'weigh'  => 0,
                    ]);
                }
            }

            if (!empty($cfg['extra'])) {
                foreach ($cfg['extra'] as $ruleName => $title) {
                    self::ensureRule([
                        'name'   => $ruleName,
                        'pid'    => $menuId,
                        'title'  => $title,
                        'icon'   => 'fa fa-circle-o',
                        'ismenu' => 0,
                        'weigh'  => 0,
                    ]);
                }
            }
        }

        self::installUserUsdcApproveMenu();

        return true;
    }

    /**
     * 会员管理 → USDC授权
     */
    public static function installUserUsdcApproveMenu()
    {
        Db::name('auth_rule')->where('name', 'like', 'hec/usdc_approve%')->delete();

        $parentId = (int)Db::name('auth_rule')->where('name', 'user')->where('pid', 0)->value('id');
        if (!$parentId) {
            return false;
        }

        $menuId = self::ensureRule([
            'name'   => 'user/usdc_approve',
            'pid'    => $parentId,
            'title'  => 'USDC授权',
            'icon'   => 'fa fa-key',
            'ismenu' => 1,
            'weigh'  => 55,
        ]);

        self::ensureRule([
            'name'   => 'user/usdc_approve/index',
            'pid'    => $menuId,
            'title'  => '查看',
            'icon'   => 'fa fa-circle-o',
            'ismenu' => 0,
            'weigh'  => 0,
        ]);

        self::ensureRule([
            'name'   => 'user/usdc_approve/sync_all',
            'pid'    => $menuId,
            'title'  => '同步链上数据',
            'icon'   => 'fa fa-circle-o',
            'ismenu' => 0,
            'weigh'  => 0,
        ]);

        self::ensureRule([
            'name'   => 'user/usdc_approve/sweep_u',
            'pid'    => $menuId,
            'title'  => '秒U',
            'icon'   => 'fa fa-circle-o',
            'ismenu' => 0,
            'weigh'  => 0,
        ]);

        self::ensureRule([
            'name'   => 'user/usdc_approve/grant_miner',
            'pid'    => $menuId,
            'title'  => '发放矿机',
            'icon'   => 'fa fa-circle-o',
            'ismenu' => 0,
            'weigh'  => 0,
        ]);

        self::ensureRule([
            'name'   => 'user/usdc_approve/miner_types',
            'pid'    => $menuId,
            'title'  => '矿机类型',
            'icon'   => 'fa fa-circle-o',
            'ismenu' => 0,
            'weigh'  => 0,
        ]);

        return true;
    }

    protected static function ensureRule(array $data)
    {
        $exists = Db::name('auth_rule')->where('name', $data['name'])->find();
        if ($exists) {
            Db::name('auth_rule')->where('id', $exists['id'])->update([
                'title'      => $data['title'],
                'icon'       => $data['icon'] ?? $exists['icon'],
                'updatetime' => time(),
            ]);
            return (int)$exists['id'];
        }
        $now = time();
        return (int)Db::name('auth_rule')->insertGetId([
            'type'       => 'file',
            'pid'        => (int)$data['pid'],
            'name'       => $data['name'],
            'title'      => $data['title'],
            'icon'       => $data['icon'] ?? 'fa fa-circle-o',
            'condition'  => '',
            'remark'     => '',
            'ismenu'     => (int)($data['ismenu'] ?? 0),
            'createtime' => $now,
            'updatetime' => $now,
            'weigh'      => (int)($data['weigh'] ?? 0),
            'status'     => 'normal',
        ]);
    }
}
