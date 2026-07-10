define(['jquery', 'bootstrap', 'backend', 'table', 'form'], function ($, undefined, Backend, Table, Form) {
    var statusList = {
        PENDING: '待接单', ACCEPTED: '进行中', COMPLETED: '已完成', CANCELLED: '已取消'
    };
    var Controller = {
        index: function () {
            Table.api.init({
                extend: {
                    index_url: 'hec/c2c/index' + location.search,
                    edit_url: 'hec/c2c/edit',
                    table: 'hec_c2c_order',
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
                    {field: 'amount', title: 'HEC数量', operate: 'BETWEEN'},
                    {field: 'price', title: '单价(USDC)'},
                    {field: 'total_price', title: '总价(USDC)'},
                    {field: 'status', title: '状态', searchList: statusList, formatter: Table.api.formatter.status},
                    {field: 'accepted_username', title: '接单员'},
                    {field: 'createtime', title: '发布时间', formatter: Table.api.formatter.datetime, operate: 'RANGE', addclass: 'datetimerange'},
                    {field: 'operate', title: __('Operate'), table: table, events: Table.api.events.operate, formatter: Table.api.formatter.operate}
                ]]
            });
            Table.api.bindevent(table);
            var toolbar = table.closest('.panel').find(Table.config.toolbar);
            toolbar.on('click', '.btn-batch-accept,.btn-batch-complete,.btn-batch-cancel', function () {
                var ids = Table.api.selectedids(table);
                if (!ids.length) { Toastr.warning(__('请选择要操作的记录')); return false; }
                var url = Table.api.replaceurl($(this).data('url'), {ids: ids.join(',')}, table);
                var confirmMsg = $(this).hasClass('btn-batch-cancel')
                    ? '取消后将退回用户 HEC，确定继续？'
                    : '确定执行批量操作？';
                Layer.confirm(confirmMsg, function (index) {
                    Fast.api.ajax({url: url, data: {ids: ids.join(',')}}, function () {
                        table.bootstrapTable('refresh');
                        Layer.close(index);
                    });
                });
                return false;
            });
        },
        edit: function () {
            Controller.api.bindevent();
            $('#btn-random-buyer').on('click', function () {
                Fast.api.ajax({url: 'hec/c2c/random_buyer'}, function (data) {
                    if (data && data.buyer_name) {
                        $('#buyer-name-input').val(data.buyer_name);
                    }
                    return false;
                });
                return false;
            });
        },
        api: { bindevent: function () { Form.api.bindevent($("form[role=form]")); } }
    };
    return Controller;
});
