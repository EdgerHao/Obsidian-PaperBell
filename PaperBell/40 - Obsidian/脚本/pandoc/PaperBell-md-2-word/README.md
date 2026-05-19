# PaperBell-md-2-word

> **PaperBell 子项目** — 在 Obsidian 中撰写学术论文，一键导出可交付的 Word 文档

[![PaperBell](https://img.shields.io/badge/PaperBell-SubProject-blue)](https://github.com/PaperBell-Org/Obsidian-PaperBell)
[![Pandoc](https://img.shields.io/badge/Pandoc-3.x-orange)](https://pandoc.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 为什么需要这个项目？

[PaperBell](https://github.com/PaperBell-Org/Obsidian-PaperBell) 提供了完整的学术 Obsidian 库模板，让研究者在 Obsidian 中管理文献、笔记和项目。但写作到交付之间还有一道坎：

**Markdown → Word 的格式转换**

Pandoc 是最强大的转换工具，但默认导出的 Word 文档在中英文混排场景下存在大量格式问题：

- 表格双语标题位置错乱（英文表题跑到表格下方）
- pandoc-crossref 插入不换行空格（NBSP）
- 中英文标点混用（半角逗号、句号出现在中文语境中）
- 中英文/汉字数字之间有多余空格
- 表格边框杂乱，未规整为学术三线表
- 图片样式不统一，引号字体与正文不一致

本项目提供 **Lua 过滤器（导出时自动处理）+ VBA 宏（导出后一键修复）** 的完整解决方案，配合 [pandoc-live-preview](https://github.com/EdgerHao/pandoc-live-preview) 插件实现写作即预览，最终**简单点击即可获得可交付的 Word 文档**。

## 完整工作流

```
┌─────────────────────────────────────────────────────────┐
│                    Obsidian + PaperBell                   │
│                                                           │
│   Markdown 写作 ←→ pandoc-live-preview 实时预览           │
│   (@fig:id → 图1, @tbl:id → 表1, [@citekey] 实时渲染)     │
└──────────────────────────┬──────────────────────────────┘
                           │ 导出 (Obsidian Enhancing Export)
                           ▼
┌─────────────────────────────────────────────────────────┐
│              Pandoc + Lua 过滤器链（自动）                  │
│                                                           │
│   ① pandoc-crossref    交叉引用解析 (图1/表1/式1)          │
│   ② zotero.lua         Zotero 引用字段化                  │
│   ③ move-tbl-caption   表格英文标题上移                    │
│   ④ replace-nbsp       不换行空格清理                      │
│   ⑤ word模板-常规.docx  Word 样式继承                     │
└──────────────────────────┬──────────────────────────────┘
                           │ 输出 .docx
                           ▼
┌─────────────────────────────────────────────────────────┐
│            PaperBell_MD2Word_VBA（Alt+F8 一键修复）         │
│                                                           │
│   1. 智能括号与引用修复                                     │
│   2. 标点符号标准化                                         │
│   3. 深度空格清理                                           │
│   4. 图片样式统一                                           │
│   5. Zotero 引用变蓝                                       │
│   6. MD 表格一键规整三线表                                   │
│   7. 精确空格与引号字体修复                                  │
│   0. 全部执行                                               │
└──────────────────────────┬──────────────────────────────┘
                           ▼
                    ✅ 可交付的 Word 文档
```

## 项目结构

```
PaperBell-md-2-word/
│
├── README.md                          ← 你正在读的文件
├── LICENSE                            ← MIT 许可证
│
│── Lua 过滤器（Pandoc 导出时自动执行）
├── zotero/                            # Zotero Better BibTeX 实时引用
│   ├── zotero.lua
│   └── zotero-README.md
├── move-tbl-caption-en/               # 表格英文标题上移到表格上方
│   ├── move-tbl-caption-en.lua
│   └── move-tbl-caption-en-README.md
├── replace-nbsp/                      # 不换行空格 (U+00A0) 替换
│   ├── replace-nbsp.lua
│   └── replace-nbsp-README.md
├── bib-style/                         # 参考文献悬挂缩进（配合 --citeproc）
│   ├── bib-style.lua
│   └── bib-style-README.md
│
│── VBA 宏（导出后在 Word 中运行）
├── PaperBell-md-2-word-VBA/           # 主工具箱 v0.1（7 合 1）
│   ├── PaperBell-md-2-word-VBA.md         # VBA 代码
│   └── PaperBell-md-2-word-VBA-README.md  # 使用说明书
├── fix-spacing-quote-font/            # 独立补充宏（选区级精确修复）
│   ├── fix-spacing-quote-font.md          # VBA 代码
│   └── fix-spacing-quote-font-README.md   # 说明
│
│── Word 模板
└── word模板-常规.docx                  # Word 参考模板（含自定义样式）
```

## 快速开始

### 前置条件

| 工具 | 用途 | 安装方式 |
|------|------|----------|
| [Obsidian](https://obsidian.md) | 写作环境 | 官网下载 |
| [PaperBell](https://github.com/PaperBell-Org/Obsidian-PaperBell) | 学术库模板 | 按官方文档初始化 |
| [pandoc-live-preview](https://github.com/EdgerHao/pandoc-live-preview) | 写作时实时预览 | Obsidian 社区插件 |
| Pandoc ≥ 3.0 | Markdown → Word 转换 | `brew install pandoc` 或官网下载 |
| [pandoc-crossref](https://github.com/lierdakil/pandoc-crossref) | 交叉引用 | 与 Pandoc 版本匹配的编译版本 |
| Zotero + Better BibTeX | 文献管理 | Zotero 官网 + 插件市场 |
| Obsidian Enhancing Export | OB 内一键导出 | Obsidian 社区插件 |

### 安装步骤

**1. 克隆本仓库到 PaperBell 库中**

```bash
cd /path/to/your/PaperBell/vault
git clone https://github.com/EdgerHao/PaperBell-md-2-word.git
```

或直接将项目文件夹放入库内任意位置。

**2. 配置 Lua 过滤器**

在 Obsidian Enhancing Export 插件的 **Word (.docx)** 导出配置中，设置 Extra arguments：

```
--filter="pandoc-crossref"
--lua-filter="<项目路径>/zotero/zotero.lua"
--lua-filter="<项目路径>/move-tbl-caption-en/move-tbl-caption-en.lua"
--reference-doc="<项目路径>/word模板-常规.docx"
--lua-filter="<项目路径>/replace-nbsp/replace-nbsp.lua"
-M link-citations=true -M chapDelim=-
-M figureTitle=图 -M figPrefix=图
```

> **过滤器顺序重要**：`pandoc-crossref` 必须在最前面，`move-tbl-caption-en` 必须在 `pandoc-crossref` 之后。

**3. 安装 VBA 宏**

1. 用 Pandoc 导出 Word 后，打开文档
2. 按 `Alt` + `F11` 打开 VBA 编辑器
3. 插入模块，粘贴 `PaperBell-md-2-word-VBA.md` 中的代码
4. 关闭编辑器，按 `Alt` + `F8` 运行 `PaperBell_MD2Word_VBA`
5. 输入 `0` 一键执行全部修复

### 使用流程

1. **在 Obsidian 中写作** — 使用 `@fig:id` / `@tbl:id` / `[@citekey]` 语法，pandoc-live-preview 实时预览
2. **导出 Word** — `Alt` + `P`，Obsidian Enhancing Export 自动调用 Pandoc + Lua 过滤器链
3. **运行 VBA 宏** — `Alt` + `F8`，输入 `0` 一键修复所有格式问题
4. **交付** — 获得排版规范的 Word 文档

## 组件详解

### Lua 过滤器

| 过滤器 | 解决的问题 | 必需？ |
|--------|-----------|--------|
| **zotero.lua** | `[@citekey]` → Word 中可刷新的 Zotero 字段 | 推荐（需 Zotero 运行） |
| **move-tbl-caption-en.lua** | 英文表题从表格下方移到上方（与中文表题并排） | 推荐 |
| **replace-nbsp.lua** | 清除 pandoc-crossref 插入的不换行空格 | 推荐 |
| **bib-style.lua** | 参考文献条目应用悬挂缩进样式 | 可选（使用 `--citeproc` 时需要） |

### VBA 宏

| 宏 | 7 个模块 | 说明 |
|-----|---------|------|
| **PaperBell_MD2Word_VBA** | 输入 `0` 全部执行 | 主工具箱，覆盖括号/标点/空格/图片/Zotero/三线表/引号字体 |
| **Fix_Spacing_And_Quote_Font** | 独立运行 | 精确修复，支持选区运行，可作为主工具箱的补充 |

### Word 模板

`word模板-常规.docx` 预定义了以下样式：

| 样式名 | 用途 |
|--------|------|
| `Body Text` | 正文（宋体 + TNR，首行缩进） |
| `Table Caption` / `Table Caption EN` | 表格中英文标题 |
| `Image Caption` / `Figure Caption EN` | 图片中英文标题 |
| `Bibliography` | 参考文献（悬挂缩进） |
| `图片` | 图片统一样式（居中） |

## 相关项目

| 项目 | 关系 | 说明 |
|------|------|------|
| [PaperBell](https://github.com/PaperBell-Org/Obsidian-PaperBell) | 父项目 | Obsidian 学术生活管理模板 |
| [pandoc-live-preview](https://github.com/EdgerHao/pandoc-live-preview) | 写作端配套 | Obsidian 中实时预览 Pandoc 交叉引用 |
| **PaperBell-md-2-word** | 导出端配套（本项目） | Pandoc 过滤器 + VBA 宏，补齐导出到交付的最后一公里 |

## 许可证

[MIT License](LICENSE)

- Lua 过滤器：MIT
- VBA 宏代码：MIT
- `zotero.lua`：遵循 [Zotero Better BibTeX](https://github.com/retorquere/zotero-better-bibtex) 原始许可
- `word模板-常规.docx`：可自由修改分发
