define(['jquery', 'bootstrap', 'backend', 'table', 'form'], function ($, undefined, Backend, Table, Form) {

    var Controller = {
        index: function () {
            // 初始化表格参数配置
            Table.api.init({
                extend: {
                    index_url: 'contract/lp/index' + location.search,
                    add_url: 'contract/lp/add',
                    edit_url: 'contract/lp/edit',
                    multi_url: 'contract/lp/multi',
                    table: 'contract_lp',
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
                        {field: 'orderId', title: __('Orderid')},
                        {field: 'uid', title: __('Uid')},
                        {field: 'address', title: __('Address')},
                        {field: 'price', title: __('Price'), operate:'BETWEEN'},
                        {field: 'hash', title: __('Hash')},
                        {field: 'lp', title: __('Lp'), operate:'BETWEEN'},
                        {field: 'status', title: __('Status'), formatter: Table.api.formatter.status,searchList: {'1': "待处理",2:"已处理",3:"已完成"}},
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
