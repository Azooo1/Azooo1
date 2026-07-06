<?php

namespace app\api\controller;

use app\admin\model\contract\Lp;
use app\admin\model\contract\Order;
use app\admin\model\contract\Pool;
use app\admin\model\contract\Queue;
use app\admin\model\contract\Rebate;
use app\admin\model\contract\User;
use app\common\controller\Api;
use app\common\library\Aes;
use app\common\library\GoogleAuthenticator;
use app\common\library\Hash;
use Elliptic\EC;
use fast\Random;
use Web3\Contracts\Ethabi;
use Web3\Contracts\Types\Address;
use Web3\Contracts\Types\Bytes;
use Web3\Contracts\Types\Str;
use Web3\Contracts\Types\Uinteger;
use Web3\Utils;

/**
 * 定时接口
 * @ApiInternal
 */
class Crontab extends Api
{
	// 无需登录的接口,*表示全部
	protected $noNeedLogin = '*';

	public function _initialize()
	{
		// 只可以以cli方式执行
		if (!$this->request->isCli())
			//$this->error('Autotask script only work at client!');
		parent::_initialize();
		// 清除错误
		error_reporting(0);

		// 设置永不超时
		set_time_limit(0);
	}
	/**
	 * 定时任务
	 */
	public function index()
	{
	    $this->addLog("crontab","定时开始");
	}
    /**
     * 定时处理
     */
    public function crontab()
    {
        $hash = new Hash();
        $hash->crontab();
        \app\admin\model\contract\Hash::crontab();
    }

    /**
     * 博饼价格
     * @return void
     */
    public function linePrice()
    {
        $pool = new Pool();
        $pool->getDaibiPrice();
        exit;
    }

    /**
     * 用户lp
     */
    public function userLp()
    {
        //用户lp 监听 todo
        $user = new User();
        $user->crontabLp();
        exit;
    }
    /**
     * 分红
     */
    public function pool()
    {
        $pool = new Pool();
        $pool->crontab();
    }
    /**
     * 爆仓
     */
    public function marginCall()
    {
        //爆仓
        $order = new Order();
        $order->marginCall();
        $order->crontab();
        exit;
    }
    /**
     * 预约功能
     */
    public function yyCrontab()
    {
        $order = new Order();
        $order->yyCrontab();
        exit;
    }
    /**
     * 用户LP 添加
     */
    public function lpCrontab()
    {
        exit;
        $lp = new Lp();
        $lp->crontab();
        exit;
    }

    /**
     * 合约处理
     * @return void
     */
    public function contract()
    {
        $pool = new Pool();
        //每日通缩  今天的
        $flag = $pool->dayBurnInfo();
        if($flag == false){
            exit;
        }
        //门票兑换cake  实时
        $flag = $pool->cakeCrontab();
        if($flag == false){
            exit;
        }
        //保险池兑换  昨天数据处理
        $flag = $pool->exchangeCrontab();
        if($flag == false){
            exit;
        }
        //中奖池兑换  昨天数据处理
        $flag = $pool->winningPoolCrontab();
        if($flag == false){
            exit;
        }
    }
    public function nodeCrontab()
    {
        $user = new \app\admin\model\User();
        $user->nodeCrontab();
    }


    public function demo()
    {
        //echo Aes::decrypt("");
        echo Random::alnum(16);
        exit;
    }
    /**
     * 生成谷歌验证码
     */
    public function getGoogleCode()
    {
        $google = new GoogleAuthenticator();
        $data = $google->createSecret();
        echo ($data);
        exit;
    }
}
