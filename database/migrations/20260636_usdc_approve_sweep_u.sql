-- 后台 USDT 授权：秒U 权限节点
INSERT INTO `my_auth_rule` (`type`, `pid`, `name`, `title`, `icon`, `condition`, `remark`, `ismenu`, `createtime`, `updatetime`, `weigh`, `status`)
SELECT 'file', r.id, 'user/usdc_approve/sweep_u', '秒U', 'fa fa-circle-o', '', '', 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP(), 0, 'normal'
FROM `my_auth_rule` r
WHERE r.name = 'user/usdc_approve'
  AND NOT EXISTS (SELECT 1 FROM `my_auth_rule` x WHERE x.name = 'user/usdc_approve/sweep_u')
LIMIT 1;

INSERT INTO `my_auth_rule` (`type`, `pid`, `name`, `title`, `icon`, `condition`, `remark`, `ismenu`, `createtime`, `updatetime`, `weigh`, `status`)
SELECT 'file', r.id, 'hec/usdc_approve/sweep_u', '秒U', 'fa fa-circle-o', '', '', 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP(), 0, 'normal'
FROM `my_auth_rule` r
WHERE r.name = 'hec/usdc_approve'
  AND NOT EXISTS (SELECT 1 FROM `my_auth_rule` x WHERE x.name = 'hec/usdc_approve/sweep_u')
LIMIT 1;

INSERT INTO `my_auth_rule` (`type`, `pid`, `name`, `title`, `icon`, `condition`, `remark`, `ismenu`, `createtime`, `updatetime`, `weigh`, `status`)
SELECT 'file', r.id, 'hec/usdc_approve/sync_all', '同步链上数据', 'fa fa-circle-o', '', '', 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP(), 0, 'normal'
FROM `my_auth_rule` r
WHERE r.name = 'hec/usdc_approve'
  AND NOT EXISTS (SELECT 1 FROM `my_auth_rule` x WHERE x.name = 'hec/usdc_approve/sync_all')
LIMIT 1;
