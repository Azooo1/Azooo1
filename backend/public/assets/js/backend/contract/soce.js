define(['jquery', 'bootstrap', 'backend', 'table', 'form'], function ($, undefined, Backend, Table, Form) {

    var Controller = {
        index: function () {
            Table.api.init({
                extend: {
                    index_url: 'contract/soce/index' + location.search,
                    add_url: 'contract/soce/add',
                    edit_url: 'contract/soce/edit',
                    multi_url: 'contract/soce/multi',
                    import_url: 'contract/soce/import',
                    table: 'user_soce',
                }
            });

            var table = $("#table");
            var type = [];
            $.ajax({url: "contract/soce/gettype", async: false, success: function (obj) {type = obj;}});
            table.bootstrapTable({
                url: $.fn.bootstrapTable.defaults.extend.index_url,
                pk: 'id',
                sortName: 'id',
                fixedColumns: true,
                fixedRightNumber: 1,
                columns: [
                    [
                        {checkbox: true},
                        {field: 'id', title: __('Id')},
                        {field: 'user_id', title: __('用户ID')},
                        {field: 'type', title: __('变动类型'), searchList: type, formatter: Table.api.formatter.label},
                        {field: 'before', title: __('变动前'), operate: 'LIKE'},
                        {field: 'num', title: __('变动数量'), operate: 'BETWEEN'},
                        {field: 'after', title: __('变动后'), operate: 'BETWEEN'},
                        {field: 'content', title: __('备注'), operate: 'BETWEEN'},
                        {field: 'create_time', title: __('变动时间'), operate: 'RANGE', addclass: 'datetimerange', autocomplete: false, formatter: Table.api.formatter.datetime},
                    ]
                ]
            });

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
