define(['jquery', 'bootstrap', 'backend', 'table', 'form'], function ($, undefined, Backend, Table, Form) {

    var Controller = {
        index: function () {
            // 初始化表格参数配置
            Table.api.init({
                extend: {
                    index_url: 'contract/balance/index' + location.search,
                    add_url: 'contract/balance/add',
                    edit_url: 'contract/balance/edit',
                    multi_url: 'contract/balance/multi',
                    import_url: 'contract/balance/import',
                    table: 'user_balance',
                }
            });

            var table = $("#table");
            var type=[];
            $.ajax({url: "contract/balance/gettype", async:false, success: function(obj){type = obj;}});
            // 初始化表格
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
                        {field: 'type', title: __('变动类型'),searchList: type,formatter:  Table.api.formatter.label},
                        {field: 'before', title: __('变动前'), operate: 'LIKE'},
                        {field: 'num', title: __('变动数量'), operate:'BETWEEN'},
                        {field: 'after', title: __('变动后'), operate:'BETWEEN'},
                        {field: 'content', title: __('备注'), operate:'BETWEEN'},
                        {field: 'create_time', title: __('变动时间'), operate:'RANGE', addclass:'datetimerange', autocomplete:false, formatter: Table.api.formatter.datetime},
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
