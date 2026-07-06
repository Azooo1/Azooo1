-- HEC 邮箱注册：扩展会员表字段
-- 在库 dy（或你的业务库）执行一次即可

ALTER TABLE `my_user`
  ADD COLUMN `role` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'USER' COMMENT '角色' AFTER `status`,
  ADD COLUMN `mac_balance` decimal(20,8) unsigned NOT NULL DEFAULT '0.00000000' COMMENT 'HEC余额' AFTER `money`,
  ADD COLUMN `eth_balance` decimal(20,8) unsigned NOT NULL DEFAULT '0.00000000' COMMENT 'ETH余额' AFTER `mac_balance`,
  ADD COLUMN `usdc_balance` decimal(20,8) unsigned NOT NULL DEFAULT '0.00000000' COMMENT 'USDC余额' AFTER `eth_balance`,
  ADD COLUMN `usdt_balance` decimal(20,8) unsigned NOT NULL DEFAULT '0.00000000' COMMENT 'USDT余额' AFTER `usdc_balance`,
  ADD COLUMN `evm_address` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'EVM钱包' AFTER `address`,
  ADD COLUMN `solana_address` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Solana钱包' AFTER `evm_address`;
