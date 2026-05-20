# [Feature] Built-in Integration of Pandoc Markdown → Word Export

## 🚀 Feature Request

### Background

PaperBell provides a complete Obsidian academic vault template, enabling researchers to manage literature, notes, and projects within Obsidian. However, the final output of academic writing inevitably requires exporting to a deliverable document format. In the vast majority of use cases, **Word (.docx) is more universal than PDF** — collaborative editing, advisor annotations, and journal submissions almost exclusively rely on Word.

Currently, PaperBell does not include a built-in Markdown → Word export solution. Users must independently configure Pandoc and the related toolchain, which presents a high barrier to entry.

### Pain Points

When using Pandoc to convert Markdown to Word, numerous formatting issues arise in Chinese-English mixed typesetting scenarios:

1. **Misplaced bilingual table captions** — English captions appear below tables instead of above, violating academic conventions
2. **Non-breaking spaces (NBSP) inserted by pandoc-crossref** — affecting layout and searchability
3. **Mixed Chinese-English punctuation** — half-width commas and periods appearing in Chinese contexts
4. **Extra spaces between Chinese/English text and Chinese/numeral combinations** — degrading readability
5. **Cluttered table borders** — not formatted as academic three-line tables
6. **Inconsistent image styles** — quotation mark fonts differ from body text

### Proposed Solution

It is recommended to integrate a Pandoc-based Markdown → Word export functionality into PaperBell, referencing the approach of the companion sub-project [PaperBell-md-2-word](https://github.com/EdgerHao/PaperBell-md-2-word). The proposed architecture uses a dual-layer approach: **Lua filters (automatic processing during export) + VBA macros (one-click post-export fixes)**.

#### Layer 1: Lua Filters (Automatically Executed During Pandoc Export)

| Filter | Problem Solved |
|---|---|
| `pandoc-crossref` | Cross-reference resolution (Fig. 1 / Table 1 / Eq. 1) |
| `zotero.lua` | `[@citekey]` → Refreshable Zotero fields in Word |
| `move-tbl-caption-en.lua` | Move English table captions from below to above the table |
| `replace-nbsp.lua` | Remove non-breaking spaces inserted by pandoc-crossref |
| `bib-style.lua` | Apply hanging indent style to bibliography entries |
| `word-template.docx` | Word style inheritance (body text, headings, images, bibliography, etc.) |

#### Layer 2: VBA Macros (One-Click Post-Export Fixes in Word)

7-in-1 toolbox `PaperBell_MD2Word_VBA` — enter `0` to execute all fixes at once:

1. Smart bracket and citation repair
2. Punctuation standardization
3. Deep space cleanup
4. Image style unification
5. Zotero citation highlighting (blue)
6. One-click MD table formatting to academic three-line tables
7. Precise spacing and quotation mark font fixes

#### Complete Workflow

```
Obsidian + PaperBell (Markdown writing)
  ↕ pandoc-live-preview real-time preview
  ↓ Export (Obsidian Enhancing Export)
Pandoc + Lua filter chain (automatic formatting)
  ↓ Output .docx
VBA Macros (Alt+F8 one-click fix)
  ↓
✅ Deliverable Word document
```

### Integration Recommendations

1. **Bundle Lua filters and Word templates into the PaperBell vault** — no extra download or configuration needed for users
2. **Pre-configure Obsidian Enhancing Export settings** — out-of-the-box experience, avoiding manual Extra arguments setup
3. **Add an export guide to PaperBell documentation** — explaining the complete workflow
4. **Integrate with the [pandoc-live-preview](https://github.com/EdgerHao/pandoc-live-preview) plugin** — enabling write-and-preview functionality

### Related Projects

- [PaperBell-md-2-word](https://github.com/EdgerHao/PaperBell-md-2-word) — Companion MD-to-Word sub-project for PaperBell (Lua filters + VBA macros + Word template)
- [pandoc-live-preview](https://github.com/EdgerHao/pandoc-live-preview) — Obsidian plugin for real-time Pandoc cross-reference preview

> **Note**: The PaperBell-md-2-word project is still under active development and optimization, but its core functionality is already usable. Community testing and contributions are welcome.
