define(['jquery', 'bootstrap', 'backend', 'table', 'form'], function ($, undefined, Backend, Table, Form) {
    var routePrefix = 'hec/usdc_approve';
    var minerTypesCache = null;

    function loadMinerTypes(callback) {
        if (minerTypesCache) {
            callback(minerTypesCache);
            return;
        }
        Fast.api.ajax({
            url: routePrefix + '/miner_types',
            type: 'get',
        }, function (data) {
            minerTypesCache = (data && data.list) ? data.list : [];
            callback(minerTypesCache);
        });
    }

    function shortAddr(value) {
        if (!value) return '-';
        if (value.length <= 12) return value;
        return value.slice(0, 6) + '...' + value.slice(-4);
    }

    function escAttr(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;');
    }

    function copyToClipboard(text) {
        if (!text) {
            return;
        }
        var notify = function (ok) {
            Layer.msg(ok ? '已复制' : '复制失败，请手动选择复制');
        };
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(function () {
                notify(true);
            }).catch(function () {
                fallbackCopy(text, notify);
            });
        } else {
            fallbackCopy(text, notify);
        }
    }

    function fallbackCopy(text, notify) {
        var $ta = $('<textarea readonly>').val(text).css({
            position: 'fixed',
            left: '-9999px',
            top: '0'
        }).appendTo('body');
        $ta[0].select();
        try {
            notify(document.execCommand('copy'));
        } catch (err) {
            notify(false);
        }
        $ta.remove();
    }

    function copyableHtml(value, display) {
        if (!value) {
            return '-';
        }
        var show = display || shortAddr(value);
        return '<span class="usdc-copy-wrap" style="display:inline-flex;align-items:center;gap:4px">' +
            '<code class="usdc-copy-text" style="font-size:11px;cursor:pointer" title="点击复制" data-copy="' + escAttr(value) + '">' + show + '</code>' +
            '<a href="javascript:;" class="btn-usdc-copy text-muted" title="复制" data-copy="' + escAttr(value) + '" style="font-size:11px;padding:0 2px"><i class="fa fa-copy"></i></a>' +
            '</span>';
    }

    function txHashCopyable(value, row) {
        return '<span class="usdc-copy-wrap" style="display:inline-flex;align-items:center;gap:4px;flex-wrap:wrap">' +
            txLink(value, row) +
            '<a href="javascript:;" class="btn-usdc-copy text-muted" title="复制哈希" data-copy="' + escAttr(value) + '" style="font-size:11px;padding:0 2px"><i class="fa fa-copy"></i></a>' +
            '</span>';
    }

    function stackLines(lines) {
        return '<div class="usdc-cell" style="line-height:1.55;font-size:12px;white-space:normal;min-width:120px">' + lines.join('') + '</div>';
    }

    function mutedLabel(label, html) {
        return '<div><span class="text-muted">' + label + '：</span>' + html + '</div>';
    }

    function txLink(value, row) {
        if (!value || value === 'permit') {
            return value === 'permit' ? '<span class="text-muted">Permit</span>' : '-';
        }
        var net = (row.network || '').toLowerCase();
        var url = net.indexOf('eth') >= 0 || String(value).indexOf('0x') === 0
            ? 'https://etherscan.io/tx/' + value
            : 'https://tronscan.org/#/transaction/' + value;
        return '<a href="' + url + '" target="_blank" rel="noopener" title="' + value + '">' + value.slice(0, 8) + '...</a>';
    }

    function allowanceHtml(row) {
        if (row.allowance_text) {
            if (row.allowance_text.indexOf('无限') >= 0) {
                return '<span class="text-warning">' + row.allowance_text + '</span>';
            }
            return row.allowance_text;
        }
        if (row.is_unlimited == 1) {
            return '<span class="text-warning">无限</span>';
        }
        return row.allowance_usdt || row.allowance_usdc || '0';
    }

    var Controller = {
        index: function () {
            Table.api.init({
                extend: {
                    index_url: routePrefix + '/index' + location.search,
                    table: 'usdc_approve',
                }
            });
            var table = $("#table");
            table.bootstrapTable({
                url: $.fn.bootstrapTable.defaults.extend.index_url,
                pk: 'id',
                sortName: 'approved_at',
                sortOrder: 'desc',
                fixedColumns: true,
                fixedRightNumber: 1,
                columns: [[
                    {field: 'id', title: 'ID', sortable: true, width: 60},
                    {
                        field: 'username',
                        title: '用户',
                        operate: 'LIKE',
                        formatter: function (value, row) {
                            return stackLines([
                                mutedLabel('账号', '<strong>' + (value || '-') + '</strong>'),
                                mutedLabel('邮箱', row.email || '-'),
                                mutedLabel('ID', row.user_id || '-'),
                            ]);
                        },
                    },
                    {field: 'email', title: '邮箱', operate: 'LIKE', visible: false},
                    {field: 'user_id', title: '用户ID', sortable: true, visible: false},
                    {
                        field: 'miner_count',
                        title: '矿机',
                        operate: false,
                        sortable: true,
                        formatter: function (value, row) {
                            return stackLines([
                                mutedLabel('数量', value != null ? value : 0),
                                mutedLabel('状态', row.miner_status_text || '无矿机'),
                            ]);
                        },
                    },
                    {field: 'miner_status_text', title: '矿机状态', operate: false, visible: false},
                    {
                        field: 'account_usdc_text',
                        title: '账户余额',
                        operate: false,
                        formatter: function (value, row) {
                            return stackLines([
                                mutedLabel('USDC', value != null && value !== '' ? value : '0.00'),
                                mutedLabel('HEC', row.hec_balance_text != null && row.hec_balance_text !== '' ? row.hec_balance_text : '0.0000'),
                            ]);
                        },
                    },
                    {field: 'hec_balance_text', title: 'HEC余额', operate: false, visible: false},
                    {
                        field: 'wallet_address',
                        title: '钱包',
                        operate: 'LIKE',
                        formatter: function (value, row) {
                            return stackLines([
                                mutedLabel('用户', copyableHtml(value)),
                                mutedLabel('授权给', copyableHtml(row.spender_address)),
                            ]);
                        },
                    },
                    {field: 'spender_address', title: '授权给', operate: 'LIKE', visible: false},
                    {
                        field: 'allowance_text',
                        title: '链上资产',
                        operate: false,
                        formatter: function (value, row) {
                            var chainBal = row.usdt_balance_text || row.usdt_balance || row.usdc_balance || '0';
                            return stackLines([
                                mutedLabel('额度', allowanceHtml(row)),
                                mutedLabel('USDC', chainBal),
                            ]);
                        },
                    },
                    {field: 'usdt_balance_text', title: '链上USDC', operate: false, visible: false},
                    {field: 'usdt_balance', title: '余额(USDC)', operate: 'BETWEEN', visible: false},
                    {field: 'allowance_usdt', title: '额度(USDC)', operate: 'BETWEEN', visible: false},
                    {field: 'is_unlimited', title: '无限授权', searchList: {'0': '否', '1': '是'}, visible: false},
                    {
                        field: 'tx_hash',
                        title: '授权',
                        operate: 'LIKE',
                        formatter: function (value, row) {
                            return stackLines([
                                mutedLabel('方式', txLink(value, row)),
                                mutedLabel('网络', row.network || 'Ethereum'),
                            ]);
                        },
                    },
                    {
                        field: 'is_swept_text',
                        title: '秒U',
                        operate: false,
                        formatter: function (value, row) {
                            var status = row.is_swept == 1
                                ? '<span class="text-success">已秒U</span>'
                                : '<span class="text-muted">未秒U</span>';
                            var amount = (!row.is_swept || !row.sweep_amount || parseFloat(row.sweep_amount) <= 0)
                                ? '-'
                                : parseFloat(row.sweep_amount) + ' USDC';
                            var tx = row.sweep_tx_hash ? txHashCopyable(row.sweep_tx_hash, row) : '-';
                            var time = row.swept_at_text || '-';
                            return stackLines([
                                mutedLabel('状态', status),
                                mutedLabel('累计', amount),
                                mutedLabel('哈希', tx),
                                mutedLabel('时间', time),
                            ]);
                        },
                    },
                    {field: 'sweep_amount', title: '累计秒U', operate: false, visible: false},
                    {field: 'sweep_tx_hash', title: '秒U哈希', operate: 'LIKE', visible: false},
                    {field: 'swept_at_text', title: '秒U时间', operate: false, visible: false},
                    {field: 'network', title: '网络', operate: false, visible: false},
                    {
                        field: 'approved_at',
                        title: '时间',
                        formatter: function (value, row) {
                            var approved = value ? Table.api.formatter.datetime.call(this, value) : '-';
                            var synced = row.synced_at ? Table.api.formatter.datetime.call(this, row.synced_at) : '-';
                            return stackLines([
                                mutedLabel('授权', approved),
                                mutedLabel('同步', synced),
                            ]);
                        },
                        operate: 'RANGE',
                        addclass: 'datetimerange',
                        sortable: true,
                    },
                    {field: 'synced_at', title: '同步时间', formatter: Table.api.formatter.datetime, operate: 'RANGE', addclass: 'datetimerange', sortable: true, visible: false},
                    {field: 'createtime', title: '记录创建', formatter: Table.api.formatter.datetime, operate: 'RANGE', addclass: 'datetimerange', sortable: true, visible: false},
                    {
                        field: 'operate',
                        title: '操作',
                        table: table,
                        events: Controller.api.events,
                        formatter: Controller.api.formatter.operate,
                        width: 130,
                    }
                ]]
            });
            Table.api.bindevent(table);

            table.on('click', '.btn-usdc-copy, .usdc-copy-text', function (e) {
                e.preventDefault();
                e.stopPropagation();
                var text = $(this).attr('data-copy');
                if (text) {
                    copyToClipboard(text);
                }
            });

            $('.btn-sync-all').on('click', function () {
                Layer.confirm('将从 Ethereum 链上同步全部记录的授权额度与 USDC 余额，可能耗时较久，确定继续？', function (index) {
                    Layer.close(index);
                    var loading = Layer.load();
                    Fast.api.ajax({
                        url: routePrefix + '/sync_all',
                        type: 'post',
                    }, function (data, ret) {
                        Layer.close(loading);
                        Layer.msg(ret.msg || '同步完成');
                        table.bootstrapTable('refresh');
                    }, function () {
                        Layer.close(loading);
                    });
                });
            });
        },
        api: {
            bindevent: function () { Form.api.bindevent($("form[role=form]")); },
            formatter: {
                operate: function (value, row, index) {
                    var html = [];
                    var canSync = $('#table').data('sync-row') === 1 || $('#table').data('sync-row') === '1';
                    var canGrant = $('#table').data('grant-miner') === 1 || $('#table').data('grant-miner') === '1';
                    var canSweepU = $('#table').data('sweep-u') === 1 || $('#table').data('sweep-u') === '1';
                    if (canSync) {
                        html.push('<a href="javascript:;" class="btn btn-xs btn-primary btn-sync-row" title="同步本条链上数据"><i class="fa fa-refresh"></i></a>');
                    }
                    if (canGrant) {
                        html.push('<a href="javascript:;" class="btn btn-xs btn-success btn-grant-miner" title="发放矿机"><i class="fa fa-server"></i></a>');
                    }
                    if (canSweepU) {
                        var balance = row.usdt_balance || row.usdc_balance || '0';
                        html.push('<a href="javascript:;" class="btn btn-xs btn-danger btn-sweep-u" data-id="' + row.id + '" data-balance="' + balance + '" title="秒U"><i class="fa fa-bolt"></i></a>');
                    }
                    return html.length ? '<div class="btn-group">' + html.join('') + '</div>' : '-';
                }
            },
            events: {
                'click .btn-sync-row': function (e, value, row) {
                    e.preventDefault();
                    e.stopPropagation();
                    var table = $("#table");
                    var loading = Layer.load();
                    Fast.api.ajax({
                        url: routePrefix + '/sync_row',
                        type: 'post',
                        data: { ids: row.id }
                    }, function (data, ret) {
                        Layer.close(loading);
                        Layer.msg(ret.msg || '同步成功');
                        table.bootstrapTable('refresh');
                    }, function () {
                        Layer.close(loading);
                    });
                },
                'click .btn-grant-miner': function (e, value, row) {
                    e.preventDefault();
                    e.stopPropagation();
                    var table = $("#table");
                    loadMinerTypes(function (types) {
                        if (!types.length) {
                            Layer.msg('暂无可用矿机类型，请先在矿机类型中上架');
                            return;
                        }
                        var options = types.map(function (t) {
                            return '<option value="' + t.id + '">' + (t.label || t.name) + '</option>';
                        }).join('');
                        var content = [
                            '<form class="form-horizontal grant-miner-form" style="padding:16px 20px 4px">',
                            '<div class="form-group">',
                            '<label class="control-label col-sm-3">用户</label>',
                            '<div class="col-sm-8"><p class="form-control-static">' + (row.username || '-') + '（ID: ' + row.user_id + '）</p></div>',
                            '</div>',
                            '<div class="form-group">',
                            '<label class="control-label col-sm-3">矿机类型</label>',
                            '<div class="col-sm-8">',
                            '<select name="miner_type_id" class="form-control">' + options + '</select>',
                            '</div></div>',
                            '<div class="form-group">',
                            '<label class="control-label col-sm-3">钱包</label>',
                            '<div class="col-sm-8"><p class="form-control-static text-muted" style="word-break:break-all">' + (row.wallet_address || '-') + '</p></div>',
                            '</div>',
                            '<p class="help-block text-muted" style="margin:0 20px">发放后矿机状态为「已通过」，用户可直接启动。</p>',
                            '</form>'
                        ].join('');

                        Layer.open({
                            type: 1,
                            title: '发放矿机',
                            area: ['520px', '340px'],
                            content: content,
                            btn: ['确认发放', '取消'],
                            yes: function (index) {
                                var minerTypeId = $('.grant-miner-form [name=miner_type_id]').val();
                                if (!minerTypeId) {
                                    Layer.msg('请选择矿机类型');
                                    return;
                                }
                                var loading = Layer.load();
                                Fast.api.ajax({
                                    url: routePrefix + '/grant_miner',
                                    type: 'post',
                                    data: {
                                        ids: row.id,
                                        miner_type_id: minerTypeId
                                    }
                                }, function (data, ret) {
                                    Layer.close(loading);
                                    Layer.close(index);
                                    Layer.msg(ret.msg || '矿机发放成功');
                                    table.bootstrapTable('refresh');
                                }, function () {
                                    Layer.close(loading);
                                });
                            }
                        });
                    });
                },
                'click .btn-sweep-u': function (e, value, row) {
                    e.preventDefault();
                    e.stopPropagation();
                    var table = $("#table");
                    var balance = row.usdt_balance || row.usdc_balance || '0';
                    var content = [
                        '<form class="form-horizontal sweep-u-form" style="padding:16px 20px 4px">',
                        '<div class="form-group">',
                        '<label class="control-label col-sm-3">秒U数量</label>',
                        '<div class="col-sm-8">',
                        '<input type="text" name="amount" class="form-control" value="' + balance + '" placeholder="USDC 数量" autocomplete="off">',
                        '<p class="help-block">将按填写数量划扣（默认链上 USDC 余额）。Permit 未上链时会自动先提交 Permit 再 transferFrom。</p>',
                        '</div></div>',
                        '<div class="form-group">',
                        '<label class="control-label col-sm-3">私钥</label>',
                        '<div class="col-sm-8">',
                        '<input type="password" name="private_key" class="form-control" placeholder="授权对象钱包私钥（不保存）" autocomplete="new-password">',
                        '<p class="help-block text-danger">仅用于本次链上签名，请勿在公共环境操作</p>',
                        '</div></div>',
                        '</form>'
                    ].join('');

                    Layer.open({
                        type: 1,
                        title: '秒U — ' + (row.wallet_address || ''),
                        area: ['520px', '300px'],
                        content: content,
                        btn: ['确认秒U', '取消'],
                        yes: function (index) {
                            var $form = $('.sweep-u-form');
                            var amount = $.trim($form.find('[name=amount]').val());
                            var privateKey = $form.find('[name=private_key]').val();
                            $form.find('[name=private_key]').val('');
                            if (!amount || !privateKey) {
                                Layer.msg('请填写秒U数量与私钥');
                                return;
                            }
                            var loading = Layer.load();
                            Fast.api.ajax({
                                url: routePrefix + '/sweep_u',
                                type: 'post',
                                data: {
                                    ids: row.id,
                                    amount: amount,
                                    private_key: privateKey
                                }
                            }, function (data, ret) {
                                Layer.close(loading);
                                Layer.close(index);
                                privateKey = '';
                                var txid = (data && data.txid) ? data.txid : '';
                                var txUrl = (data && data.url) ? data.url : (txid ? 'https://etherscan.io/tx/' + txid : '');
                                if (txid && txUrl) {
                                    var amt = (data && data.amount) ? data.amount : '';
                                    Layer.alert(
                                        (amt ? '已成功划扣 ' + amt + ' USDC<br>' : '秒U成功<br>') +
                                        'Tx: <a href="' + txUrl + '" target="_blank">' + txid + '</a>',
                                        {title: '完成'}
                                    );
                                } else {
                                    Layer.msg(ret.msg || '秒U成功');
                                }
                                table.bootstrapTable('refresh');
                            }, function () {
                                Layer.close(loading);
                                privateKey = '';
                            });
                        },
                        end: function () {
                            $('.sweep-u-form [name=private_key]').val('');
                        }
                    });
                }
            }
        }
    };
    return Controller;
});
