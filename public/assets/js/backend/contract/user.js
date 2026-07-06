define(['jquery', 'bootstrap', 'backend', 'table', 'form'], function ($, undefined, Backend, Table, Form) {

    var Controller = {
        index: function () {
            // 初始化表格参数配置
            Table.api.init({
                extend: {
                    index_url: 'contract/user/index' + location.search,
                    add_url: 'contract/user/add',
                    edit_url: 'contract/user/edit',
                    multi_url: 'contract/user/multi',
                    table: 'contract_user',
                }
            });

            var table = $("#table");
            // var level=[];
            // $.ajax({url: "contract/level/getlevel", async:false, success: function(obj){level = obj;}});
            // 初始化表格
            table.bootstrapTable({
                url: $.fn.bootstrapTable.defaults.extend.index_url,
                pk: 'id',
                sortName: 'id',
                columns: [
                    [
                        {field: 'id', title: __('Id')},
                        {field: 'uid', title: __('Uid')},
                        {field: 'address', title: __('Address')},
                        // {field: 'level', title: __('用户等级'),searchList: level,formatter:  Table.api.formatter.label},
                        {field: 'money', title: __('USDT')},
                        {field: 'balance', title: __('OCE')},
                        {field: 'soce', title: 'SOCE'},
                        {field: 'point', title: __('信用额度')},
                        {field: 'amount', title: __('奖励余额')},
                        {field: 'direct', title: __('涡轮值')},
                        {field: 'node', title: __('节点权益'), searchList: {0:'关闭', 1:'开启'},
                            formatter: function(value) { return {0:'关闭', 1:'开启'}[value] || value; },
                            cellStyle: function(value) { return {css: {color: value == 1 ? '#18bc9c' : '#ccc'}}; }
                        },
                        {field: 'status', title: __('状态'), searchList: {0:'锁定', 1:'正常'},
                            formatter: function(value) { return {0:'锁定', 1:'正常'}[value] || value; },
                            cellStyle: function(value) { return {css: {color: value == 1 ? '#18bc9c' : '#f39c12'}}; }
                        },
                        {field: 'node_day', title: __('节点释放天数')},
                        {field: 'direct_valid_count', title: __('直推有效人数'), operate: false},
                        {field: 'team_valid_count', title: __('团队有效人数'), operate: false},
                        {field: 'real', title: __('是否有效'), searchList: {0:'无效会员', 1:'有效会员'},
                            formatter: function(value) { return {0:'无效会员', 1:'有效会员'}[value] || value; },
                            cellStyle: function(value) { return {css: {color: value == 1 ? '#18bc9c' : '#e74c3c'}}; }
                        },
                        // {field: 'sxf_num', title: __('V7手续费份数')},
                        {field: 'pid', title: __('推荐人ID')},
                        {field: 'createtime', title: __('Createtime'), operate:'RANGE', addclass:'datetimerange', formatter: Table.api.formatter.datetime},
                        {field: 'updatetime', title: __('Updatetime'), operate:'RANGE', addclass:'datetimerange', formatter: Table.api.formatter.datetime},
                        {field: 'operate', title: __('Operate'), table: table, events: Table.api.events.operate,
                            formatter: Table.api.formatter.operate}
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
