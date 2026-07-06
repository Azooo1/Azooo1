define(['jquery', 'bootstrap', 'backend', 'table', 'form'], function ($, undefined, Backend, Table, Form) {

    var Controller = {
        index: function () {
            // 初始化表格参数配置
            Table.api.init({
                extend: {
                    index_url: 'contract/pay/index' + location.search,
                    add_url: 'contract/pay/add',
                    edit_url: 'contract/pay/edit',
                    multi_url: 'contract/pay/multi',
                    table: 'contract_pay',
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
                        {checkbox: true},
                        {field: 'id', title: __('Id')},
                        {field: 'uid', title: __('Uid')},
                        {field: 'from', title: __('Address')},
                        {field: 'credittype', title: __('钱包'),searchList: {'usdt': __('USDT'), 'my': __('MY')}, formatter: Table.api.formatter.status},
                        {field: 'price', title: __('Price'), operate:'BETWEEN'},
                        {field: 'to', title: '收款钱包'},
                        {field: 'hash', title: __('Hash')},
                        {field: 'status', title: __('Status'), formatter: Table.api.formatter.status,searchList: {'1': "待付款",2:"已支付"}},
                        {field: 'createtime', title: __('Createtime'), operate:'RANGE', addclass:'datetimerange', formatter: Table.api.formatter.datetime},
                        {field: 'updatetime', title: __('Updatetime'), operate:'RANGE', addclass:'datetimerange', formatter: Table.api.formatter.datetime},
                        {field: 'operate', title: __('Operate'), table: table, events: Table.api.events.operate, formatter: Table.api.formatter.operate}
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
