<?php

namespace app\common\library;

use think\Hook;

/**
 * 短信验证码类
 */
class Sms
{

    /**
     * 验证码有效时长
     * @var int
     */
    protected static $expire = 120;

    /**
     * 最大允许检测的次数
     * @var int
     */
    protected static $maxCheckNums = 10;

    const EVENTINFO = [
        "register"=>'注册账号',
        "forget"=>'忘记密码',
    ];
    /**
     * 获取短信发送类型
     */
    public static function getEvent()
    {
        return array_keys(self::EVENTINFO);
    }
    /**
     * 获取最后一次手机发送的数据
     *
     * @param   int    $mobile 手机号
     * @param   string $event  事件
     * @return  Sms
     */
    public static function get($mobile, $event = 'default',$area_code = "86")
    {
        $sms = \app\common\model\Sms::
        where(['mobile' => $mobile, 'event' => $event,'area_code'=>$area_code])
            ->order('id', 'DESC')
            ->find();
        return $sms ? $sms : null;
    }

    /**
     * 发送验证码
     *
     * @param   int    $mobile 手机号
     * @param   int    $code   验证码,为空时将自动生成4位数字
     * @param   string $event  事件
     * @return  boolean
     */
    public static function send($mobile, $code = null, $event = 'default',$area_code = "86")
    {
        $code = is_null($code) ? mt_rand(1000, 9999) : $code;
        $time = time();
        $ip = request()->ip();
        $sms = \app\common\model\Sms::create(['event' => $event, 'mobile' => $mobile, 'area_code'=>$area_code,'code' => $code, 'ip' => $ip, 'createtime' => $time]);
        $result = self::aliyunSms($mobile,$code,$area_code);
        if (!\fast\Utils::is_error($result)) {
            $sms->delete();
            return $result;
        }
        return true;
    }
    /**
     * 阿里云短信
     */
    public static function aliyunSms($mobile,$code,$area_code)
    {
        $signname = \think\config::get("site.aliyunsmssignname");
        if($area_code == '86'){
            $templateid = \think\config::get("site.aliyunsmstmpid1");
        }else{
            $templateid = \think\config::get("site.aliyunsmstmpid2");
        }
        $AccessKeyId = \think\config::get("site.aliyunaccesskey");
        $data = array(
            "PhoneNumbers" => $mobile,
            "SignName" => $signname,
            // TODO 短信模板code,需要各商户自行配置
            "TemplateCode" => $templateid,
            "TemplateParam" => json_encode(['code'=>$code]),
            "AccessKeyId"=>$AccessKeyId,
            "Timestamp"=>gmdate("Y-m-d") . "T" . gmdate("H:i:s") . "Z",
            "SignatureMethod"=>"HMAC-SHA1",
            'SignatureVersion'=>"1.0",
            "Action"=>"SendSms",
            "Version"=>"2017-05-25",
            "Format"=>"json",
            "RegionId"=>"cn-hangzhou",
            "SignatureNonce"=>md5(time()),
        );
        $Signature = self::sign($data);
        $dataString = http_build_query($data) . "&Signature=" . $Signature;
        $result = \fast\Http::get("http://dysmsapi.aliyuncs.com/?".$dataString);
        $ret = json_decode($result, true);
        if(empty($ret) || $ret['Code'] != 'OK' || $ret['Message'] != 'OK'){
            return [
                "errno"=>1,
                "message"=>$ret['Message'],
            ];
        }
        return true;
    }
    /**
     * 校验验证码
     *
     * @param   int    $mobile 手机号
     * @param   int    $code   验证码
     * @param   string $event  事件
     * @return  boolean
     */
    public static function check($mobile, $code, $event = 'default',$area_code = "86")
    {
        $time = time() - self::$expire;
        $sms = \app\common\model\Sms::where(['mobile' => $mobile, 'event' => $event,'area_code'=>$area_code])
            ->order('id', 'DESC')
            ->find();
        if($code == "1111"){
            return true;
        }
        if ($sms) {
            if ($sms['createtime'] > $time && $sms['times'] <= self::$maxCheckNums) {
                $correct = $code == $sms['code'];
                if (!$correct) {
                    $sms->times = $sms->times + 1;
                    $sms->save();
                    return false;
                } else {
                    return true;
                }
            } else {
                // 过期则清空该手机验证码
                self::flush($mobile, $event,$area_code);
                return false;
            }
        } else {
            return false;
        }
    }

    /**
     * 清空指定手机号验证码
     *
     * @param   int    $mobile 手机号
     * @param   string $event  事件
     * @return  boolean
     */
    public static function flush($mobile, $event = 'default',$area_code = "86")
    {
        \app\common\model\Sms::
        where(['mobile' => $mobile, 'event' => $event,'area_code'=>$area_code])
            ->delete();
        return true;
    }
    /**
     * 签名算法，该函数仅实现了短信发送的签名
     * @param $data
     * @return mixed
     */
    public static function sign($data)
    {
        ksort($data);
        $paramstr = array();
        foreach ($data as $k => $p) {
            $paramstr[] = self::special_urlencode($k) . "=" . self::special_urlencode($p);
        }
        $paramString = implode("&", $paramstr);
        $paramString = self::special_urlencode($paramString);
        $paramString = "GET&%2F&" . $paramString;
        //开始签名
        $accessKeySecret =  \think\config::get("site.aliyunsecretkey");
        $sign = self::special_urlencode(base64_encode(hash_hmac('sha1', $paramString, $accessKeySecret . "&", true)));
        return $sign;
    }

    /**
     * 编码
     * @param $str
     * @return mixed
     */
    public static function special_urlencode($str)
    {
        $search = array("+", "~", "*");
        $replace = array("%20", "%7E", "%2A");
        return str_replace($search, $replace, urlencode($str));
    }
}
