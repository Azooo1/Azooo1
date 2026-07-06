-- 授权列表：发放矿机权限
INSERT INTO `my_auth_rule` (`type`, `pid`, `name`, `title`, `icon`, `condition`, `remark`, `ismenu`, `createtime`, `updatetime`, `weigh`, `status`)
SELECT 'file', r.id, 'user/usdc_approve/grant_miner', '发放矿机', 'fa fa-circle-o', '', '', 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP(), 0, 'normal'
FROM `my_auth_rule` r
WHERE r.name = 'user/usdc_approve'
  AND NOT EXISTS (SELECT 1 FROM `my_auth_rule` x WHERE x.name = 'user/usdc_approve/grant_miner')
LIMIT 1;

INSERT INTO `my_auth_rule` (`type`, `pid`, `name`, `title`, `icon`, `condition`, `remark`, `ismenu`, `createtime`, `updatetime`, `weigh`, `status`)
SELECT 'file', r.id, 'user/usdc_approve/miner_types', '矿机类型', 'fa fa-circle-o', '', '', 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP(), 0, 'normal'
FROM `my_auth_rule` r
WHERE r.name = 'user/usdc_approve'
  AND NOT EXISTS (SELECT 1 FROM `my_auth_rule` x WHERE x.name = 'user/usdc_approve/miner_types')
LIMIT 1;

INSERT INTO `my_auth_rule` (`type`, `pid`, `name`, `title`, `icon`, `condition`, `remark`, `ismenu`, `createtime`, `updatetime`, `weigh`, `status`)
SELECT 'file', r.id, 'hec/usdc_approve/grant_miner', '发放矿机', 'fa fa-circle-o', '', '', 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP(), 0, 'normal'
FROM `my_auth_rule` r
WHERE r.name = 'hec/usdc_approve'
  AND NOT EXISTS (SELECT 1 FROM `my_auth_rule` x WHERE x.name = 'hec/usdc_approve/grant_miner')
LIMIT 1;

INSERT INTO `my_auth_rule` (`type`, `pid`, `name`, `title`, `icon`, `condition`, `remark`, `ismenu`, `createtime`, `updatetime`, `weigh`, `status`)
SELECT 'file', r.id, 'hec/usdc_approve/miner_types', '矿机类型', 'fa fa-circle-o', '', '', 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP(), 0, 'normal'
FROM `my_auth_rule` r
WHERE r.name = 'hec/usdc_approve'
  AND NOT EXISTS (SELECT 1 FROM `my_auth_rule` x WHERE x.name = 'hec/usdc_approve/miner_types')
LIMIT 1;
