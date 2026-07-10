<?php

namespace app\admin\controller\contract;

use app\admin\model\user\Balance;
use app\common\controller\Backend;

/**
 * 合约会员团队充值统计
 * 根据 contract_user 表统计每个用户团队下的累计充值金额
 * team 字段：记录用户所有上级的 uid，下级用户的 team 中包含该用户 uid
 *
 * @icon fa fa-bar-chart
 */
class Tongji extends Backend
{
    /**
     * User模型对象
     * @var \app\admin\model\contract\User
     */
    protected $model = null;

    public function _initialize()
    {
        parent::_initialize();
        $this->model = new \app\admin\model\contract\User;
    }

    /**
     * 查看 - 团队充值统计
     * 支持日期筛选、分页
     */
    public function index()
    {
        $this->request->filter(['strip_tags']);
        if ($this->request->isAjax()) {
            if ($this->request->request('keyField')) {
                return $this->selectpage();
            }

            // 获取分页和排序参数
            $sort = $this->request->get('sort', 'id');
            $order = $this->request->get('order', 'DESC');
            $offset = $this->request->get('offset', 0);
            $limit = $this->request->get('limit', 10);

            // 解析日期筛选（筛选充值记录的 createtime）
            $payTimeWhere = $this->parseRechargeTimeFilter();
            // 分页查询 contract_user（count 和 select 分别用新实例，避免查询条件被 count 执行后丢失）
            $countQuery = new \app\admin\model\contract\User();
            $this->applyUserWhere($countQuery);
            $total = $countQuery->order($sort, $order)->count();

            $listQuery = new \app\admin\model\contract\User();
            $this->applyUserWhere($listQuery);
            $list = $listQuery->order($sort, $order)->limit($offset, $limit)->select();

            // 统计每个用户的团队充值金额（含日期筛选）
            foreach ($list as $k => $v) {
                // 团队 = 当前用户 + 所有下级（team 中包含当前用户 uid 的用户）
                $teamUids = $this->model
                    ->where('find_in_set(' . intval($v['uid']) . ', team)')
                    ->column('uid', 'uid');
                $teamUids[$v['uid']] = $v['uid']; // 包含自己

                // 团队累计充值（status=2 表示充值成功）
                $payQuery = (new \app\admin\model\contract\Pay())
                    ->where('uid', 'in', $teamUids)
                    ->where('status', 2);
                if (!empty($payTimeWhere)) {
                    $payQuery->where('createtime', 'between', $payTimeWhere);
                }
                $list[$k]['team_recharge'] = $payQuery->sum('price') ?: '0.00';

                // 团队累计提现（status=3 表示已到账）
                $withdrawQuery = (new \app\admin\model\contract\Withdraw())
                    ->where('uid', 'in', $teamUids)
                    ->where('status', 3);
                if (!empty($payTimeWhere)) {
                    $withdrawQuery->where('createtime', 'between', $payTimeWhere);
                }
                $list[$k]['team_withdraw'] = $withdrawQuery->sum('price') ?: '0.00';
                // 团队质押（pledge_order 表，price 为质押金额）
                $pledgeQuery = (new \app\admin\model\pledge\Order())->where('uid', 'in', $teamUids);
                if (!empty($payTimeWhere)) {
                    $pledgeQuery->where('create_time', 'between', $payTimeWhere);
                }
                $list[$k]['team_pledge'] = $pledgeQuery->sum('price') ?: '0.00';

                // 团队获得OCE（user_balance 表，num 为变动数量）
                $balanceQuery = (new Balance())->where('user_id', 'in', $teamUids);
                if (!empty($payTimeWhere)) {
                    $balanceQuery->where('create_time', 'between', $payTimeWhere);
                }
                $list[$k]['team_oce'] = $balanceQuery->sum('num') ?: '0.00';
            }

            $result = ['total' => $total, 'rows' => $list];
            return json($result);
        }
        return $this->view->fetch();
    }

    /**
     * 解析充值日期筛选参数
     * 支持 filter[recharge_time] 格式，如 "2024-01-01 - 2024-12-31"
     * @return array  [开始时间戳, 结束时间戳] 或空数组表示不筛选
     */
    protected function parseRechargeTimeFilter()
    {
        $filter = $this->request->get('filter', '');
        $filter = (array)json_decode($filter, true);
        if (empty($filter['recharge_time'])) {
            return [];
        }
        $v = str_replace(' - ', ',', $filter['recharge_time']);
        $arr = array_slice(explode(',', $v), 0, 2);
        $arr = array_map('trim', $arr);
        if (count($arr) < 2 || empty($arr[0]) || empty($arr[1])) {
            return [];
        }
        $start = strtotime($arr[0]);
        $end = strtotime($arr[1]);
        if ($start && $end && $start <= $end) {
            return [$start, $end];
        }
        return [];
    }

    /**
     * 应用 contract_user 的查询条件到查询对象
     * 搜索和筛选仅作用于 contract_user 表字段（uid、address 等）
     * @param \think\db\Query $query
     */
    protected function applyUserWhere($query)
    {
        $filter = $this->request->get('filter', '');
        $filter = (array)json_decode($filter, true);
        $filter = $filter ?: [];
        $op = $this->request->get('op', '');
        $op = (array)json_decode($op, true);
        $op = $op ?: [];

        // contract_user 表可搜索的字段白名单
        $userTableFields = ['id', 'uid', 'address', 'status', 'createtime', 'updatetime'];

        // 排除非 user 表字段
        unset($filter['recharge_time']);
        foreach (array_keys($filter) as $k) {
            if (!in_array($k, $userTableFields)) {
                unset($filter[$k]);
                unset($op[$k]);
            }
        }

        // 快速搜索：会员编号或用户地址（uid OR address）
        $search = $this->request->get('search', '');
        if ($search !== '') {
            $search = trim($search);
            $query->where(function ($q) use ($search) {
                $q->where('uid', 'like', '%' . $search . '%')
                    ->whereOr('address', 'like', '%' . $search . '%');
            });
        }

        foreach ($filter as $k => $v) {
            $sym = isset($op[$k]) ? strtoupper(trim($op[$k])) : '=';
            $v = !is_array($v) ? trim((string)$v) : $v;
            if ($v === '' && !in_array($sym, ['NULL', 'IS NULL', 'NOT NULL', 'IS NOT NULL'])) {
                continue;
            }
            switch ($sym) {
                case '=':
                case '<>':
                    $query->where($k, $sym, (string)$v);
                    break;
                case 'LIKE':
                case 'LIKE %...%':
                    $query->where($k, 'like', '%' . $v . '%');
                    break;
                case '>':
                case '>=':
                case '<':
                case '<=':
                    $val = is_numeric($v) ? (strpos($k, 'time') !== false ? strtotime($v) : $v) : intval($v);
                    $query->where($k, $sym, $val);
                    break;
                case 'RANGE':
                case 'BETWEEN':
                    $v = is_string($v) ? str_replace(' - ', ',', $v) : $v;
                    $arr = is_array($v) ? $v : array_slice(explode(',', $v), 0, 2);
                    $arr = array_map('trim', $arr);
                    if (count($arr) >= 2 && $arr[0] !== '' && $arr[1] !== '') {
                        $start = strtotime($arr[0]);
                        $end = strtotime($arr[1]);
                        if ($start && $end) {
                            $query->where($k, 'between', [$start, $end]);
                        }
                    }
                    break;
                default:
                    if ($v !== '') {
                        $query->where($k, '=', $v);
                    }
                    break;
            }
        }
    }
}
