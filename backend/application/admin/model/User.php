<?php

namespace app\admin\model;

use app\admin\model\user\Relation;
use app\common\library\HecBalanceLedger;
use app\common\model\MoneyLog;
use app\common\model\ScoreLog;
use think\Config;
use think\Model;

class User extends Model
{

    // 表名
    protected $name = 'user';
    // 自动写入时间戳字段
    protected $autoWriteTimestamp = 'int';
    // 定义时间戳字段名
    protected $createTime = 'createtime';
    protected $updateTime = 'updatetime';
    // 追加属性
    protected $append = [
        'prevtime_text',
        'logintime_text',
        'jointime_text'
    ];

    public function getOriginData()
    {
        return $this->origin;
    }

    protected static function init()
    {
        self::beforeUpdate(function ($row) {
            $changed = $row->getChangedData();
            //如果有修改密码
            if (isset($changed['password'])) {
                if ($changed['password']) {
                    $salt = \fast\Random::alnum();
                    $row->password = \app\common\library\Auth::instance()->getEncryptPassword($changed['password'], $salt);
                    $row->salt = $salt;
                } else {
                    unset($row->password);
                }
            }
        });


        self::beforeUpdate(function ($row) {
            $changedata = $row->getChangedData();
            if (isset($changedata['money'])) {
                $origin = $row->getOriginData();
                MoneyLog::create(['user_id' => $row['id'], 'money' => $changedata['money'] - $origin['money'], 'before' => $origin['money'], 'after' => $changedata['money'], 'memo' => '管理员变更金额']);
            }
            if (isset($changedata['score'])) {
                $origin = $row->getOriginData();
                ScoreLog::create(['user_id' => $row['id'], 'score' => $changedata['score'] - $origin['score'], 'before' => $origin['score'], 'after' => $changedata['score'], 'memo' => '管理员变更积分']);
            }
            if (isset($changedata['mac_balance'])) {
                $origin = $row->getOriginData();
                HecBalanceLedger::logHecAdjust($row['id'], $origin['mac_balance'] ?? 0, $changedata['mac_balance']);
            }
            if (isset($changedata['usdt_balance'])) {
                $origin = $row->getOriginData();
                HecBalanceLedger::logUsdcAdjust($row['id'], $origin['usdt_balance'] ?? 0, $changedata['usdt_balance']);
            }
        });
    }

    public function getGenderList()
    {
        return ['1' => __('Male'), '0' => __('Female')];
    }

    public function getStatusList()
    {
        return ['normal' => __('Normal'), 'hidden' => __('Hidden')];
    }

    public function getPrevtimeTextAttr($value, $data)
    {
        $value = $value ? $value : $data['prevtime'];
        return is_numeric($value) ? date("Y-m-d H:i:s", $value) : $value;
    }

    public function getLogintimeTextAttr($value, $data)
    {
        $value = $value ? $value : $data['logintime'];
        return is_numeric($value) ? date("Y-m-d H:i:s", $value) : $value;
    }

    public function getJointimeTextAttr($value, $data)
    {
        $value = $value ? $value : $data['jointime'];
        return is_numeric($value) ? date("Y-m-d H:i:s", $value) : $value;
    }

    protected function setPrevtimeAttr($value)
    {
        return $value && !is_numeric($value) ? strtotime($value) : $value;
    }

    protected function setLogintimeAttr($value)
    {
        return $value && !is_numeric($value) ? strtotime($value) : $value;
    }

    protected function setJointimeAttr($value)
    {
        return $value && !is_numeric($value) ? strtotime($value) : $value;
    }

    protected function setBirthdayAttr($value)
    {
        return $value === '' || $value === null ? null : $value;
    }

    public function group()
    {
        return $this->belongsTo('UserGroup', 'group_id', 'id', [], 'LEFT')->setEagerlyType(0);
    }


    /**
     * 节点定时统计
     */
    public function nodeCrontab()
    {
        $levelList = Config::get("site.node_level_nums");
        $list = \app\admin\model\contract\User::where("node",">",0)->where("nodetime","<",time())->limit(100)->select();
        if(!empty($list)){
            foreach ($list as $ks=>$vs) {
                //直推人数
                $uidList = Relation::where("pid", $vs["uid"])->where("level", 1)->column("id,uid");
                if (empty($uidList)) {
                    $zhiNode = 0;
                } else {
                    $zhiNode = \app\admin\model\contract\User::where("uid", "in", array_values($uidList))->where("node", ">", 0)->sum("node");
                }
                $vs->zhiNode = $zhiNode + 1;
                $nodeLevel = 0;
                foreach ($levelList as $k=>$v){
                    if($vs->zhiNode>=$v){
                        $nodeLevel = $k;
                    }
                }
                if($vs->nodeLevel != $nodeLevel){
                    $vs->nodeLevel = $nodeLevel;
                }
                $vs->nodetime = time() + 3600;
                $vs->save();
            }
        }
    }
}
