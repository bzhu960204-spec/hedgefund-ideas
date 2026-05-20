# HedgeFund Ideas Management

个人对冲基金投资信 / 研究文档管理系统。上传 PDF → 关联公司与投资观点 → 按公司检索汇总。

---

## 快速启动

```powershell
# 启动前后端（端口自动查找，默认 8081 / 5173）
.\start-dev.ps1

# 停止所有服务
.\stop-dev.ps1
```

浏览器打开 [http://localhost:5173](http://localhost:5173)

---

## JSON 批量导入观点 (Ideas Import)

在文档详情页 (Document Detail) 右侧面板，点击 **⬇ Import JSON** 按钮，粘贴以下格式的 JSON 数组即可批量创建观点。

### 接口

```
POST /api/ideas/import?documentId={id}
Content-Type: application/json
```

### JSON 格式

```json
[
  {
    "companyTicker": "META",
    "companyName": "Meta Platforms",
    "action": "BUY",
    "summary": "Trading below intrinsic value with strong FCF generation.",
    "thesis": "Meta is currently trading at 18x forward earnings while generating $50B+ in annual FCF. The Reality Labs losses are masking the core business strength. Instagram Reels monetization is inflecting upward, and AI-driven ad targeting improvements post-ATT are restoring ROAS for advertisers. The company has a clear path to $20+ EPS by 2027.",
    "confidence": "HIGH"
  },
  {
    "companyTicker": "GOOGL",
    "companyName": "Alphabet",
    "action": "MONITOR",
    "summary": "AI integration may drive search monetisation improvement.",
    "thesis": "Google's AI Overviews are increasing search engagement rather than cannibalizing ad clicks. Cloud segment approaching profitability inflection. Main risk is regulatory overhang from DOJ antitrust case. Position sizing should wait for clarity on remedies.",
    "confidence": "MEDIUM"
  }
]
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `action` | string | **是** | 操作方向：`BUY` / `SELL` / `HOLD` / `MONITOR` / `NONE` |
| `companyTicker` | string | 三选一* | 股票代码（大小写不敏感），优先匹配已有公司 |
| `companyName` | string | 三选一* | 公司全名，当 ticker 未在数据库中找到时用于自动创建 |
| `companyId` | number | 三选一* | 直接指定数据库中已有公司的 ID |
| `summary` | string | 否 | 一句话摘要（最长 2000 字符） |
| `thesis` | string | 否 | 完整投资论点 / 文档原文内容（不限长度，CLOB） |
| `confidence` | string | 否 | 置信度：`HIGH` / `MEDIUM` / `LOW` |

> **三选一\*** — `companyTicker`、`companyName`、`companyId` 至少提供其中一个。
>
> **公司自动创建规则：**
> 1. 若提供 `companyId` → 直接使用该公司，不存在则报错
> 2. 若提供 `companyTicker` → 按 ticker 查找，找不到则用 `companyTicker` + `companyName` 自动创建新公司
> 3. 若只提供 `companyName` → 直接创建新公司（不查重）

### 完整示例（含所有可选字段）

```json
[
  {
    "companyTicker": "NKE",
    "companyName": "Nike",
    "action": "BUY",
    "summary": "Brand moat intact; short-term margin pressure priced in. Direct-to-consumer shift accelerating.",
    "confidence": "HIGH"
  },
  {
    "companyTicker": "SBUX",
    "companyName": "Starbucks",
    "action": "MONITOR",
    "summary": "Turnaround thesis under new CEO. Watch same-store sales recovery in China.",
    "confidence": "MEDIUM"
  },
  {
    "companyId": 3,
    "action": "SELL",
    "summary": "Valuation stretched; no margin of safety at current price.",
    "confidence": "HIGH"
  },
  {
    "companyName": "Unlisted Private Co",
    "action": "HOLD",
    "confidence": "LOW"
  }
]
```

### 返回值

成功时返回导入的观点列表（HTTP 200）：

```json
[
  {
    "id": 10,
    "documentId": 2,
    "documentTitle": "2026Q1 - Oakmark Fund",
    "companyId": 5,
    "companyName": "Nike",
    "companyTicker": "NKE",
    "action": "BUY",
    "summary": "Brand moat intact...",
    "confidence": "HIGH",
    "createdAt": "2026-05-20T11:00:00"
  }
]
```

失败时返回 HTTP 400：

```json
{ "error": "Each idea must provide companyId, companyTicker, or companyName" }
```

---

## 数据模型

```
Document  ──< Idea >──  Company
(PDF文档)   (观点/操作)   (上市/非上市公司)
```

| 实体 | 核心字段 |
|------|---------|
| **Document** | title, source(基金名), period(如2026Q1), fileName, uploadTime, notes |
| **Company** | name, ticker, sector, description |
| **Idea** | action, summary, thesis, confidence, createdAt；关联 Document + Company |

---

## 技术栈

| 层 | 技术 |
|----|------|
| 后端 | Spring Boot 3.2.5 · Java 17 · Spring Data JPA |
| 数据库 | H2 文件模式（`./data/hedgefund`，持久化） |
| PDF 存储 | 本地文件系统（`./uploads/`） |
| 前端 | React 18 · Vite 5 · TypeScript · 纯 CSS 主题 |
| 主题 | Material Design / Ant Design Pro（侧边栏底部切换） |

---

## H2 数据库控制台

开发时可访问 [http://localhost:8081/h2-console](http://localhost:8081/h2-console)

- JDBC URL: `jdbc:h2:file:./data/hedgefund`
- 用户名: `sa`，密码为空
