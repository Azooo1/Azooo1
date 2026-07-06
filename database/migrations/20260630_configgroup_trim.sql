-- 系统配置：隐藏「充值 / 提现 / 质押 / 节点」四个分组页签
UPDATE `my_config`
SET `value` = '{"basic":"Basic","user":"User","agb":"HEC配置"}'
WHERE `name` = 'configgroup';
