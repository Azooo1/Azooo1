define(['jquery', 'bootstrap', 'backend', 'table', 'form'], function ($, undefined, Backend, Table, Form) {
    var statusList = {
        PENDING: '待审核', APPROVED: '已通过', COMPLETED: '已完成', REJECTED: '已拒绝'
    };
    var Controller = {
        index: function () {
            Table.api.init({
                extend: {
                    index_url: 'hec/withdraw/index' + location.search,
                    edit_url: 'hec/withdraw/edit',
                    multi_url: 'hec/withdraw/multi',
                    table: 'hec_withdraw',
                }
            });
            var table = $("#table");
            table.bootstrapTable({
                url: $.fn.bootstrapTable.defaults.extend.index_url,
                pk: 'id',
                sortName: 'id',
                sortOrder: 'desc',
                columns: [[
                    {checkbox: true},
                    {field: 'id', title: 'ID'},
                    {field: 'user_id', title: '用户ID'},
                    {field: 'username', title: '用户名'},
                    {field: 'currency', title: '币种'},
                    {field: 'amount', title: '到账数量', operate: 'BETWEEN'},
                    {field: 'to_address', title: '提币地址', operate: 'LIKE'},
                    {field: 'chain', title: '链'},
                    {field: 'status', title: '状态', searchList: statusList, formatter: Table.api.formatter.status},
                    {field: 'review_note', title: '备注'},
                    {field: 'createtime', title: '申请时间', formatter: Table.api.formatter.datetime, operate: 'RANGE', addclass: 'datetimerange'},
                    {field: 'operate', title: __('Operate'), table: table, events: Table.api.events.operate, formatter: Table.api.formatter.operate}
                ]]
            });
            Table.api.bindevent(table);
            var toolbar = table.closest('.panel').find(Table.config.toolbar);
            toolbar.on('click', '.btn-batch-approve,.btn-batch-reject', function () {
                var ids = Table.api.selectedids(table);
                if (!ids.length) { Toastr.warning(__('请选择要操作的记录')); return false; }
                var url = Table.api.replaceurl($(this).data('url'), {ids: ids.join(',')}, table);
                if ($(this).hasClass('btn-batch-reject')) {
                    Layer.confirm('拒绝后将退回用户余额，确定继续？', function (index) {
                        Fast.api.ajax({url: url, data: {ids: ids.join(',')}}, function () { table.bootstrapTable('refresh'); Layer.close(index); });
                    });
                } else {
                    Fast.api.ajax({url: url, data: {ids: ids.join(',')}}, function () { table.bootstrapTable('refresh'); });
                }
                return false;
            });
        },
        edit: function () { Controller.api.bindevent(); },
        api: { bindevent: function () { Form.api.bindevent($("form[role=form]")); } }
    };
    return Controller;
});
