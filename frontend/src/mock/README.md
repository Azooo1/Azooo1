# 模拟数据

前端页面在 API 不可用或未登录时使用的模拟/默认数据。

| 文件 | 内容 |
|------|------|
| `live-activities.ts` | 首页实时动态种子数据 |
| `miner-metrics.ts` | 矿机算力/温度抖动逻辑 |
| `miner-terminal.ts` | 矿机终端日志模板 |
| `market-ticker.ts` | 行情条 fallback 与币种配色 |
| `miners-catalog.ts` | 首页/白皮书矿机目录 |
| `page-defaults.ts` | 闪兑、提币、C2C 默认配置 |

统一入口：`import { ... } from '../mock'` 或 `from '../mock/xxx'`。
