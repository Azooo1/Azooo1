define(['jquery', 'bootstrap', 'backend', 'table', 'form'], function ($, undefined, Backend, Table, Form) {

    var Controller = {
        index: function () {
            // 初始化表格参数配置
            Table.api.init({
                extend: {
                    index_url: 'contract/level/index' + location.search,
                    add_url: 'contract/level/add',
                    edit_url: 'contract/level/edit',
                    multi_url: 'contract/level/multi',
                    import_url: 'contract/level/import',
                    table: 'contract_level',
                }
            });

            var table = $("#table");
            var cat_name=[];
            $.ajax({url: "contract/level/getlevel", async:false, success: function(obj){cat_name = obj;}});
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
                        {field: 'title', title: '等级名称', operate: 'LIKE'},
                        {field: 'rate', title: '团队收益(%)'},
                        {field: 'plat', title: '平级奖励(%)'},
                        {field: 'sxf', title: '手续费分红(%)'},
                        {field: 'line', title: '考核层数(代)'},
                        {field: 'pledge_num', title: '业绩要求', operate:'BETWEEN'},
                        {field: 'level_num', title: '级别考核人数', operate:'BETWEEN'},
                        {field: 'level', title: '考核级别要求', searchList: cat_name,formatter:  Table.api.formatter.label},
                        {field: 'price', title: '直接购买费用(U)'},
                        {field: 'createtime', title: '创建时间', operate:'RANGE', addclass:'datetimerange', autocomplete:false, formatter: Table.api.formatter.datetime},
                        {field: 'updatetime', title: '更新时间', operate:'RANGE', addclass:'datetimerange', autocomplete:false, formatter: Table.api.formatter.datetime},
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
                var category = $("select[name='category']", layero).val();
            }
        }
    };
    return Controller;
});
