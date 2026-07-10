<?php
/**
 * Create By PhpStrom
 * @Author: BeiTa
 * @Date: 2023/8/24
 * @Time: 17:30
 */

namespace app\common\controller;

use app\admin\model\user\Pricelog;
use think\Config;
use think\Controller;

/**
 * 项目公共控制器
 * @package app\common\controller
 */
class Price extends Controller
{
    public function setPrice(){
        $price=Config::get('site.coin_price');
        $day=date('Y-m-d',time()-86400);
        $create_time=time();
        if(Pricelog::where('day',$day)->find()){
            Pricelog::where('day',$day)->update(['num'=>$price,'create_time'=>$create_time]);
        }else{
            Pricelog::insert(['num'=>$price,'day'=>$day,'create_time'=>$create_time]);
        }
        return true;
    }

    /**
     * 获取BSC链上指定合约的所有持有人信息
     */
    public static function getPrice()
    {
        $url = "https://api.dexscreener.com/latest/dex/pairs/bsc/0x0bc03c0d7e62a0bd2477c317bdf30fe9463cb388";
        // 发起请求
        $data = self::httpGet($url);
        $row=json_decode($data,true);
        $price=$row['pairs']['0']['priceUsd'];
        if($price<=0){
            $price=1;
        }
        return $price;
    }

    /**
     * 发送GET请求
     * @param string $url 请求地址
     * @param int $timeout 超时时间(秒)
     * @return string|false 响应内容
     */
    private static function httpGet($url, $timeout = 10)
    {
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => $timeout,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        ]);

        $response = curl_exec($ch);
        if (curl_errno($ch)) {
            trace('cURL错误: ' . curl_error($ch), 'error');
            $response = false;
        }
        curl_close($ch);

        return $response;
    }
}
