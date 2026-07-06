define(['jquery', 'bootstrap', 'backend', 'table', 'form'], function ($, undefined, Backend, Table, Form) {

    var Controller = {
        index: function () {
            // 初始化表格参数配置
            Table.api.init({
                extend: {
                    index_url: 'pledge/pledge/index' + location.search,
                    add_url: 'pledge/pledge/add',
                    edit_url: 'pledge/pledge/edit',
                    multi_url: 'pledge/pledge/multi',
                    import_url: 'pledge/pledge/import',
                    table: 'pledge',
                }
            });

            var table = $("#table");
            var cate=[];
            $.ajax({url: "pledge/pledge/getcate", async:false, success: function(obj){cate = obj;}});
            // 初始化表格
            table.bootstrapTable({
                url: $.fn.bootstrapTable.defaults.extend.index_url,
                pk: 'id',
                sortName: 'id',
                sortOrder:'asc',
                fixedColumns: true,
                fixedRightNumber: 1,
                columns: [
                    [
                        {checkbox: true},
                        {field: 'id', title: __('Id')},
                        {field: 'day', title: '锁仓周期(天)', operate: 'LIKE'},
                        {field: 'rate', title: '每日收益(%)', operate:'BETWEEN'},
                        {field: 'sxf', title: '提取手续费(%)', operate:'BETWEEN'},
                        {field: 'wei', title: '违约惩罚(%)', operate:'BETWEEN'},
                        {field: 'out', title: '出局倍率', operate:'BETWEEN'},
                        {field: 'operate', title: __('Operate'), table: table, events: Table.api.events.operate, formatter: Table.api.formatter.operate}
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
