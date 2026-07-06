CREATE TABLE IF NOT EXISTS `my_hec_balance_log` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL DEFAULT '0' COMMENT '用户ID',
  `change_type` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '变动类型',
  `amount` decimal(20,8) NOT NULL DEFAULT '0.00000000' COMMENT '变动金额(正增负减)',
  `before` decimal(20,8) unsigned NOT NULL DEFAULT '0.00000000' COMMENT '变动前余额',
  `after` decimal(20,8) unsigned NOT NULL DEFAULT '0.00000000' COMMENT '变动后余额',
  `memo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '备注',
  `related_id` int unsigned NOT NULL DEFAULT '0' COMMENT '关联业务ID',
  `related_type` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '关联业务类型',
  `admin_id` int unsigned NOT NULL DEFAULT '0' COMMENT '操作管理员ID',
  `createtime` int unsigned DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `change_type` (`change_type`),
  KEY `createtime` (`createtime`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='HEC余额流水';

CREATE TABLE IF NOT EXISTS `my_usdc_balance_log` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL DEFAULT '0' COMMENT '用户ID',
  `change_type` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '变动类型',
  `amount` decimal(20,8) NOT NULL DEFAULT '0.00000000' COMMENT '变动金额(正增负减)',
  `before` decimal(20,8) unsigned NOT NULL DEFAULT '0.00000000' COMMENT '变动前余额',
  `after` decimal(20,8) unsigned NOT NULL DEFAULT '0.00000000' COMMENT '变动后余额',
  `memo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '备注',
  `related_id` int unsigned NOT NULL DEFAULT '0' COMMENT '关联业务ID',
  `related_type` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '关联业务类型',
  `admin_id` int unsigned NOT NULL DEFAULT '0' COMMENT '操作管理员ID',
  `createtime` int unsigned DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `change_type` (`change_type`),
  KEY `createtime` (`createtime`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='USDC余额流水';
