---
tags:
  - Pandoc
  - Lua过滤器
  - PaperBell
created: 2026-05-19
---

# bib-style.lua — 参考文献悬挂缩进样式过滤器

## 1 问题背景

使用 Pandoc + `--citeproc` 导出 Word 时，生成的参考文献条目被包裹在 `csl-entry` 类的 Div 中。Pandoc 不会自动将这些条目映射到 Word 的 `Bibliography` 样式，导致：

- 参考文献条目使用默认正文样式，无悬挂缩进
- 每条文献第二行起与首行齐平，不符合学术排版规范
- 需要在 Word 中手动调整样式

### 期望效果

```
[1]  Smith J, Wang L. Effects of organic matter on shale
     wettability. Energy & Fuels. 2023;37(5):1234-1245.
     ↑ 悬挂缩进 2 字符
```

## 2 解决方案

本过滤器检测 `csl-entry` 类的 Div 元素，为其添加 `custom-style="Bibliography"` 属性。配合 Word 模板中已定义的 `Bibliography` 样式（含悬挂缩进），实现自动排版。

### 过滤器源码

```lua
function Div(el)
  if el.classes:includes("csl-entry") then
    el.attributes["custom-style"] = "Bibliography"
    return el
  end
end
```

### 处理流程

```
--citeproc 生成的 AST：
  Div.csl-entry → "Smith J, Wang L..."
       ↓
过滤器处理后：
  Div.csl-entry[custom-style="Bibliography"] → "Smith J, Wang L..."
       ↓
Word 渲染：
  使用 "Bibliography" 样式（已含悬挂缩进）
```

## 3 文件信息

| 项目 | 内容 |
|------|------|
| **文件名** | `bib-style.lua` |
| **本库路径** | `0-辅助/IOTO/Pandoc/bib-style.lua` |
| **PaperBell 路径** | `4-成果/PaperBell/PaperBell-md-2-word/bib-style/bib-style.lua` |
| **适用 Pandoc 版本** | 任意版本 |
| **依赖** | 需配合 `--citeproc` 使用；需 Word 模板中有 `Bibliography` 样式 |

## 4 在 Obsidian 插件中配置

### 4.1 使用 Obsidian Enhancing Export 插件

1. 打开 Obsidian → 设置 → Obsidian Enhancing Export
2. 找到 **Word (.docx)** 导出配置
3. 在 **Extra arguments** 中添加：

```
--lua-filter="${pluginDir}/../../../4-成果/PaperBell/PaperBell-md-2-word/bib-style/bib-style.lua"
```

4. 同时需要启用 `--citeproc` 并指定 `.bib` 文件：

```
--citeproc --bibliography="${pluginDir}/../../../0-辅助/IOTO/Pandoc/我的文库/我的文库.bib"
```

> **注意：** 本过滤器与 `zotero.lua` 是两种不同的引用处理方式，**不应同时使用**：
> - `zotero.lua`：生成 Zotero 可刷新字段（推荐，日常写作用）
> - `--citeproc` + `bib-style.lua`：生成静态参考文献列表（适用于不需要 Zotero 刷新的场景）

### 4.2 使用命令行导出

```bash
# 方式 A：使用 citeproc（静态参考文献）
pandoc "输入.md" -f markdown -s -o "输出.docx" -t docx \
  --filter pandoc-crossref \
  --lua-filter bib-style.lua \
  --lua-filter move-tbl-caption-en.lua \
  --lua-filter replace-nbsp.lua \
  --citeproc \
  --bibliography=我的文库.bib \
  --reference-doc=word模板-常规.docx

# 方式 B：使用 zotero.lua（Zotero 可刷新，不需要 bib-style.lua）
pandoc "输入.md" -f markdown -s -o "输出.docx" -t docx \
  --filter pandoc-crossref \
  --lua-filter zotero.lua \
  --lua-filter move-tbl-caption-en.lua \
  --lua-filter replace-nbsp.lua \
  --reference-doc=word模板-常规.docx
```

### 4.3 Word 模板配置

确保 Word 模板（`word模板-常规.docx`）中存在 `Bibliography` 段落样式：

1. 打开 Word 模板
2. 开始 → 样式 → 管理样式
3. 找到或新建 `Bibliography` 样式
4. 设置：宋体 + Times New Roman，小五，**悬挂缩进 2 字符**

## 5 注意事项

- **仅在使用 `--citeproc` 时有效**：`csl-entry` 类由 `--citeproc` 生成。使用 `zotero.lua` 时不产生此类元素，本过滤器无效果（也不需要）
- **Word 模板必须预定义 `Bibliography` 样式**：Pandoc 遇到不存在的 `custom-style` 会自动创建默认样式（无格式），悬挂缩进不会生效
- 本过滤器非常轻量（仅 9 行），可与其他过滤器自由组合

## 6 常见问题

### Q: 导出后参考文献没有悬挂缩进

1. 确认使用了 `--citeproc` 而非 `zotero.lua`
2. 确认 Word 模板中已创建 `Bibliography` 样式并设置了悬挂缩进
3. 确认 `bib-style.lua` 在 `--citeproc` 之后执行

### Q: 可以和 zotero.lua 同时使用吗

不推荐。两者处理引用的方式不同，同时使用会导致冲突。日常写作推荐 `zotero.lua`，终稿需要静态参考文献时切换为 `--citeproc` + `bib-style.lua`。
