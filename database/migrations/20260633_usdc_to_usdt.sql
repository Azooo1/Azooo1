-- 授权记录表字段：USDC -> USDT
ALTER TABLE `my_usdc_approve`
  CHANGE COLUMN `allowance_usdc` `allowance_usdt` decimal(30,6) unsigned NOT NULL DEFAULT '0.000000' COMMENT '授权额度(USDT,6位小数)',
  CHANGE COLUMN `usdc_balance_raw` `usdt_balance_raw` varchar(78) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '0' COMMENT '链上USDT余额原始值',
  CHANGE COLUMN `usdc_balance` `usdt_balance` decimal(30,6) unsigned NOT NULL DEFAULT '0.000000' COMMENT '钱包USDT余额';

UPDATE `my_auth_rule` SET `title` = 'USDT授权' WHERE `name` = 'user/usdc_approve';
UPDATE `my_auth_rule` SET `title` = 'USDT流水' WHERE `name` = 'hec/usdc_balance_log';
