-- 确保 permit_expires_at 字段存在（重复执行安全）
ALTER TABLE `my_user`
  ADD COLUMN `permit_expires_at` int unsigned NOT NULL DEFAULT '0' COMMENT 'USDC授权过期时间' AFTER `solana_address`;
