ALTER TABLE `my_miner_type` ADD COLUMN `image` varchar(255) NOT NULL DEFAULT '' COMMENT '矿机图片' AFTER `name`;

UPDATE `my_miner_type` SET `image` = '/images/miners/h21e.png' WHERE `id` = 1 AND `image` = '';
UPDATE `my_miner_type` SET `image` = '/images/miners/e21e.png' WHERE `id` = 2 AND `image` = '';
UPDATE `my_miner_type` SET `image` = '/images/miners/c15-pro.png' WHERE `id` = 3 AND `image` = '';
