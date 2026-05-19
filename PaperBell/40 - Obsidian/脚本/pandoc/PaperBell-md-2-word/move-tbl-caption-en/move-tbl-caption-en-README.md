---
tags:
  - Pandoc
  - Lua过滤器
  - PaperBell
created: 2026-05-19
---

# move-tbl-caption-en.lua — 表格英文标题上移过滤器

## 1 问题背景

在 Obsidian 中使用 Pandoc 导出 Word 时，表格双语标题的排版存在位置不一致的问题：

```
Markdown 源码中的写法：

| 数据... |
: 中文表题 {#tbl:id}                        ← Pandoc 原生表格标题

::: {custom-style="Table Caption EN"}       ← 自定义 div 块
Table [-@tbl:id] English caption
:::
```

**导出到 Word 后的实际效果：**

| 位置 | 内容 | 说明 |
|------|------|------|
| 表格上方 | 中文表题 | Pandoc 自动将原生标题提到上方 ✓ |
| 表格下方 | 英文表题 | div 块按文档流留在下方 ✗ |

而图片没有这个问题——因为 Pandoc 的图片标题本身就在下方，中英文标题方向一致。

## 2 解决方案

本 Lua 过滤器在 pandoc-crossref 处理完编号后执行，将中文标题从表格中提取出来，与英文标题一起按正确顺序放到表格上方。

### 过滤器执行流程

```
pandoc-crossref 处理后的 AST：
  Block N:   Table（含中文标题 "表 1: xxx"）
  Block N+1: Div "Table Caption EN"（英文标题）
       ↓
过滤器重排后：
  Block 1:   Div "Table Caption"（中文标题，独立段落）
  Block 2:   Div "Table Caption EN"（英文标题）
  Block 3:   Table（无原生标题）
```

### 导出效果（修复后）

| 位置 | 内容 | Word 样式 |
|------|------|-----------|
| 表格上方 | 表 1: 中文表题 | `TableCaption` |
| 表格上方 | Table 1 English caption | `TableCaptionEN` |
| 表格 | 数据行 | — |

## 3 文件信息

| 项目 | 内容 |
|------|------|
| **文件名** | `move-tbl-caption-en.lua` |
| **本库路径** | `0-辅助/IOTO/Pandoc/move-tbl-caption-en.lua` |
| **PaperBell 路径** | `4-成果/PaperBell/PaperBell-md-2-word/move-tbl-caption-en.lua` |
| **适用 Pandoc 版本** | 3.x（使用 `pandoc.Caption` 构造函数） |
| **依赖** | 必须在 pandoc-crossref 之后执行 |

## 4 在 Obsidian 插件中配置

### 4.1 使用 Obsidian Enhancing Export 插件

1. 打开 Obsidian → 设置 → Obsidian Enhancing Export
2. 找到 **Word (.docx)** 导出配置
3. 在 **Extra arguments**（自定义参数）中，确认过滤器按以下顺序排列：

```
--filter=".../pandoc-crossref" \
--lua-filter=".../zotero.lua" \
--lua-filter=".../move-tbl-caption-en.lua" \
--reference-doc=".../word模板-常规.docx" \
--lua-filter=".../replace-nbsp.lua" \
-M link-citations=true ...
```

> **关键：** `move-tbl-caption-en.lua` 必须在 `pandoc-crossref` 之后、`replace-nbsp.lua` 之前。顺序错误会导致编号未解析或位置不正确。

### 4.2 使用命令行导出

```bash
pandoc "输入.md" -f markdown -s -o "输出.docx" -t docx \
  --filter pandoc-crossref \
  --lua-filter zotero.lua \
  --lua-filter move-tbl-caption-en.lua \
  --lua-filter replace-nbsp.lua \
  --reference-doc=word模板-常规.docx \
  -M link-citations=true -M chapDelim=- \
  -M figureTitle=图 -M figPrefix=图
```

### 4.3 PaperBell 项目中的路径写法

在 PaperBell 的 Obsidian Enhancing Export 配置中，使用 `${pluginDir}` 变量定位文件：

```
--lua-filter="${pluginDir}/../../4-成果/PaperBell/PaperBell-md-2-word/move-tbl-caption-en.lua"
```

或使用库内统一路径：

```
--lua-filter="${pluginDir}/../../../0-辅助/IOTO/Pandoc/move-tbl-caption-en.lua"
```

## 5 Markdown 写法（不变）

本过滤器无需改变现有的表格写法，照常使用即可：

```markdown
| 盆地/地区 | 层位 | Ro 范围 (%) | TOC 范围 (%) |
| --------- | ---- | ----------- | ------------ |
| 松辽盆地  | 青山口组 | 0.49~0.63 | 0.85~14.80 |
: 页岩样品基本地球化学特征 {#tbl:sample-summary}

::: {custom-style="Table Caption EN"}
Table [-@tbl:sample-summary] Basic geochemical characteristics of shale samples.
:::
```

> **注意：** 只有带有 `custom-style="Table Caption EN"` 的 div 才会被移动。没有英文标题的表格完全不受影响。

## 6 常见问题

### Q: 过滤器报错 `attempt to call a nil value (field 'Caption')`

Pandoc 版本过低（< 3.0）。`pandoc.Caption` 构造函数需要 Pandoc 3.x。请升级 Pandoc。

### Q: 英文标题仍在表格下方

检查过滤器顺序——`move-tbl-caption-en.lua` 必须在 `--filter pandoc-crossref` 之后。如果顺序反了，pandoc-crossref 尚未分配编号，过滤器无法正确工作。

### Q: 没有 `TableCaptionEN` 样式

确认 Word 模板（`word模板-常规.docx`）中已创建名为 `Table Caption EN` 的段落样式。如果模板中没有该样式，Pandoc 会创建一个默认样式（等于没有格式）。参见 [[0-辅助/IOTO/Pandoc/Pandoc导出Word样式控制指南]] 了解如何创建。
