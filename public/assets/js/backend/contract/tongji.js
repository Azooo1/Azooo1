define(['jquery', 'bootstrap', 'backend', 'table', 'form'], function ($, undefined, Backend, Table, Form) {

    var Controller = {
        index: function () {
            // 初始化表格参数配置
            Table.api.init({
                extend: {
                    index_url: 'contract/tongji/index' + location.search,
                    table: 'contract_user',
                }
            });

            var table = $("#table");
            // 初始化表格 - 团队充值统计
            table.bootstrapTable({
                url: $.fn.bootstrapTable.defaults.extend.index_url,
                pk: 'id',
                sortName: 'id',
                sortOrder: 'desc',
                pagination: true,
                search: true,
                commonSearch: true,
                columns: [
                    [
                        // {field: 'id', title: __('ID'), sortable: true},
                        {field: 'uid', title: '会员编号', sortable: true},
                        {field: 'address', title: __('用户地址'), operate: 'LIKE'},
                        {field: 'recharge_time', title: __('日期筛选'), operate: 'RANGE', addclass: 'datetimerange', visible: false},
                        {field: 'team_recharge', title: __('团队充值'), operate: false, sortable: false},
                        {field: 'team_withdraw', title: __('团队提现'), operate: false, sortable: false},
                        {field: 'team_pledge', title: __('团队质押'), operate: false, sortable: false},
                        {field: 'team_oce', title: __('团队获得OCE'), operate: false, sortable: false},
                        {field: 'createtime', title: __('注册时间'), operate: false, addclass: 'datetimerange', formatter: Table.api.formatter.datetime},
                    ]
                ]
            });

            // 为表格绑定事件
            Table.api.bindevent(table);
        },
        add: function () {
            Controller.api.bindevent();
        },
        edit: function () {
            Controller.api.bindevent();
        },
        api: {
            bindevent: function () {
                Form.api.bindevent($("form[role=form]"));
            }
        }
    };
    return Controller;
});
