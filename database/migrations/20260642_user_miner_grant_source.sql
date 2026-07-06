-- 用户矿机来源：user_apply 用户申请 | admin_grant 后台发放
ALTER TABLE `my_user_miner`
  ADD COLUMN `grant_source` varchar(20) NOT NULL DEFAULT 'user_apply' COMMENT '来源 user_apply|admin_grant' AFTER `stop_reason`;
