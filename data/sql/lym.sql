-- phpMyAdmin SQL Dump
-- version 4.8.5
-- https://www.phpmyadmin.net/
--
-- 主机： localhost
-- 生成日期： 2023-07-25 09:50:24
-- 服务器版本： 5.7.26
-- PHP 版本： 7.3.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- 数据库： `lym`
--

-- --------------------------------------------------------

--
-- 表的结构 `my_admin`
--

CREATE TABLE `my_admin` (
  `id` int(10) UNSIGNED NOT NULL COMMENT 'ID',
  `username` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '用户名',
  `nickname` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '昵称',
  `password` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '密码',
  `salt` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '密码盐',
  `avatar` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '头像',
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '电子邮箱',
  `loginfailure` tinyint(1) UNSIGNED NOT NULL DEFAULT '0' COMMENT '失败次数',
  `logintime` int(10) DEFAULT NULL COMMENT '登录时间',
  `loginip` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '登录IP',
  `createtime` int(10) DEFAULT NULL COMMENT '创建时间',
  `updatetime` int(10) DEFAULT NULL COMMENT '更新时间',
  `token` varchar(59) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT 'Session标识',
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'normal' COMMENT '状态'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员表';

--
-- 转存表中的数据 `my_admin`
--

INSERT INTO `my_admin` (`id`, `username`, `nickname`, `password`, `salt`, `avatar`, `email`, `loginfailure`, `logintime`, `loginip`, `createtime`, `updatetime`, `token`, `status`) VALUES
(1, 'admin', 'Admin', '29f2147bacdfec739826d4fc8c47b41e', 'tplCoE', '/assets/img/avatar.png', 'admin@admin.com', 0, 1690246474, '127.0.0.1', 1492186163, 1690246474, 'bb07f79b-ec82-4115-aee4-7a4f564f0e1f', 'normal'),
(2, 'zh9025', '超级管理', 'c1af387cff7890519bab6bca48188cbe', 'Yy3FJD', '/assets/img/avatar.png', 'zh9025@qq.com', 0, 1597991803, '172.16.1.21', 1597985822, 1598006775, '', 'normal');

-- --------------------------------------------------------

--
-- 表的结构 `my_admin_log`
--

CREATE TABLE `my_admin_log` (
  `id` int(10) UNSIGNED NOT NULL COMMENT 'ID',
  `admin_id` int(10) UNSIGNED NOT NULL DEFAULT '0' COMMENT '管理员ID',
  `username` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '管理员名字',
  `url` varchar(1500) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '操作页面',
  `title` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '日志标题',
  `content` longtext COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '内容',
  `ip` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT 'IP',
  `useragent` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT 'User-Agent',
  `createtime` int(10) DEFAULT NULL COMMENT '操作时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员日志表';

--
-- 转存表中的数据 `my_admin_log`
--

INSERT INTO `my_admin_log` (`id`, `admin_id`, `username`, `url`, `title`, `content`, `ip`, `useragent`, `createtime`) VALUES
(1, 0, 'Unknown', '/TbJzmVSIWa.php/index/login?url=%2FTbJzmVSIWa.php', '登录', '{\"url\":\"\\/TbJzmVSIWa.php\",\"__token__\":\"c4bdef7fd3b78b941d339fb0b7fd7c4e\",\"username\":\"admin\",\"captcha\":\"k6mr\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1597985450),
(2, 0, 'Unknown', '/TbJzmVSIWa.php/index/login?url=%2FTbJzmVSIWa.php', '登录', '{\"url\":\"\\/TbJzmVSIWa.php\",\"__token__\":\"eca71141abeeca3e4ab07541e7e8d9b2\",\"username\":\"admin\",\"captcha\":\"6pey\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1597985457),
(3, 0, 'Unknown', '/TbJzmVSIWa.php/index/login?url=%2FTbJzmVSIWa.php', '登录', '{\"url\":\"\\/TbJzmVSIWa.php\",\"__token__\":\"4fc9bde20eae38233efe99ba13abb0b5\",\"username\":\"admin\",\"captcha\":\"wxxl\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1597985463),
(4, 0, 'Unknown', '/TbJzmVSIWa.php/index/login?url=%2FTbJzmVSIWa.php', '', '{\"url\":\"\\/TbJzmVSIWa.php\",\"__token__\":\"9b4b388db18904803e98cca8d2db05af\",\"username\":\"admin\",\"captcha\":\"wxxl\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1597985464),
(5, 0, 'Unknown', '/TbJzmVSIWa.php/index/login?url=%2FTbJzmVSIWa.php', '登录', '{\"url\":\"\\/TbJzmVSIWa.php\",\"__token__\":\"ed445dc10f4578a2b660ad2069079845\",\"username\":\"admin\",\"captcha\":\"xrid\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1597985471),
(6, 0, 'Unknown', '/TbJzmVSIWa.php/index/login?url=%2FTbJzmVSIWa.php', '登录', '{\"url\":\"\\/TbJzmVSIWa.php\",\"__token__\":\"6fd7178e9c599e4e20eb87a1c5ad5a31\",\"username\":\"admin\",\"captcha\":\"iuwc\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1597985486),
(7, 0, 'Unknown', '/TbJzmVSIWa.php/index/login?url=%2FTbJzmVSIWa.php', '登录', '{\"url\":\"\\/TbJzmVSIWa.php\",\"__token__\":\"45b25c66b5b8d61fc5fb0feb58823759\",\"username\":\"admin\",\"captcha\":\"n4ae\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1597985495),
(8, 0, 'Unknown', '/TbJzmVSIWa.php/index/login?url=%2FTbJzmVSIWa.php', '登录', '{\"url\":\"\\/TbJzmVSIWa.php\",\"__token__\":\"e212be9db0ada93d0ea0e67a366d81ae\",\"username\":\"admin\",\"captcha\":\"n4ae\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1597985559),
(9, 0, 'Unknown', '/TbJzmVSIWa.php/index/login?url=%2FTbJzmVSIWa.php', '登录', '{\"url\":\"\\/TbJzmVSIWa.php\",\"__token__\":\"e531618551d6215963ca706cf3896be5\",\"username\":\"admin\",\"captcha\":\"n4ae\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1597985563),
(10, 0, 'Unknown', '/TbJzmVSIWa.php/index/login?url=%2FTbJzmVSIWa.php', '登录', '{\"url\":\"\\/TbJzmVSIWa.php\",\"__token__\":\"e6397dfdbca97b42b6728a2c7c6da521\",\"username\":\"admin\",\"captcha\":\"ov6m\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1597985578),
(11, 0, 'Unknown', '/TbJzmVSIWa.php/index/login?url=%2FTbJzmVSIWa.php', '登录', '{\"url\":\"\\/TbJzmVSIWa.php\",\"__token__\":\"8d9fde4880ee47d35a3ab664a51b3796\",\"username\":\"admin\",\"captcha\":\"wl5a\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1597985666),
(12, 0, 'Unknown', '/TbJzmVSIWa.php/index/login?url=%2FTbJzmVSIWa.php', '登录', '{\"url\":\"\\/TbJzmVSIWa.php\",\"__token__\":\"799999e0bbb22f18b0e408c918ab6460\",\"username\":\"admin\",\"captcha\":\"c2xc\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1597985673),
(13, 1, 'admin', '/TbJzmVSIWa.php/index/login?url=%2FTbJzmVSIWa.php', '登录', '{\"url\":\"\\/TbJzmVSIWa.php\",\"__token__\":\"5e0beb515c02e3975e1f665b181a9a9b\",\"username\":\"admin\",\"captcha\":\"x6nk\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1597985722),
(14, 1, 'admin', '/TbJzmVSIWa.php/auth/group/del/ids/4', '权限管理 角色组 删除', '{\"action\":\"del\",\"ids\":\"4\",\"params\":\"\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1597985754),
(15, 1, 'admin', '/TbJzmVSIWa.php/auth/group/del/ids/5', '权限管理 角色组 删除', '{\"action\":\"del\",\"ids\":\"5\",\"params\":\"\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1597985756),
(16, 1, 'admin', '/TbJzmVSIWa.php/auth/group/del/ids/3', '权限管理 角色组 删除', '{\"action\":\"del\",\"ids\":\"3\",\"params\":\"\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1597985758),
(17, 1, 'admin', '/TbJzmVSIWa.php/auth/group/del/ids/2', '权限管理 角色组 删除', '{\"action\":\"del\",\"ids\":\"2\",\"params\":\"\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1597985760),
(18, 1, 'admin', '/TbJzmVSIWa.php/auth/group/roletree', '权限管理 角色组', '{\"pid\":\"1\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1597985762),
(19, 1, 'admin', '/TbJzmVSIWa.php/auth/group/add?dialog=1', '权限管理 角色组 添加', '{\"dialog\":\"1\",\"__token__\":\"01cc328d174cf9c5231ea85de6833e72\",\"row\":{\"rules\":\"1,2,6,7,8,9,10,11,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,40,41,42,43,44,45,46,47,48,49,50,67,68,69,70,71,72,5,66\",\"pid\":\"1\",\"name\":\"\\u8d85\\u7ea7\\u7ba1\\u7406\",\"status\":\"normal\"}}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1597985795),
(20, 1, 'admin', '/TbJzmVSIWa.php/auth/admin/add?dialog=1', '权限管理 管理员管理 添加', '{\"dialog\":\"1\",\"__token__\":\"cb5fac7a7e07b51280093c17568e58a5\",\"group\":[\"6\"],\"row\":{\"username\":\"zh9025\",\"email\":\"zh9025@qq.com\",\"nickname\":\"\\u8d85\\u7ea7\\u7ba1\\u7406\",\"password\":\"123456\",\"status\":\"normal\"}}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1597985822),
(21, 2, 'zh9025', '/TbJzmVSIWa.php/index/login', '登录', '{\"__token__\":\"37be72644b5bbe211bc7045b590d53bb\",\"username\":\"zh9025\",\"captcha\":\"glf7\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1597985837),
(22, 2, 'zh9025', '/TbJzmVSIWa.php/general.config/edit', '常规管理 系统配置 编辑', '{\"__token__\":\"b976a585bc62ff81934527cf6faa837d\",\"row\":{\"name\":\"\\u76db\\u5927\\u5408\\u7ea6\",\"beian\":\"\",\"cdnurl\":\"\",\"version\":\"1.0.1\",\"timezone\":\"Asia\\/Shanghai\",\"forbiddenip\":\"\",\"languages\":\"{&quot;backend&quot;:&quot;zh-cn&quot;,&quot;frontend&quot;:&quot;zh-cn&quot;}\",\"fixedpage\":\"dashboard\"}}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1597985903),
(23, 0, 'Unknown', '/TbJzmVSIWa.php/index/login', '', '{\"__token__\":\"0f3fc1bac9de8e41decaa1a4467028b4\",\"username\":\"admin\",\"captcha\":\"wovh\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1597985980),
(24, 1, 'admin', '/TbJzmVSIWa.php/index/login', '登录', '{\"__token__\":\"52cb19436e3cdcf76a8dd499eb03a36b\",\"username\":\"admin\",\"captcha\":\"btec\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1597985987),
(25, 1, 'admin', '/TbJzmVSIWa.php/general.profile/update', '常规管理 个人资料 更新个人信息', '{\"__token__\":\"1b66f1b897ded0079582f4f5c07650eb\",\"row\":{\"avatar\":\"\\/assets\\/img\\/avatar.png\",\"email\":\"admin@admin.com\",\"nickname\":\"Admin\",\"password\":\"@zhang1104\"}}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1597985997),
(26, 2, 'zh9025', '/TbJzmVSIWa.php/index/login', '登录', '{\"__token__\":\"9d940a72f248a9d75f220685ae5837bf\",\"username\":\"zh9025\",\"captcha\":\"xytp\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1597986011),
(27, 2, 'zh9025', '/TbJzmVSIWa.php/general/config/check', '常规管理 系统配置', '{\"row\":{\"name\":\"text_demo\"}}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1597986190),
(28, 2, 'zh9025', '/TbJzmVSIWa.php/general.config/add', '常规管理 系统配置 添加', '{\"__token__\":\"f5dc71a675866d8d140f3ab0aeaf1b43\",\"row\":{\"type\":\"editor\",\"group\":\"example\",\"name\":\"text_demo\",\"title\":\"\\u6d4b\\u8bd5\\u6587\\u672c\",\"value\":\"\",\"content\":\"value1|title1\\r\\nvalue2|title2\",\"tip\":\"\",\"rule\":\"\",\"extend\":\"\"}}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1597986196),
(29, 2, 'zh9025', '/TbJzmVSIWa.php/index/login', '登录', '{\"__token__\":\"0966e0df0a1de128855f0953becd117e\",\"username\":\"zh9025\",\"captcha\":\"cvxh\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1597986212),
(30, 1, 'admin', '/TbJzmVSIWa.php/index/login', '登录', '{\"__token__\":\"96a02ecbe0861d12ad5a2d437d44cc11\",\"username\":\"admin\",\"captcha\":\"dlte\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1597986227),
(31, 1, 'admin', '/TbJzmVSIWa.php/addon/install', '插件管理', '{\"name\":\"summernote\",\"force\":\"0\",\"uid\":\"19729\",\"token\":\"76e30347-487a-4cfa-a39b-10da2a3b3fd1\",\"version\":\"1.0.4\",\"faversion\":\"1.0.0.20200506_beta\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1597986247),
(32, 1, 'admin', '/TbJzmVSIWa.php/index/index', '', '{\"action\":\"refreshmenu\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1597986247),
(33, 2, 'zh9025', '/TbJzmVSIWa.php/index/login', '登录', '{\"__token__\":\"25042e6b0d84409a3404df7508ef40d5\",\"username\":\"zh9025\",\"captcha\":\"8pxx\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1597986267),
(34, 2, 'zh9025', '/zh9025.php/index/login?url=%2Fzh9025.php', '登录', '{\"url\":\"\\/zh9025.php\",\"__token__\":\"fba0d9a8194ab1b1f9ef7ab04d2005a1\",\"username\":\"zh9025\",\"captcha\":\"sbc8\"}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1597991803),
(35, 2, 'zh9025', '/zh9025.php/general.config/edit', '常规管理 系统配置 编辑', '{\"__token__\":\"32169a5d3f98fbfbe5c5089147af6936\",\"row\":{\"name\":\"\\u76db\\u5927\\u5408\\u7ea6\",\"beian\":\"\",\"cdnurl\":\"\",\"version\":\"1.0.1\",\"timezone\":\"Asia\\/Shanghai\",\"forbiddenip\":\"\",\"languages\":\"{&quot;backend&quot;:&quot;zh-cn&quot;,&quot;frontend&quot;:&quot;zh-cn&quot;}\",\"fixedpage\":\"dashboard\"}}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1597992386),
(36, 2, 'zh9025', '/zh9025.php/ajax/upload', '', '{\"name\":\"12.png\"}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1597992604),
(37, 2, 'zh9025', '/zh9025.php/general.config/edit', '常规管理 系统配置 编辑', '{\"__token__\":\"866dbf8f4fe286ec18ff7cc5831fe2e0\",\"row\":{\"aliyunaccesskey\":\"LTAI4GKv5dYertJVtgrNA9J1\",\"aliyunsecretkey\":\"cDNNgk2YZzLS4UtEi9yrF5VjDmvYwb\",\"aliyunendpoint\":\"http:\\/\\/oss-cn-beijing.aliyuncs.com\",\"aliyunbucket\":\"fclm\",\"aliyundomain\":\"http:\\/\\/world-img.fclm1688.com\",\"aliyunsharedomain\":\"http:\\/\\/world-img.fclm1688.com\\/share\\/index.html\"}}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1597992609),
(38, 2, 'zh9025', '/zh9025.php/ajax/upload', '', '{\"name\":\"\\u6bcd\\u5a74.png\"}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1597992615),
(39, 2, 'zh9025', '/zh9025.php/ajax/upload', '', '{\"name\":\"\\u5e7c\\u513f\\u6559\\u80b2.png\"}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1597992709),
(40, 2, 'zh9025', '/zh9025.php/ajax/upload', '', '{\"name\":\"\\u751f\\u6d3b\\u670d\\u52a1.png\"}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1597992749),
(41, 2, 'zh9025', '/zh9025.php/general.config/edit', '常规管理 系统配置 编辑', '{\"__token__\":\"51c93b81c12be426c44f47daac56f831\",\"row\":{\"text_demo\":\"2222\",\"img_demo\":\"http:\\/\\/world-img.fclm1688.com\\/uploads\\/20200821\\/c4bfdb01164c4b4d9f52e22badcddf76.png\"}}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1597992766),
(42, 2, 'zh9025', '/zh9025.php/general.config/edit', '常规管理 系统配置 编辑', '{\"__token__\":\"e40a3f868b628e30816ef6bede4b7cf3\",\"row\":{\"name\":\"\\u76db\\u5927\\u5408\\u7ea6\",\"beian\":\"\",\"cdnurl\":\"\",\"version\":\"1.0.1\",\"timezone\":\"Asia\\/Shanghai\",\"forbiddenip\":\"\",\"languages\":\"{&quot;backend&quot;:&quot;zh-cn&quot;,&quot;frontend&quot;:&quot;zh-cn&quot;}\",\"fixedpage\":\"dashboard\"}}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1597992794),
(43, 2, 'zh9025', '/zh9025.php/general/config/emailtest', '', '{\"__token__\":\"8764b4e57338b6fc39a2d4ce143b6910\",\"row\":{\"mail_type\":\"1\",\"mail_smtp_host\":\"smtp.qq.com\",\"mail_smtp_port\":\"465\",\"mail_smtp_user\":\"zh9025@qq.com\",\"mail_smtp_pass\":\"kllewfekaqawbigh\",\"mail_verify_type\":\"2\",\"mail_from\":\"598836535@qq.com\"},\"receiver\":\"1\"}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1598006751),
(44, 2, 'zh9025', '/zh9025.php/general/config/emailtest', '', '{\"__token__\":\"8764b4e57338b6fc39a2d4ce143b6910\",\"row\":{\"mail_type\":\"1\",\"mail_smtp_host\":\"smtp.qq.com\",\"mail_smtp_port\":\"465\",\"mail_smtp_user\":\"zh9025@qq.com\",\"mail_smtp_pass\":\"kllewfekaqawbigh\",\"mail_verify_type\":\"2\",\"mail_from\":\"598836535@qq.com\"},\"receiver\":\"1\"}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1598006756),
(45, 2, 'zh9025', '/zh9025.php/general/config/emailtest', '', '{\"__token__\":\"8764b4e57338b6fc39a2d4ce143b6910\",\"row\":{\"mail_type\":\"1\",\"mail_smtp_host\":\"smtp.qq.com\",\"mail_smtp_port\":\"465\",\"mail_smtp_user\":\"zh9025@qq.com\",\"mail_smtp_pass\":\"kllewfekaqawbigh\",\"mail_verify_type\":\"2\",\"mail_from\":\"598836535@qq.com\"},\"receiver\":\"1\"}', '172.16.1.21', 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1', 1598006759),
(46, 2, 'zh9025', '/zh9025.php/general.config/edit', '常规管理 系统配置 编辑', '{\"__token__\":\"8764b4e57338b6fc39a2d4ce143b6910\",\"row\":{\"mail_type\":\"1\",\"mail_smtp_host\":\"smtp.qq.com\",\"mail_smtp_port\":\"465\",\"mail_smtp_user\":\"zh9025@qq.com\",\"mail_smtp_pass\":\"kllewfekaqawbigh\",\"mail_verify_type\":\"2\",\"mail_from\":\"598836535@qq.com\"}}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1598006772),
(47, 1, 'admin', '/zh9025.php/index/login', '登录', '{\"__token__\":\"2420c8ae256ce4c3da93e978cf6198ed\",\"username\":\"admin\",\"captcha\":\"ytbt\"}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1598006783),
(48, 1, 'admin', '/zh9025.php/general/config/emailtest', '常规管理 系统配置', '{\"__token__\":\"c8bc9e2744a7d9d6fb45360444731198\",\"row\":{\"mail_type\":\"1\",\"mail_smtp_host\":\"smtp.qq.com\",\"mail_smtp_port\":\"465\",\"mail_smtp_user\":\"zh9025@qq.com\",\"mail_smtp_pass\":\"kllewfekaqawbigh\",\"mail_verify_type\":\"2\",\"mail_from\":\"598836535@qq.com\"},\"receiver\":\"2\"}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1598006790),
(49, 1, 'admin', '/zh9025.php/general/config/emailtest', '常规管理 系统配置', '{\"__token__\":\"c8bc9e2744a7d9d6fb45360444731198\",\"row\":{\"mail_type\":\"1\",\"mail_smtp_host\":\"smtp.qq.com\",\"mail_smtp_port\":\"465\",\"mail_smtp_user\":\"zh9025@qq.com\",\"mail_smtp_pass\":\"kllewfekaqawbigh\",\"mail_verify_type\":\"2\",\"mail_from\":\"598836535@qq.com\"},\"receiver\":\"2\"}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1598006798),
(50, 1, 'admin', '/zh9025.php/general/config/emailtest', '常规管理 系统配置', '{\"__token__\":\"c8bc9e2744a7d9d6fb45360444731198\",\"row\":{\"mail_type\":\"1\",\"mail_smtp_host\":\"smtp.qq.com\",\"mail_smtp_port\":\"465\",\"mail_smtp_user\":\"zh9025@qq.com\",\"mail_smtp_pass\":\"kllewfekaqawbigh\",\"mail_verify_type\":\"2\",\"mail_from\":\"598836535@qq.com\"},\"receiver\":\"2\"}', '172.16.1.21', 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1', 1598006800),
(51, 1, 'admin', '/zh9025.php/general/config/emailtest', '常规管理 系统配置', '{\"__token__\":\"c8bc9e2744a7d9d6fb45360444731198\",\"row\":{\"mail_type\":\"1\",\"mail_smtp_host\":\"smtp.qq.com\",\"mail_smtp_port\":\"465\",\"mail_smtp_user\":\"zh9025@qq.com\",\"mail_smtp_pass\":\"kllewfekaqawbigh\",\"mail_verify_type\":\"2\",\"mail_from\":\"598836535@qq.com\"},\"receiver\":\"2\"}', '172.16.1.21', 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1', 1598006869),
(52, 1, 'admin', '/zh9025.php/general/config/emailtest', '常规管理 系统配置', '{\"__token__\":\"c8bc9e2744a7d9d6fb45360444731198\",\"row\":{\"mail_type\":\"1\",\"mail_smtp_host\":\"smtp.qq.com\",\"mail_smtp_port\":\"465\",\"mail_smtp_user\":\"zh9025@qq.com\",\"mail_smtp_pass\":\"kllewfekaqawbigh\",\"mail_verify_type\":\"2\",\"mail_from\":\"598836535@qq.com\"},\"receiver\":\"598836535@qq.com\"}', '172.16.1.21', 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1', 1598006947),
(53, 1, 'admin', '/zh9025.php/general/config/emailtest', '常规管理 系统配置', '{\"__token__\":\"c8bc9e2744a7d9d6fb45360444731198\",\"row\":{\"mail_type\":\"1\",\"mail_smtp_host\":\"smtp.qq.com\",\"mail_smtp_port\":\"465\",\"mail_smtp_user\":\"zh9025@qq.com\",\"mail_smtp_pass\":\"kllewfekaqawbigh\",\"mail_verify_type\":\"2\",\"mail_from\":\"zh9025@qq.com\"},\"receiver\":\"598836535@qq.com\"}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1598007160),
(54, 1, 'admin', '/zh9025.php/general/config/emailtest', '常规管理 系统配置', '{\"__token__\":\"c8bc9e2744a7d9d6fb45360444731198\",\"row\":{\"mail_type\":\"1\",\"mail_smtp_host\":\"smtp.qq.com\",\"mail_smtp_port\":\"465\",\"mail_smtp_user\":\"zh9025@qq.com\",\"mail_smtp_pass\":\"kllewfekaqawbigh\",\"mail_verify_type\":\"2\",\"mail_from\":\"zh9025@qq.com\"},\"receiver\":\"598836535@qq.com\"}', '172.16.1.21', 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1', 1598007168),
(55, 1, 'admin', '/zh9025.php/general.config/edit', '常规管理 系统配置 编辑', '{\"__token__\":\"c8bc9e2744a7d9d6fb45360444731198\",\"row\":{\"mail_type\":\"1\",\"mail_smtp_host\":\"smtp.qq.com\",\"mail_smtp_port\":\"465\",\"mail_smtp_user\":\"zh9025@qq.com\",\"mail_smtp_pass\":\"kllewfekaqawbigh\",\"mail_verify_type\":\"2\",\"mail_from\":\"zh9025@qq.com\"}}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1598008338),
(56, 1, 'admin', '/zh9025.php/general.config/edit', '常规管理 系统配置 编辑', '{\"__token__\":\"19c717e85c0aab088c8bf62fd8a2d54d\",\"row\":{\"mail_type\":\"2\",\"mail_smtp_host\":\"smtp.qq.com\",\"mail_smtp_port\":\"465\",\"mail_smtp_user\":\"zh9025@qq.com\",\"mail_smtp_pass\":\"kllewfekaqawbigh\",\"mail_verify_type\":\"2\",\"mail_from\":\"zh9025@qq.com\"}}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1598008387),
(57, 1, 'admin', '/zh9025.php/general/config/emailtest', '常规管理 系统配置', '{\"__token__\":\"870ff11090119d84ca47ae6884ffd5d9\",\"row\":{\"mail_type\":\"2\",\"mail_smtp_host\":\"smtp.qq.com\",\"mail_smtp_port\":\"465\",\"mail_smtp_user\":\"zh9025@qq.com\",\"mail_smtp_pass\":\"kllewfekaqawbigh\",\"mail_verify_type\":\"2\",\"mail_from\":\"zh9025@qq.com\"},\"receiver\":\"598836535@qq.com\"}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1598008396),
(58, 1, 'admin', '/zh9025.php/general.config/edit', '常规管理 系统配置 编辑', '{\"__token__\":\"870ff11090119d84ca47ae6884ffd5d9\",\"row\":{\"mail_type\":\"1\",\"mail_smtp_host\":\"smtp.qq.com\",\"mail_smtp_port\":\"465\",\"mail_smtp_user\":\"zh9025@qq.com\",\"mail_smtp_pass\":\"kllewfekaqawbigh\",\"mail_verify_type\":\"2\",\"mail_from\":\"zh9025@qq.com\"}}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1598008403),
(59, 1, 'admin', '/zh9025.php/general/config/emailtest', '常规管理 系统配置', '{\"__token__\":\"3774590d2d71e67332f80499a6f15c90\",\"row\":{\"mail_type\":\"1\",\"mail_smtp_host\":\"smtp.qq.com\",\"mail_smtp_port\":\"465\",\"mail_smtp_user\":\"zh9025@qq.com\",\"mail_smtp_pass\":\"kllewfekaqawbigh\",\"mail_verify_type\":\"2\",\"mail_from\":\"zh9025@qq.com\"},\"receiver\":\"598836535@qq.com\"}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1598008412),
(60, 1, 'admin', '/zh9025.php/general.config/edit', '常规管理 系统配置 编辑', '{\"__token__\":\"3774590d2d71e67332f80499a6f15c90\",\"row\":{\"mail_type\":\"1\",\"mail_smtp_host\":\"smtp.qq.com\",\"mail_smtp_port\":\"465\",\"mail_smtp_user\":\"zh9025@qq.com\",\"mail_smtp_pass\":\"kllewfekaqawbigh\",\"mail_verify_type\":\"2\",\"mail_from\":\"zh9025@qq.com\"}}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1598008439),
(61, 1, 'admin', '/zh9025.php/general.config/edit', '常规管理 系统配置 编辑', '{\"__token__\":\"c9faabfc30fb8a4d2cfb2ba1a3b66c7c\",\"row\":{\"mail_type\":\"1\",\"mail_smtp_host\":\"smtp.qq.com\",\"mail_smtp_port\":\"465\",\"mail_smtp_user\":\"zh9025\",\"mail_smtp_pass\":\"kllewfekaqawbigh\",\"mail_verify_type\":\"2\",\"mail_from\":\"zh9025@qq.com\"}}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1598008449),
(62, 1, 'admin', '/zh9025.php/general/config/emailtest', '常规管理 系统配置', '{\"__token__\":\"93adc31d7be031bb3dc5ce9468279a55\",\"row\":{\"mail_type\":\"1\",\"mail_smtp_host\":\"smtp.qq.com\",\"mail_smtp_port\":\"465\",\"mail_smtp_user\":\"zh9025\",\"mail_smtp_pass\":\"kllewfekaqawbigh\",\"mail_verify_type\":\"2\",\"mail_from\":\"zh9025@qq.com\"},\"receiver\":\"598836535@qq.com\"}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1598008458),
(63, 1, 'admin', '/zh9025.php/general.config/edit', '常规管理 系统配置 编辑', '{\"__token__\":\"93adc31d7be031bb3dc5ce9468279a55\",\"row\":{\"mail_type\":\"1\",\"mail_smtp_host\":\"smtp.qq.com\",\"mail_smtp_port\":\"465\",\"mail_smtp_user\":\"zh9025\",\"mail_smtp_pass\":\"jajoqmjrsvsgbibh\",\"mail_verify_type\":\"2\",\"mail_from\":\"zh9025@qq.com\"}}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1598008540),
(64, 1, 'admin', '/zh9025.php/general/config/emailtest', '常规管理 系统配置', '{\"__token__\":\"3b0e0835b1f5abea4fde59d5ce124584\",\"row\":{\"mail_type\":\"1\",\"mail_smtp_host\":\"smtp.qq.com\",\"mail_smtp_port\":\"465\",\"mail_smtp_user\":\"zh9025\",\"mail_smtp_pass\":\"jajoqmjrsvsgbibh\",\"mail_verify_type\":\"2\",\"mail_from\":\"zh9025@qq.com\"},\"receiver\":\"598836535@qq.com\"}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1598008548),
(65, 1, 'admin', '/zh9025.php/general.config/edit', '常规管理 系统配置 编辑', '{\"__token__\":\"ca2aa2d43d148a24fcd811b1793b2c50\",\"row\":{\"aliyunaccesskey\":\"LTAI4GKv5dYertJVtgrNA9J1\",\"aliyunsecretkey\":\"cDNNgk2YZzLS4UtEi9yrF5VjDmvYwb\",\"aliyunendpoint\":\"http:\\/\\/oss-cn-beijing.aliyuncs.com\",\"aliyunbucket\":\"fclm\",\"aliyundomain\":\"http:\\/\\/world-img.fclm1688.com\",\"aliyunsharedomain\":\"http:\\/\\/world-img.fclm1688.com\\/share\\/index.html\",\"aliyunsmssignname\":\"\\u90a6\\u8000\\u79d1\\u6280\",\"aliyunsmstmpid\":\"SMS_176532352\"}}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1598061738),
(66, 1, 'admin', '/zh9025.php/general.config/edit', '常规管理 系统配置 编辑', '{\"__token__\":\"53e7e0707b58d8654bdf4c8aec0ea185\",\"row\":{\"aliyunaccesskey\":\"LTAI4GKv5dYertJVtgrNA9J1\",\"aliyunsecretkey\":\"cDNNgk2YZzLS4UtEi9yrF5VjDmvYwb\",\"aliyunendpoint\":\"http:\\/\\/oss-cn-beijing.aliyuncs.com\",\"aliyunbucket\":\"fclm\",\"aliyundomain\":\"http:\\/\\/world-img.fclm1688.com\",\"aliyunsharedomain\":\"http:\\/\\/world-img.fclm1688.com\\/share\\/index.html\",\"aliyunsmssignname\":\"\\u90d1\\u5dde\\u4f73\\u5bb8\\u516c\\u53f8\",\"aliyunsmstmpid\":\"SMS_176927895\"}}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1598062811),
(67, 1, 'admin', '/zh9025.php/auth/rule/edit/ids/85?dialog=1', '权限管理 菜单规则 编辑', '{\"dialog\":\"1\",\"__token__\":\"9ac19754ab0cfa954b7676a6e412fa78\",\"row\":{\"ismenu\":\"1\",\"pid\":\"0\",\"name\":\"article\",\"title\":\"\\u6587\\u7ae0\\u7ba1\\u7406\",\"icon\":\"fa fa-list\",\"weigh\":\"0\",\"condition\":\"\",\"remark\":\"\",\"status\":\"normal\"},\"ids\":\"85\"}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1598063476),
(68, 1, 'admin', '/zh9025.php/index/index', '', '{\"action\":\"refreshmenu\"}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1598063476),
(69, 1, 'admin', '/zh9025.php/auth/rule/edit/ids/85?dialog=1', '权限管理 菜单规则 编辑', '{\"dialog\":\"1\",\"__token__\":\"f6e3e91684008d494a02d46c4d5bfe5a\",\"row\":{\"ismenu\":\"1\",\"pid\":\"0\",\"name\":\"article\",\"title\":\"\\u6587\\u7ae0\\u5e7b\\u706f\",\"icon\":\"fa fa-list\",\"weigh\":\"0\",\"condition\":\"\",\"remark\":\"\",\"status\":\"normal\"},\"ids\":\"85\"}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1598063581),
(70, 1, 'admin', '/zh9025.php/index/index', '', '{\"action\":\"refreshmenu\"}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1598063581),
(71, 1, 'admin', '/zh9025.php/auth/rule/edit/ids/86?dialog=1', '权限管理 菜单规则 编辑', '{\"dialog\":\"1\",\"__token__\":\"73668a397a277dd82af421757afb3876\",\"row\":{\"ismenu\":\"1\",\"pid\":\"85\",\"name\":\"article\\/article\",\"title\":\"\\u6587\\u7ae0\\u8bb0\\u5f55\",\"icon\":\"fa fa-circle-o\",\"weigh\":\"0\",\"condition\":\"\",\"remark\":\"\",\"status\":\"normal\"},\"ids\":\"86\"}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1598063594),
(72, 1, 'admin', '/zh9025.php/index/index', '', '{\"action\":\"refreshmenu\"}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1598063594),
(73, 1, 'admin', '/zh9025.php/ajax/upload', '', '{\"name\":\"12.png\"}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1598064269),
(74, 1, 'admin', '/zh9025.php/ajax/upload', '', '{\"name\":\"12.png\"}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1598064283),
(75, 1, 'admin', '/zh9025.php/ajax/upload', '', '{\"name\":\"12.png\"}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1598064458),
(76, 1, 'admin', '/zh9025.php/article/article/add?dialog=1', '文章幻灯 文章记录 添加', '{\"dialog\":\"1\",\"row\":{\"type\":\"1\",\"title\":\"\\u6d4b\\u8bd5\\u6587\\u7ae01\",\"thumb\":\"http:\\/\\/world-img.fclm1688.com\\/uploads\\/20200822\\/8ae467ece82b546dfe6edabbb3158f91.png\",\"info\":\"222\",\"status\":\"1\",\"displayorder\":\"0\"}}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1598064518),
(77, 1, 'admin', '/zh9025.php/ajax/upload', '', '{\"name\":\"bg2.png\"}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1598064695),
(78, 1, 'admin', '/zh9025.php/article/article/add?dialog=1', '文章幻灯 文章记录 添加', '{\"dialog\":\"1\",\"row\":{\"type\":\"1\",\"title\":\"\\u6d4b\\u8bd5\\u6587\\u7ae02\",\"thumb\":\"http:\\/\\/world-img.fclm1688.com\\/uploads\\/20200822\\/0c91da98525c038a3daf5e8b95a27f5d.png\",\"info\":\"4444\",\"status\":\"1\",\"displayorder\":\"0\"}}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1598064698),
(79, 1, 'admin', '/zh9025.php/article/article/edit/ids/2?dialog=1', '文章幻灯 文章记录 编辑', '{\"dialog\":\"1\",\"row\":{\"type\":\"1\",\"title\":\"\\u6d4b\\u8bd5\\u6587\\u7ae02\",\"thumb\":\"http:\\/\\/world-img.fclm1688.com\\/uploads\\/20200822\\/0c91da98525c038a3daf5e8b95a27f5d.png\",\"info\":\"4444\",\"status\":\"1\",\"displayorder\":\"100\"},\"ids\":\"2\"}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1598064760),
(80, 1, 'admin', '/zh9025.php/article/article/multi/ids/2', '文章幻灯 文章记录 批量更新', '{\"ids\":\"2\",\"params\":\"status=0\"}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1598064802),
(81, 1, 'admin', '/zh9025.php/article/article/multi/ids/2,1', '文章幻灯 文章记录 批量更新', '{\"ids\":\"2,1\",\"params\":\"status=1\"}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1598064805),
(82, 1, 'admin', '/zh9025.php/article/article/multi/ids/2,1', '文章幻灯 文章记录 批量更新', '{\"ids\":\"2,1\",\"params\":\"status=0\"}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1598064809),
(83, 1, 'admin', '/zh9025.php/article/article/multi/ids/2,1', '文章幻灯 文章记录 批量更新', '{\"ids\":\"2,1\",\"params\":\"status=1\"}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1598064811),
(84, 1, 'admin', '/zh9025.php/article/article/edit/ids/1?dialog=1', '文章幻灯 文章记录 编辑', '{\"dialog\":\"1\",\"row\":{\"type\":\"2\",\"title\":\"\\u6d4b\\u8bd5\\u6587\\u7ae01\",\"thumb\":\"http:\\/\\/world-img.fclm1688.com\\/uploads\\/20200822\\/8ae467ece82b546dfe6edabbb3158f91.png\",\"info\":\"222\",\"status\":\"1\",\"displayorder\":\"0\"},\"ids\":\"1\"}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1598064876),
(85, 1, 'admin', '/zh9025.php/ajax/upload', '', '{\"name\":\"11.png\"}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1598064976),
(86, 1, 'admin', '/zh9025.php/article/article/add?dialog=1', '文章幻灯 文章记录 添加', '{\"dialog\":\"1\",\"row\":{\"type\":\"1\",\"title\":\"\\u6d4b\\u8bd5\\u6587\\u7ae03\",\"thumb\":\"http:\\/\\/world-img.fclm1688.com\\/uploads\\/20200822\\/3234f34428168d09874487e742f2d000.png\",\"info\":\"555\",\"status\":\"1\",\"displayorder\":\"0\"}}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1598064979),
(87, 1, 'admin', '/zh9025.php/article/slide/add?dialog=1', '文章幻灯 幻灯信息 添加', '{\"dialog\":\"1\",\"row\":{\"type\":\"1\",\"title\":\"1\",\"thumb\":\"http:\\/\\/world-img.fclm1688.com\\/uploads\\/20200822\\/3234f34428168d09874487e742f2d000.png\",\"status\":\"1\",\"displayorder\":\"0\"}}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1598065204),
(88, 1, 'admin', '/zh9025.php/article/slide/add?dialog=1', '文章幻灯 幻灯信息 添加', '{\"dialog\":\"1\",\"row\":{\"type\":\"1\",\"title\":\"2\",\"thumb\":\"http:\\/\\/world-img.fclm1688.com\\/uploads\\/20200822\\/8ae467ece82b546dfe6edabbb3158f91.png\",\"status\":\"1\",\"displayorder\":\"0\"}}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1598065210),
(89, 1, 'admin', '/zh9025.php/article/slide/add?dialog=1', '文章幻灯 幻灯信息 添加', '{\"dialog\":\"1\",\"row\":{\"type\":\"1\",\"title\":\"3\",\"thumb\":\"http:\\/\\/world-img.fclm1688.com\\/uploads\\/20200822\\/0c91da98525c038a3daf5e8b95a27f5d.png\",\"status\":\"1\",\"displayorder\":\"0\"}}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1598065218),
(90, 1, 'admin', '/zh9025.php/article/slide/edit/ids/3?dialog=1', '文章幻灯 幻灯信息 编辑', '{\"dialog\":\"1\",\"row\":{\"type\":\"2\",\"title\":\"3\",\"thumb\":\"http:\\/\\/world-img.fclm1688.com\\/uploads\\/20200822\\/0c91da98525c038a3daf5e8b95a27f5d.png\",\"status\":\"1\",\"displayorder\":\"0\"},\"ids\":\"3\"}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1598065225),
(91, 1, 'admin', '/zh9025.php/general.config/edit', '常规管理 系统配置 编辑', '{\"__token__\":\"584f59080b16bced969fcbc2ebed380c\",\"row\":{\"categorytype\":\"{&quot;default&quot;:&quot;Default&quot;,&quot;page&quot;:&quot;Page&quot;,&quot;article&quot;:&quot;Article&quot;,&quot;test&quot;:&quot;Test&quot;}\",\"configgroup\":\"{&quot;basic&quot;:&quot;Basic&quot;,&quot;email&quot;:&quot;Email&quot;,&quot;dictionary&quot;:&quot;Dictionary&quot;,&quot;user&quot;:&quot;User&quot;,&quot;oss&quot;:&quot;\\u963f\\u91cc\\u4e91&quot;,&quot;example&quot;:&quot;Example&quot;,&quot;img&quot;:&quot;\\u56fe\\u7247&quot;}\"}}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1598066197),
(92, 1, 'admin', '/zh9025.php/general.config/edit', '常规管理 系统配置 编辑', '{\"__token__\":\"d331fcd1838af15e3d8ef0d57f3561e7\",\"row\":{\"categorytype\":\"{&quot;default&quot;:&quot;Default&quot;,&quot;page&quot;:&quot;Page&quot;,&quot;article&quot;:&quot;Article&quot;,&quot;test&quot;:&quot;Test&quot;}\",\"configgroup\":\"{&quot;basic&quot;:&quot;Basic&quot;,&quot;email&quot;:&quot;Email&quot;,&quot;user&quot;:&quot;User&quot;,&quot;oss&quot;:&quot;\\u963f\\u91cc\\u4e91&quot;,&quot;img&quot;:&quot;\\u56fe\\u7247&quot;,&quot;example&quot;:&quot;Example&quot;,&quot;dictionary&quot;:&quot;Dictionary&quot;}\"}}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1598066266),
(93, 1, 'admin', '/zh9025.php/ajax/upload', '', '{\"name\":\"reg-headimg.png\"}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1598066296),
(94, 1, 'admin', '/zh9025.php/general.config/edit', '常规管理 系统配置 编辑', '{\"__token__\":\"6f54d31b7b405f4d0880830c10358e7e\",\"row\":{\"imgapplogo\":\"http:\\/\\/world-img.fclm1688.com\\/uploads\\/20200822\\/d245f9baebe1bc9fa4e78a2cf95229f2.png\"}}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1598066298),
(95, 1, 'admin', '/zh9025.php/ajax/upload', '', '{\"name\":\"1fe5f4944e794f3b77d8204718cb0659.png_WH_750X1334 (1).png\"}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1598066445),
(96, 1, 'admin', '/zh9025.php/general.config/edit', '常规管理 系统配置 编辑', '{\"__token__\":\"b276e203a63835b28638151d58a480cf\",\"row\":{\"imgapplogo\":\"http:\\/\\/world-img.fclm1688.com\\/uploads\\/20200822\\/d245f9baebe1bc9fa4e78a2cf95229f2.png\",\"imgshareposter\":\"http:\\/\\/world-img.fclm1688.com\\/uploads\\/20200822\\/1fe5f4944e794f3b77d8204718cb0659.png\"}}', '172.16.1.21', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.104 Safari/537.36', 1598066447),
(97, 1, 'admin', '/zh9025.php/index/login?url=%2Fzh9025.php', '登录', '{\"url\":\"\\/zh9025.php\",\"__token__\":\"1d2bdd239b9b187f5079d30d4845469b\",\"username\":\"admin\",\"captcha\":\"i25x\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36', 1690191911),
(98, 1, 'admin', '/zh9025.php/auth/rule/multi/ids/8', '权限管理 菜单规则', '{\"action\":\"\",\"ids\":\"8\",\"params\":\"ismenu=0\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36', 1690191922),
(99, 1, 'admin', '/zh9025.php/index/index', '', '{\"action\":\"refreshmenu\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36', 1690191922),
(100, 1, 'admin', '/zh9025.php/auth/rule/multi/ids/7', '权限管理 菜单规则', '{\"action\":\"\",\"ids\":\"7\",\"params\":\"ismenu=0\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36', 1690191923),
(101, 1, 'admin', '/zh9025.php/index/index', '', '{\"action\":\"refreshmenu\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36', 1690191923),
(102, 1, 'admin', '/zh9025.php/auth/rule/multi/ids/3', '权限管理 菜单规则', '{\"action\":\"\",\"ids\":\"3\",\"params\":\"ismenu=0\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36', 1690191925),
(103, 1, 'admin', '/zh9025.php/index/index', '', '{\"action\":\"refreshmenu\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36', 1690191925),
(104, 1, 'admin', '/zh9025.php/auth/rule/multi/ids/4', '权限管理 菜单规则', '{\"action\":\"\",\"ids\":\"4\",\"params\":\"ismenu=0\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36', 1690191929),
(105, 1, 'admin', '/zh9025.php/index/index', '', '{\"action\":\"refreshmenu\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36', 1690191929),
(106, 1, 'admin', '/zh9025.php/auth/rule/multi/ids/73', '权限管理 菜单规则', '{\"action\":\"\",\"ids\":\"73\",\"params\":\"ismenu=0\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36', 1690191933),
(107, 1, 'admin', '/zh9025.php/index/index', '', '{\"action\":\"refreshmenu\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36', 1690191933),
(108, 1, 'admin', '/zh9025.php/auth/rule/multi/ids/79', '权限管理 菜单规则', '{\"action\":\"\",\"ids\":\"79\",\"params\":\"ismenu=0\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36', 1690191935),
(109, 1, 'admin', '/zh9025.php/index/index', '', '{\"action\":\"refreshmenu\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36', 1690191935),
(110, 1, 'admin', '/zh9025.php/auth/rule/edit/ids/98?dialog=1', '权限管理 菜单规则 编辑', '{\"dialog\":\"1\",\"__token__\":\"d7dea7fa27d035392a14ffbd38601629\",\"row\":{\"ismenu\":\"1\",\"pid\":\"0\",\"name\":\"contract\",\"title\":\"\\u5408\\u7ea6\\u7ba1\\u7406\",\"icon\":\"fa fa-list\",\"weigh\":\"0\",\"condition\":\"\",\"remark\":\"\",\"status\":\"normal\"},\"ids\":\"98\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36', 1690201608),
(111, 1, 'admin', '/zh9025.php/index/index', '', '{\"action\":\"refreshmenu\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36', 1690201608),
(112, 1, 'admin', '/zh9025.php/general.config/edit', '常规管理 系统配置 编辑', '{\"__token__\":\"b9614d0e131b9c62cb52c254c97fc627\",\"row\":{\"categorytype\":\"{&quot;default&quot;:&quot;Default&quot;,&quot;page&quot;:&quot;Page&quot;,&quot;article&quot;:&quot;Article&quot;,&quot;test&quot;:&quot;Test&quot;}\",\"configgroup\":\"{&quot;basic&quot;:&quot;Basic&quot;,&quot;email&quot;:&quot;Email&quot;,&quot;user&quot;:&quot;User&quot;,&quot;contract&quot;:&quot;\\u5408\\u7ea6&quot;,&quot;rule&quot;:&quot;\\u89c4\\u5219&quot;}\"}}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36', 1690201821),
(113, 1, 'admin', '/zh9025.php/general.config/edit', '常规管理 系统配置 编辑', '{\"__token__\":\"adbd284eefb9a6b666f525eb23770e18\",\"row\":{\"name\":\"demo\",\"beian\":\"\",\"cdnurl\":\"\",\"version\":\"1.0.1\",\"timezone\":\"Asia\\/Shanghai\",\"forbiddenip\":\"\",\"languages\":\"{&quot;backend&quot;:&quot;zh-cn&quot;,&quot;frontend&quot;:&quot;zh-cn&quot;}\",\"fixedpage\":\"dashboard\"}}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36', 1690201848),
(114, 1, 'admin', '/zh9025.php/general.config/edit', '常规管理 系统配置 编辑', '{\"__token__\":\"43af2163069b573899093efcb1aae516\",\"row\":{\"name\":\"LYM\",\"beian\":\"\",\"cdnurl\":\"\",\"version\":\"1.0.1\",\"timezone\":\"Asia\\/Shanghai\",\"forbiddenip\":\"\",\"languages\":\"{&quot;backend&quot;:&quot;zh-cn&quot;,&quot;frontend&quot;:&quot;zh-cn&quot;}\",\"fixedpage\":\"dashboard\"}}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36', 1690201852),
(115, 1, 'admin', '/zh9025.php/general.config/edit', '常规管理 系统配置 编辑', '{\"__token__\":\"3355613baccd65f5e06d4a837da5f39b\",\"row\":{\"name\":\"LYM\",\"beian\":\"\",\"cdnurl\":\"\",\"version\":\"1.0.1\",\"timezone\":\"Asia\\/Shanghai\",\"forbiddenip\":\"\",\"languages\":\"{&quot;backend&quot;:&quot;zh-cn&quot;,&quot;frontend&quot;:&quot;zh-cn&quot;}\",\"fixedpage\":\"dashboard\"}}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36', 1690201854),
(116, 1, 'admin', '/zh9025.php/general.config/edit', '常规管理 系统配置 编辑', '{\"__token__\":\"15852e350dd801735943d61b1536a774\",\"row\":{\"one_address\":\"{&quot;1&quot;:&quot;0x26241a987Eb843701AAa866DDc5C178DAc9B5EbA&quot;}\"}}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36', 1690201918),
(117, 1, 'admin', '/zh9025.php/index/login?url=%2Fzh9025.php', '登录', '{\"url\":\"\\/zh9025.php\",\"__token__\":\"269d032df6e14edc419aa66b95e3cdc0\",\"username\":\"admin\",\"captcha\":\"qn8j\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36', 1690246474),
(118, 1, 'admin', '/zh9025.php/contract/user/edit/ids/1?dialog=1', '合约管理 合约会员 编辑', '{\"dialog\":\"1\",\"row\":{\"credit1\":\"2\",\"credit2\":\"3\",\"credit3\":\"4\"},\"ids\":\"1\"}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36', 1690246868);

-- --------------------------------------------------------

--
-- 表的结构 `my_article_list`
--

CREATE TABLE `my_article_list` (
  `id` int(11) UNSIGNED NOT NULL,
  `type` tinyint(1) UNSIGNED NOT NULL DEFAULT '0' COMMENT '类型',
  `lang` tinyint(1) DEFAULT '1' COMMENT '语言',
  `title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '标题',
  `thumb` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '图片',
  `info` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '内容',
  `status` tinyint(1) UNSIGNED NOT NULL DEFAULT '0' COMMENT '状态',
  `displayorder` int(11) UNSIGNED NOT NULL DEFAULT '0' COMMENT '排序',
  `createtime` int(11) UNSIGNED NOT NULL DEFAULT '0' COMMENT '创建时间',
  `updatetime` int(11) UNSIGNED NOT NULL DEFAULT '0' COMMENT '更新时间'
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章信息';

--
-- 转存表中的数据 `my_article_list`
--

INSERT INTO `my_article_list` (`id`, `type`, `lang`, `title`, `thumb`, `info`, `status`, `displayorder`, `createtime`, `updatetime`) VALUES
(1, 1, 1, '测试文章1', 'http://world-img.fclm1688.com/uploads/20200822/8ae467ece82b546dfe6edabbb3158f91.png', '<p>222</p>', 1, 0, 1598064518, 1598064876),
(2, 1, 1, '测试文章2', 'http://world-img.fclm1688.com/uploads/20200822/0c91da98525c038a3daf5e8b95a27f5d.png', '<p>4444</p>', 1, 100, 1598064698, 1598064811),
(3, 1, 1, '测试文章3', 'http://world-img.fclm1688.com/uploads/20200822/3234f34428168d09874487e742f2d000.png', '<p>555</p>', 1, 0, 1598064979, 1598064979);

-- --------------------------------------------------------

--
-- 表的结构 `my_attachment`
--

CREATE TABLE `my_attachment` (
  `id` int(20) UNSIGNED NOT NULL COMMENT 'ID',
  `admin_id` int(10) UNSIGNED NOT NULL DEFAULT '0' COMMENT '管理员ID',
  `user_id` int(10) UNSIGNED NOT NULL DEFAULT '0' COMMENT '会员ID',
  `url` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '物理路径',
  `imagewidth` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '宽度',
  `imageheight` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '高度',
  `imagetype` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '图片类型',
  `imageframes` int(10) UNSIGNED NOT NULL DEFAULT '0' COMMENT '图片帧数',
  `filesize` int(10) UNSIGNED NOT NULL DEFAULT '0' COMMENT '文件大小',
  `mimetype` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT 'mime类型',
  `extparam` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '透传数据',
  `createtime` int(10) DEFAULT NULL COMMENT '创建日期',
  `updatetime` int(10) DEFAULT NULL COMMENT '更新时间',
  `uploadtime` int(10) DEFAULT NULL COMMENT '上传时间',
  `storage` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'local' COMMENT '存储位置',
  `sha1` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '文件 sha1编码'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='附件表';

--
-- 转存表中的数据 `my_attachment`
--

INSERT INTO `my_attachment` (`id`, `admin_id`, `user_id`, `url`, `imagewidth`, `imageheight`, `imagetype`, `imageframes`, `filesize`, `mimetype`, `extparam`, `createtime`, `updatetime`, `uploadtime`, `storage`, `sha1`) VALUES
(1, 1, 0, '/assets/img/qrcode.png', '150', '150', 'png', 0, 21859, 'image/png', '', 1499681848, 1499681848, 1499681848, 'local', '17163603d0263e4838b9387ff2cd4877e8b018f6'),
(2, 2, 0, '/uploads/20200821/8ae467ece82b546dfe6edabbb3158f91.png', '750', '350', 'png', 0, 179175, 'image/png', '{\"name\":\"12.png\"}', 1597992604, 1597992604, 1597992604, 'aliyun', 'ce332a4da6ee0488eab75a66a3cd86a2b8466141'),
(3, 2, 0, 'uploads/20200821/db95c05499bccd731f256c0caa4e6947.png', '92', '91', 'png', 0, 9502, 'image/png', '{\"name\":\"\\u6bcd\\u5a74.png\"}', 1597992615, 1597992615, 1597992615, 'aliyun', '53fa168e694719f0a723a403c67e2b181738205d'),
(4, 2, 0, 'uploads/20200821/7f554ec4a4e16052ac042330b95a19c5.png', '100', '99', 'png', 0, 9252, 'image/png', '{\"name\":\"\\u5e7c\\u513f\\u6559\\u80b2.png\"}', 1597992709, 1597992709, 1597992709, 'aliyun', '077064d3b75baf08323e66e935270daafc38157e'),
(5, 2, 0, 'http://world-img.fclm1688.com/uploads/20200821/c4bfdb01164c4b4d9f52e22badcddf76.png', '92', '91', 'png', 0, 8412, 'image/png', '{\"name\":\"\\u751f\\u6d3b\\u670d\\u52a1.png\"}', 1597992749, 1597992749, 1597992749, 'aliyun', 'a73cb8e5478e080745d3431d46b7d6761f7acb8a'),
(6, 1, 0, 'http://world-img.fclm1688.com/uploads/20200822/8ae467ece82b546dfe6edabbb3158f91.png', '750', '350', 'png', 0, 179175, 'image/png', '{\"name\":\"12.png\"}', 1598064269, 1598064269, 1598064269, 'aliyun', 'ce332a4da6ee0488eab75a66a3cd86a2b8466141'),
(7, 1, 0, 'http://world-img.fclm1688.com/uploads/20200822/0c91da98525c038a3daf5e8b95a27f5d.png', '660', '270', 'png', 0, 137786, 'image/png', '{\"name\":\"bg2.png\"}', 1598064695, 1598064695, 1598064695, 'aliyun', '0bca7cc78aedf9f6b64a21577088ddc413bdc4e2'),
(8, 1, 0, 'http://world-img.fclm1688.com/uploads/20200822/3234f34428168d09874487e742f2d000.png', '750', '350', 'png', 0, 193835, 'image/png', '{\"name\":\"11.png\"}', 1598064976, 1598064976, 1598064976, 'aliyun', '9d638fe14f4386df9888ff5be681aabf0d2714c5'),
(9, 1, 0, 'http://world-img.fclm1688.com/uploads/20200822/d245f9baebe1bc9fa4e78a2cf95229f2.png', '190', '188', 'png', 0, 10947, 'image/png', '{\"name\":\"reg-headimg.png\"}', 1598066296, 1598066296, 1598066296, 'aliyun', '9e20bd3f56b2a661cd1ab6c64b24c2e677972172'),
(10, 1, 0, 'http://world-img.fclm1688.com/uploads/20200822/1fe5f4944e794f3b77d8204718cb0659.png', '750', '1334', 'png', 0, 771878, 'image/png', '{\"name\":\"1fe5f4944e794f3b77d8204718cb0659.png_WH_750X1334 (1).png\"}', 1598066445, 1598066445, 1598066445, 'aliyun', '332870a7d7a108d814a0e2ec86796c491e5a80d9');

-- --------------------------------------------------------

--
-- 表的结构 `my_auth_group`
--

CREATE TABLE `my_auth_group` (
  `id` int(10) UNSIGNED NOT NULL,
  `pid` int(10) UNSIGNED NOT NULL DEFAULT '0' COMMENT '父组别',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '组名',
  `rules` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '规则ID',
  `createtime` int(10) DEFAULT NULL COMMENT '创建时间',
  `updatetime` int(10) DEFAULT NULL COMMENT '更新时间',
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '状态'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分组表';

--
-- 转存表中的数据 `my_auth_group`
--

INSERT INTO `my_auth_group` (`id`, `pid`, `name`, `rules`, `createtime`, `updatetime`, `status`) VALUES
(1, 0, 'Admin group', '*', 1490883540, 149088354, 'normal'),
(6, 1, '超级管理', '1,2,6,7,8,9,10,11,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,40,41,42,43,44,45,46,47,48,49,50,67,68,69,70,71,72,5,66', 1597985795, 1597985795, 'normal');

-- --------------------------------------------------------

--
-- 表的结构 `my_auth_group_access`
--

CREATE TABLE `my_auth_group_access` (
  `uid` int(10) UNSIGNED NOT NULL COMMENT '会员ID',
  `group_id` int(10) UNSIGNED NOT NULL COMMENT '级别ID'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='权限分组表';

--
-- 转存表中的数据 `my_auth_group_access`
--

INSERT INTO `my_auth_group_access` (`uid`, `group_id`) VALUES
(1, 1),
(2, 6);

-- --------------------------------------------------------

--
-- 表的结构 `my_auth_rule`
--

CREATE TABLE `my_auth_rule` (
  `id` int(10) UNSIGNED NOT NULL,
  `type` enum('menu','file') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'file' COMMENT 'menu为菜单,file为权限节点',
  `pid` int(10) UNSIGNED NOT NULL DEFAULT '0' COMMENT '父ID',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '规则名称',
  `title` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '规则名称',
  `icon` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '图标',
  `condition` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '条件',
  `remark` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '备注',
  `ismenu` tinyint(1) UNSIGNED NOT NULL DEFAULT '0' COMMENT '是否为菜单',
  `createtime` int(10) DEFAULT NULL COMMENT '创建时间',
  `updatetime` int(10) DEFAULT NULL COMMENT '更新时间',
  `weigh` int(10) NOT NULL DEFAULT '0' COMMENT '权重',
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '状态'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='节点表';

--
-- 转存表中的数据 `my_auth_rule`
--

INSERT INTO `my_auth_rule` (`id`, `type`, `pid`, `name`, `title`, `icon`, `condition`, `remark`, `ismenu`, `createtime`, `updatetime`, `weigh`, `status`) VALUES
(1, 'file', 0, 'dashboard', 'Dashboard', 'fa fa-dashboard', '', 'Dashboard tips', 1, 1497429920, 1497429920, 143, 'normal'),
(2, 'file', 0, 'general', 'General', 'fa fa-cogs', '', '', 1, 1497429920, 1497430169, 137, 'normal'),
(3, 'file', 0, 'category', 'Category', 'fa fa-leaf', '', 'Category tips', 0, 1497429920, 1690191925, 119, 'normal'),
(4, 'file', 0, 'addon', 'Addon', 'fa fa-rocket', '', 'Addon tips', 0, 1502035509, 1690191929, 0, 'normal'),
(5, 'file', 0, 'auth', 'Auth', 'fa fa-group', '', '', 1, 1497429920, 1497430092, 99, 'normal'),
(6, 'file', 2, 'general/config', 'Config', 'fa fa-cog', '', 'Config tips', 1, 1497429920, 1497430683, 60, 'normal'),
(7, 'file', 2, 'general/attachment', 'Attachment', 'fa fa-file-image-o', '', 'Attachment tips', 0, 1497429920, 1690191923, 53, 'normal'),
(8, 'file', 2, 'general/profile', 'Profile', 'fa fa-user', '', '', 0, 1497429920, 1690191922, 34, 'normal'),
(9, 'file', 5, 'auth/admin', 'Admin', 'fa fa-user', '', 'Admin tips', 1, 1497429920, 1497430320, 118, 'normal'),
(10, 'file', 5, 'auth/adminlog', 'Admin log', 'fa fa-list-alt', '', 'Admin log tips', 1, 1497429920, 1497430307, 113, 'normal'),
(11, 'file', 5, 'auth/group', 'Group', 'fa fa-group', '', 'Group tips', 1, 1497429920, 1497429920, 109, 'normal'),
(12, 'file', 5, 'auth/rule', 'Rule', 'fa fa-bars', '', 'Rule tips', 1, 1497429920, 1497430581, 104, 'normal'),
(13, 'file', 1, 'dashboard/index', 'View', 'fa fa-circle-o', '', '', 0, 1497429920, 1497429920, 136, 'normal'),
(14, 'file', 1, 'dashboard/add', 'Add', 'fa fa-circle-o', '', '', 0, 1497429920, 1497429920, 135, 'normal'),
(15, 'file', 1, 'dashboard/del', 'Delete', 'fa fa-circle-o', '', '', 0, 1497429920, 1497429920, 133, 'normal'),
(16, 'file', 1, 'dashboard/edit', 'Edit', 'fa fa-circle-o', '', '', 0, 1497429920, 1497429920, 134, 'normal'),
(17, 'file', 1, 'dashboard/multi', 'Multi', 'fa fa-circle-o', '', '', 0, 1497429920, 1497429920, 132, 'normal'),
(18, 'file', 6, 'general/config/index', 'View', 'fa fa-circle-o', '', '', 0, 1497429920, 1497429920, 52, 'normal'),
(19, 'file', 6, 'general/config/add', 'Add', 'fa fa-circle-o', '', '', 0, 1497429920, 1497429920, 51, 'normal'),
(20, 'file', 6, 'general/config/edit', 'Edit', 'fa fa-circle-o', '', '', 0, 1497429920, 1497429920, 50, 'normal'),
(21, 'file', 6, 'general/config/del', 'Delete', 'fa fa-circle-o', '', '', 0, 1497429920, 1497429920, 49, 'normal'),
(22, 'file', 6, 'general/config/multi', 'Multi', 'fa fa-circle-o', '', '', 0, 1497429920, 1497429920, 48, 'normal'),
(23, 'file', 7, 'general/attachment/index', 'View', 'fa fa-circle-o', '', 'Attachment tips', 0, 1497429920, 1497429920, 59, 'normal'),
(24, 'file', 7, 'general/attachment/select', 'Select attachment', 'fa fa-circle-o', '', '', 0, 1497429920, 1497429920, 58, 'normal'),
(25, 'file', 7, 'general/attachment/add', 'Add', 'fa fa-circle-o', '', '', 0, 1497429920, 1497429920, 57, 'normal'),
(26, 'file', 7, 'general/attachment/edit', 'Edit', 'fa fa-circle-o', '', '', 0, 1497429920, 1497429920, 56, 'normal'),
(27, 'file', 7, 'general/attachment/del', 'Delete', 'fa fa-circle-o', '', '', 0, 1497429920, 1497429920, 55, 'normal'),
(28, 'file', 7, 'general/attachment/multi', 'Multi', 'fa fa-circle-o', '', '', 0, 1497429920, 1497429920, 54, 'normal'),
(29, 'file', 8, 'general/profile/index', 'View', 'fa fa-circle-o', '', '', 0, 1497429920, 1497429920, 33, 'normal'),
(30, 'file', 8, 'general/profile/update', 'Update profile', 'fa fa-circle-o', '', '', 0, 1497429920, 1497429920, 32, 'normal'),
(31, 'file', 8, 'general/profile/add', 'Add', 'fa fa-circle-o', '', '', 0, 1497429920, 1497429920, 31, 'normal'),
(32, 'file', 8, 'general/profile/edit', 'Edit', 'fa fa-circle-o', '', '', 0, 1497429920, 1497429920, 30, 'normal'),
(33, 'file', 8, 'general/profile/del', 'Delete', 'fa fa-circle-o', '', '', 0, 1497429920, 1497429920, 29, 'normal'),
(34, 'file', 8, 'general/profile/multi', 'Multi', 'fa fa-circle-o', '', '', 0, 1497429920, 1497429920, 28, 'normal'),
(35, 'file', 3, 'category/index', 'View', 'fa fa-circle-o', '', 'Category tips', 0, 1497429920, 1497429920, 142, 'normal'),
(36, 'file', 3, 'category/add', 'Add', 'fa fa-circle-o', '', '', 0, 1497429920, 1497429920, 141, 'normal'),
(37, 'file', 3, 'category/edit', 'Edit', 'fa fa-circle-o', '', '', 0, 1497429920, 1497429920, 140, 'normal'),
(38, 'file', 3, 'category/del', 'Delete', 'fa fa-circle-o', '', '', 0, 1497429920, 1497429920, 139, 'normal'),
(39, 'file', 3, 'category/multi', 'Multi', 'fa fa-circle-o', '', '', 0, 1497429920, 1497429920, 138, 'normal'),
(40, 'file', 9, 'auth/admin/index', 'View', 'fa fa-circle-o', '', 'Admin tips', 0, 1497429920, 1497429920, 117, 'normal'),
(41, 'file', 9, 'auth/admin/add', 'Add', 'fa fa-circle-o', '', '', 0, 1497429920, 1497429920, 116, 'normal'),
(42, 'file', 9, 'auth/admin/edit', 'Edit', 'fa fa-circle-o', '', '', 0, 1497429920, 1497429920, 115, 'normal'),
(43, 'file', 9, 'auth/admin/del', 'Delete', 'fa fa-circle-o', '', '', 0, 1497429920, 1497429920, 114, 'normal'),
(44, 'file', 10, 'auth/adminlog/index', 'View', 'fa fa-circle-o', '', 'Admin log tips', 0, 1497429920, 1497429920, 112, 'normal'),
(45, 'file', 10, 'auth/adminlog/detail', 'Detail', 'fa fa-circle-o', '', '', 0, 1497429920, 1497429920, 111, 'normal'),
(46, 'file', 10, 'auth/adminlog/del', 'Delete', 'fa fa-circle-o', '', '', 0, 1497429920, 1497429920, 110, 'normal'),
(47, 'file', 11, 'auth/group/index', 'View', 'fa fa-circle-o', '', 'Group tips', 0, 1497429920, 1497429920, 108, 'normal'),
(48, 'file', 11, 'auth/group/add', 'Add', 'fa fa-circle-o', '', '', 0, 1497429920, 1497429920, 107, 'normal'),
(49, 'file', 11, 'auth/group/edit', 'Edit', 'fa fa-circle-o', '', '', 0, 1497429920, 1497429920, 106, 'normal'),
(50, 'file', 11, 'auth/group/del', 'Delete', 'fa fa-circle-o', '', '', 0, 1497429920, 1497429920, 105, 'normal'),
(51, 'file', 12, 'auth/rule/index', 'View', 'fa fa-circle-o', '', 'Rule tips', 0, 1497429920, 1497429920, 103, 'normal'),
(52, 'file', 12, 'auth/rule/add', 'Add', 'fa fa-circle-o', '', '', 0, 1497429920, 1497429920, 102, 'normal'),
(53, 'file', 12, 'auth/rule/edit', 'Edit', 'fa fa-circle-o', '', '', 0, 1497429920, 1497429920, 101, 'normal'),
(54, 'file', 12, 'auth/rule/del', 'Delete', 'fa fa-circle-o', '', '', 0, 1497429920, 1497429920, 100, 'normal'),
(55, 'file', 4, 'addon/index', 'View', 'fa fa-circle-o', '', 'Addon tips', 0, 1502035509, 1502035509, 0, 'normal'),
(56, 'file', 4, 'addon/add', 'Add', 'fa fa-circle-o', '', '', 0, 1502035509, 1502035509, 0, 'normal'),
(57, 'file', 4, 'addon/edit', 'Edit', 'fa fa-circle-o', '', '', 0, 1502035509, 1502035509, 0, 'normal'),
(58, 'file', 4, 'addon/del', 'Delete', 'fa fa-circle-o', '', '', 0, 1502035509, 1502035509, 0, 'normal'),
(59, 'file', 4, 'addon/downloaded', 'Local addon', 'fa fa-circle-o', '', '', 0, 1502035509, 1502035509, 0, 'normal'),
(60, 'file', 4, 'addon/state', 'Update state', 'fa fa-circle-o', '', '', 0, 1502035509, 1502035509, 0, 'normal'),
(63, 'file', 4, 'addon/config', 'Setting', 'fa fa-circle-o', '', '', 0, 1502035509, 1502035509, 0, 'normal'),
(64, 'file', 4, 'addon/refresh', 'Refresh', 'fa fa-circle-o', '', '', 0, 1502035509, 1502035509, 0, 'normal'),
(65, 'file', 4, 'addon/multi', 'Multi', 'fa fa-circle-o', '', '', 0, 1502035509, 1502035509, 0, 'normal'),
(66, 'file', 0, 'user', 'User', 'fa fa-list', '', '', 1, 1516374729, 1516374729, 0, 'normal'),
(67, 'file', 66, 'user/user', 'User', 'fa fa-user', '', '', 1, 1516374729, 1516374729, 0, 'normal'),
(68, 'file', 67, 'user/user/index', 'View', 'fa fa-circle-o', '', '', 0, 1516374729, 1516374729, 0, 'normal'),
(69, 'file', 67, 'user/user/edit', 'Edit', 'fa fa-circle-o', '', '', 0, 1516374729, 1516374729, 0, 'normal'),
(70, 'file', 67, 'user/user/add', 'Add', 'fa fa-circle-o', '', '', 0, 1516374729, 1516374729, 0, 'normal'),
(71, 'file', 67, 'user/user/del', 'Del', 'fa fa-circle-o', '', '', 0, 1516374729, 1516374729, 0, 'normal'),
(72, 'file', 67, 'user/user/multi', 'Multi', 'fa fa-circle-o', '', '', 0, 1516374729, 1516374729, 0, 'normal'),
(73, 'file', 66, 'user/group', 'User group', 'fa fa-users', '', '', 0, 1516374729, 1690191933, 0, 'normal'),
(74, 'file', 73, 'user/group/add', 'Add', 'fa fa-circle-o', '', '', 0, 1516374729, 1516374729, 0, 'normal'),
(75, 'file', 73, 'user/group/edit', 'Edit', 'fa fa-circle-o', '', '', 0, 1516374729, 1516374729, 0, 'normal'),
(76, 'file', 73, 'user/group/index', 'View', 'fa fa-circle-o', '', '', 0, 1516374729, 1516374729, 0, 'normal'),
(77, 'file', 73, 'user/group/del', 'Del', 'fa fa-circle-o', '', '', 0, 1516374729, 1516374729, 0, 'normal'),
(78, 'file', 73, 'user/group/multi', 'Multi', 'fa fa-circle-o', '', '', 0, 1516374729, 1516374729, 0, 'normal'),
(79, 'file', 66, 'user/rule', 'User rule', 'fa fa-circle-o', '', '', 0, 1516374729, 1690191935, 0, 'normal'),
(80, 'file', 79, 'user/rule/index', 'View', 'fa fa-circle-o', '', '', 0, 1516374729, 1516374729, 0, 'normal'),
(81, 'file', 79, 'user/rule/del', 'Del', 'fa fa-circle-o', '', '', 0, 1516374729, 1516374729, 0, 'normal'),
(82, 'file', 79, 'user/rule/add', 'Add', 'fa fa-circle-o', '', '', 0, 1516374729, 1516374729, 0, 'normal'),
(83, 'file', 79, 'user/rule/edit', 'Edit', 'fa fa-circle-o', '', '', 0, 1516374729, 1516374729, 0, 'normal'),
(84, 'file', 79, 'user/rule/multi', 'Multi', 'fa fa-circle-o', '', '', 0, 1516374729, 1516374729, 0, 'normal'),
(85, 'file', 0, 'article', '文章幻灯', 'fa fa-list', '', '', 1, 1598009273, 1598063581, 0, 'normal'),
(86, 'file', 85, 'article/article', '文章记录', 'fa fa-circle-o', '', '', 1, 1598009273, 1598063594, 0, 'normal'),
(87, 'file', 86, 'article/article/index', '查看', 'fa fa-circle-o', '', '', 0, 1598009273, 1598009273, 0, 'normal'),
(88, 'file', 86, 'article/article/add', '添加', 'fa fa-circle-o', '', '', 0, 1598009273, 1598009273, 0, 'normal'),
(89, 'file', 86, 'article/article/edit', '编辑', 'fa fa-circle-o', '', '', 0, 1598009273, 1598009273, 0, 'normal'),
(90, 'file', 86, 'article/article/del', '删除', 'fa fa-circle-o', '', '', 0, 1598009273, 1598009273, 0, 'normal'),
(91, 'file', 86, 'article/article/multi', '批量更新', 'fa fa-circle-o', '', '', 0, 1598009273, 1598009273, 0, 'normal'),
(92, 'file', 85, 'article/slide', '幻灯信息', 'fa fa-circle-o', '', '', 1, 1598063790, 1598063790, 0, 'normal'),
(93, 'file', 92, 'article/slide/index', '查看', 'fa fa-circle-o', '', '', 0, 1598063790, 1598063790, 0, 'normal'),
(94, 'file', 92, 'article/slide/add', '添加', 'fa fa-circle-o', '', '', 0, 1598063790, 1598063790, 0, 'normal'),
(95, 'file', 92, 'article/slide/edit', '编辑', 'fa fa-circle-o', '', '', 0, 1598063790, 1598063790, 0, 'normal'),
(96, 'file', 92, 'article/slide/del', '删除', 'fa fa-circle-o', '', '', 0, 1598063790, 1598063790, 0, 'normal'),
(97, 'file', 92, 'article/slide/multi', '批量更新', 'fa fa-circle-o', '', '', 0, 1598063790, 1598063790, 0, 'normal'),
(98, 'file', 0, 'contract', '合约管理', 'fa fa-list', '', '', 1, 1690196467, 1690201608, 0, 'normal'),
(99, 'file', 98, 'contract/user', '合约会员', 'fa fa-circle-o\r', '', '', 1, 1690196467, 1690196467, 0, 'normal'),
(100, 'file', 99, 'contract/user/index', '查看', 'fa fa-circle-o', '', '', 0, 1690196467, 1690196467, 0, 'normal'),
(101, 'file', 99, 'contract/user/add', '添加', 'fa fa-circle-o', '', '', 0, 1690196467, 1690196467, 0, 'normal'),
(102, 'file', 99, 'contract/user/edit', '编辑', 'fa fa-circle-o', '', '', 0, 1690196467, 1690196467, 0, 'normal'),
(103, 'file', 99, 'contract/user/del', '删除', 'fa fa-circle-o', '', '', 0, 1690196467, 1690196467, 0, 'normal'),
(104, 'file', 99, 'contract/user/multi', '批量更新', 'fa fa-circle-o', '', '', 0, 1690196467, 1690196467, 0, 'normal'),
(105, 'file', 98, 'contract/hash', '合约事件', 'fa fa-circle-o\r', '', '', 1, 1690196477, 1690196477, 0, 'normal'),
(106, 'file', 105, 'contract/hash/index', '查看', 'fa fa-circle-o', '', '', 0, 1690196477, 1690196477, 0, 'normal'),
(107, 'file', 105, 'contract/hash/add', '添加', 'fa fa-circle-o', '', '', 0, 1690196477, 1690196477, 0, 'normal'),
(108, 'file', 105, 'contract/hash/edit', '编辑', 'fa fa-circle-o', '', '', 0, 1690196477, 1690196477, 0, 'normal'),
(109, 'file', 105, 'contract/hash/del', '删除', 'fa fa-circle-o', '', '', 0, 1690196477, 1690196477, 0, 'normal'),
(110, 'file', 105, 'contract/hash/multi', '批量更新', 'fa fa-circle-o', '', '', 0, 1690196477, 1690196477, 0, 'normal'),
(111, 'file', 98, 'contract/rebate', '账户记录', 'fa fa-circle-o\r', '', '', 1, 1690200530, 1690200530, 0, 'normal'),
(112, 'file', 111, 'contract/rebate/index', '查看', 'fa fa-circle-o', '', '', 0, 1690200530, 1690200530, 0, 'normal'),
(113, 'file', 111, 'contract/rebate/add', '添加', 'fa fa-circle-o', '', '', 0, 1690200530, 1690200530, 0, 'normal'),
(114, 'file', 111, 'contract/rebate/edit', '编辑', 'fa fa-circle-o', '', '', 0, 1690200530, 1690200530, 0, 'normal'),
(115, 'file', 111, 'contract/rebate/del', '删除', 'fa fa-circle-o', '', '', 0, 1690200530, 1690200530, 0, 'normal'),
(116, 'file', 111, 'contract/rebate/multi', '批量更新', 'fa fa-circle-o', '', '', 0, 1690200530, 1690200530, 0, 'normal');

-- --------------------------------------------------------

--
-- 表的结构 `my_category`
--

CREATE TABLE `my_category` (
  `id` int(10) UNSIGNED NOT NULL,
  `pid` int(10) UNSIGNED NOT NULL DEFAULT '0' COMMENT '父ID',
  `type` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '栏目类型',
  `name` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `nickname` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `flag` set('hot','index','recommend') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `image` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '图片',
  `keywords` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '关键字',
  `description` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '描述',
  `diyname` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '自定义名称',
  `createtime` int(10) DEFAULT NULL COMMENT '创建时间',
  `updatetime` int(10) DEFAULT NULL COMMENT '更新时间',
  `weigh` int(10) NOT NULL DEFAULT '0' COMMENT '权重',
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '状态'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分类表';

--
-- 转存表中的数据 `my_category`
--

INSERT INTO `my_category` (`id`, `pid`, `type`, `name`, `nickname`, `flag`, `image`, `keywords`, `description`, `diyname`, `createtime`, `updatetime`, `weigh`, `status`) VALUES
(1, 0, 'page', '官方新闻', 'news', 'recommend', '/assets/img/qrcode.png', '', '', 'news', 1495262190, 1495262190, 1, 'normal'),
(2, 0, 'page', '移动应用', 'mobileapp', 'hot', '/assets/img/qrcode.png', '', '', 'mobileapp', 1495262244, 1495262244, 2, 'normal'),
(3, 2, 'page', '微信公众号', 'wechatpublic', 'index', '/assets/img/qrcode.png', '', '', 'wechatpublic', 1495262288, 1495262288, 3, 'normal'),
(4, 2, 'page', 'Android开发', 'android', 'recommend', '/assets/img/qrcode.png', '', '', 'android', 1495262317, 1495262317, 4, 'normal'),
(5, 0, 'page', '软件产品', 'software', 'recommend', '/assets/img/qrcode.png', '', '', 'software', 1495262336, 1499681850, 5, 'normal'),
(6, 5, 'page', '网站建站', 'website', 'recommend', '/assets/img/qrcode.png', '', '', 'website', 1495262357, 1495262357, 6, 'normal'),
(7, 5, 'page', '企业管理软件', 'company', 'index', '/assets/img/qrcode.png', '', '', 'company', 1495262391, 1495262391, 7, 'normal'),
(8, 6, 'page', 'PC端', 'website-pc', 'recommend', '/assets/img/qrcode.png', '', '', 'website-pc', 1495262424, 1495262424, 8, 'normal'),
(9, 6, 'page', '移动端', 'website-mobile', 'recommend', '/assets/img/qrcode.png', '', '', 'website-mobile', 1495262456, 1495262456, 9, 'normal'),
(10, 7, 'page', 'CRM系统 ', 'company-crm', 'recommend', '/assets/img/qrcode.png', '', '', 'company-crm', 1495262487, 1495262487, 10, 'normal'),
(11, 7, 'page', 'SASS平台软件', 'company-sass', 'recommend', '/assets/img/qrcode.png', '', '', 'company-sass', 1495262515, 1495262515, 11, 'normal'),
(12, 0, 'test', '测试1', 'test1', 'recommend', '/assets/img/qrcode.png', '', '', 'test1', 1497015727, 1497015727, 12, 'normal'),
(13, 0, 'test', '测试2', 'test2', 'recommend', '/assets/img/qrcode.png', '', '', 'test2', 1497015738, 1497015738, 13, 'normal');

-- --------------------------------------------------------

--
-- 表的结构 `my_config`
--

CREATE TABLE `my_config` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '变量名',
  `group` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '分组',
  `title` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '变量标题',
  `tip` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '变量描述',
  `type` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '类型:string,text,int,bool,array,datetime,date,file',
  `value` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '变量值',
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '变量字典数据',
  `rule` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '验证规则',
  `extend` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '扩展属性',
  `status` tinyint(1) UNSIGNED NOT NULL DEFAULT '1' COMMENT '状态',
  `displayorder` int(11) UNSIGNED NOT NULL DEFAULT '0' COMMENT '排序'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置';

--
-- 转存表中的数据 `my_config`
--

INSERT INTO `my_config` (`id`, `name`, `group`, `title`, `tip`, `type`, `value`, `content`, `rule`, `extend`, `status`, `displayorder`) VALUES
(1, 'name', 'basic', 'Site name', '请填写站点名称', 'string', 'LYM', '', 'required', '', 1, 0),
(2, 'beian', 'basic', 'Beian', '粤ICP备15000000号-1', 'string', '', '', '', '', 1, 0),
(3, 'cdnurl', 'basic', 'Cdn url', '如果静态资源使用第三方云储存请配置该值', 'string', '', '', '', '', 1, 0),
(4, 'version', 'basic', 'Version', '如果静态资源有变动请重新配置该值', 'string', '1.0.1', '', 'required', '', 1, 0),
(5, 'timezone', 'basic', 'Timezone', '', 'string', 'Asia/Shanghai', '', 'required', '', 1, 0),
(6, 'forbiddenip', 'basic', 'Forbidden ip', '一行一条记录', 'text', '', '', '', '', 1, 0),
(7, 'languages', 'basic', 'Languages', '', 'array', '{\"backend\":\"zh-cn\",\"frontend\":\"zh-cn\"}', '', 'required', '', 1, 0),
(8, 'fixedpage', 'basic', 'Fixed page', '请尽量输入左侧菜单栏存在的链接', 'string', 'dashboard', '', 'required', '', 1, 0),
(9, 'categorytype', 'dictionary', 'Category type', '', 'array', '{\"default\":\"Default\",\"page\":\"Page\",\"article\":\"Article\",\"test\":\"Test\"}', '', '', '', 1, 0),
(10, 'configgroup', 'dictionary', 'Config group', '', 'array', '{\"basic\":\"Basic\",\"user\":\"User\",\"contract\":\"合约\",\"rule\":\"规则\"}', '', '', '', 1, 0),
(11, 'mail_type', 'email', 'Mail type', '选择邮件发送方式', 'select', '1', '[\"Please select\",\"SMTP\",\"Mail\"]', '', '', 1, 0),
(12, 'mail_smtp_host', 'email', 'Mail smtp host', '错误的配置发送邮件会导致服务器超时', 'string', 'smtp.qq.com', '', '', '', 1, 0),
(13, 'mail_smtp_port', 'email', 'Mail smtp port', '(不加密默认25,SSL默认465,TLS默认587)', 'string', '465', '', '', '', 1, 0),
(14, 'mail_smtp_user', 'email', 'Mail smtp user', '（填写完整用户名）', 'string', 'zh9025', '', '', '', 1, 0),
(15, 'mail_smtp_pass', 'email', 'Mail smtp password', '（填写您的密码）', 'string', 'jajoqmjrsvsgbibh', '', '', '', 1, 0),
(16, 'mail_verify_type', 'email', 'Mail vertify type', '（SMTP验证方式[推荐SSL]）', 'select', '2', '[\"None\",\"TLS\",\"SSL\"]', '', '', 1, 0),
(17, 'mail_from', 'email', 'Mail from', '', 'string', 'zh9025@qq.com', '', '', '', 1, 0),
(18, 'text_demo', 'example', '测试文本', '', 'editor', '<p>2222</p>', '', '', '', 1, 0),
(19, 'aliyunaccesskey', 'oss', '阿里云对象存储AccessKey', '', 'string', 'LTAI4GKv5dYertJVtgrNA9J1', '', '', '', 1, 0),
(20, 'aliyunsecretkey', 'oss', '阿里云对象存储SecretKey', '', 'string', 'cDNNgk2YZzLS4UtEi9yrF5VjDmvYwb', '', '', '', 1, 0),
(21, 'aliyunendpoint', 'oss', '阿里云对象存储地域节点', '', 'string', 'http://oss-cn-beijing.aliyuncs.com', '', '', '', 1, 0),
(22, 'aliyunbucket', 'oss', '阿里云对象存储空间名称', '', 'string', 'fclm', '', '', '', 1, 0),
(23, 'aliyundomain', 'oss', '阿里云对象存储域名', '', 'string', 'http://world-img.fclm1688.com', '', '', '', 1, 0),
(24, 'aliyunsharedomain', 'oss', '阿里云对象存储分享域名地址', '', 'string', 'http://world-img.fclm1688.com/share/index.html', '', '', '', 1, 0),
(25, 'img_demo', 'example', '测试图片', '', 'image', 'http://world-img.fclm1688.com/uploads/20200821/c4bfdb01164c4b4d9f52e22badcddf76.png', '', '', '', 1, 0),
(26, 'aliyunsmssignname', 'oss', '阿里云短信签名', '', 'string', '郑州佳宸公司', '', '', '', 1, 0),
(27, 'aliyunsmstmpid1', 'oss', '阿里云短信国内模板ID', '', 'string', 'SMS_176927895', '', '', '', 1, 0),
(28, 'aliyunsmstmpid2', 'oss', '阿里云短信国际模板ID', '', 'string', 'SMS_176927895', '', '', '', 1, 0),
(29, 'imgapplogo', 'img', 'APPlogo', '', 'image', 'http://world-img.fclm1688.com/uploads/20200822/d245f9baebe1bc9fa4e78a2cf95229f2.png', '', '', '', 1, 0),
(30, 'imgshareposter', 'img', '海报背景', '', 'images', 'http://world-img.fclm1688.com/uploads/20200822/1fe5f4944e794f3b77d8204718cb0659.png', '', '', '', 1, 0),
(31, 'one_address', 'user', '系统第一个地址', '', 'array', '{\"1\":\"0x26241a987Eb843701AAa866DDc5C178DAc9B5EbA\"}', '', '', '', 1, 0);

-- --------------------------------------------------------

--
-- 表的结构 `my_contract_hash`
--

CREATE TABLE `my_contract_hash` (
  `id` int(11) UNSIGNED NOT NULL,
  `types` varchar(50) DEFAULT NULL COMMENT '类型',
  `hash` varchar(255) DEFAULT NULL COMMENT 'hash',
  `block` int(11) UNSIGNED NOT NULL DEFAULT '0' COMMENT '区块高度',
  `info` text COMMENT '内容',
  `status` tinyint(1) UNSIGNED NOT NULL DEFAULT '1' COMMENT '状态',
  `address` varchar(50) DEFAULT NULL COMMENT '用户地址',
  `params1` decimal(20,6) UNSIGNED NOT NULL DEFAULT '0.000000' COMMENT '参数1',
  `params2` decimal(20,6) UNSIGNED NOT NULL DEFAULT '0.000000' COMMENT '参数2',
  `createtime` int(11) UNSIGNED NOT NULL DEFAULT '0' COMMENT '创建时间',
  `updatetime` int(11) UNSIGNED NOT NULL DEFAULT '0' COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='合约事件';

-- --------------------------------------------------------

--
-- 表的结构 `my_contract_rebate`
--

CREATE TABLE `my_contract_rebate` (
  `id` int(11) UNSIGNED NOT NULL,
  `uid` int(11) UNSIGNED NOT NULL DEFAULT '0' COMMENT '会员编号',
  `address` varchar(50) DEFAULT NULL COMMENT '用户地址',
  `date` varchar(50) DEFAULT NULL COMMENT '日期',
  `types` varchar(50) DEFAULT NULL COMMENT '类型',
  `orderId` varchar(50) DEFAULT NULL COMMENT '订单号',
  `credittype` varchar(50) DEFAULT NULL COMMENT '账户',
  `percent` decimal(11,2) UNSIGNED NOT NULL DEFAULT '0.00' COMMENT '比例',
  `price` decimal(20,6) NOT NULL DEFAULT '0.000000' COMMENT '金额',
  `ago` decimal(20,6) UNSIGNED NOT NULL DEFAULT '0.000000' COMMENT '之前',
  `after` decimal(20,6) UNSIGNED NOT NULL DEFAULT '0.000000' COMMENT '之后',
  `status` tinyint(1) UNSIGNED NOT NULL DEFAULT '1' COMMENT '状态',
  `createtime` int(11) UNSIGNED NOT NULL DEFAULT '0' COMMENT '创建时间',
  `updatetime` int(11) UNSIGNED NOT NULL DEFAULT '0' COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='账户记录';

--
-- 转存表中的数据 `my_contract_rebate`
--

INSERT INTO `my_contract_rebate` (`id`, `uid`, `address`, `date`, `types`, `orderId`, `credittype`, `percent`, `price`, `ago`, `after`, `status`, `createtime`, `updatetime`) VALUES
(1, 1, '0x26241a987Eb843701AAa866DDc5C178DAc9B5EbA', '2023-07-25', 'admin', '2080230725090100001', 'credit1', '100.00', '2.000000', '0.000000', '2.000000', 1, 1690246868, 1690246868),
(2, 1, '0x26241a987Eb843701AAa866DDc5C178DAc9B5EbA', '2023-07-25', 'admin', '2080230725090100001', 'credit2', '100.00', '3.000000', '0.000000', '3.000000', 1, 1690246868, 1690246868),
(3, 1, '0x26241a987Eb843701AAa866DDc5C178DAc9B5EbA', '2023-07-25', 'admin', '2080230725090100001', 'credit3', '100.00', '4.000000', '0.000000', '4.000000', 1, 1690246868, 1690246868);

-- --------------------------------------------------------

--
-- 表的结构 `my_contract_user`
--

CREATE TABLE `my_contract_user` (
  `id` int(11) UNSIGNED NOT NULL,
  `uid` int(11) UNSIGNED NOT NULL DEFAULT '0' COMMENT '会员编号',
  `address` varchar(50) DEFAULT NULL COMMENT '用户地址',
  `credit1` decimal(20,6) UNSIGNED NOT NULL DEFAULT '0.000000' COMMENT '账户1',
  `credit2` decimal(20,6) UNSIGNED NOT NULL DEFAULT '0.000000' COMMENT '账户2',
  `credit3` decimal(20,6) UNSIGNED NOT NULL DEFAULT '0.000000' COMMENT '账户3',
  `status` tinyint(1) UNSIGNED NOT NULL DEFAULT '1' COMMENT '状态',
  `createtime` int(11) UNSIGNED NOT NULL DEFAULT '0' COMMENT '创建时间',
  `updatetime` int(11) UNSIGNED NOT NULL DEFAULT '0' COMMENT '更新时间',
  `lock_version` int(11) UNSIGNED NOT NULL DEFAULT '0' COMMENT '版本号'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='合约会员';

--
-- 转存表中的数据 `my_contract_user`
--

INSERT INTO `my_contract_user` (`id`, `uid`, `address`, `credit1`, `credit2`, `credit3`, `status`, `createtime`, `updatetime`, `lock_version`) VALUES
(1, 1, '0x26241a987Eb843701AAa866DDc5C178DAc9B5EbA', '2.000000', '3.000000', '4.000000', 1, 1690246595, 1690246868, 3),
(2, 2, '0x4210073F39823f6F3D26336cC799DB32766A8B41', '0.000000', '0.000000', '0.000000', 1, 1690248529, 1690248529, 0);

-- --------------------------------------------------------

--
-- 表的结构 `my_ems`
--

CREATE TABLE `my_ems` (
  `id` int(10) UNSIGNED NOT NULL COMMENT 'ID',
  `event` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '事件',
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '邮箱',
  `code` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '验证码',
  `times` int(10) UNSIGNED NOT NULL DEFAULT '0' COMMENT '验证次数',
  `ip` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT 'IP',
  `createtime` int(10) UNSIGNED DEFAULT '0' COMMENT '创建时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='邮箱验证码表';

--
-- 转存表中的数据 `my_ems`
--

INSERT INTO `my_ems` (`id`, `event`, `email`, `code`, `times`, `ip`, `createtime`) VALUES
(3, 'register', '598836535@qq.com', '6482', 0, '127.0.0.1', 1598006627),
(4, 'forget', '598836535@qq.com', '4334', 0, '127.0.0.1', 1598008854);

-- --------------------------------------------------------

--
-- 表的结构 `my_slide_list`
--

CREATE TABLE `my_slide_list` (
  `id` int(11) UNSIGNED NOT NULL,
  `title` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '标题',
  `type` tinyint(1) UNSIGNED NOT NULL DEFAULT '0' COMMENT '类型',
  `lang` tinyint(1) DEFAULT '1' COMMENT '语言',
  `thumb` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '图片',
  `status` tinyint(1) UNSIGNED NOT NULL DEFAULT '0' COMMENT '状态',
  `displayorder` int(11) UNSIGNED NOT NULL DEFAULT '0' COMMENT '排序',
  `createtime` int(11) UNSIGNED NOT NULL DEFAULT '0' COMMENT '创建时间',
  `updatetime` int(11) UNSIGNED NOT NULL DEFAULT '0' COMMENT '更新时间'
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='幻灯信息';

--
-- 转存表中的数据 `my_slide_list`
--

INSERT INTO `my_slide_list` (`id`, `title`, `type`, `lang`, `thumb`, `status`, `displayorder`, `createtime`, `updatetime`) VALUES
(1, '1', 1, 1, 'http://world-img.fclm1688.com/uploads/20200822/3234f34428168d09874487e742f2d000.png', 1, 0, 1598065204, 1598065204),
(2, '2', 1, 1, 'http://world-img.fclm1688.com/uploads/20200822/8ae467ece82b546dfe6edabbb3158f91.png', 1, 0, 1598065210, 1598065210),
(3, '3', 1, 1, 'http://world-img.fclm1688.com/uploads/20200822/0c91da98525c038a3daf5e8b95a27f5d.png', 1, 0, 1598065218, 1598065225);

-- --------------------------------------------------------

--
-- 表的结构 `my_sms`
--

CREATE TABLE `my_sms` (
  `id` int(10) UNSIGNED NOT NULL COMMENT 'ID',
  `event` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '事件',
  `mobile` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '手机号',
  `area_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '区号',
  `code` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '验证码',
  `times` int(10) UNSIGNED NOT NULL DEFAULT '0' COMMENT '验证次数',
  `ip` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT 'IP',
  `createtime` int(10) UNSIGNED DEFAULT '0' COMMENT '创建时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='短信验证码表';

--
-- 转存表中的数据 `my_sms`
--

INSERT INTO `my_sms` (`id`, `event`, `mobile`, `area_code`, `code`, `times`, `ip`, `createtime`) VALUES
(1, 'forget', '18749320615', '86', '3139', 0, '127.0.0.1', 1598001173),
(2, 'forget', '18749320615', '86', '1349', 0, '127.0.0.1', 1598061886),
(4, 'forget', '18749320615', '86', '9792', 0, '127.0.0.1', 1598062823),
(5, 'forget', '18749320615', '86', '2582', 0, '127.0.0.1', 1598062887);

-- --------------------------------------------------------

--
-- 表的结构 `my_test`
--

CREATE TABLE `my_test` (
  `id` int(10) UNSIGNED NOT NULL COMMENT 'ID',
  `admin_id` int(10) NOT NULL DEFAULT '0' COMMENT '管理员ID',
  `category_id` int(10) UNSIGNED NOT NULL DEFAULT '0' COMMENT '分类ID(单选)',
  `category_ids` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '分类ID(多选)',
  `week` enum('monday','tuesday','wednesday') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '星期(单选):monday=星期一,tuesday=星期二,wednesday=星期三',
  `flag` set('hot','index','recommend') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '标志(多选):hot=热门,index=首页,recommend=推荐',
  `genderdata` enum('male','female') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'male' COMMENT '性别(单选):male=男,female=女',
  `hobbydata` set('music','reading','swimming') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '爱好(多选):music=音乐,reading=读书,swimming=游泳',
  `title` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '标题',
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '内容',
  `image` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '图片',
  `images` varchar(1500) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '图片组',
  `attachfile` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '附件',
  `keywords` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '关键字',
  `description` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '描述',
  `city` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '省市',
  `json` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '配置:key=名称,value=值',
  `price` float(10,2) UNSIGNED NOT NULL DEFAULT '0.00' COMMENT '价格',
  `views` int(10) UNSIGNED NOT NULL DEFAULT '0' COMMENT '点击',
  `startdate` date DEFAULT NULL COMMENT '开始日期',
  `activitytime` datetime DEFAULT NULL COMMENT '活动时间(datetime)',
  `year` year(4) DEFAULT NULL COMMENT '年',
  `times` time DEFAULT NULL COMMENT '时间',
  `refreshtime` int(10) DEFAULT NULL COMMENT '刷新时间(int)',
  `createtime` int(10) DEFAULT NULL COMMENT '创建时间',
  `updatetime` int(10) DEFAULT NULL COMMENT '更新时间',
  `deletetime` int(10) DEFAULT NULL COMMENT '删除时间',
  `weigh` int(10) NOT NULL DEFAULT '0' COMMENT '权重',
  `switch` tinyint(1) NOT NULL DEFAULT '0' COMMENT '开关',
  `status` enum('normal','hidden') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'normal' COMMENT '状态',
  `state` enum('0','1','2') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1' COMMENT '状态值:0=禁用,1=正常,2=推荐'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='测试表';

--
-- 转存表中的数据 `my_test`
--

INSERT INTO `my_test` (`id`, `admin_id`, `category_id`, `category_ids`, `week`, `flag`, `genderdata`, `hobbydata`, `title`, `content`, `image`, `images`, `attachfile`, `keywords`, `description`, `city`, `json`, `price`, `views`, `startdate`, `activitytime`, `year`, `times`, `refreshtime`, `createtime`, `updatetime`, `deletetime`, `weigh`, `switch`, `status`, `state`) VALUES
(1, 0, 12, '12,13', 'monday', 'hot,index', 'male', 'music,reading', '我是一篇测试文章', '<p>我是测试内容</p>', '/assets/img/avatar.png', '/assets/img/avatar.png,/assets/img/qrcode.png', '/assets/img/avatar.png', '关键字', '描述', '广西壮族自治区/百色市/平果县', '{\"a\":\"1\",\"b\":\"2\"}', 0.00, 0, '2017-07-10', '2017-07-10 18:24:45', 2017, '18:24:45', 1499682285, 1499682526, 1499682526, NULL, 0, 1, 'normal', '1');

-- --------------------------------------------------------

--
-- 表的结构 `my_user`
--

CREATE TABLE `my_user` (
  `id` int(10) UNSIGNED NOT NULL COMMENT 'ID',
  `group_id` int(10) UNSIGNED NOT NULL DEFAULT '0' COMMENT '组别ID',
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '用户名',
  `nickname` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '昵称',
  `password` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '密码',
  `salt` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '密码盐',
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '电子邮箱',
  `mobile` varchar(11) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '手机号',
  `area_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '区号',
  `avatar` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '头像',
  `level` tinyint(1) UNSIGNED NOT NULL DEFAULT '0' COMMENT '等级',
  `gender` tinyint(1) UNSIGNED NOT NULL DEFAULT '0' COMMENT '性别',
  `birthday` date DEFAULT NULL COMMENT '生日',
  `bio` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '格言',
  `money` decimal(10,2) UNSIGNED NOT NULL DEFAULT '0.00' COMMENT '余额',
  `score` int(10) UNSIGNED NOT NULL DEFAULT '0' COMMENT '积分',
  `successions` int(10) UNSIGNED NOT NULL DEFAULT '1' COMMENT '连续登录天数',
  `maxsuccessions` int(10) UNSIGNED NOT NULL DEFAULT '1' COMMENT '最大连续登录天数',
  `prevtime` int(10) DEFAULT NULL COMMENT '上次登录时间',
  `logintime` int(10) DEFAULT NULL COMMENT '登录时间',
  `loginip` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '登录IP',
  `loginfailure` tinyint(1) UNSIGNED NOT NULL DEFAULT '0' COMMENT '失败次数',
  `joinip` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '加入IP',
  `jointime` int(10) DEFAULT NULL COMMENT '加入时间',
  `createtime` int(10) DEFAULT NULL COMMENT '创建时间',
  `updatetime` int(10) DEFAULT NULL COMMENT '更新时间',
  `token` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT 'Token',
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '状态',
  `verification` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '验证',
  `invite_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '邀请码',
  `referrer` int(11) UNSIGNED NOT NULL DEFAULT '0' COMMENT '推荐人',
  `relation` text COLLATE utf8mb4_unicode_ci COMMENT '推荐关系',
  `address` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '地址'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会员表';

--
-- 转存表中的数据 `my_user`
--

INSERT INTO `my_user` (`id`, `group_id`, `username`, `nickname`, `password`, `salt`, `email`, `mobile`, `area_code`, `avatar`, `level`, `gender`, `birthday`, `bio`, `money`, `score`, `successions`, `maxsuccessions`, `prevtime`, `logintime`, `loginip`, `loginfailure`, `joinip`, `jointime`, `createtime`, `updatetime`, `token`, `status`, `verification`, `invite_code`, `referrer`, `relation`, `address`) VALUES
(1, 0, '0x26241a987Eb843701AAa866DDc5C178DAc9B5EbA', '0x26241a987Eb843701AAa866DDc5C178DAc9B5EbA', 'c1a9804d57680ee7b3f7934c7f78aedf', 'fkvZHW', '', '', NULL, '', 1, 0, NULL, '', '0.00', 0, 1, 1, 1690246595, 1690246610, '127.0.0.1', 0, '127.0.0.1', 1690246595, 1690246595, 1690248350, '', 'normal', '', '94486278', 0, '0', '0x26241a987Eb843701AAa866DDc5C178DAc9B5EbA'),
(2, 0, '0x4210073F39823f6F3D26336cC799DB32766A8B41', '0x4210073F39823f6F3D26336cC799DB32766A8B41', '7ac5427b18ae67f26e665fb77c1d5ab9', 'CwqLMZ', '', '', NULL, '', 1, 0, NULL, '', '0.00', 0, 1, 1, 1690248529, 1690248529, '127.0.0.1', 0, '127.0.0.1', 1690248529, 1690248529, 1690248558, '', 'normal', '', '84806868', 1, '1-0', '0x4210073F39823f6F3D26336cC799DB32766A8B41');

-- --------------------------------------------------------

--
-- 表的结构 `my_user_group`
--

CREATE TABLE `my_user_group` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '组名',
  `rules` text COLLATE utf8mb4_unicode_ci COMMENT '权限节点',
  `createtime` int(10) DEFAULT NULL COMMENT '添加时间',
  `updatetime` int(10) DEFAULT NULL COMMENT '更新时间',
  `status` enum('normal','hidden') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '状态'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会员组表';

--
-- 转存表中的数据 `my_user_group`
--

INSERT INTO `my_user_group` (`id`, `name`, `rules`, `createtime`, `updatetime`, `status`) VALUES
(1, '默认组', '1,2,3,4,5,6,7,8,9,10,11,12', 1515386468, 1516168298, 'normal');

-- --------------------------------------------------------

--
-- 表的结构 `my_user_money_log`
--

CREATE TABLE `my_user_money_log` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL DEFAULT '0' COMMENT '会员ID',
  `money` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '变更余额',
  `before` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '变更前余额',
  `after` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '变更后余额',
  `memo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '备注',
  `createtime` int(10) DEFAULT NULL COMMENT '创建时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会员余额变动表';

-- --------------------------------------------------------

--
-- 表的结构 `my_user_relation`
--

CREATE TABLE `my_user_relation` (
  `id` int(11) UNSIGNED NOT NULL,
  `uid` int(11) UNSIGNED NOT NULL DEFAULT '0' COMMENT '会员编号',
  `level` int(11) UNSIGNED NOT NULL DEFAULT '0' COMMENT '层级',
  `pid` int(11) UNSIGNED NOT NULL DEFAULT '0' COMMENT '上级'
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会员关系表';

--
-- 转存表中的数据 `my_user_relation`
--

INSERT INTO `my_user_relation` (`id`, `uid`, `level`, `pid`) VALUES
(4, 1, 1, 0),
(7, 2, 1, 1),
(8, 2, 2, 0);

-- --------------------------------------------------------

--
-- 表的结构 `my_user_rule`
--

CREATE TABLE `my_user_rule` (
  `id` int(10) UNSIGNED NOT NULL,
  `pid` int(10) DEFAULT NULL COMMENT '父ID',
  `name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '名称',
  `title` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '标题',
  `remark` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '备注',
  `ismenu` tinyint(1) DEFAULT NULL COMMENT '是否菜单',
  `createtime` int(10) DEFAULT NULL COMMENT '创建时间',
  `updatetime` int(10) DEFAULT NULL COMMENT '更新时间',
  `weigh` int(10) DEFAULT '0' COMMENT '权重',
  `status` enum('normal','hidden') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '状态'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会员规则表';

--
-- 转存表中的数据 `my_user_rule`
--

INSERT INTO `my_user_rule` (`id`, `pid`, `name`, `title`, `remark`, `ismenu`, `createtime`, `updatetime`, `weigh`, `status`) VALUES
(1, 0, 'index', '前台', '', 1, 1516168079, 1516168079, 1, 'normal'),
(2, 0, 'api', 'API接口', '', 1, 1516168062, 1516168062, 2, 'normal'),
(3, 1, 'user', '会员模块', '', 1, 1515386221, 1516168103, 12, 'normal'),
(4, 2, 'user', '会员模块', '', 1, 1515386221, 1516168092, 11, 'normal'),
(5, 3, 'index/user/login', '登录', '', 0, 1515386247, 1515386247, 5, 'normal'),
(6, 3, 'index/user/register', '注册', '', 0, 1515386262, 1516015236, 7, 'normal'),
(7, 3, 'index/user/index', '会员中心', '', 0, 1516015012, 1516015012, 9, 'normal'),
(8, 3, 'index/user/profile', '个人资料', '', 0, 1516015012, 1516015012, 4, 'normal'),
(9, 4, 'api/user/login', '登录', '', 0, 1515386247, 1515386247, 6, 'normal'),
(10, 4, 'api/user/register', '注册', '', 0, 1515386262, 1516015236, 8, 'normal'),
(11, 4, 'api/user/index', '会员中心', '', 0, 1516015012, 1516015012, 10, 'normal'),
(12, 4, 'api/user/profile', '个人资料', '', 0, 1516015012, 1516015012, 3, 'normal');

-- --------------------------------------------------------

--
-- 表的结构 `my_user_score_log`
--

CREATE TABLE `my_user_score_log` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL DEFAULT '0' COMMENT '会员ID',
  `score` int(10) NOT NULL DEFAULT '0' COMMENT '变更积分',
  `before` int(10) NOT NULL DEFAULT '0' COMMENT '变更前积分',
  `after` int(10) NOT NULL DEFAULT '0' COMMENT '变更后积分',
  `memo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '备注',
  `createtime` int(10) DEFAULT NULL COMMENT '创建时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会员积分变动表';

-- --------------------------------------------------------

--
-- 表的结构 `my_user_token`
--

CREATE TABLE `my_user_token` (
  `token` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Token',
  `user_id` int(10) UNSIGNED NOT NULL DEFAULT '0' COMMENT '会员ID',
  `createtime` int(10) DEFAULT NULL COMMENT '创建时间',
  `expiretime` int(10) DEFAULT NULL COMMENT '过期时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会员Token表';

--
-- 转存表中的数据 `my_user_token`
--

INSERT INTO `my_user_token` (`token`, `user_id`, `createtime`, `expiretime`) VALUES
('00fe402c700d11d9203c445764818df4c75c59dd', 7, 1597998945, 1600590945),
('0493246947b3eec37b7086f122ff9084d78bec53', 1, 1690246595, 1692838595),
('089e75021ea8f96c6943b39d7bc86ee01cbc6dfd', 3, 1597996957, 1600588957),
('0cf0322a96c0c6f12bbc4f1f76a91646b37e28e7', 5, 1597997814, 1600589814),
('0f4cac23c1b5c1f60346bf54c83125ff240cb9d1', 2, 1597999884, 1600591884),
('16fe0da1c8d5666a2c29b6f8faeed0f1829b10b0', 2, 1597996674, 1600588674),
('3a9e2f8ea764a4248c1a800a5ed1c28d438d93ba', 6, 1597998001, 1600590001),
('3a9fd9b042868753944e394db43bb92dd077f79a', 4, 1597997754, 1600589754),
('3aa69826557c5f825739274ef9327e559d04eaf0', 8, 1598008791, 1600600791),
('8d9a719a3567555760e7ccf9c8b073694e217de7', 8, 1598008890, 1600600890),
('a2218f4e0e78270627173754920992f84f55cf1d', 2, 1690248529, 1692840529),
('ae3933189293a835eb2b30fbc4c474ef5e549eeb', 1, 1690195602, 1692787602),
('c6008d2bac6ca6210c69920ab620234ccc1acac9', 1, 1690246610, 1692838610),
('d7c10f0670c0c108a9a1287b0c83660e2f5ae0f4', 8, 1598008669, 1600600669),
('f3af1cdcddd0f54f0ae9844a11e6d23193cbcef4', 8, 1598066722, 1600658722);

--
-- 转储表的索引
--

--
-- 表的索引 `my_admin`
--
ALTER TABLE `my_admin`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`) USING BTREE;

--
-- 表的索引 `my_admin_log`
--
ALTER TABLE `my_admin_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `name` (`username`);

--
-- 表的索引 `my_article_list`
--
ALTER TABLE `my_article_list`
  ADD PRIMARY KEY (`id`);

--
-- 表的索引 `my_attachment`
--
ALTER TABLE `my_attachment`
  ADD PRIMARY KEY (`id`);

--
-- 表的索引 `my_auth_group`
--
ALTER TABLE `my_auth_group`
  ADD PRIMARY KEY (`id`);

--
-- 表的索引 `my_auth_group_access`
--
ALTER TABLE `my_auth_group_access`
  ADD UNIQUE KEY `uid_group_id` (`uid`,`group_id`),
  ADD KEY `uid` (`uid`),
  ADD KEY `group_id` (`group_id`);

--
-- 表的索引 `my_auth_rule`
--
ALTER TABLE `my_auth_rule`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`) USING BTREE,
  ADD KEY `pid` (`pid`),
  ADD KEY `weigh` (`weigh`);

--
-- 表的索引 `my_category`
--
ALTER TABLE `my_category`
  ADD PRIMARY KEY (`id`),
  ADD KEY `weigh` (`weigh`,`id`),
  ADD KEY `pid` (`pid`);

--
-- 表的索引 `my_config`
--
ALTER TABLE `my_config`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- 表的索引 `my_contract_hash`
--
ALTER TABLE `my_contract_hash`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `hash` (`hash`),
  ADD KEY `types` (`types`),
  ADD KEY `block` (`block`);

--
-- 表的索引 `my_contract_rebate`
--
ALTER TABLE `my_contract_rebate`
  ADD PRIMARY KEY (`id`),
  ADD KEY `uid` (`uid`),
  ADD KEY `address` (`address`),
  ADD KEY `date` (`date`),
  ADD KEY `types` (`types`),
  ADD KEY `orderId` (`orderId`),
  ADD KEY `credittype` (`credittype`);

--
-- 表的索引 `my_contract_user`
--
ALTER TABLE `my_contract_user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uid` (`uid`),
  ADD UNIQUE KEY `address` (`address`);

--
-- 表的索引 `my_ems`
--
ALTER TABLE `my_ems`
  ADD PRIMARY KEY (`id`) USING BTREE;

--
-- 表的索引 `my_slide_list`
--
ALTER TABLE `my_slide_list`
  ADD PRIMARY KEY (`id`);

--
-- 表的索引 `my_sms`
--
ALTER TABLE `my_sms`
  ADD PRIMARY KEY (`id`);

--
-- 表的索引 `my_test`
--
ALTER TABLE `my_test`
  ADD PRIMARY KEY (`id`);

--
-- 表的索引 `my_user`
--
ALTER TABLE `my_user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `invite_code` (`invite_code`),
  ADD KEY `username` (`username`),
  ADD KEY `email` (`email`),
  ADD KEY `mobile` (`mobile`);

--
-- 表的索引 `my_user_group`
--
ALTER TABLE `my_user_group`
  ADD PRIMARY KEY (`id`);

--
-- 表的索引 `my_user_money_log`
--
ALTER TABLE `my_user_money_log`
  ADD PRIMARY KEY (`id`);

--
-- 表的索引 `my_user_relation`
--
ALTER TABLE `my_user_relation`
  ADD PRIMARY KEY (`id`),
  ADD KEY `uid` (`uid`),
  ADD KEY `pid` (`pid`);

--
-- 表的索引 `my_user_rule`
--
ALTER TABLE `my_user_rule`
  ADD PRIMARY KEY (`id`);

--
-- 表的索引 `my_user_score_log`
--
ALTER TABLE `my_user_score_log`
  ADD PRIMARY KEY (`id`);

--
-- 表的索引 `my_user_token`
--
ALTER TABLE `my_user_token`
  ADD PRIMARY KEY (`token`);

--
-- 在导出的表使用AUTO_INCREMENT
--

--
-- 使用表AUTO_INCREMENT `my_admin`
--
ALTER TABLE `my_admin`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID', AUTO_INCREMENT=3;

--
-- 使用表AUTO_INCREMENT `my_admin_log`
--
ALTER TABLE `my_admin_log`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID', AUTO_INCREMENT=119;

--
-- 使用表AUTO_INCREMENT `my_article_list`
--
ALTER TABLE `my_article_list`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- 使用表AUTO_INCREMENT `my_attachment`
--
ALTER TABLE `my_attachment`
  MODIFY `id` int(20) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID', AUTO_INCREMENT=11;

--
-- 使用表AUTO_INCREMENT `my_auth_group`
--
ALTER TABLE `my_auth_group`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- 使用表AUTO_INCREMENT `my_auth_rule`
--
ALTER TABLE `my_auth_rule`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=117;

--
-- 使用表AUTO_INCREMENT `my_category`
--
ALTER TABLE `my_category`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- 使用表AUTO_INCREMENT `my_config`
--
ALTER TABLE `my_config`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- 使用表AUTO_INCREMENT `my_contract_hash`
--
ALTER TABLE `my_contract_hash`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- 使用表AUTO_INCREMENT `my_contract_rebate`
--
ALTER TABLE `my_contract_rebate`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- 使用表AUTO_INCREMENT `my_contract_user`
--
ALTER TABLE `my_contract_user`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- 使用表AUTO_INCREMENT `my_ems`
--
ALTER TABLE `my_ems`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID', AUTO_INCREMENT=5;

--
-- 使用表AUTO_INCREMENT `my_slide_list`
--
ALTER TABLE `my_slide_list`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- 使用表AUTO_INCREMENT `my_sms`
--
ALTER TABLE `my_sms`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID', AUTO_INCREMENT=6;

--
-- 使用表AUTO_INCREMENT `my_test`
--
ALTER TABLE `my_test`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID', AUTO_INCREMENT=2;

--
-- 使用表AUTO_INCREMENT `my_user`
--
ALTER TABLE `my_user`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID', AUTO_INCREMENT=3;

--
-- 使用表AUTO_INCREMENT `my_user_group`
--
ALTER TABLE `my_user_group`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- 使用表AUTO_INCREMENT `my_user_money_log`
--
ALTER TABLE `my_user_money_log`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- 使用表AUTO_INCREMENT `my_user_relation`
--
ALTER TABLE `my_user_relation`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- 使用表AUTO_INCREMENT `my_user_rule`
--
ALTER TABLE `my_user_rule`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- 使用表AUTO_INCREMENT `my_user_score_log`
--
ALTER TABLE `my_user_score_log`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
