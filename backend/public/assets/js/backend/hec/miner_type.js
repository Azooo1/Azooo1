define(['jquery', 'bootstrap', 'backend', 'table', 'form'], function ($, undefined, Backend, Table, Form) {
    var Controller = {
        index: function () {
            Table.api.init({
                extend: {
                    index_url: 'hec/miner_type/index' + location.search,
                    add_url: 'hec/miner_type/add',
                    edit_url: 'hec/miner_type/edit',
                    del_url: 'hec/miner_type/del',
                    multi_url: 'hec/miner_type/multi',
                    table: 'miner_type',
                }
            });
            var table = $("#table");
            table.bootstrapTable({
                url: $.fn.bootstrapTable.defaults.extend.index_url,
                pk: 'id',
                sortName: 'weigh',
                sortOrder: 'desc',
                columns: [[
                    {checkbox: true},
                    {field: 'id', title: '类型ID'},
                    {field: 'image', title: '图片', events: Table.api.events.image, formatter: Table.api.formatter.image, operate: false},
                    {field: 'name', title: '名称'},
                    {field: 'price', title: '价格(USD)', operate: 'BETWEEN'},
                    {field: 'daily_output', title: '日产HEC'},
                    {field: 'validity_days', title: '有效期(天)'},
                    {field: 'status', title: '上架', searchList: {0: '下架', 1: '上架'}, formatter: Table.api.formatter.status},
                    {field: 'weigh', title: '排序'},
                    {field: 'updatetime', title: '更新时间', formatter: Table.api.formatter.datetime, operate: 'RANGE', addclass: 'datetimerange'},
                    {field: 'operate', title: __('Operate'), table: table, events: Table.api.events.operate, formatter: Table.api.formatter.operate}
                ]]
            });
            Table.api.bindevent(table);
        },
        add: function () { Controller.api.bindevent(); },
        edit: function () { Controller.api.bindevent(); },
        api: { bindevent: function () { Form.api.bindevent($("form[role=form]")); } }
    };
    return Controller;
});
