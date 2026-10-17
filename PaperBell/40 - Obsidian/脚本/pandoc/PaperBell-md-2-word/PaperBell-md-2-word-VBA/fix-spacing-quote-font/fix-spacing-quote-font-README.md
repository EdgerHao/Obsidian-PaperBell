---
tags:
  - VBA
  - Word宏
  - PaperBell
created: 2026-05-19
---

# Fix_Spacing_And_Quote_Font — 空格与引号字体修复

## 1 功能说明

本宏处理主工具箱（PaperBell_MD2Word_VBA）**未覆盖**的两类格式问题：

现已合并至主程序第七个功能


| 功能 | 说明 |
|------|------|
| 关闭亚洲文字自动间距 | 禁用 Word 自动在中英文/中数字间插入的间距 |
| 清除特殊空格字符 | NBSP（U+00A0）、全角空格（U+3000）、○、·、•、Tab |
| 图表式编号空格 | `图 1` → `图1`、`表 2` → `表2`、`式 3` → `式3` |
| 引用括号空格 | `[ ` → `[`、` ]` → `]` |
| 引号字体统一 | 将 `""` `''` 的字体设为宋体 |

> **与主工具箱的区别**：主工具箱模块 3 用通配符批量替换空格，本宏用逐字替换更精准；此外本宏独有的功能是关闭 Word 的亚洲文字自动间距和引号字体修复。

## 2 使用方式

### 支持选区运行

- **选中部分文本** → 只处理选区
- **不选任何文本** → 处理全文

### 安装方法

与主工具箱相同，将 [[4-成果/PaperBell/PaperBell-md-2-word/PaperBell-md-2-word-VBA/fix-spacing-quote-font/fix-spacing-quote-font]] 代码粘贴到 VBA 模块中即可。可以与主工具箱放在同一个模块里。

### 运行方法

按 `Alt` + `F8`，选择 `Fix_Spacing_And_Quote_Font`，运行。

## 3 与主工具箱的协作

建议运行顺序：

```
1. PaperBell_MD2Word_VBA（输入 0 执行全部）
2. Fix_Spacing_And_Quote_Font（收尾清理）
```

两者无冲突，可按任意顺序运行。本宏专注于主工具箱遗漏的细节：
- Word 段落级的"亚洲文字自动间距"属性
- 特殊 Unicode 空格字符
- 引号的字体归属

## 4 文件信息

| 项目 | 内容 |
|------|------|
| **文件名** | `fix-spacing-quote-font.md` |
| **宏入口函数** | `Fix_Spacing_And_Quote_Font` |
| **原始路径** | `4-成果/PaperBell/Word 宏程序：论文格式检查优化（ob-pandoc-导出）/` |
| **PaperBell 路径** | `4-成果/PaperBell/PaperBell-md-2-word/fix-spacing-quote-font/` |
