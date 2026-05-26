# NewsNow 摘要 API 接口文档

## 基础信息

- Base URL: `http://your-server:5173/api`
- 请求方式: GET / POST
- 数据格式: JSON

---

## 1. 获取最新摘要

获取最新一期各分类的新闻综述。

```
GET /api/summary/latest
```

**请求参数**：无

**响应示例**：
```json
{
  "updatedTime": 1716800000000,
  "summaries": [
    {
      "id": "tech_2026-05-27_morning",
      "columnId": "tech",
      "columnName": "科技",
      "date": "2026-05-27",
      "period": "morning",
      "title": "科技领域热点动态综述",
      "summary": "今日科技领域热点动态包括...",
      "tags": ["小米", "华为", "芯片"],
      "newsCount": 50,
      "updatedTime": 1716800000000
    }
  ]
}
```

**字段说明**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 摘要唯一ID，格式: `{columnId}_{date}_{period}` |
| `columnId` | string | 分类标识：`china`/`world`/`tech`/`finance` |
| `columnName` | string | 分类中文名 |
| `date` | string | 日期，格式: `YYYY-MM-DD` |
| `period` | string | 时段：`morning`/`noon`/`evening` |
| `title` | string | 综述标题 |
| `summary` | string | 综述正文（约300字） |
| `tags` | string[] | 关键标签数组 |
| `newsCount` | number | 涵盖的新闻条数 |
| `updatedTime` | number | 生成时间戳（毫秒） |

---

## 2. 按分类+日期查询摘要列表

```
GET /api/summary/list?column={columnId}&date={date}
```

**请求参数**：

| 参数 | 必填 | 说明 |
|------|------|------|
| `column` | 是 | 分类标识：`china`/`world`/`tech`/`finance` |
| `date` | 是 | 日期，格式：`YYYY-MM-DD` |

**请求示例**：
```
GET /api/summary/list?column=tech&date=2026-05-27
```

**响应示例**：
```json
{
  "columnId": "tech",
  "columnName": "科技",
  "date": "2026-05-27",
  "summaries": [
    {
      "id": "tech_2026-05-27_morning",
      "columnId": "tech",
      "columnName": "科技",
      "date": "2026-05-27",
      "period": "morning",
      "title": "科技领域热点动态综述",
      "summary": "...",
      "tags": ["小米", "华为"],
      "newsCount": 50,
      "updatedTime": 1716800000000
    }
  ]
}
```

---

## 3. 获取摘要详情（含新闻列表）

获取指定摘要的完整内容，包含所有原始新闻条目及原文链接。

```
GET /api/summary/detail?id={summaryId}
```

**请求参数**：

| 参数 | 必填 | 说明 |
|------|------|------|
| `id` | 是 | 摘要ID，如 `tech_2026-05-27_morning` |

**请求示例**：
```
GET /api/summary/detail?id=tech_2026-05-27_morning
```

**响应示例**：
```json
{
  "id": "tech_2026-05-27_morning",
  "columnId": "tech",
  "columnName": "科技",
  "date": "2026-05-27",
  "period": "morning",
  "title": "科技领域热点动态综述",
  "summary": "今日科技领域热点动态包括...",
  "tags": ["小米", "华为", "芯片"],
  "newsCount": 50,
  "updatedTime": 1716800000000,
  "newsItems": [
    {
      "id": "2042667657242076706",
      "title": "如何看待小米公布2026年第一财季财报",
      "url": "https://www.zhihu.com/question/xxx",
      "source": "zhihu",
      "sourceName": "知乎"
    },
    {
      "id": "71986424",
      "title": "小米集团2026年Q1业绩公布",
      "url": "https://www.coolapk.com/feed/71986424",
      "source": "coolapk",
      "sourceName": "酷安"
    }
  ]
}
```

**newsItems 字段说明**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 新闻原始ID |
| `title` | string | 新闻标题 |
| `url` | string | **原文链接**，可直接跳转 |
| `source` | string | 来源标识（如 `zhihu`、`weibo`） |
| `sourceName` | string | 来源中文名（如 `知乎`、`微博`） |

---

## 4. 获取所有标签

获取所有摘要中提取的关键标签及出现次数。

```
GET /api/summary/tags
```

**请求参数**：无

**响应示例**：
```json
{
  "tags": [
    { "name": "小米", "count": 5 },
    { "name": "AI", "count": 3 },
    { "name": "华为", "count": 2 }
  ]
}
```

---

## 5. 手动触发摘要生成

手动触发摘要生成（通常由定时任务自动调用）。

```
POST /api/summary/generate?columns={columns}&force={force}
```

**请求参数**：

| 参数 | 必填 | 说明 |
|------|------|------|
| `columns` | 否 | 指定分类，逗号分隔，如 `tech,finance`。不传则生成全部 |
| `force` | 否 | 是否强制覆盖已有摘要，默认 `false` |

**请求示例**：
```
POST /api/summary/generate?columns=tech&force=true
```

**响应示例**：
```json
{
  "success": true,
  "results": [
    "tech: success (50 items)"
  ]
}
```

---

## 分类对照表

| columnId | 中文名 | 包含的新闻源 |
|----------|--------|-------------|
| `china` | 国内 | 知乎、微博、酷安、抖音、虎扑、百度贴吧、今日头条、澎湃新闻、哔哩哔哩、百度热搜等 |
| `world` | 国际 | 联合早报、卫星通讯社、参考消息、靠谱新闻等 |
| `tech` | 科技 | V2EX、IT之家、远景论坛、Solidot、Hacker News、Github、少数派、稀土掘金等 |
| `finance` | 财经 | 华尔街见闻、36氪、财联社、雪球、格隆汇、法布财经、金十数据等 |

## 时段说明

| period | 时间范围 | 含义 |
|--------|----------|------|
| `morning` | 00:00 - 08:00 | 早间 |
| `noon` | 08:00 - 15:00 | 午间 |
| `evening` | 15:00 - 23:59 | 晚间 |

## 定时任务

摘要每天自动生成 3 次，时间分别为：
- 07:00（morning）
- 12:00（noon）
- 19:00（evening）

也可通过 `POST /api/summary/generate` 手动触发。
