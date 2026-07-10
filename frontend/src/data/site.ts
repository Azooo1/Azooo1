export const ASSET_BASE = 'https://hecminai.cloud'

import type { CSSProperties } from 'react'

export const THEME_STYLE = {
  '--theme-primary': '#10b981',
  '--theme-accent': '#2dd4bf',
  '--theme-glow': 'rgba(16, 185, 129, 0.5)',
  '--theme-glow-light': 'rgba(16, 185, 129, 0.2)',
  '--theme-gradient-from': '#10b981',
  '--theme-gradient-to': '#2dd4bf',
} as CSSProperties

export const PARTNERS = ['BITMAIN', 'FinCEN', 'Cloudflare', 'AWS', 'CertiK']

export const FEATURE_IMAGES = [
  { image: `${ASSET_BASE}/images/features/ai-hashrate.png`, reverse: false },
  { image: `${ASSET_BASE}/images/features/security.png`, reverse: true },
  { image: `${ASSET_BASE}/images/features/green-energy.png`, reverse: false },
]

export const FEATURES = [
  {
    title: 'AI 优化算力',
    description:
      '我们专有的 AURA 引擎持续分析网络状况，实时重新分配算力，全天候最大化您的挖矿收益。',
    stats: [
      { value: '32%', label: '高于手动配置' },
      { value: '<50ms', label: '重分配速度' },
    ],
    image: `${ASSET_BASE}/images/features/ai-hashrate.png`,
    reverse: false,
  },
  {
    title: '企业级安全',
    description:
      '多层安全架构，冷钱包存储、双重认证和实时异常检测。通过与领先加密保险商合作，资产保额高达 5000 万美元。',
    stats: [
      { value: '$5000万', label: '保险保额' },
      { value: '0', label: '安全事故' },
    ],
    image: `${ASSET_BASE}/images/features/security.png`,
    reverse: true,
  },
  {
    title: '100% 绿色能源挖矿',
    description:
      '所有数据中心均采用可再生能源供电——水电、太阳能和风电。碳中和运营已通过独立审计认证。',
    stats: [
      { value: '100%', label: '可再生能源' },
      { value: '6', label: '全球数据中心' },
    ],
    image: `${ASSET_BASE}/images/features/green-energy.png`,
    reverse: false,
  },
]

export const STEPS = [
  {
    num: '01',
    title: '注册账户',
    desc: '使用邮箱注册，设置安全密码，输入邀请码即可加入平台。',
    icon: 'user',
  },
  {
    num: '02',
    title: 'Web3钱包 USDC',
    desc: '连接您的 Web3 钱包，钱包持有 300 USDC 就可以免费申领一台 H21E 矿机。',
    icon: 'wallet',
  },
  {
    num: '03',
    title: '申请矿机',
    desc: '选择适合您预算的矿机套餐，开始获得每日挖矿收益。',
    icon: 'chip',
  },
]
