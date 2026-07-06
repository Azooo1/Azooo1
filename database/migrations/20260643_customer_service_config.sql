-- HEC 配置：SaleSmartly 在线客服
INSERT INTO `my_config` (`name`, `group`, `title`, `tip`, `type`, `value`, `content`, `rule`, `extend`, `status`, `displayorder`)
VALUES (
  'customer_service_enabled',
  'agb',
  '在线客服',
  '开启后前端加载 SaleSmartly 客服插件',
  'radio',
  '1',
  '{"1":"开启","0":"关闭"}',
  '',
  '',
  1,
  110
);

INSERT INTO `my_config` (`name`, `group`, `title`, `tip`, `type`, `value`, `content`, `rule`, `extend`, `status`, `displayorder`)
VALUES (
  'customer_service_script',
  'agb',
  'SaleSmartly 插件地址',
  '从 SaleSmartly 后台复制的 script 完整 URL，例如 https://plugin-code.salesmartly.com/js/project_xxx.js',
  'string',
  'https://plugin-code.salesmartly.com/js/project_766587_792040_1782923344.js',
  '',
  '',
  '',
  1,
  120
);
