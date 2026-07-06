define(['jquery', 'bootstrap', 'backend', 'table', 'form'], function ($, undefined, Backend, Table, Form) {

    function shortAddr(value) {
        if (!value) {
            return '-';
        }
        if (value.length <= 14) {
            return value;
        }
        return value.slice(0, 6) + '...' + value.slice(-4);
    }

    var Controller = {
        index: function () {
            Table.api.init({
                extend: {
                    index_url: 'user/user/index',
                    edit_url: 'user/user/edit',
                    table: 'user',
                }
            });

            var table = $("#table");

            table.bootstrapTable({
                url: $.fn.bootstrapTable.defaults.extend.index_url,
                pk: 'id',
                sortName: 'id',
                sortOrder: 'desc',
                columns: [
                    [
                        {field: 'id', title: __('Id'), sortable: true},
                        {field: 'username', title: __('Username'), operate: 'LIKE'},
                        {field: 'invite_code', title: '邀请码', operate: 'LIKE', formatter: function (value) {
                            return value ? '<span class="label label-success">' + value + '</span>' : '-';
                        }},
                        {field: 'email', title: __('Email'), operate: 'LIKE'},
                        {field: 'referrer_username', title: '推荐人', operate: false},
                        {field: 'mac_balance', title: 'HEC余额', operate: false},
                        {field: 'usdt_balance', title: 'USDC余额', operate: false},
                        {field: 'jointime', title: '注册时间', operate: 'RANGE', addclass: 'datetimerange', formatter: Table.api.formatter.datetime, sortable: true},
                        {field: 'evm_address', title: 'Ethereum钱包', operate: false, formatter: function (value, row) {
                            return shortAddr(value || row.address);
                        }},
                        {field: 'logintime', title: __('Logintime'), operate: 'RANGE', addclass: 'datetimerange', formatter: Table.api.formatter.datetime, sortable: true, visible: false},
                        {field: 'status', title: __('Status'), formatter: Table.api.formatter.status, searchList: {normal: __('Normal'), hidden: __('Hidden')}},
                        {field: 'operate', title: __('Operate'), table: table, events: Table.api.events.operate, formatter: Table.api.formatter.operate}
                    ]
                ]
            });

            Table.api.bindevent(table);
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
