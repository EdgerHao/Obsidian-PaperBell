# [Feature] 内置集成 Pandoc Markdown → Word 导出功能

## 🚀 Feature Request

### 背景

PaperBell 提供了完整的 Obsidian 学术库模板，让研究者在 Obsidian 中管理文献、笔记和项目。然而，学术写作的最终产出不可避免地需要导出为可交付的文档格式。在绝大多数使用场景下，**Word（.docx）比 PDF 更为通用**——合作者协作修改、导师批注、期刊投稿等环节几乎都以 Word 为主。

目前 PaperBell 本身并未内置 Markdown → Word 的导出方案，用户需要自行配置 Pandoc 及相关工具链，门槛较高。

### 痛点

使用 Pandoc 将 Markdown 转为 Word 时，在中英文混排场景下存在大量格式问题，主要包括：

1. **表格双语标题位置错乱** — 英文表题跑到表格下方，不符合学术规范
2. **pandoc-crossref 插入不换行空格（NBSP）** — 影响排版和搜索
3. **中英文标点混用** — 半角逗号、句号出现在中文语境中
4. **中英文/汉字数字之间多余空格** — 影响阅读体验
5. **表格边框杂乱** — 未规整为学术三线表
6. **图片样式不统一** — 引号字体与正文不一致

### 建议方案

建议在 PaperBell 中**内置集成**基于 Pandoc 的 Markdown → Word 导出功能，具体参考配套子项目 [PaperBell-md-2-word](https://github.com/EdgerHao/PaperBell-md-2-word) 的方案，采用 **Lua 过滤器（导出时自动处理）+ VBA 宏（导出后一键修复）** 的双层架构：

#### 第一层：Lua 过滤器（Pandoc 导出时自动执行）

| 过滤器 | 解决的问题 |
|---|---|
| `pandoc-crossref` | 交叉引用解析（图1/表1/式1） |
| `zotero.lua` | `[@citekey]` → Word 中可刷新的 Zotero 字段 |
| `move-tbl-caption-en.lua` | 英文表题从表格下方移到上方 |
| `replace-nbsp.lua` | 清除 pandoc-crossref 插入的不换行空格 |
| `bib-style.lua` | 参考文献条目悬挂缩进样式 |
| `word模板-常规.docx` | Word 样式继承（正文、标题、图片、参考文献等） |

#### 第二层：VBA 宏（导出后在 Word 中一键修复）

7 合 1 工具箱 `PaperBell_MD2Word_VBA`，输入 `0` 一键执行：

1. 智能括号与引用修复
2. 标点符号标准化
3. 深度空格清理
4. 图片样式统一
5. Zotero 引用变蓝
6. MD 表格一键规整三线表
7. 精确空格与引号字体修复

#### 完整工作流

```
Obsidian + PaperBell（Markdown 写作）
  ↕ pandoc-live-preview 实时预览
  ↓ 导出（Obsidian Enhancing Export）
Pandoc + Lua 过滤器链（自动处理格式）
  ↓ 输出 .docx
VBA 宏（Alt+F8 一键修复）
  ↓
✅ 可交付的 Word 文档
```

### 集成建议

1. **将 Lua 过滤器和 Word 模板内置到 PaperBell 库中**，用户无需额外下载配置
2. **预设 Obsidian Enhancing Export 的导出配置**，开箱即用，避免用户手动填写 Extra arguments
3. **在 PaperBell 文档中增加导出指南**，说明完整工作流
4. **与 [pandoc-live-preview](https://github.com/EdgerHao/pandoc-live-preview) 插件联动**，实现写作即预览

### 相关项目

- [PaperBell-md-2-word](https://github.com/EdgerHao/PaperBell-md-2-word) — 配套 PaperBell 的 MD 转 Word 子项目（Lua 过滤器 + VBA 宏 + Word 模板）
- [pandoc-live-preview](https://github.com/EdgerHao/pandoc-live-preview) — Obsidian 中实时预览 Pandoc 交叉引用的社区插件

> **注**：PaperBell-md-2-word 项目目前仍在优化完善中，但核心功能已可用，欢迎社区参与测试和贡献。
