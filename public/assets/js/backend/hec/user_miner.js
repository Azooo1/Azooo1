define(['jquery', 'bootstrap', 'backend', 'table', 'form'], function ($, undefined, Backend, Table, Form) {
    var statusList = {
        PENDING: '待审核', APPROVED: '已通过', RUNNING: '运行中',
        STOPPED: '已停止', REJECTED: '已拒绝', EXPIRED: '已过期'
    };
    var grantSourceList = {
        user_apply: '用户申请',
        admin_grant: '后台发放'
    };
    var Controller = {
        index: function () {
            Table.api.init({
                extend: {
                    index_url: 'hec/user_miner/index' + location.search,
                    edit_url: 'hec/user_miner/edit',
                    del_url: 'hec/user_miner/del',
                    multi_url: 'hec/user_miner/multi',
                    table: 'user_miner',
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
                    {field: 'miner_type_name', title: '矿机类型'},
                    {
                        field: 'grant_source',
                        title: '来源',
                        operate: '=',
                        searchList: grantSourceList,
                        formatter: Table.api.formatter.label,
                        custom: {admin_grant: 'warning', user_apply: 'primary'}
                    },
                    {field: 'wallet_address', title: '钱包地址', operate: 'LIKE'},
                    {field: 'status', title: '状态', searchList: statusList, formatter: Table.api.formatter.status},
                    {field: 'total_mined', title: '累计HEC'},
                    {field: 'started_at', title: '开始时间', formatter: Table.api.formatter.datetime, operate: 'RANGE', addclass: 'datetimerange'},
                    {field: 'expires_at', title: '到期时间', formatter: Table.api.formatter.datetime, operate: 'RANGE', addclass: 'datetimerange'},
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
                    Layer.confirm('确定批量拒绝？', function (index) {
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
