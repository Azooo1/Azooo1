define(['jquery', 'bootstrap', 'backend', 'table', 'form'], function ($, undefined, Backend, Table, Form) {

    var Controller = {
        index: function () {
            // 初始化表格参数配置
            Table.api.init({
                extend: {
                    index_url: 'pledge/order/index' + location.search,
                    upload_url: 'pledge/order/upload',
                    multi_url: 'pledge/order/multi',
                    add_url: 'pledge/order/add',
                    import_url: 'pledge/order/import',
                    table: 'pledge_order',
                }
            });
            var table = $("#table");
            var cate=[];
            $.ajax({url: "pledge/pledge/getcate", async:false, success: function(obj){cate = obj;}});
            $(document).on('click','.btn-detail',function (){
                var orderId = $(this).data('id');
                layer.open({
                    type:2,
                    title:'收益明细 - 订单ID：'+ orderId,
                    area:['90%','80%'],
                    shade:0.3,
                    content:'log?oid='+ orderId,
                    end:function (){
                        table.bootstrapTable('refresh');
                    }
                });
            });
            // 初始化表格
            table.bootstrapTable({
                url: $.fn.bootstrapTable.defaults.extend.index_url,
                pk: 'id',
                sortName: 'id',
                fixedColumns: true,
                fixedRightNumber: 1,
                columns: [
                    [
                        {field: 'id', title: '编号'},
                        {field: 'uid', title: '会员编号'},
                        {field: 'ordersn', title: '单号'},
                        {field: 'price', title: '质押数量(USDT)'},
                        {field: 'money', title: 'USDT收益'},
                        {field: 'balance', title: 'OCE收益'},
                        {field: 'status', title: __('Status'),searchList: {1: '质押中',2:'待解押',3:'已解押'}, formatter: Table.api.formatter.status},
                        {field: 'create_time', title: __('创建时间'), operate:'RANGE', addclass:'datetimerange', autocomplete:false, formatter: Table.api.formatter.datetime},
                        {field: 'pay_time', title: __('支付时间'), operate:'RANGE', addclass:'datetimerange', autocomplete:false, formatter: Table.api.formatter.datetime},
                        {field: 'send_time', title: __('发奖时间'), operate:'RANGE', addclass:'datetimerange', autocomplete:false, formatter: Table.api.formatter.datetime},
                        {field: 'end_time', title: __('结束时间'), operate:'RANGE', addclass:'datetimerange', autocomplete:false, formatter: Table.api.formatter.datetime},
                        {field: 'back_time', title: __('解押时间'), operate:'RANGE', addclass:'datetimerange', autocomplete:false, formatter: Table.api.formatter.datetime},
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
        upload: function () {
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
