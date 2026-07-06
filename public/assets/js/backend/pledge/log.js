define(['jquery', 'bootstrap', 'backend', 'table', 'form'], function ($, undefined, Backend, Table, Form) {

    var Controller = {
        index: function () {
            // 初始化表格参数配置
            Table.api.init({
                extend: {
                    index_url: 'pledge/log/index' + location.search,
                    table: 'pledge_order_log'
                }
            });
            var table = $("#table");
            var type=[];
            $.ajax({url: "pledge/log/gettype", async:false, success: function(obj){type = obj;}});
            // 初始化表格
            table.bootstrapTable({
                url: $.fn.bootstrapTable.defaults.extend.index_url,
                pk: 'id',
                sortName: 'id',
                fixedColumns: true,
                fixedRightNumber: 1,
                columns: [
                    [
                        {field: 'id', title: __('编号')},
                        {field: 'user_id', title: __('会员编号')},
                        {field: 'oid', title: __('订单ID')},
                        {field: 'type', title: __('变动类型'),searchList: type, formatter: Table.api.formatter.status},
                        {field: 'num', title: __('收益金额')},
                        {field: 'before', title: __('额度变动前')},
                        {field: 'after', title: __('额度变动后')},
                        {field: 'from', title: __('来源订单')},
                        {field: 'content', title: __('收益说明')},
                        {field: 'create_time', title: __('时间'), operate:'RANGE', addclass:'datetimerange', autocomplete:false, formatter: Table.api.formatter.datetime},
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
        upload: function () {
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
