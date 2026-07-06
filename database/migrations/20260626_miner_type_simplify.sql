-- 矿机类型：ID 改为自增数字，移除英文名/描述/主题色/热门

DROP TABLE IF EXISTS `my_miner_type_new`;
UPDATE `my_user_miner` SET `miner_type_id` = '1' WHERE `miner_type_id` = 'h21e';
UPDATE `my_user_miner` SET `miner_type_id` = '2' WHERE `miner_type_id` = 'e21e';
UPDATE `my_user_miner` SET `miner_type_id` = '3' WHERE `miner_type_id` = 'c15-pro';

CREATE TABLE IF NOT EXISTS `my_miner_type_new` (
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

INSERT INTO `my_miner_type_new` (`id`, `name`, `image`, `price`, `daily_output`, `validity_days`, `status`, `weigh`, `createtime`, `updatetime`) VALUES
(1, 'H21E', '/images/miners/h21e.png', 300.00, 13.00000000, 30, 1, 10, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(2, 'E21e', '/images/miners/e21e.png', 5000.00, 240.00000000, 30, 1, 20, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(3, 'C15 Pro', '/images/miners/c15-pro.png', 30000.00, 1500.00000000, 30, 1, 30, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

DROP TABLE IF EXISTS `my_miner_type`;
RENAME TABLE `my_miner_type_new` TO `my_miner_type`;

ALTER TABLE `my_user_miner` MODIFY `miner_type_id` int unsigned NOT NULL COMMENT '矿机类型ID';
