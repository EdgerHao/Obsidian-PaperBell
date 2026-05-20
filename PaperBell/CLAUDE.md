# CLAUDE.md - PaperBell Research Workflow

## Project Overview
PaperBell is an Obsidian-based academic research management system that helps researchers organize literature, manage projects, and streamline their writing workflow. This vault is optimized for use with the Claudian plugin for seamless Claude AI integration.

## Core Workflow

### 1. Literature Management
- **Inputs/Zotero/** - Store and organize academic papers imported from Zotero
- Use `@cite` and `@annotation` tags for literature notes
- Follow consistent frontmatter: title, authors, year, doi, tags

### 2. Project Management
- **Projects/** - Track research projects with linked literature
- Each project maintains connections to related papers, scholars, and outputs
- Use `@project` tag to link notes to specific projects

### 3. Knowledge Building
- **Cards/Concepts/** - Build concept definitions and knowledge graphs
- **Persons/Scholars/** - Maintain scholar profiles with research areas
- **Locations/Institutes/** - Track institutions and research organizations

### 4. Writing & Output
- **Drafts/** - Work-in-progress notes and manuscripts
- **Outputs/** - Final deliverables and publications
- Use Longform plugin for manuscript writing

## Quick Actions

```bash
# Search for literature by keyword
find -name "*.md" -path "Inputs/*" | xargs grep -l "keyword"

# List all projects
ls Projects/ | grep -v ".base"

# Count words in current manuscript
wc -w Drafts/*.md
```

## Key Commands

| Command | Description |
|---------|-------------|
| `/summarize` | Summarize selected literature or notes |
| `/outline` | Generate an outline for academic writing |
| `/connect` | Suggest internal links between notes |
| `/citation` | Help format citations and references |
| `/project` | Manage research project workflows |

## Note Templates

### Literature Note Structure
```yaml
---
title: "{{title}}"
authors: ["{{author}}"]
year: {{year}}
doi: "{{doi}}"
tags: ["#literature", "#{{topic}}"]
---

## Summary
Brief summary of the paper...

## Key Findings
- Finding 1
- Finding 2

## Methodology
Research methodology...

## Notes
Personal notes and insights...
```

### Project Note Structure
```yaml
---
title: "{{project_name}}"
status: active/inactive/completed
start_date: "{{date}}"
related_literature: []
team_members: []
---

## Overview
Project description...

## Objectives
- Objective 1
- Objective 2

## Milestones
- [ ] Milestone 1
- [ ] Milestone 2

## Related Papers
- [[Paper1]]
- [[Paper2]]
```

## Custom Skills

PaperBell includes custom Claude skills for academic workflows:

1. **paperbell-academic-writing** - Academic writing conventions and vault structure guidance
2. **paperbell-note-conventions** - Frontmatter and template conventions for different note types

## Workflow Tips

1. **Daily Review**: Start each day by reviewing your daily note and project updates
2. **Literature Digest**: Process 2-3 papers weekly and link them to relevant projects
3. **Concept Building**: Regularly update concept notes to strengthen your knowledge graph
4. **Project Tracking**: Use the Projects folder to maintain overview of active research

## Export & Publishing

- Use Obsidian Enhancing Export plugin for PDF/Word export
- Pandoc templates available in `40 - Obsidian/脚本/pandoc/`
- Support for APA, Nature, PNAS citation styles

## Local Development

```bash
# Open Claude Code in this vault
claude .

# Start Obsidian with this vault
obsidian .
```

## Storage Structure

| Path | Contents |
|------|----------|
| `.claude/system-prompt.txt` | System prompt for Claude AI |
| `.claude/skills/*/SKILL.md` | Custom Claude skills |
| `.claude/commands/*.md` | Custom slash commands |
| `.obsidian/plugins/` | Obsidian plugins including Claudian |
| `40 - Obsidian/模板/` | Note templates |

## Collaboration

- Use git for version control
- Share vault via GitHub or other git hosting
- Maintain separate branches for personal and shared content

## Best Practices

- Use consistent tagging: `#literature`, `#concept`, `#project`, `#scholar`
- Link notes using wiki-links: `[[Note Name]]`
- Maintain clean frontmatter with essential metadata
- Regularly back up your vault
- Use the PaperBell plugin for enhanced functionality