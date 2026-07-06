<?php

namespace app\common\library;

use app\common\model\User;
use app\common\model\UserRule;
use fast\Random;
use think\Cache;
use think\Config;
use think\Db;
use think\Exception;
use think\Hook;
use think\Request;
use think\Validate;

class Auth
{
    protected static $instance = null;
    protected $_error = '';
    protected $_logined = false;
    protected $_user = null;
    protected $_token = '';
    protected $_registerBonus = 0;
    //Token默认有效时长
    protected $keeptime = 2592000;
    protected $requestUri = '';
    protected $rules = [];
    //默认配置
    protected $config = [];
    protected $options = [];
    protected $allowFields = ['id', 'username', 'nickname', 'mobile', 'avatar', 'score'];

    public function __construct($options = [])
    {
        if ($config = Config::get('user')) {
            $this->config = array_merge($this->config, $config);
        }
        $this->options = array_merge($this->config, $options);
    }

    /**
     *
     * @param array $options 参数
     * @return Auth
     */
    public static function instance($options = [])
    {
        if (is_null(self::$instance)) {
            self::$instance = new static($options);
        }

        return self::$instance;
    }

    /**
     * 获取User模型
     * @return User
     */
    public function getUser()
    {
        return $this->_user;
    }

    /**
     * 兼容调用user模型的属性
     *
     * @param string $name
     * @return mixed
     */
    public function __get($name)
    {
        return $this->_user ? $this->_user->$name : null;
    }
    /**
     * 获取用户邀请链接
     */
    public function getUserUrl()
    {
        //return request()->domain()."/index/wx/index?inviteCode=".$this->_user->invite_code;
        return \think\config::get('site.aliyunsharedomain'). '?inviteCode=' . base64_encode($this->_user->invite_code);
    }
    /**
     * 根据Token初始化
     *
     * @param string $token Token
     * @return boolean
     */
    public function init($token)
    {
        if ($this->_logined) {
            return true;
        }
        if ($this->_error) {
            return false;
        }
        $data = Token::get($token);
        if (!$data) {
            return false;
        }
        $user_id = intval($data['user_id']);
        if ($user_id > 0) {
            $user = User::get($user_id);
            if (!$user) {
                $this->setError('Account not exist');
                return false;
            }
            if ($user['status'] != 'normal') {
                $this->setError('Account is locked');
                return false;
            }
            $this->_user = $user;
            $this->_logined = true;
            $this->_token = $token;

            //初始化成功的事件
            Hook::listen("user_init_successed", $this->_user);

            return true;
        } else {
            $this->setError('You are not logged in');
            return false;
        }
    }

    /**
     * 注册用户
     *
     * @param string $address 地址
     * @param string $inviteCode 邀请码
     * @return boolean
     */
    public function register($address,$inviteCode = "")
    {
        // 检测用户名或邮箱、手机号是否存在
        if (User::getByAddress($address)) {
            $this->setError(__('地址已存在'));
            return false;
        }
        $cache = Cache::get("address-reg-".$address);
        if(!empty($cache)){
            $this->setError(__("请稍后重试"));
            return false;
        }
        Cache::set("address-reg-".$address,1,3);

        $ip = request()->ip();
        $time = time();


        $data = [
            'username' => $address,
            'password' => $address,
            'address' => $address,
            'level'    => 1,
            'score'    => 0,
            'avatar'   => '',
        ];
        $params = array_merge($data, [
            'nickname'  => $address,
            'salt'      => Random::alnum(),
            'jointime'  => $time,
            'joinip'    => $ip,
            'logintime' => $time,
            'loginip'   => $ip,
            'prevtime'  => $time,
            'status'    => 'normal',
            'referrer'   => 0,
            'relation'  => 0,
        ]);
        $params['password'] = $this->getEncryptPassword($address, $params['salt']);
        //邀请码
        $params['invite_code'] = User::saveInviteCode();
        if(!empty($inviteCode)){
            $inviteUser = User::getInviteCode($inviteCode);
            if(!empty($inviteUser)){
                $params['referrer'] = $inviteUser['id'];
                $params['relation'] = $inviteUser['id']."-".$inviteUser['relation'];
            }
        }

        //账号注册时需要开启事务,避免出现垃圾数据
        Db::startTrans();
        try {
            $user = User::create($params, true);
            \app\admin\model\user\Relation::addRelation($user->id,$params['relation']);
            $this->_user = User::get($user->id);

            //设置Token
            $this->_token = Random::uuid();
            Token::set($this->_token, $user->id, $this->keeptime);
            //同步到合约会员
            \app\admin\model\contract\User::addUserInfo($user);
            //注册成功的事件
            Hook::listen("user_register_successed", $this->_user, $data);
            Db::commit();
        } catch (Exception $e) {
            $this->setError($e->getMessage());
            Db::rollback();
            return false;
        }
        return true;
    }

    /**
     * 邮箱注册（新前端 HEC）
     *
     * @param string $username
     * @param string $email
     * @param string $password
     * @param string $inviteCode
     * @return boolean
     */
    public function registerAccount($username, $email, $password, $inviteCode)
    {
        $username = trim($username);
        $email = strtolower(trim($email));
        $inviteCode = strtoupper(trim($inviteCode));

        if (!$username || !$email || !$password) {
            $this->setError('用户名、邮箱和密码为必填项');
            return false;
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->setError('邮箱格式不正确');
            return false;
        }
        if (strlen($password) < 6) {
            $this->setError('密码长度不能少于6位');
            return false;
        }
        if (!$inviteCode) {
            $this->setError('邀请码为必填项');
            return false;
        }
        if (!preg_match('/^[A-Z0-9]{6,8}$/', $inviteCode)) {
            $this->setError('邀请码格式不正确');
            return false;
        }
        if (User::getByUsername($username)) {
            $this->setError('用户名已被注册');
            return false;
        }
        if (User::getByEmail($email)) {
            $this->setError('邮箱已被注册');
            return false;
        }
        $inviteUser = User::getInviteCode($inviteCode);
        if (empty($inviteUser)) {
            $this->setError('邀请码无效');
            return false;
        }

        $cacheKey = 'email-reg-' . $email;
        if (Cache::get($cacheKey)) {
            $this->setError('请稍后重试');
            return false;
        }
        Cache::set($cacheKey, 1, 3);

        $ip = request()->ip();
        $time = time();
        $salt = Random::alnum();
        $bonus = random_int(8, 88);

        $params = [
            'username'     => $username,
            'nickname'     => $this->randomChineseNickname(),
            'email'        => $email,
            'password'     => $this->getEncryptPassword($password, $salt),
            'salt'         => $salt,
            'level'        => 1,
            'score'        => 0,
            'avatar'       => '',
            'role'         => 'USER',
            'mac_balance'  => $bonus,
            'eth_balance'  => 0,
            'usdc_balance' => 0,
            'usdt_balance' => 0,
            'jointime'     => $time,
            'joinip'       => $ip,
            'logintime'    => $time,
            'loginip'      => $ip,
            'prevtime'     => $time,
            'status'       => 'normal',
            'referrer'     => $inviteUser['id'],
            'relation'     => $inviteUser['id'] . '-' . $inviteUser['relation'],
            'invite_code'  => User::saveInviteCode(),
        ];

        Db::startTrans();
        try {
            $user = User::create($params, true);
            \app\common\library\HecBalanceLedger::logHec(
                $user->id,
                'REGISTER_BONUS',
                (string)$bonus,
                '0',
                (string)$bonus,
                '注册赠送'
            );
            \app\admin\model\user\Relation::addRelation($user->id, $params['relation']);
            $this->_user = User::get($user->id);
            $this->_token = Random::uuid();
            Token::set($this->_token, $user->id, $this->keeptime);
            \app\admin\model\contract\User::addUserInfo($this->_user);
            Hook::listen('user_register_successed', $this->_user, ['bonus' => $bonus]);
            Db::commit();
        } catch (Exception $e) {
            $this->setError($e->getMessage());
            Db::rollback();
            return false;
        }
        $this->_logined = true;
        $this->_registerBonus = $bonus;
        return true;
    }

    /**
     * 邮箱登录（新前端 HEC）
     */
    public function loginByEmail($email, $password)
    {
        $email = strtolower(trim($email));
        if (!$email || !$password) {
            $this->setError('邮箱和密码为必填项');
            return false;
        }
        $user = User::getByEmail($email);
        if (!$user) {
            $this->setError('邮箱或密码错误');
            return false;
        }
        if ($user['status'] !== 'normal') {
            $this->setError('账户已被禁用，请联系客服');
            return false;
        }
        if ($user->password !== $this->getEncryptPassword($password, $user->salt)) {
            $this->setError('邮箱或密码错误');
            return false;
        }
        return $this->direct($user->id);
    }

    /**
     * 注册奖励 HEC 数量（仅邮箱注册）
     */
    public function getRegisterBonus()
    {
        return isset($this->_registerBonus) ? $this->_registerBonus : 0;
    }

    /**
     * 用户登录
     *
     * @param string $address  地址
     * @return boolean
     */
    public function login($address)
    {
        $user = User::get(['address' => $address]);
        if (!$user) {
            $this->setError(__("地址异常"));
            return false;
        }
        $contractUser=\app\admin\model\contract\User::where('uid',$user['id'])->find();
        if ($contractUser['status'] != 1) {
            $this->setError(__("用户已锁定"));
            return false;
        }
        if (!empty($password) && $user->password != $this->getEncryptPassword($password, $user->salt)) {
            $this->setError('Password is incorrect');
            return false;
        }
        //直接登录会员
        $this->direct($user->id);

        return true;
    }

    /**
     * 注销
     *
     * @return boolean
     */
    public function logout()
    {
        if (!$this->_logined) {
            $this->setError('You are not logged in');
            return false;
        }
        //设置登录标识
        $this->_logined = false;
        //删除Token
        Token::delete($this->_token);
        //注销成功的事件
        Hook::listen("user_logout_successed", $this->_user);
        return true;
    }

    /**
     * 修改密码
     * @param string $newpassword       新密码
     * @param string $oldpassword       旧密码
     * @param bool   $ignoreoldpassword 忽略旧密码
     * @return boolean
     */
    public function changepwd($newpassword, $oldpassword = '', $ignoreoldpassword = false)
    {
        if (!$this->_logined) {
            $this->setError('You are not logged in');
            return false;
        }
        //判断旧密码是否正确
        if ($this->_user->password == $this->getEncryptPassword($oldpassword, $this->_user->salt) || $ignoreoldpassword) {
            Db::startTrans();
            try {
                $salt = Random::alnum();
                $newpassword = $this->getEncryptPassword($newpassword, $salt);
                $this->_user->save(['loginfailure' => 0, 'password' => $newpassword, 'salt' => $salt]);

                Token::delete($this->_token);
                //修改密码成功的事件
                Hook::listen("user_changepwd_successed", $this->_user);
                Db::commit();
            } catch (Exception $e) {
                Db::rollback();
                $this->setError($e->getMessage());
                return false;
            }
            return true;
        } else {
            $this->setError('Password is incorrect');
            return false;
        }
    }

    /**
     * 通过用户 ID 初始化（JWT 鉴权，不刷新 Token）
     *
     * @param int $user_id
     * @return boolean
     */
    public function initByUserId($user_id)
    {
        if ($this->_logined) {
            return true;
        }
        $user_id = (int)$user_id;
        if ($user_id <= 0) {
            return false;
        }
        $user = User::get($user_id);
        if (!$user) {
            $this->setError('Account not exist');
            return false;
        }
        if ($user['status'] != 'normal') {
            $this->setError('Account is locked');
            return false;
        }
        $this->_user = $user;
        $this->_logined = true;
        Hook::listen('user_init_successed', $this->_user);
        return true;
    }

    /**
     * 直接登录账号
     * @param int $user_id
     * @return boolean
     */
    public function direct($user_id)
    {
        $user = User::get($user_id);
        if ($user) {
            Db::startTrans();
            try {
                $ip = request()->ip();
                $time = time();

                //判断连续登录和最大连续登录
                if ($user->logintime < \fast\Date::unixtime('day')) {
                    $user->successions = $user->logintime < \fast\Date::unixtime('day', -1) ? 1 : $user->successions + 1;
                    $user->maxsuccessions = max($user->successions, $user->maxsuccessions);
                }

                $user->prevtime = $user->logintime;
                //记录本次登录的IP和时间
                $user->loginip = $ip;
                $user->logintime = $time;
                //重置登录失败次数
                $user->loginfailure = 0;

                $user->save();

                $this->_user = $user;

                $this->_token = Random::uuid();
                Token::set($this->_token, $user->id, $this->keeptime);

                $this->_logined = true;

                //登录成功的事件
                Hook::listen("user_login_successed", $this->_user);
                Db::commit();
            } catch (Exception $e) {
                Db::rollback();
                $this->setError($e->getMessage());
                return false;
            }
            return true;
        } else {
            return false;
        }
    }

    /**
     * 检测是否是否有对应权限
     * @param string $path   控制器/方法
     * @param string $module 模块 默认为当前模块
     * @return boolean
     */
    public function check($path = null, $module = null)
    {
        if (!$this->_logined) {
            return false;
        }

        $ruleList = $this->getRuleList();
        $rules = [];
        foreach ($ruleList as $k => $v) {
            $rules[] = $v['name'];
        }
        $url = ($module ? $module : request()->module()) . '/' . (is_null($path) ? $this->getRequestUri() : $path);
        $url = strtolower(str_replace('.', '/', $url));
        return in_array($url, $rules) ? true : false;
    }

    /**
     * 判断是否登录
     * @return boolean
     */
    public function isLogin()
    {
        if ($this->_logined) {
            return true;
        }
        return false;
    }

    /**
     * 获取当前Token
     * @return string
     */
    public function getToken()
    {
        return $this->_token;
    }

    /**
     * 获取会员基本信息
     */
    public function getUserinfo()
    {
        $data = $this->_user->toArray();
        $allowFields = $this->getAllowFields();
        $userinfo = array_intersect_key($data, array_flip($allowFields));
        $userinfo = array_merge($userinfo, Token::get($this->_token));
        return $userinfo;
    }

    /**
     * 获取会员组别规则列表
     * @return array
     */
    public function getRuleList()
    {
        if ($this->rules) {
            return $this->rules;
        }
        $group = $this->_user->group;
        if (!$group) {
            return [];
        }
        $rules = explode(',', $group->rules);
        $this->rules = UserRule::where('status', 'normal')->where('id', 'in', $rules)->field('id,pid,name,title,ismenu')->select();
        return $this->rules;
    }

    /**
     * 获取当前请求的URI
     * @return string
     */
    public function getRequestUri()
    {
        return $this->requestUri;
    }

    /**
     * 设置当前请求的URI
     * @param string $uri
     */
    public function setRequestUri($uri)
    {
        $this->requestUri = $uri;
    }

    /**
     * 获取允许输出的字段
     * @return array
     */
    public function getAllowFields()
    {
        return $this->allowFields;
    }

    /**
     * 设置允许输出的字段
     * @param array $fields
     */
    public function setAllowFields($fields)
    {
        $this->allowFields = $fields;
    }

    /**
     * 删除一个指定会员
     * @param int $user_id 会员ID
     * @return boolean
     */
    public function delete($user_id)
    {
        $user = User::get($user_id);
        if (!$user) {
            return false;
        }
        Db::startTrans();
        try {
            // 删除会员
            User::destroy($user_id);
            // 删除会员指定的所有Token
            Token::clear($user_id);

            Hook::listen("user_delete_successed", $user);
            Db::commit();
        } catch (Exception $e) {
            Db::rollback();
            $this->setError($e->getMessage());
            return false;
        }
        return true;
    }

    /**
     * 获取密码加密后的字符串
     * @param string $password 密码
     * @param string $salt     密码盐
     * @return string
     */
    public function getEncryptPassword($password, $salt = '')
    {
        return md5(md5($password) . $salt);
    }

    /**
     * 检测当前控制器和方法是否匹配传递的数组
     *
     * @param array $arr 需要验证权限的数组
     * @return boolean
     */
    public function match($arr = [])
    {
        $request = Request::instance();
        $arr = is_array($arr) ? $arr : explode(',', $arr);
        if (!$arr) {
            return false;
        }
        $arr = array_map('strtolower', $arr);
        // 是否存在
        if (in_array(strtolower($request->action()), $arr) || in_array('*', $arr)) {
            return true;
        }

        // 没找到匹配
        return false;
    }

    /**
     * 设置会话有效时间
     * @param int $keeptime 默认为永久
     */
    public function keeptime($keeptime = 0)
    {
        $this->keeptime = $keeptime;
    }

    /**
     * 渲染用户数据
     * @param array  $datalist  二维数组
     * @param mixed  $fields    加载的字段列表
     * @param string $fieldkey  渲染的字段
     * @param string $renderkey 结果字段
     * @return array
     */
    public function render(&$datalist, $fields = [], $fieldkey = 'user_id', $renderkey = 'userinfo')
    {
        $fields = !$fields ? ['id', 'nickname', 'level', 'avatar'] : (is_array($fields) ? $fields : explode(',', $fields));
        $ids = [];
        foreach ($datalist as $k => $v) {
            if (!isset($v[$fieldkey])) {
                continue;
            }
            $ids[] = $v[$fieldkey];
        }
        $list = [];
        if ($ids) {
            if (!in_array('id', $fields)) {
                $fields[] = 'id';
            }
            $ids = array_unique($ids);
            $selectlist = User::where('id', 'in', $ids)->column($fields);
            foreach ($selectlist as $k => $v) {
                $list[$v['id']] = $v;
            }
        }
        foreach ($datalist as $k => &$v) {
            $v[$renderkey] = isset($list[$v[$fieldkey]]) ? $list[$v[$fieldkey]] : null;
        }
        unset($v);
        return $datalist;
    }

    /**
     * 设置错误信息
     *
     * @param $error 错误信息
     * @return Auth
     */
    public function setError($error)
    {
        $this->_error = $error;
        return $this;
    }

    /**
     * 获取错误信息
     * @return string
     */
    public function getError()
    {
        return $this->_error ? __($this->_error) : '';
    }

    /**
     * 生成随机中文昵称（3个常用汉字）
     */
    protected function randomChineseNickname($length = 3)
    {
        $nickname = '';
        for ($i = 0; $i < $length; $i++) {
            $code = mt_rand(0x4E00, 0x9FA5);
            if (function_exists('mb_chr')) {
                $nickname .= mb_chr($code, 'UTF-8');
            } else {
                $nickname .= iconv('UCS-4BE', 'UTF-8', pack('N', $code));
            }
        }
        return $nickname;
    }
}
