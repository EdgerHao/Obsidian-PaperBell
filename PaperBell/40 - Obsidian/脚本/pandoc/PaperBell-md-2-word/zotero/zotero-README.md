---
tags:
  - Pandoc
  - Lua过滤器
  - PaperBell
  - Zotero
created: 2026-05-19
---

# zotero.lua — Zotero Better BibTeX 实时引用过滤器

## 1 功能说明

本过滤器是 **Zotero Better BibTeX (BBT)** 插件的官方 Pandoc 集成组件，用于将 Markdown 中的 `[@citekey]` 引用转换为 Word 中可刷新的 Zotero 字段。

### 核心功能

| 功能 | 说明 |
|------|------|
| **实时引用替换** | 将 `[@citekey]` 转换为 Word 中的 Zotero 字段（`ADDIN ZOTERO_ITEM`） |
| **本地 Zotero 通信** | 通过 JSON-RPC 调用本地 Zotero（端口 23119）获取文献元数据 |
| **CSL 样式支持** | 支持 APA、国标等多种 CSL 引用格式 |
| **文献类型识别** | 自动区分作者-年份引用和括号引用 |

### 引用转换示例

```markdown
Markdown 源码：
已有研究证实 [@Smith2023; @Wang2022]
@Smith2023 指出...

Word 中转换结果：
已有研究证实 <Zotero Field: (Smith, 2023; Wang, 2022)>
Smith (2023) 指出...
```

在 Word 中打开后，Zotero 插件可以**刷新**这些字段，自动更新引用编号和参考文献列表。

## 2 文件信息

| 项目 | 内容 |
|------|------|
| **文件名** | `zotero.lua` |
| **来源** | Zotero Better BibTeX 官方自动生成 |
| **本库路径** | `0-辅助/IOTO/Pandoc/zotero.lua` |
| **PaperBell 路径** | `4-成果/PaperBell/PaperBell-md-2-word/zotero/zotero.lua` |
| **适用 Pandoc 版本** | ≥ 2.16.2（需要 `lpeg` 库） |
| **依赖** | 本地 Zotero + Better BibTeX 插件需运行中 |

## 3 前置条件

### 3.1 必须安装的软件

1. **Zotero** 桌面端，且运行中
2. **Better BibTeX 插件** — 自动生成规范 citekey
3. Zotero 中需已导入被引用的文献条目

### 3.2 Zotero 配置

| 配置项 | 值 |
|--------|------|
| **User ID** | 16057575 |
| **API Key** | Ni28zHVEFbIzFCa34cwzhXz8 |
| **BBT JSON-RPC 端点** | `http://localhost:23119/better-bibtex/json-rpc` |
| **citekey 生成规则** | `auth_年份_标题前N词`（BBT 自动管理） |

## 4 在 Obsidian 插件中配置

### 4.1 使用 Obsidian Enhancing Export 插件

1. 打开 Obsidian → 设置 → Obsidian Enhancing Export
2. 找到 **Word (.docx)** 导出配置
3. 在 **Extra arguments** 中添加：

```
--lua-filter="${pluginDir}/../../../4-成果/PaperBell/PaperBell-md-2-word/zotero/zotero.lua"
```

> **位置：** 放在 `pandoc-crossref` 之后、其他 Lua 过滤器之前。

### 4.2 使用命令行导出

```bash
pandoc "输入.md" -f markdown -s -o "输出.docx" -t docx \
  --filter pandoc-crossref \
  --lua-filter zotero.lua \
  --lua-filter move-tbl-caption-en.lua \
  --lua-filter replace-nbsp.lua \
  --reference-doc=word模板-常规.docx
```

### 4.3 版本更新

`zotero.lua` 由 Better BibTeX 自动生成并维护。更新方式：

1. 打开 Zotero → 编辑 → 首选项 → Better BibTeX
2. 找到 Pandoc 集成设置
3. 下载最新的 `zotero.lua` 覆盖本文件

过滤器内部会检查版本号，导出时若控制台出现 `new version available` 提示，即需更新。

## 5 注意事项

- **Zotero 必须运行**：导出时若 Zotero 未启动，引用将无法转换为 Zotero 字段，输出会保留原始 `[@citekey]` 形式
- **不与 `--citeproc` 同时使用**：`zotero.lua` 和 `--citeproc` 是两种不同的引用处理方式，不应同时启用
- **文件较大**（约 57KB）：包含完整的 JSON 解析器和 Zotero 通信逻辑，这是正常的
- **不要手动编辑**此文件，它是自动生成的第三方工具

## 6 常见问题

### Q: 导出时报错 `upgrade pandoc to version 2.16.2 or later`

Pandoc 版本过低，需要升级到 2.16.2 以上。当前本库使用 Pandoc 3.9，满足要求。

### Q: 导出的 Word 中引用显示为 `<Do Zotero Refresh: [@citekey]>`

Zotero 未运行或 Better BibTeX 插件未安装。打开 Zotero 后重新导出即可。

### Q: 某些引用未能转换

检查 Zotero 中是否存在对应的 citekey 条目。可在 Zotero 中搜索 citekey 确认。
