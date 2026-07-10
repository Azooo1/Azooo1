define(['jquery', 'bootstrap', 'backend', 'table', 'form'], function ($, undefined, Backend, Table, Form) {

    var Controller = {
        index: function () {
            // 初始化表格参数配置
            Table.api.init({
                extend: {
                    index_url: 'contract/order/index' + location.search,
                    add_url: 'contract/order/add',
                    edit_url: 'contract/order/edit',
                    multi_url: 'contract/order/multi',
                    table: 'contract_order',
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
                        {field: 'address', title: __('Address')},
                        {field: 'price', title: __('Price'), operate:'BETWEEN'},
                        {field: 'service', title: __('手续费')},
                        {field: 'round', title: __('Round')},
                        {field: 'outStatus', title: __('出局状态'), formatter: Table.api.formatter.status,searchList: {'0': "待处理",1:"已处理"}},
                        {field: 'status', title: __('Status'), formatter: Table.api.formatter.status,searchList: {'1': "待出局",2:"已出局",3:"已爆仓"}},
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
