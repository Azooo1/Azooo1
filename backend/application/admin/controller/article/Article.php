<?php

namespace app\admin\controller\article;

use app\common\controller\Backend;

/**
 * 文章信息
 *
 * @icon fa fa-circle-o
 */
class Article extends Backend
{

    /**
     * Article模型对象
     * @var \app\admin\model\article\Article
     */
    protected $model = null;

    public function _initialize()
    {
        parent::_initialize();
        $this->model = new \app\admin\model\article\Article;

    }

    /**
     * 默认生成的控制器所继承的父类中有index/add/edit/del/multi五个基础方法、destroy/restore/recyclebin三个回收站方法
     * 因此在当前控制器中可不用编写增删改查的代码,除非需要自己控制这部分逻辑
     * 需要将application/admin/library/traits/Backend.php中对应的方法复制到当前控制器,然后进行修改
     */

    /**
     * 查看
     */
    public function index()
    {
        //设置过滤方法
        $this->request->filter(['strip_tags']);
        if ($this->request->isAjax()) {
            //如果发送的来源是Selectpage，则转发到Selectpage
            if ($this->request->request('keyField')) {
                return $this->selectpage();
            }
            list($where, $sort, $order, $offset, $limit) = $this->buildparams();
            $total = $this->model
                ->where($where)
                ->order($sort, $order)
                ->count();
            $list = $this->model
                ->where($where)
                ->order($sort, $order)
                ->limit($offset, $limit)
                ->select();
            $typeInfo = \app\admin\model\article\Article::getTypeLevel();
            $langInfo = \app\admin\model\article\Article::getLangInfo();
            foreach ($list as $k => $v) {
//                $v->type = $typeInfo[$v->type];
                $v->lang = $langInfo[$v->lang];
            }
            $result = array("total" => $total, "rows" => $list);

            return json($result);
        }
        return $this->view->fetch();
    }
    /**
     * 添加
     */
    public function add()
    {
        $this->view->assign('typeList', build_select('row[type]', \app\admin\model\article\Article::getTypeLevel(), 'type', ['class' => 'form-control selectpicker']));
        $this->view->assign('langList', build_select('row[lang]', \app\admin\model\article\Article::getLangInfo(), 'lang', ['class' => 'form-control selectpicker']));
        return parent::add();
    }
    /**
     * 编辑
     */
    public function edit($ids = NULL)
    {
        $row = $this->model->get($ids);
        if (!$row)
            $this->error(__('No Results were found'));
        $this->view->assign('typeList', build_select('row[type]', \app\admin\model\article\Article::getTypeLevel(), $row['type'], ['class' => 'form-control selectpicker']));
        $this->view->assign('langList', build_select('row[lang]', \app\admin\model\article\Article::getLangInfo(), $row['lang'], ['class' => 'form-control selectpicker']));
        return parent::edit($ids);
    }
}
