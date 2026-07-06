-- HEC 业务表：矿机、闪兑、提币、价格
-- 在业务库执行一次（可与 20260622_hec_user_register.sql 一并执行）

-- 用户表扩展（若 20260622 已执行可跳过报错列）
ALTER TABLE `my_user`
  ADD COLUMN `role` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'USER' COMMENT '角色' AFTER `status`,
  ADD COLUMN `mac_balance` decimal(20,8) unsigned NOT NULL DEFAULT '0.00000000' COMMENT 'HEC余额' AFTER `money`,
  ADD COLUMN `eth_balance` decimal(20,8) unsigned NOT NULL DEFAULT '0.00000000' COMMENT 'ETH余额' AFTER `mac_balance`,
  ADD COLUMN `usdc_balance` decimal(20,8) unsigned NOT NULL DEFAULT '0.00000000' COMMENT 'USDC余额' AFTER `eth_balance`,
  ADD COLUMN `usdt_balance` decimal(20,8) unsigned NOT NULL DEFAULT '0.00000000' COMMENT 'USDT余额' AFTER `usdc_balance`,
  ADD COLUMN `evm_address` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'EVM钱包' AFTER `address`,
  ADD COLUMN `solana_address` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Solana钱包' AFTER `evm_address`,
  ADD COLUMN `permit_expires_at` int unsigned NOT NULL DEFAULT '0' COMMENT 'USDC授权过期时间' AFTER `solana_address`;

CREATE TABLE IF NOT EXISTS `my_miner_type` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL COMMENT '名称',
  `image` varchar(255) NOT NULL DEFAULT '' COMMENT '矿机图片',
  `price` decimal(20,2) unsigned NOT NULL DEFAULT '0.00' COMMENT '价格USD',
  `daily_output` decimal(20,8) unsigned NOT NULL DEFAULT '0.00000000' COMMENT '日产HEC',
  `validity_days` int unsigned NOT NULL DEFAULT '30' COMMENT '有效期天',
  `status` tinyint unsigned NOT NULL DEFAULT '1' COMMENT '1上架0下架',
  `weigh` int NOT NULL DEFAULT '0' COMMENT '排序',
  `createtime` int unsigned DEFAULT NULL,
  `updatetime` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='矿机类型';

CREATE TABLE IF NOT EXISTS `my_user_miner` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL COMMENT '用户ID',
  `miner_type_id` int unsigned NOT NULL COMMENT '矿机类型ID',
  `status` varchar(20) NOT NULL DEFAULT 'PENDING' COMMENT '状态',
  `wallet_address` varchar(50) NOT NULL DEFAULT '' COMMENT '钱包地址',
  `chain_id` int unsigned NOT NULL DEFAULT '1' COMMENT '链ID',
  `started_at` int unsigned DEFAULT NULL COMMENT '开始挖矿时间',
  `stopped_at` int unsigned DEFAULT NULL COMMENT '停止时间',
  `expires_at` int unsigned NOT NULL DEFAULT '0' COMMENT '到期时间',
  `last_settle_at` int unsigned NOT NULL DEFAULT '0' COMMENT '上次结算',
  `total_mined` decimal(20,8) unsigned NOT NULL DEFAULT '0.00000000' COMMENT '累计产出',
  `stop_reason` varchar(255) DEFAULT NULL COMMENT '停止原因',
  `createtime` int unsigned DEFAULT NULL,
  `updatetime` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户矿机';

CREATE TABLE IF NOT EXISTS `my_hec_exchange` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `from_currency` varchar(10) NOT NULL DEFAULT 'MAC',
  `to_currency` varchar(10) NOT NULL DEFAULT 'USDC',
  `from_amount` decimal(20,8) unsigned NOT NULL DEFAULT '0.00000000',
  `to_amount` decimal(20,8) unsigned NOT NULL DEFAULT '0.00000000',
  `rate` decimal(20,8) unsigned NOT NULL DEFAULT '0.00000000',
  `fee` decimal(20,8) unsigned NOT NULL DEFAULT '0.00000000',
  `createtime` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='HEC闪兑记录';

CREATE TABLE IF NOT EXISTS `my_hec_withdraw` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `amount` decimal(20,8) unsigned NOT NULL DEFAULT '0.00000000',
  `currency` varchar(10) NOT NULL DEFAULT 'USDC',
  `to_address` varchar(50) NOT NULL DEFAULT '',
  `chain` varchar(20) NOT NULL DEFAULT 'ETH',
  `status` varchar(20) NOT NULL DEFAULT 'PENDING',
  `review_note` varchar(255) DEFAULT NULL,
  `createtime` int unsigned DEFAULT NULL,
  `updatetime` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='HEC提币记录';

CREATE TABLE IF NOT EXISTS `my_hec_price_log` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `price` decimal(20,8) unsigned NOT NULL DEFAULT '0.27000000',
  `log_date` date NOT NULL,
  `createtime` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `log_date` (`log_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='HEC价格日志';

INSERT IGNORE INTO `my_miner_type` (`id`, `name`, `image`, `price`, `daily_output`, `validity_days`, `status`, `weigh`, `createtime`, `updatetime`) VALUES
(1, 'H21E', '/images/miners/h21e.png', 300.00, 13.00000000, 30, 1, 10, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(2, 'E21e', '/images/miners/e21e.png', 5000.00, 240.00000000, 30, 1, 20, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(3, 'C15 Pro', '/images/miners/c15-pro.png', 30000.00, 1500.00000000, 30, 1, 30, UNIX_TIMESTAMP(), UNIX_TIMESTAMP());
