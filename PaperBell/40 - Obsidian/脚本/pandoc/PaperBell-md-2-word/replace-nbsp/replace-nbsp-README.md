---
tags:
  - Pandoc
  - Lua过滤器
  - PaperBell
created: 2026-05-19
---

# replace-nbsp.lua — 不换行空格替换过滤器

## 1 问题背景

pandoc-crossref 在导出 Word 时，会在交叉引用编号（如"表 1"、"图 2"）中的空格处插入**不换行空格**（U+00A0, Non-Breaking Space）。这会导致：

- Word 中"表"与编号之间无法正常换行
- 后续编辑时可能出现奇怪的断行行为
- 批量查找替换时匹配不到（普通空格搜不到 NBSP）

## 2 解决方案

本过滤器遍历所有 `Str` 元素，将 U+00A0 替换为普通空格 U+0020。

### 过滤器源码

```lua
function Str(el)
  -- \194\160 是 U+00A0 的 UTF-8 编码
  el.text = el.text:gsub("\194\160", " ")
  return el
end
```

### 处理效果

```
导出 Word 前（含 NBSP）：
  表 1: 页岩样品基本地球化学特征
       ↓
处理后（普通空格）：
  表 1: 页岩样品基本地球化学特征
```

## 3 文件信息

| 项目 | 内容 |
|------|------|
| **文件名** | `replace-nbsp.lua` |
| **本库路径** | `0-辅助/IOTO/Pandoc/replace-nbsp.lua` |
| **PaperBell 路径** | `4-成果/PaperBell/PaperBell-md-2-word/replace-nbsp/replace-nbsp.lua` |
| **适用 Pandoc 版本** | 任意版本 |
| **依赖** | 无 |

## 4 在 Obsidian 插件中配置

### 4.1 使用 Obsidian Enhancing Export 插件

1. 打开 Obsidian → 设置 → Obsidian Enhancing Export
2. 找到 **Word (.docx)** 导出配置
3. 在 **Extra arguments** 中添加：

```
--lua-filter="${pluginDir}/../../../4-成果/PaperBell/PaperBell-md-2-word/replace-nbsp/replace-nbsp.lua"
```

> **建议放在过滤器链的最后**，因为其他过滤器可能也会引入 NBSP。

### 4.2 使用命令行导出

```bash
pandoc "输入.md" -f markdown -s -o "输出.docx" -t docx \
  --filter pandoc-crossref \
  --lua-filter zotero.lua \
  --lua-filter move-tbl-caption-en.lua \
  --lua-filter replace-nbsp.lua \
  --reference-doc=word模板-常规.docx
```

## 5 注意事项

- 本过滤器为**全局替换**，会替换文档中所有的 NBSP，不限于交叉引用位置
- 如果某些场景确实需要保留 NBSP（如防止特定位置换行），请勿使用本过滤器
- 过滤器非常轻量，不影响导出性能
