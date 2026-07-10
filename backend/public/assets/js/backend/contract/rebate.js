define(['jquery', 'bootstrap', 'backend', 'table', 'form'], function ($, undefined, Backend, Table, Form) {

    var Controller = {
        index: function () {
            // 初始化表格参数配置
            Table.api.init({
                extend: {
                    index_url: 'contract/rebate/index' + location.search,
                    add_url: 'contract/rebate/add',
                    edit_url: 'contract/rebate/edit',
                    multi_url: 'contract/rebate/multi',
                    table: 'contract_rebate',
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
                        {field: 'uid', title: __('Uid')},
                        {field: 'address', title: __('Address')},
                        {field: 'date', title: __('Date')},
                        {field: 'types', title: __('Types'), formatter: Table.api.formatter.status,searchList: {'admin': "管理","paynode":"节点","paycode":"激活","transfer":"转让",'withdraw':"提现",
                            "exchange":"兑换","payment":"支付","recharge":"充值","superCodePool":"超级节点分红","codePool":"节点分红","cakePool":"门票分红",
                            "static":"静态收益","out":"出局收益","userAddLp":"用户添加LP","czNodePool":"节点池分红","czZjPool":"中奖池分红","czBxPool":"保险池分红",
                            "czLpPool":"LP分红","recommend":"推荐","bcGive":"爆仓额度","cancellp":"撤销LP"}},
                        {field: 'orderId', title: __('Orderid')},
                        {field: 'credittype', title: __('Credittype'), formatter: Table.api.formatter.status,searchList: {'node': "节点",'credit1':"USDT",'credit2':"CZ",'credit3':"CZ额度",
                            "credit4":"cake",'credit5':"lp"}},
                        // {field: 'percent', title: __('Percent'), operate:'BETWEEN'},
                        {field: 'price', title: __('Price'), operate:'BETWEEN'},
                        {field: 'ago', title: __('Ago'), operate:'BETWEEN'},
                        {field: 'after', title: __('After'), operate:'BETWEEN'},
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
