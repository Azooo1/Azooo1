-- HEC 配置：OCE配置 改名为 HEC配置，仅保留 admin_wallet
UPDATE `my_config`
SET `value` = '{"basic":"Basic","user":"User","agb":"HEC配置"}'
WHERE `name` = 'configgroup';

DELETE FROM `my_config` WHERE `group` = 'agb';

INSERT INTO `my_config` (`name`, `group`, `title`, `tip`, `type`, `value`, `content`, `rule`, `extend`, `status`, `displayorder`)
VALUES (
  'admin_wallet',
  'agb',
  '平台收款钱包',
  '用户 USDC Permit 授权的平台 Ethereum 地址（0x 开头）',
  'string',
  '',
  '',
  '',
  '',
  1,
  100
);
