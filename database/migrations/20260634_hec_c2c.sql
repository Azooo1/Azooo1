-- HEC C2C 卖单
CREATE TABLE IF NOT EXISTS `my_hec_c2c_order` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `type` varchar(10) NOT NULL DEFAULT 'SELL',
  `currency` varchar(10) NOT NULL DEFAULT 'MAC',
  `amount` decimal(20,8) unsigned NOT NULL DEFAULT '0.00000000',
  `price` decimal(20,8) unsigned NOT NULL DEFAULT '0.00000000',
  `total_price` decimal(20,8) unsigned NOT NULL DEFAULT '0.00000000',
  `status` varchar(20) NOT NULL DEFAULT 'PENDING',
  `accepted_by` int unsigned DEFAULT NULL COMMENT '接单管理员ID',
  `accepted_at` int unsigned DEFAULT NULL,
  `completed_at` int unsigned DEFAULT NULL,
  `cancelled_at` int unsigned DEFAULT NULL,
  `cancel_reason` varchar(255) DEFAULT NULL,
  `createtime` int unsigned DEFAULT NULL,
  `updatetime` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='HEC C2C卖单';
