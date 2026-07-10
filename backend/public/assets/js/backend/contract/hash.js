define(['jquery', 'bootstrap', 'backend', 'table', 'form'], function ($, undefined, Backend, Table, Form) {

    var Controller = {
        index: function () {
            // 初始化表格参数配置
            Table.api.init({
                extend: {
                    index_url: 'contract/hash/index' + location.search,
                    add_url: 'contract/hash/add',
                    edit_url: 'contract/hash/edit',
                    multi_url: 'contract/hash/multi',
                    table: 'contract_hash',
                }
            });

            var table = $("#table");

            // 初始化表格
            table.bootstrapTable({
                url: $.fn.bootstrapTable.defaults.extend.index_url,
                pk: 'id',
                sortName: 'id',
                columns: [
                    [
                        {field: 'id', title: __('Id')},
                        {field: 'types', title: __('Types'), formatter: Table.api.formatter.status,searchList: {"paynode": __('节点'),"paycode":"激活",
                            "withdraw":"提现","lpinfo":"手续费","rechargeinfo":"充值","exchangeinfo":"兑换","winninginfo":"兑换LP","exchangecakeinfo":"兑换cake",
                            "UserAddLp":"添加LP"}},
                        {field: 'hash', title: __('Hash')},
                        {field: 'block', title: __('Block')},
                        {field: 'status', title: __('Status'), formatter: Table.api.formatter.status,searchList: {1: __('未处理'), 2: __('已完成')}},
                        {field: 'address', title: __('Address')},
                        {field: 'params1', title: __('Params1'), operate:'BETWEEN'},
                        {field: 'params2', title: __('Params2'), operate:'BETWEEN'},
                        {field: 'createtime', title: __('Createtime'), operate:'RANGE', addclass:'datetimerange', formatter: Table.api.formatter.datetime},
                        {field: 'updatetime', title: __('Updatetime'), operate:'RANGE', addclass:'datetimerange', formatter: Table.api.formatter.datetime}
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
