import { ASSET_BASE } from '../data/site'

export const MINERS_CATALOG = [
  {
    id: '1',
    name: 'H21E',
    price: 300,
    dailyOutput: '13 HEC',
    dailyEarnings: '$3.51',
    monthlyEarnings: '$105.30',
    validity: '30天',
    image: `${ASSET_BASE}/images/miners/h21e.png`,
  },
  {
    id: '2',
    name: 'E21e',
    price: 5000,
    dailyOutput: '240 HEC',
    dailyEarnings: '$64.80',
    monthlyEarnings: '$1,944.00',
    validity: '30天',
    image: `${ASSET_BASE}/images/miners/e21e.png`,
  },
  {
    id: '3',
    name: 'C15 Pro',
    price: 30000,
    dailyOutput: '1,500 HEC',
    dailyEarnings: '$405.00',
    monthlyEarnings: '$12,150.00',
    validity: '30天',
    image: `${ASSET_BASE}/images/miners/c15-pro.png`,
  },
] as const

/** @deprecated 使用 MINERS_CATALOG */
export const MINERS = MINERS_CATALOG
