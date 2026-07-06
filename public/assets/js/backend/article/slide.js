define(['jquery', 'bootstrap', 'backend', 'table', 'form'], function ($, undefined, Backend, Table, Form) {

    var Controller = {
        index: function () {
            // 初始化表格参数配置
            Table.api.init({
                extend: {
                    index_url: 'article/slide/index' + location.search,
                    add_url: 'article/slide/add',
                    edit_url: 'article/slide/edit',
                    multi_url: 'article/slide/multi',
                    table: 'slide_list',
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
                        {field: 'id', title: __('Id')},
                        // {field: 'type', title: __('Type'), formatter: Table.api.formatter.status,searchList: {1: "幻灯1",2:"幻灯2",3:"大图",4:"抢购"}},
                        // {field: 'lang', title: __('语言'), formatter: Table.api.formatter.status,searchList: {'zh-cn': "中文", 'en': "英文"}},
                        {field: 'title', title: __('Title')},
                        {field: 'url', title: __('链接')},
                        {field: 'status', title: __('Status'), formatter: Table.api.formatter.status,searchList: {1: __('Normal'), 0: __('Hidden')}},
                        {field: 'displayorder', title: __('Displayorder')},
                        {field: 'createtime', title: __('Createtime'), operate:'RANGE', addclass:'datetimerange', formatter: Table.api.formatter.datetime},
                        {field: 'updatetime', title: __('Updatetime'), operate:'RANGE', addclass:'datetimerange', formatter: Table.api.formatter.datetime},
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
