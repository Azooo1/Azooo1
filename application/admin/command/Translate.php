<?php

namespace app\admin\command;

use think\console\Command;
use think\console\Input;
use think\console\input\Option;
use think\console\Output;
use think\Env;
use think\Exception;

/**
 * 翻译
 * 自动检测	auto	中文	zh	英语	en
粤语	yue	文言文	wyw	日语	jp
韩语	kor	法语	fra	西班牙语	spa
泰语	th	阿拉伯语	ara	俄语	ru
葡萄牙语	pt	德语	de	意大利语	it
希腊语	el	荷兰语	nl	波兰语	pl
保加利亚语	bul	爱沙尼亚语	est	丹麦语	dan
芬兰语	fin	捷克语	cs	罗马尼亚语	rom
斯洛文尼亚语	slo	瑞典语	swe	匈牙利语	hu
繁体中文	cht	越南语	vie
 *
 */
class Translate extends Command
{
    protected function configure()
    {
        $this->setName('translate')
            ->addOption('file', 'f', Option::VALUE_OPTIONAL, 'controller name', null)
            ->addOption('language', 'l', Option::VALUE_OPTIONAL, 'language', 'en')
            ->addOption('tool', 't', Option::VALUE_OPTIONAL, 'language', 'baidu')
            ->setDescription('translation tool');
    }
    protected function execute(Input $input, Output $output)
    {
        //文件
        $file = $input->getOption('file');
        if (!$file) {
            throw new Exception('file name can\'t empty');
        }

        //语言
        $lang = $input->getOption('language') ?: 'en';

        //翻译工具 百度
        $tool = $input->getOption('tool') ?: 'baidu';
        //获取源文件信息
        if(!is_file(APP_PATH."api/lang/zh-cn/".$file.".php")){
            throw new Exception("请核对路径[$file]是否正确");
        }

        $codeInfo = file_get_contents(APP_PATH."api/lang/zh-cn/".$file.".php");
        if(empty($codeInfo)){
            throw new Exception("请核对路径[$file]是否正确");
        }
        //解析数据结构
        $codeData = (explode('"',$codeInfo));
        $num = 1;
        foreach ($codeData as $k=>$v){
            if($k == $num){
                $data[$v] = '"'.$v.'"';
                $num += 4;
            }
        }
        //构造新数据
        $body = "<?php".PHP_EOL.PHP_EOL."return [".PHP_EOL;
        foreach ($data as $ks=>$vs){
            if($tool == "baidu") {
                if($lang == "zh-cn"){
                    $toLang = "zh";
                }elseif($lang == "zh-tw"){
                    $toLang = "cht";
                }else{
                    $toLang = $lang;
                }
                $dst = $this->getBaiduFanyi($ks, $toLang);
            }elseif($tool == "youdao"){
                if($lang == "zh-cn"){
                    $toLang = "zh-CHS";
                }else{
                    $toLang = $lang;
                }
                $dst = $this->getYoudaoFanyi($ks,$toLang);
                sleep(1);
            }
            $body.= "  ".$vs.' => "'.$dst.'",'.PHP_EOL;
        }
        $body.="];".PHP_EOL;
        $output->info($body);
        //更新文件数据
        $pathname = str_replace("zh-cn",$lang,APP_PATH."api/lang/zh-cn/".$file.".php");
        if (!is_dir(dirname($pathname))) {
            mkdir(dirname($pathname), 0755, true);
        }
        file_put_contents($pathname,$body);
        $output->info("Translate Successed!");
    }
    /**
     * 翻译
     */
    public function getBaiduFanyi($keyword,$to = "en")
    {
        $appid = Env::get("baidu.appid");
        $appkey = Env::get("baidu.appkey");
        if(empty($appid)){
            throw new  Exception("baidu_appid 参数缺失");
        }
        if(empty($appkey)){
            throw new  Exception("baidu_appkey 参数缺失");
        }
        try {
            $salt = time() . rand(1, 10000);
            $sign = md5($appid . $keyword . $salt . $appkey);
            $url = "http://api.fanyi.baidu.com/api/trans/vip/translate?q=" . urlencode($keyword) . "&from=zh&to=" . $to . "&appid=" . $appid . "&salt=" . $salt . "&sign=" . $sign;
            $data = file_get_contents($url);
            $data = json_decode($data, true);
            if (isset($data['error_code'])) {
                throw new \Exception($data['error_msg']);
            }
        }catch (\Exception $e){
            throw new Exception($e->getMessage());
        }
        return $data["trans_result"][0]["dst"];
    }
    /**
     * 有道翻译
     */
    public function getYoudaoFanyi($keyword,$to = "en")
    {
        $appid = Env::get("youdao.appid");
        $appkey = Env::get("youdao.appkey");
        if(empty($appid)){
            throw new  Exception("youdao 参数缺失");
        }
        if(empty($appkey)){
            throw new  Exception("youdao 参数缺失");
        }
        try{
            $params = array('q' => htmlspecialchars($keyword, ENT_QUOTES, 'UTF-8'),
                'from' => 'zh-CHS',
                'to' => $to,
            );
            $params = $this->add_auth_params($params, $appid, $appkey);
            $data = $this->do_call('http://openapi.youdao.com/api', 'post', array(), $params, 'application/json');
        }catch (\Exception $e){
            throw new Exception($e->getMessage());
        }
        return $data["translation"][0];
    }
    public function do_call($url, $method, $header, $param, $expectContentType, $timeout = 3000)
    {
        $curl = curl_init();
        curl_setopt($curl, CURLOPT_TIMEOUT, $timeout);
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
        if (!empty($header)) {
            curl_setopt($curl, CURLOPT_HTTPHEADER, $header);
        }
        $data = http_build_query($param);
        if ($method == 'post') {
            curl_setopt($curl, CURLOPT_POST, 1);
            curl_setopt($curl, CURLOPT_POSTFIELDS, $data);
        } else if ($method == 'get') {
            $url = $url . '?' . $data;
        } else {
            print 'http method not support';
            return null;
        }
        curl_setopt($curl, CURLOPT_URL, $url);
        $r = curl_exec($curl);
        $contentType = curl_getinfo($curl, CURLINFO_CONTENT_TYPE);
        if (strpos($contentType, $expectContentType) === false) {
            echo $r;
            $r = null;
        }
        curl_close($curl);
        return json_decode($r,true);
    }
    public function add_auth_params($param, $appKey, $appSecret)
    {
        if (array_key_exists('q', $param)) {
            $q = $param['q'];
        } else {
            $q = $param['img'];
        }
        $salt = $this->create_uuid();
        $curtime = strtotime("now");
        $sign = $this->calculate_sign($appKey, $appSecret, $q, $salt, $curtime);
        $param['appKey'] = $appKey;
        $param['salt'] = $salt;
        $param["curtime"] = $curtime;
        $param['signType'] = 'v3';
        $param['sign'] = $sign;
        return $param;
    }

    public function create_uuid()
    {
        $str = md5(uniqid(mt_rand(), true));
        $uuid = substr($str, 0, 8) . '-';
        $uuid .= substr($str, 8, 4) . '-';
        $uuid .= substr($str, 12, 4) . '-';
        $uuid .= substr($str, 16, 4) . '-';
        $uuid .= substr($str, 20, 12);
        return $uuid;
    }

    public function calculate_sign($appKey, $appSecret, $q, $salt, $curtime)
    {
        $strSrc = $appKey . $this->get_input($q) . $salt . $curtime . $appSecret;
        return hash("sha256", $strSrc);
    }

    public function get_input($q)
    {
        if (empty($q)) {
            return null;
        }
        $len = mb_strlen($q, 'utf-8');
        return $len <= 20 ? $q : (mb_substr($q, 0, 10) . $len . mb_substr($q, $len - 10, $len));
    }
}
