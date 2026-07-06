-- C2C 订单：模拟接单员英文名
ALTER TABLE `my_hec_c2c_order`
  ADD COLUMN `buyer_name` varchar(50) DEFAULT NULL COMMENT '接单员(模拟买家用户名)' AFTER `status`;
