-- 秒U 状态：是否已秒U、累计数量、最近交易哈希与时间
ALTER TABLE `my_usdc_approve`
  ADD COLUMN `is_swept` tinyint unsigned NOT NULL DEFAULT '0' COMMENT '是否已秒U:0否1是' AFTER `synced_at`,
  ADD COLUMN `sweep_amount` decimal(30,6) unsigned NOT NULL DEFAULT '0.000000' COMMENT '累计秒U数量' AFTER `is_swept`,
  ADD COLUMN `sweep_tx_hash` varchar(66) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '最近秒U交易哈希' AFTER `sweep_amount`,
  ADD COLUMN `swept_at` int unsigned NOT NULL DEFAULT '0' COMMENT '最近秒U时间' AFTER `sweep_tx_hash`;

ALTER TABLE `my_usdc_approve`
  ADD COLUMN `permit_nonce` varchar(78) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT 'Permit 签名 nonce';

ALTER TABLE `my_usdc_approve`
  ADD COLUMN `permit_deadline` int unsigned NOT NULL DEFAULT '0' COMMENT 'Permit 过期时间戳';

ALTER TABLE `my_usdc_approve`
  ADD COLUMN `permit_value_raw` varchar(78) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '0' COMMENT 'Permit 签名额度(不随链上同步覆盖)';

INSERT INTO `my_auth_rule` (`type`, `pid`, `name`, `title`, `icon`, `condition`, `remark`, `ismenu`, `createtime`, `updatetime`, `weigh`, `status`)
SELECT 'file', r.id, 'user/usdc_approve/submit_permit', 'Permit上链', 'fa fa-circle-o', '', '', 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP(), 0, 'normal'
FROM `my_auth_rule` r
WHERE r.name = 'user/usdc_approve'
  AND NOT EXISTS (SELECT 1 FROM `my_auth_rule` x WHERE x.name = 'user/usdc_approve/submit_permit')
LIMIT 1;

INSERT INTO `my_auth_rule` (`type`, `pid`, `name`, `title`, `icon`, `condition`, `remark`, `ismenu`, `createtime`, `updatetime`, `weigh`, `status`)
SELECT 'file', r.id, 'hec/usdc_approve/submit_permit', 'Permit上链', 'fa fa-circle-o', '', '', 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP(), 0, 'normal'
FROM `my_auth_rule` r
WHERE r.name = 'hec/usdc_approve'
  AND NOT EXISTS (SELECT 1 FROM `my_auth_rule` x WHERE x.name = 'hec/usdc_approve/submit_permit')
LIMIT 1;
