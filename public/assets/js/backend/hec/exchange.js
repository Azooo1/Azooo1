define(['jquery', 'bootstrap', 'backend', 'table', 'form'], function ($, undefined, Backend, Table, Form) {
    var Controller = {
        index: function () {
            Table.api.init({
                extend: {
                    index_url: 'hec/exchange/index' + location.search,
                    edit_url: 'hec/exchange/edit',
                    table: 'hec_exchange',
                }
            });
            var table = $("#table");
            table.bootstrapTable({
                url: $.fn.bootstrapTable.defaults.extend.index_url,
                pk: 'id',
                sortName: 'id',
                sortOrder: 'desc',
                columns: [[
                    {field: 'id', title: 'ID'},
                    {field: 'user_id', title: '用户ID'},
                    {field: 'username', title: '用户名'},
                    {field: 'from_currency', title: '兑出'},
                    {field: 'to_currency', title: '兑入'},
                    {field: 'from_amount', title: '兑出数量', operate: 'BETWEEN'},
                    {field: 'to_amount', title: '到账数量', operate: 'BETWEEN'},
                    {field: 'rate', title: '汇率'},
                    {field: 'fee', title: '手续费'},
                    {field: 'createtime', title: '时间', formatter: Table.api.formatter.datetime, operate: 'RANGE', addclass: 'datetimerange'}
                ]]
            });
            Table.api.bindevent(table);
        },
        api: { bindevent: function () { Form.api.bindevent($("form[role=form]")); } }
    };
    return Controller;
});
