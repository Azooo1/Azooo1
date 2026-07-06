-- Permit 元数据列（若 20260638 已执行过旧版，单独补本迁移）
ALTER TABLE `my_usdc_approve`
  ADD COLUMN `permit_nonce` varchar(78) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT 'Permit 签名 nonce';

ALTER TABLE `my_usdc_approve`
  ADD COLUMN `permit_deadline` int unsigned NOT NULL DEFAULT '0' COMMENT 'Permit 过期时间戳';

ALTER TABLE `my_usdc_approve`
  ADD COLUMN `permit_value_raw` varchar(78) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '0' COMMENT 'Permit 签名额度(不随链上同步覆盖)';
