# NewsNow 项目开发总结

## 项目概述

NewsNow 是一个优雅的实时新闻聚合平台，基于 [ourongxing/newsnow](https://github.com/ourongxing/newsnow) 进行二次开发。本项目在原有功能基础上，新增了 **AI 智能摘要** 功能，利用智谱 GLM-4-Flash 大模型对新闻进行自动分类总结。

---

## 技术栈

### 前端
- **框架**: React 19 + TypeScript
- **路由**: TanStack Router
- **状态管理**: Jotai + TanStack Query
- **样式**: UnoCSS + Framer Motion
- **构建工具**: Vite 7

### 后端
- **运行时**: Nitro (Node.js)
- **数据库**: SQLite (better-sqlite3) / Cloudflare D1
- **AI 服务**: 智谱 GLM-4-Flash API
- **部署**: Docker / Cloudflare Pages

---

## 核心功能

### 1. 新闻聚合 (原有功能)
- 支持 30+ 新闻源（知乎、微博、V2EX、Hacker News 等）
- 实时热榜更新
- 自适应抓取间隔（2-30分钟）
- GitHub OAuth 登录与数据同步

### 2. AI 智能摘要 (新增功能)

#### 功能特性
- **四大分类**: 国内、国际、科技、财经
- **三个时段**: 早间 (00:00-08:00)、午间 (08:00-15:00)、晚间 (15:00-23:59)
- **自动生成**: 每天 07:00 / 12:00 / 19:00 定时生成
- **手动触发**: 支持通过 API 手动触发生成

#### 技术实现

**后端 API** (`server/api/summary/`)
| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/summary/latest` | GET | 获取最新摘要 |
| `/api/summary/list` | GET | 按分类+日期查询 |
| `/api/summary/detail` | GET | 获取详情（含新闻列表）|
| `/api/summary/tags` | GET | 获取所有标签 |
| `/api/summary/generate` | POST | 手动触发生成 |

**数据库设计** (`server/database/summary.ts`)
- `summaries` 表: 存储摘要元数据
- `news_items` 表: 存储原始新闻条目
- `tags` 表: 存储关键词标签

**AI 生成流程** (`server/summary/generate.ts`)
1. 获取指定分类的新闻列表
2. 构建 Prompt 并调用智谱 API
3. 解析 JSON 响应，提取标题、摘要、标签
4. 存储到数据库

**前端页面** (`src/routes/summary.tsx`)
- 分类 Tab 切换（国内/国际/科技/财经）
- 日期导航
- 摘要卡片展示
- 详情弹窗（含新闻列表）

---

## 项目结构

```
newsnow-main/
├── src/                    # 前端源码
│   ├── components/         # 组件
│   ├── routes/             # 路由页面
│   │   ├── summary.tsx     # 摘要页面 (新增)
│   │   └── ...
│   └── ...
├── server/                 # 后端源码
│   ├── api/                # API 接口
│   │   └── summary/        # 摘要 API (新增)
│   ├── database/           # 数据库
│   │   └── summary.ts      # 摘要数据表 (新增)
│   ├── summary/            # 摘要生成逻辑 (新增)
│   │   └── generate.ts
│   └── utils/
│       └── zhipu.ts        # 智谱 API 封装 (新增)
├── shared/                 # 共享代码
│   └── sources.json        # 新闻源配置
├── API.md                  # API 文档 (新增)
└── PROJECT_SUMMARY.md      # 本文档 (新增)
```

---

## 开发历程

| 提交 | 说明 |
|------|------|
| `61f8891` | 初始 fork，修复 HackerNews API，移除 Freebuf/ProductHunt |
| `2abe2f1` | 新增新闻摘要 API，集成智谱 GLM-4-Flash |
| `7594f0e` | 新增 AI 摘要页面，支持详情查看 |
| `a321dd5` | 修复摘要页导航，合并列表和详情为单路由 |

---

## 环境变量

```env
# 智谱 AI API Key (摘要功能必需)
ZHIPU_API_KEY=your_api_key

# GitHub OAuth (登录功能)
G_CLIENT_ID=
G_CLIENT_SECRET=
JWT_SECRET=

# 数据库
INIT_TABLE=true
ENABLE_CACHE=true
```

---

## 本地开发

```bash
# 安装依赖
corepack enable
pnpm i

# 配置环境变量
cp example.env.server .env.server
# 编辑 .env.server，填入 ZHIPU_API_KEY

# 启动开发服务器
pnpm dev
```

---

## 待优化项

1. **摘要缓存**: 增加前端缓存策略，减少 API 调用
2. **定时任务**: 完善定时任务调度，支持自定义时间
3. **多模型支持**: 接入更多 AI 模型（如 DeepSeek、GPT-4o）
4. **用户订阅**: 支持用户订阅特定分类的摘要推送
5. **历史归档**: 支持按月/年查看历史摘要

---

## 相关文档

- [README.md](./README.md) - 项目说明
- [API.md](./API.md) - API 接口文档
- [CONTRIBUTING.md](./CONTRIBUTING.md) - 贡献指南

---

*文档生成时间: 2026-05-28*
