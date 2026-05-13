# PaperBell + Quartz 代码百科

> 本文档详细描述了 PaperBell 项目的技术架构、核心模块、关键组件及运行方式。PaperBell 是一个基于 Quartz 静态网站生成器的学术笔记管理系统，集成 Obsidian 笔记工具，支持将 Markdown 笔记转换为静态网站。

---

## 目录

1. [项目概述](#1-项目概述)
2. [整体架构](#2-整体架构)
3. [核心模块详解](#3-核心模块详解)
4. [关键类和函数说明](#4-关键类和函数说明)
5. [插件系统](#5-插件系统)
6. [依赖关系](#6-依赖关系)
7. [项目运行方式](#7-项目运行方式)
8. [配置文件说明](#8-配置文件说明)

---

## 1. 项目概述

### 1.1 项目简介

- **项目名称**: PaperBell
- **技术栈**: Quartz 4.x (基于 Node.js 的静态网站生成器)
- **主要功能**: 将 Obsidian 笔记库转换为静态学术网站
- **Node 版本要求**: >= 20
- **NPM 版本要求**: >= 9.3.1

### 1.2 项目结构

```
/workspace/
├── quartz/                      # Quartz 核心框架
│   ├── cli/                    # 命令行工具
│   ├── components/             # React 组件
│   ├── i18n/                   # 国际化
│   ├── plugins/                # 插件系统 (transformers/filters/emitters)
│   ├── processors/             # 内容处理管道
│   ├── static/                 # 静态资源
│   ├── styles/                 # 样式文件
│   ├── util/                   # 工具函数
│   ├── bootstrap-cli.mjs       # CLI 入口
│   ├── build.ts                # 构建逻辑
│   └── cfg.ts                  # 配置类型定义
├── PaperBell/                   # Obsidian 笔记库内容
│   ├── 00 - Obsidian/          # Obsidian 配置和脚本
│   ├── Cards/                  # 卡片笔记
│   ├── Inputs/                 # 输入笔记
│   ├── Outputs/                # 输出文档
│   ├── Locations/              # 位置信息
│   └── Persons/                # 人员信息
├── quartz.config.ts             # Quartz 主配置
├── quartz.layout.ts             # 页面布局配置
└── package.json                # 项目依赖
```

---

## 2. 整体架构

### 2.1 架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户操作层                                 │
│   (npx quartz build / quartz dev / quartz sync)                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       CLI 入口层 (bootstrap-cli.mjs)            │
│   - 参数解析 (yargs)                                            │
│   - 命令路由                                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      构建管道 (build.ts)                         │
│                                                                   │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   │
│  │  Glob    │──▶│  Parse   │──▶│  Filter  │──▶│  Emit    │   │
│  │  文件扫描 │   │  解析转换 │   │  内容过滤 │   │  生成输出 │   │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       插件系统层                                 │
│                                                                   │
│  ┌─────────────────┐                                             │
│  │   Transformers  │ ── Markdown → HTML 转换                    │
│  │   (13个插件)     │ ── 链接处理、语法高亮、目录生成等            │
│  └─────────────────┘                                             │
│  ┌─────────────────┐                                             │
│  │     Filters     │ ── 过滤不需要发布的内容                      │
│  │   (2个插件)      │ ── 草稿过滤、显式发布控制                    │
│  └─────────────────┘                                             │
│  ┌─────────────────┐                                             │
│  │    Emitters     │ ── 生成输出文件                             │
│  │   (10个插件)     │ ── HTML页面、资源文件、sitemap等            │
│  └─────────────────┘                                             │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 构建流程

1. **Glob 阶段**: 扫描源目录中的所有 Markdown 文件
2. **Parse 阶段**: 使用 unified/remark/rehype 管道解析 Markdown
3. **Filter 阶段**: 过滤掉不需要发布的内容（如草稿）
4. **Emit 阶段**: 使用 React 组件渲染并输出静态文件

---

## 3. 核心模块详解

### 3.1 处理器模块 (`quartz/processors/`)

#### 3.1.1 parse.ts - 解析器

**功能**: 负责将 Markdown 文件解析为 HTML AST

**关键函数**:

| 函数名 | 职责 | 参数 | 返回值 |
|--------|------|------|--------|
| `createMdProcessor()` | 创建 Markdown 处理器 | `ctx: BuildCtx` | `QuartzMdProcessor` |
| `createHtmlProcessor()` | 创建 HTML 处理器 | `ctx: BuildCtx` | `QuartzHtmlProcessor` |
| `createFileParser()` | 创建文件解析器 | `ctx: BuildCtx, fps: FilePath[]` | 异步解析函数 |
| `parseMarkdown()` | 主解析入口 | `ctx: BuildCtx, fps: FilePath[]` | `ProcessedContent[]` |

**处理流程**:
```
Markdown → remark-parse → MD AST → [Transformers] → HTML AST → rehype → HTML
```

#### 3.1.2 filter.ts - 过滤器

**功能**: 过滤不需要发布的内容

**关键函数**:

```typescript
function filterContent(ctx: BuildCtx, content: ProcessedContent[]): ProcessedContent[]
```

**处理逻辑**:
- 遍历所有过滤器插件
- 每个过滤器调用 `shouldPublish()` 方法决定内容是否保留
- 返回过滤后的内容数组

#### 3.1.3 emit.ts - 发射器

**功能**: 调用所有 emitter 插件生成输出文件

**关键函数**:

```typescript
async function emitContent(ctx: BuildCtx, content: ProcessedContent[]): Promise<void>
```

### 3.2 构建模块 (`quartz/build.ts`)

**功能**: 核心构建逻辑，包含完整构建和热更新构建

**关键类型**:

```typescript
type BuildData = {
  ctx: BuildCtx                    // 构建上下文
  ignored: GlobbyFilterFunction    // Git 忽略过滤器
  mut: Mutex                       // 互斥锁
  contentMap: Map<FilePath, ProcessedContent>  // 内容缓存
  dependencies: Dependencies        // 依赖图
  // ...
}
```

**关键函数**:

| 函数名 | 职责 |
|--------|------|
| `buildQuartz()` | 执行完整构建 |
| `startServing()` | 启动热更新服务器 |
| `partialRebuildFromEntrypoint()` | 快速增量构建 |
| `rebuildFromEntrypoint()` | 全量增量构建 |

### 3.3 组件模块 (`quartz/components/`)

**功能**: 提供 React 组件用于页面渲染

**主要组件**:

| 组件名 | 文件 | 用途 |
|--------|------|------|
| `Content` | pages/Content.tsx | 主内容区域 |
| `Head` | Head.tsx | HTML head 标签 |
| `Header` | Header.tsx | 页头 |
| `Footer` | Footer.tsx | 页脚 |
| `Explorer` | Explorer.tsx | 文件浏览器 |
| `Search` | Search.tsx | 搜索框 |
| `Graph` | Graph.tsx | 知识图谱 |
| `TableOfContents` | TableOfContents.tsx | 目录 |
| `Backlinks` | Backlinks.tsx | 反向链接 |
| `Breadcrumbs` | Breadcrumbs.tsx | 面包屑导航 |
| `Darkmode` | Darkmode.tsx | 暗色模式切换 |
| `TagList` | TagList.tsx | 标签列表 |
| `ContentMeta` | ContentMeta.tsx | 内容元数据 |

### 3.4 工具模块 (`quartz/util/`)

#### 3.4.1 path.ts - 路径处理

**Slug 类型系统**:

```typescript
export type FilePath    // 文件路径（绝对，包含扩展名）
export type FullSlug    // 完整 slug（无相对路径）
export type SimpleSlug  // 简化 slug
export type RelativeURL // 相对 URL
```

**关键函数**:

| 函数名 | 职责 |
|--------|------|
| `slugifyFilePath()` | 将文件路径转换为 slug |
| `simplifySlug()` | 简化为简单 slug |
| `transformInternalLink()` | 转换内部链接 |
| `pathToRoot()` | 计算到根目录的相对路径 |
| `resolveRelative()` | 解析相对路径 |
| `normalizeRelativeURLs()` | 规范化相对 URL |

#### 3.4.2 ctx.ts - 构建上下文

```typescript
export interface BuildCtx {
  buildId: string           // 构建 ID（用于热更新）
  argv: Argv                // 命令行参数
  cfg: QuartzConfig         // 用户配置
  allSlugs: FullSlug[]      // 所有 slug 列表
}
```

#### 3.4.3 其他工具

| 文件 | 用途 |
|------|------|
| `perf.ts` | 性能计时器 |
| `log.ts` | 日志工具 |
| `trace.ts` | 错误追踪 |
| `glob.ts` | 文件匹配 |
| `jsx.tsx` | JSX 工厂 |
| `resources.tsx` | 资源管理 |

---

## 4. 关键类和函数说明

### 4.1 插件类型定义 (`quartz/plugins/types.ts`)

#### Transformer Plugin

```typescript
export type QuartzTransformerPluginInstance = {
  name: string
  textTransform?: (ctx: BuildCtx, src: string | Buffer) => string | Buffer  // 文本转换
  markdownPlugins?: (ctx: BuildCtx) => PluggableList                          // Markdown 插件
  htmlPlugins?: (ctx: BuildCtx) => PluggableList                            // HTML 插件
  externalResources?: (ctx: BuildCtx) => Partial<StaticResources>           // 外部资源
}
```

#### Filter Plugin

```typescript
export type QuartzFilterPluginInstance = {
  name: string
  shouldPublish(ctx: BuildCtx, content: ProcessedContent): boolean
}
```

#### Emitter Plugin

```typescript
export type QuartzEmitterPluginInstance = {
  name: string
  emit(ctx: BuildCtx, content: ProcessedContent[], resources: StaticResources): Promise<FilePath[]>
  getQuartzComponents(ctx: BuildCtx): QuartzComponent[]
  getDependencyGraph?(ctx: BuildCtx, content: ProcessedContent[], resources: StaticResources): Promise<DepGraph<FilePath>>
}
```

### 4.2 核心类: DepGraph (`quartz/depgraph.ts`)

**功能**: 依赖图管理，用于增量构建时的文件依赖追踪

**主要方法**:

```typescript
class DepGraph<T> {
  addNode(node: T): void
  addEdge(src: T, dst: T): void
  hasNode(node: T): boolean
  getLeafNodeAncestors(node: T): T[]
  mergeGraph(graph: DepGraph<T>): void
  updateIncomingEdgesForNode(graph: DepGraph<T>, node: T): void
  removeNode(node: T): void
  removeOrphanNodes(): T[]
}
```

### 4.3 VFile 数据结构 (`quartz/plugins/vfile.ts`)

```typescript
export type MarkdownContent = [MDRoot, VFile]
export type ProcessedContent = [HTMLRoot, VFile]

declare module "vfile" {
  interface DataMap {
    slug: FullSlug
    filePath: FilePath
    relativePath: FilePath
    frontmatter: Frontmatter
  }
}
```

---

## 5. 插件系统

### 5.1 Transformers (13个)

| 插件 | 文件 | 功能 |
|------|------|------|
| `FrontMatter` | frontmatter.ts | 解析 YAML/TOML frontmatter |
| `CreatedModifiedDate` | lastmod.ts | 提取创建/修改日期 |
| `SyntaxHighlighting` | syntax.ts | 代码语法高亮 |
| `ObsidianFlavoredMarkdown` | ofm.ts | Obsidian 扩展语法 |
| `GitHubFlavoredMarkdown` | gfm.ts | GitHub 扩展语法 |
| `TableOfContents` | toc.ts | 生成目录 |
| `CrawlLinks` | links.ts | 链接爬取和转换 |
| `Description` | description.ts | 生成页面描述 |
| `Latex` | latex.ts | LaTeX 数学公式 |
| `Citations` | citations.ts | 引用处理 |
| `HardLineBreaks` | linebreaks.ts | 硬换行 |
| `OxHugoFlavoredMarkdown` | oxhugofm.ts | Ox-Hugo 兼容 |
| `RoamFlavoredMarkdown` | roam.ts | Roam Research 兼容 |

### 5.2 Filters (2个)

| 插件 | 文件 | 功能 |
|------|------|------|
| `RemoveDrafts` | draft.ts | 移除草稿文件 |
| `ExplicitPublish` | explicit.ts | 基于 publish 字段过滤 |

### 5.3 Emitters (10个)

| 插件 | 文件 | 功能 |
|------|------|------|
| `ContentPage` | contentPage.tsx | 生成内容页面 HTML |
| `TagPage` | tagPage.tsx | 生成标签页面 |
| `FolderPage` | folderPage.tsx | 生成文件夹页面 |
| `ContentIndex` | contentIndex.ts | 生成搜索索引 |
| `AliasRedirects` | aliases.ts | 别名重定向 |
| `Assets` | assets.ts | 复制静态资源 |
| `Static` | static.ts | 复制静态文件 |
| `ComponentResources` | componentResources.ts | 组件资源 |
| `NotFoundPage` | 404.tsx | 404 页面 |
| `CNAME` | cname.ts | CNAME 文件 |

### 5.4 自定义插件示例

```typescript
// 创建自定义 Transformer
import { QuartzTransformerPlugin } from "./types"

export const MyCustomTransformer: QuartzTransformerPlugin = (opts) => {
  return {
    name: "MyCustomTransformer",
    markdownPlugins(ctx) {
      return [
        // remark 插件
      ]
    },
    htmlPlugins(ctx) {
      return [
        // rehype 插件
      ]
    }
  }
}
```

---

## 6. 依赖关系

### 6.1 主要依赖

| 依赖包 | 版本 | 用途 |
|--------|------|------|
| `unified` | ^11.0.5 | 统一处理管道 |
| `remark-parse` | ^11.0.0 | Markdown 解析 |
| `remark-rehype` | ^11.1.2 | Markdown → HTML 转换 |
| `rehype-*` | 各版本 | HTML 转换插件 |
| `preact` | ^10.29.1 | UI 组件渲染 |
| `d3` | ^7.9.0 | 知识图谱可视化 |
| `flexsearch` | 0.8.212 | 搜索功能 |
| `chokidar` | ^5.0.0 | 文件监听 |
| `gray-matter` | ^4.0.3 | Frontmatter 解析 |
| `esbuild` | ^0.28.0 | 代码打包 |
| `sharp` | ^0.34.5 | 图片处理 |
| `satori` | ^0.26.0 | JSX → SVG 转换 |

### 6.2 依赖图

```
unified
├── remark-parse
├── remark-rehype
│   └── rehype-stringify
├── remark-gfm
├── remark-math
├── remark-frontmatter
└── remark-* (其他插件)

preact
├── preact-render-to-string
└── @floating-ui/dom

d3
└── pixi.js (知识图谱渲染)

gray-matter
├── js-yaml
└── toml
```

---

## 7. 项目运行方式

### 7.1 环境准备

```bash
# Node.js >= 20
node --version

# 安装依赖
npm install
```

### 7.2 常用命令

```bash
# 构建静态网站
npx quartz build

# 开发模式（热更新）
npx quartz dev

# 指定输出目录
npx quartz build -o dist

# 指定内容目录
npx quartz build -d my-content

# 详细输出
npx quartz build -v

# 类型检查
npm run check

# 代码格式化
npm run format

# 运行测试
npm run test
```

### 7.3 Docker 部署

```bash
# 构建 Docker 镜像
docker build -t paperbell .

# 运行容器
docker run -p 8080:8080 paperbell
```

### 7.4 Vercel 部署

项目已配置 `vercel.json`，可直接部署到 Vercel：

```bash
vercel deploy
```

---

## 8. 配置文件说明

### 8.1 quartz.config.ts

```typescript
const config: QuartzConfig = {
  configuration: {
    pageTitle: "PaperBell",           // 页面标题
    enableSPA: true,                   // 单页应用模式
    enablePopovers: true,              // 悬停预览
    baseUrl: "paperbell.cn",          // 基础 URL
    ignorePatterns: ["private", "templates", ".obsidian"],  // 忽略目录
    defaultDateType: "created",       // 默认日期类型
    generateSocialImages: false,      // 生成社交图片
    theme: {
      typography: {
        header: "Schibsted Grotesk",
        body: "Source Sans Pro",
        code: "IBM Plex Mono",
      },
      colors: { /* 颜色配置 */ }
    }
  },
  plugins: {
    transformers: [ /* 转换器插件 */ ],
    filters: [ /* 过滤器插件 */ ],
    emitters: [ /* 发射器插件 */ ]
  }
}
```

### 8.2 quartz.layout.ts

```typescript
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  footer: Component.Footer({ /* 页脚链接 */ })
}

export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.Breadcrumbs(),
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.TagList(),
  ],
  left: [
    Component.Explorer(),
    Component.Search(),
    Component.Darkmode(),
  ],
  right: [
    Component.Graph(),
    Component.TableOfContents(),
    Component.Backlinks(),
  ]
}
```

### 8.3 环境变量

参考 `.env.example`：

```bash
# 可用的分析提供商
QUARTZ_ANALYTICS_PROVIDER=plausible

# 其他配置...
```

---

## 附录

### A. 文件路径别名

| 别名 | 实际路径 | 用途 |
|------|----------|------|
| `QUARTZ` | `"quartz"` | Quartz 目录常量 |

### B. Frontmatter 字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `title` | string | 页面标题 |
| `tags` | string[] | 标签 |
| `aliases` | string[] | 别名 |
| `created` | date | 创建日期 |
| `modified` | date | 修改日期 |
| `publish` | boolean | 是否发布 |
| `draft` | boolean | 是否草稿 |
| `description` | string | 页面描述 |
| `cssclasses` | string[] | CSS 类名 |

### C. 性能优化

1. **增量构建**: 使用 `--fastRebuild` 启用依赖图追踪
2. **并发处理**: 根据文件数量自动调整工作线程数
3. **缓存**: 内容解析结果会被缓存用于热更新

---

*文档生成时间: 2025年*
*基于 Quartz v4.5.8*
