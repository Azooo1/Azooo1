-- 提币记录增加扣款金额字段（拒绝时原路退回）
ALTER TABLE `my_hec_withdraw`
  ADD COLUMN `deduct_amount` decimal(20,8) unsigned NOT NULL DEFAULT '0.00000000' COMMENT '实际扣款' AFTER `amount`;
