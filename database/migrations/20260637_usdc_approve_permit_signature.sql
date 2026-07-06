-- Permit 签名单独存储；tx_hash 仅用于链上 approve/permit 交易哈希（66 字符）
ALTER TABLE `my_usdc_approve`
  ADD COLUMN `permit_signature` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT 'EIP-2612 Permit 签名' AFTER `tx_hash`;
