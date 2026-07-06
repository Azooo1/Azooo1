ALTER TABLE `my_usdc_approve`
  ADD COLUMN `usdc_balance_raw` varchar(78) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '0' COMMENT '链上USDC余额原始值' AFTER `allowance_usdc`,
  ADD COLUMN `usdc_balance` decimal(30,6) unsigned NOT NULL DEFAULT '0.000000' COMMENT '钱包USDC余额' AFTER `usdc_balance_raw`,
  ADD COLUMN `synced_at` int unsigned NOT NULL DEFAULT '0' COMMENT '链上同步时间' AFTER `approved_at`;
