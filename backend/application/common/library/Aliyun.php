<?php

namespace app\common\library;
use Exception;
use OSS\Core\OssException;
use OSS\OssClient;

/**
 * Aliyun云存储
 * Class Client
 * @package common\components\wsd
 */
class Aliyun
{
    /**
     * @var string AccessKey 密匙
     */
    public $accessKey;
    /**
     * @var string SecretKey 秘钥
     */
    public $secretKey;
    /**
     * @var string EndPoint 地域节点
     */
    public $endPoint;
    /**
     * @var string Bucket 存储空间名称
     */
    public $bucket;
    /**
     * @var string 访问域名
     */
    public $domain;
    /** @var OssClient */
    public $ossClient;
    /** @var Aliyun */
    public static $client;

    /**
     * 类初始化（配置参数）
     */
    public function __construct() {
        //从配置中获取数据
        $this->accessKey = \think\config::get('site.aliyunaccesskey');
        $this->secretKey = \think\config::get('site.aliyunsecretkey');
        $this->endPoint = \think\config::get('site.aliyunendpoint');
        $this->bucket = \think\config::get('site.aliyunbucket');
        $this->domain = \think\config::get('site.aliyundomain');
        if (empty($this->accessKey) || empty($this->secretKey)) {
            throw new Exception('初始化失败，缺少阿里云密匙秘钥');
        }
        if (empty($this->endPoint)) {
            throw new Exception('初始化失败，缺少阿里云地域节点名称');
        }
        if (empty($this->bucket)) {
            throw new Exception('初始化失败，缺少阿里云存储空间名称');
        }
        $this->ossClient = new OssClient($this->accessKey, $this->secretKey, $this->endPoint);
    }

    /**
     * @return Aliyun
     */
    public static function getOss() {
        if (!static::$client) {
            $oss = new self();
            return self::$client = $oss;
        }
        return self::$client;
    }

    /**
     * 文件上传方法(以流形式上传)
     * @param $filename
     * @param $data
     * @return  [文件类型]
     * @throws Exception
     */
    public function uploadOs($filename, $data) {
        try {
            $result = $this->ossClient->putObject($this->bucket, $filename, $data);
            return $result['info']['url'];
        } catch (Exception $e) {
            throw new  Exception($e->getMessage());
        }
    }

    /**
     * 文件上传方法(以文件形式上传)
     * @param $remote
     * @param $local
     * @return string
     * @throws Exception
     */
    public function uploadFile($remote, $local) {
        try {
            $result = $this->ossClient->uploadFile($this->bucket, $remote, $local);
            return $result['info']['url'];
        } catch (Exception $e) {
            throw new  Exception($e->getMessage());
            return false;
        }
    }

    /**
     * 文件删除
     * @param $filename
     * @throws Exception
     */
    public function deleteObj($filename) {
        try {
            $this->ossClient->deleteObject($this->bucket, $filename);
        } catch (Exception $e) {
            throw new  Exception($e->getMessage());
        }
    }

    /**
     * 展示目录内容
     * @param $path
     * @return \OSS\Model\ObjectListInfo
     * @throws Exception
     */
    public function listObj($path = '') {
        try {
            if ($path) {
                $path = trim($path, '/') . '/';
            }
            $res = $this->ossClient->listObjects($this->bucket, [
                OssClient::OSS_PREFIX => $path,
                OssClient::OSS_MAX_KEYS => 300,
            ]);
            return $res;
        } catch (Exception $e) {
            throw new  Exception($e->getMessage());
        }
    }

    /**
     * 判断文件或目录是否存在
     * @param $path string 目录以 / 结尾
     * @return bool
     * @throws Exception
     */
    public function isExists(&$path) {
        try {
            $basename = basename($path);
            if (strpos($basename, '.') === false) {
                // 没有点的默认为目录，目录需要以 / 结尾
                $path = rtrim($path, '/') . '/';
            }
            $path = ltrim($path, '/');
            return $this->ossClient->doesObjectExist($this->bucket, $path);
        } catch (Exception $e) {
            throw new  Exception($e->getMessage());
        }
    }

    /**
     * 创建目录
     * @param $path
     * @return bool
     * @throws Exception
     */
    public function mkDir($path) {
        try {
            return $this->ossClient->createObjectDir($this->bucket, rtrim($path, '/'));
        } catch (Exception $e) {
            throw new  Exception($e->getMessage());
        }
    }

    /**
     * 获取文件内容
     * @param $path
     * @return string
     * @throws Exception
     */
    public function getContent($path) {
        try {
            return $this->ossClient->getObject($this->bucket, $path);
        } catch (OssException $e) {
            if ($e->getErrorCode() == 'NoSuchKey') {
                throw new Exception('文件不存在');
            }
        } catch (\Exception $e) {
            throw new  Exception($e->getMessage());
        }
    }

    /**
     * 拼装OSS域名
     * @param $path
     * @param bool $checkExists
     * @return string
     * @throws Exception
     */
    public function getUrl($path, $checkExists = false) {
        if ($checkExists) {
            $res = $this->isExists($path);
            if (!$res) {
                throw new Exception('图片不存在');
            }
        }
        return rtrim($this->domain, '/') . '/' . ltrim($path, '/');
    }
}
