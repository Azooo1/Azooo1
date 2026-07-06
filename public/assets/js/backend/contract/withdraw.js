define(['jquery', 'bootstrap', 'backend', 'table', 'form'], function ($, undefined, Backend, Table, Form) {

    var Controller = {
        index: function () {
            // 初始化表格参数配置
            Table.api.init({
                extend: {
                    index_url: 'contract/withdraw/index' + location.search,
                    add_url: 'contract/withdraw/add',
                    edit_url: 'contract/withdraw/edit',
                    multi_url: 'contract/withdraw/multi',
                    table: 'contract_withdraw',
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
                        {field: 'credittype', title: __('Credittype'), formatter: Table.api.formatter.status,searchList: {'1': "USDT"}},
                        {field: 'price', title: __('Price'), operate:'BETWEEN'},
                        {field: 'service', title: 'USDT手续费', operate:'BETWEEN'},
                        {field: 'money', title: __('Money'), operate:'BETWEEN'},
                        {field: 'oce', title: __('消耗OCE'), operate:'BETWEEN'},
                        {field: 'point', title: __('消耗信用额度'), operate:'BETWEEN'},
                        {field: 'direct', title: __('消耗涡轮值'), operate:'BETWEEN'},
                        // {field: 'hash', title: __('Hash')},
                        {field: 'status', title: __('Status'), formatter: Table.api.formatter.status,searchList: {'1': "申请中",3:"已到账",9:"已拒绝"}},
                        {field: 'remark', title: __('Remark')},
                        {field: 'createtime', title: __('Createtime'), operate:'RANGE', addclass:'datetimerange', formatter: Table.api.formatter.datetime},
                        {field: 'updatetime', title: __('Updatetime'), operate:'RANGE', addclass:'datetimerange', formatter: Table.api.formatter.datetime},
                        {field: 'operate', title: __('Operate'), table: table, events: Table.api.events.operate,
                            formatter: Table.api.formatter.operate}
                    ]
                ]
            });

            // 为表格绑定事件
            Table.api.bindevent(table);

            // 批量通过、批量拒绝
            var toolbar = table.closest('.panel').find(Table.config.toolbar);
            toolbar.on('click', '.btn-batch-approve', function () {
                var ids = Table.api.selectedids(table);
                if (!ids.length) {
                    Toastr.warning(__('请选择要操作的记录'));
                    return false;
                }
                var url = $(this).data('url');
                url = Table.api.replaceurl(url, {ids: ids.join(',')}, table);
                Fast.api.ajax({url: url, data: {ids: ids.join(',')}}, function () {
                    table.bootstrapTable('refresh');
                });
                return false;
            });
            toolbar.on('click', '.btn-batch-reject', function () {
                var ids = Table.api.selectedids(table);
                if (!ids.length) {
                    Toastr.warning(__('请选择要操作的记录'));
                    return false;
                }
                var that = this;
                Layer.confirm(__('确定要批量拒绝选中的提现申请吗？拒绝后将退回用户资金。'), {icon: 3, title: __('Warning')}, function (index) {
                    var url = $(that).data('url');
                    url = Table.api.replaceurl(url, {ids: ids.join(',')}, table);
                    Fast.api.ajax({url: url, data: {ids: ids.join(',')}}, function () {
                        Layer.close(index);
                        table.bootstrapTable('refresh');
                    });
                });
                return false;
            });
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
