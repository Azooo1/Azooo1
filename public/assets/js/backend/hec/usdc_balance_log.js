define(['jquery', 'bootstrap', 'backend', 'table', 'form'], function ($, undefined, Backend, Table, Form) {
    var changeTypeList = {
        'EXCHANGE_IN': '闪兑到账',
        'C2C_IN': 'C2C成交到账',
        'WITHDRAW_OUT': '提币扣除',
        'WITHDRAW_REFUND': '提币退回',
        'ADMIN_ADJUST': '管理员调整'
    };

    var Controller = {
        index: function () {
            Table.api.init({
                extend: {
                    index_url: 'hec/usdc_balance_log/index' + location.search,
                    table: 'usdc_balance_log',
                }
            });
            var table = $("#table");
            table.bootstrapTable({
                url: $.fn.bootstrapTable.defaults.extend.index_url,
                pk: 'id',
                sortName: 'id',
                sortOrder: 'desc',
                columns: [[
                    {field: 'id', title: 'ID', sortable: true},
                    {field: 'user_id', title: '用户ID'},
                    {field: 'username', title: '用户名', operate: false},
                    {field: 'change_type', title: '变动类型', searchList: changeTypeList, formatter: function (value, row) {
                        return row.change_type_text || changeTypeList[value] || value;
                    }},
                    {field: 'amount', title: '变动金额', operate: 'BETWEEN', formatter: function (value) {
                        var n = parseFloat(value);
                        if (isNaN(n)) return value;
                        var cls = n >= 0 ? 'text-success' : 'text-danger';
                        var prefix = n > 0 ? '+' : '';
                        return '<span class="' + cls + '">' + prefix + value + '</span>';
                    }},
                    {field: 'before', title: '变动前', operate: false},
                    {field: 'after', title: '变动后', operate: false},
                    {field: 'memo', title: '备注', operate: 'LIKE'},
                    {field: 'related_id', title: '关联ID', operate: false},
                    {field: 'related_type', title: '关联类型', operate: false},
                    {field: 'admin_id', title: '管理员ID', operate: false},
                    {field: 'createtime', title: '时间', formatter: Table.api.formatter.datetime, operate: 'RANGE', addclass: 'datetimerange', sortable: true}
                ]]
            });
            Table.api.bindevent(table);
        },
        api: { bindevent: function () { Form.api.bindevent($("form[role=form]")); } }
    };
    return Controller;
});
