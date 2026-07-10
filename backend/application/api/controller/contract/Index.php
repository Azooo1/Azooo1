<?php

namespace app\api\controller\contract;

use app\admin\model\article\Article;
use app\admin\model\Reward;
use app\admin\model\article\Slide;
use app\admin\model\contract\Order;
use app\admin\model\contract\Pool;
use app\admin\model\user\Money;
use app\admin\model\user\Pricelog;
use app\common\controller\Api;
use app\common\controller\Price;
use think\Config;

/**
 * 首页
 */
class Index extends Api
{
    // 无需登录的接口,*表示全部
    protected $noNeedLogin = '*';

    public function _initialize()
    {
        parent::_initialize();
    }

    /**
     * 首页信息
     */
    public function index()
    {
        $data = [
            "dappUrl1"=>Config::get("site.dapp_url1"),
            "dappUrl2"=>Config::get("site.dapp_url2"),
            "dappUrl3"=>Config::get("site.dapp_url3"),
            "dappUrl4"=>Config::get("site.dapp_url4"),
            "dappUrl5"=>Config::get("site.dapp_url5"),
            "topThumb"=>cdnurl(Config::get("site.dapp_thumb_top"),true),
            "nodeThumb"=>cdnurl(Config::get("site.dapp_thumb_node"),true),
            "topUrl"=>Config::get("site.dapp_url_top"),
            "nodeUrl"=>Config::get("site.dapp_url_node"),

        ];
        $this->success(__("首页信息"), $data);
    }

    public function getLine(){
        $list=Pricelog::order('id desc')->limit(7)->select();
        $newlist=array_reverse($list);
        $this->success('获取成功',$newlist);
    }
    /**
     * 二期首页
     */
    public function getInfo()
    {
        $slide1 = Slide::where("type",1)->where("lang",$this->request->langset())->where("status",1)
            ->field("id,thumb,url")
            ->order("displayorder desc,id desc")->limit(6)->select();
        foreach ($slide1 as $k=>$v){
            $slide1[$k]["thumb"] = cdnurl($v['thumb'],true);
        }
        $slide2 = Slide::where("type",2)->where("lang",$this->request->langset())->where("status",1)
            ->field("id,thumb,url")
            ->order("displayorder desc,id desc")->limit(6)->select();
        foreach ($slide2 as $k=>$v){
            $slide2[$k]["thumb"] = cdnurl($v['thumb'],true);
        }
        $slide3 = Slide::where("type",3)->where("lang",$this->request->langset())->where("status",1)
            ->field("id,thumb,url")
            ->order("displayorder desc,id desc")->find();
        if(!empty($slide3)){
            $slide3["thumb"] = cdnurl($slide3['thumb'],true);
        }

        $reward=Reward::get(1);
        $data = [
            "name"=>Config::get("site.name"),
            "slide1"=>$slide1?$slide1:null,
            "slide2"=>$slide2?$slide2:null,
            "slide3"=>$slide3?$slide3:null,
            "dappUrl1"=>Config::get("site.dapp_url1"),
            "dappUrl2"=>Config::get("site.dapp_url2"),
            "dappUrl3"=>Config::get("site.dapp_url3"),
            "dappUrl4"=>Config::get("site.dapp_url4"),
            "dappUrl5"=>Config::get("site.dapp_url5"),
            "topThumb"=>cdnurl(Config::get("site.dapp_thumb_top"),true),
            "nodeThumb"=>cdnurl(Config::get("site.dapp_thumb_node"),true),
            "topUrl"=>Config::get("site.dapp_url_top"),
            "nodeUrl"=>Config::get("site.dapp_url_node"),
            "web_help"=>htmlspecialchars_decode(Config::get("site.web_help")),
            "reward1"=>$reward['reward1'],
            "reward2"=>$reward['reward2'],
            "reward3"=>$reward['reward3'],
        ];
//        $price=Price::getPrice();
        //卖出参数配置
        $data["sell_min"]=Money::where('user_id',$this->auth->id)->where('type',Money::BUY)->whereTime('create_time','today')->sum('num');
        $data["sell_status"]=Config::get("site.sell_status");
        $data["sell_max"]=Config::get("site.sell_max");
        $data["sell_num"]=Config::get("site.sell_num");
        $data["buy_min"]=abs(Money::where('user_id',$this->auth->id)->where('type',Money::SELL)->whereTime('create_time','today')->sum('num'));
        $data["buy_status"]=Config::get("site.buy_status");
        $data["buy_max"]=Config::get("site.buy_max");
        $data["buy_num"]=Config::get("site.buy_num");

        $data["liutong_num"]=Config::get("site.liutong_num");
        $data["xiaohui_num"]=Config::get("site.xiaohui_num");
        $data["price"]=Config::get("site.coin_price");
        $last_price=Pricelog::order('id desc')->limit(1)->value('num');
        if ($last_price == 0) {
            $data['price_rate']=0;
        }
        // 核心计算公式：(今日价格 - 昨日价格) / 昨日价格 * 100%
        $change_rate = ($data["price"] - $last_price) / $last_price * 100;
        // 保留指定小数位数
        $data['price_rate'] = round($change_rate, 2);
        $this->success(__("首页信息"),$data);
    }
    /**
     * 公告列表
     */
    public function getNotice()
    {
        if(isset($_SERVER["HTTP_LANG"])){
            $lang = $_SERVER["HTTP_LANG"] == "en" ? 2 : 1;
        }else{
            $lang = 1;
        }
        $list = Article::where("status", 1)->where("lang", $lang)
            ->field("id,title,info,createtime")
            ->order("id desc")
            ->select();
        $data = [
            "list"=>$list?$list:[]
        ];
        $this->success(__("公共列表"),$data);
    }
    /**
     * 公告详情
     */
    public function detail()
    {
        $id = $this->request->post("id");
        if (empty($id)) {
            $this->error(__("Information acquisition failed"));
        }
        $detail = Article::where("id", $id)->find();
        if (empty($detail)) {
            $this->error(__("Information acquisition failed"));
        }
        $detail->info = htmlspecialchars_decode($detail->info);
        $data = [
            "detail" => $detail,
        ];
        $this->success(__("公告详情"), $data);
    }
}
