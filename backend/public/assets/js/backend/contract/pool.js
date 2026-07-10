define(['jquery', 'bootstrap', 'backend', 'table', 'form'], function ($, undefined, Backend, Table, Form) {

    var Controller = {
        index: function () {
            // 初始化表格参数配置
            Table.api.init({
                extend: {
                    index_url: 'contract/pool/index' + location.search,
                    add_url: 'contract/pool/add',
                    edit_url: 'contract/pool/edit',
                    multi_url: 'contract/pool/multi',
                    table: 'contract_pool',
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
                        {field: 'date', title: __('Date')},
                        {field: 'types', title: __('Types'), formatter: Table.api.formatter.status,searchList: {'1': "保险池",2:"中奖池",3:"节点分红池",4:"代币价格",
                            5:"爆仓门票",11:"创世节点分红",12:"节点分红",13:"门票分红",14:"每日通缩",21:"博饼lp分红",22:"博饼节点分红",23:"兑换代币分红",24:"添加LP分红"}},
                        {field: 'price', title: __('Price'), operate:'BETWEEN'},
                        {field: 'status', title: __('Status'), formatter: Table.api.formatter.status,searchList: {'1': "待处理",2:"已处理"}},
                        {field: 'createtime', title: __('Createtime'), operate:'RANGE', addclass:'datetimerange', formatter: Table.api.formatter.datetime},
                        {field: 'updatetime', title: __('Updatetime'), operate:'RANGE', addclass:'datetimerange', formatter: Table.api.formatter.datetime}
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
