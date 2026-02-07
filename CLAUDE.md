# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Flare** is a BMAD (Balanced Method for Makers) project — an AI-driven project orchestration framework (v6.0.0-Beta.7). It is **not** a traditional software application with source code to build or test. Instead, it is a configuration and workflow system executed entirely by Claude AI agents at runtime.

- **Project name:** flare
- **User name:** winner
- **User skill level:** intermediate
- **Output directory:** `docs/` (planning-artifacts and implementation-artifacts subdirectories)

## How to Work in This Codebase

There is no build system, package manager, or test runner. All "execution" happens through Claude slash commands that activate agents and workflows.

### Key Slash Commands

Start with the master orchestrator:
- `/bmad-agent-bmad-master` — Activates the BMad Master agent (main entry point, shows menu of all available workflows/tasks)
- `/bmad-help` — Get advice on what to do next (can append context, e.g., `/bmad-help where should I start`)

Agent commands (each activates a specialized persona):
- `/bmad-agent-bmm-analyst` — Mary, business/market research
- `/bmad-agent-bmm-architect` — Winston, system design
- `/bmad-agent-bmm-dev` — Amelia, code implementation
- `/bmad-agent-bmm-pm` — John, product management
- `/bmad-agent-bmm-qa` — Quinn, QA/test automation
- `/bmad-agent-bmm-sm` — Bob, scrum master
- `/bmad-agent-bmm-ux-designer` — Sally, UX design
- `/bmad-agent-bmm-quick-flow-solo-dev` — Barry, lean/rapid development

Workflow commands follow the pattern `/bmad-bmm-<workflow-name>` (e.g., `/bmad-bmm-create-prd`, `/bmad-bmm-dev-story`, `/bmad-bmm-sprint-planning`).

## Architecture

### Runtime Model

All files are loaded **on-demand at runtime**, never pre-loaded. When an agent or workflow is activated:
1. The `.claude/commands/<command>.md` file triggers loading
2. The agent file is loaded from `_bmad/<module>/agents/<agent>.md`
3. Config is loaded from `_bmad/<module>/config.yaml` to populate session variables
4. Workflow steps are loaded sequentially from `steps/` subdirectories

### Directory Structure

```
_bmad/
├── core/                      # Core module
│   ├── agents/                # BMad Master agent definition
│   ├── tasks/                 # Help, editorial/adversarial reviews, doc sharding
│   └── workflows/             # Brainstorming, party-mode, advanced-elicitation
├── bmm/                       # Balanced Method for Makers module
│   ├── agents/                # 10 specialized agent personas
│   ├── teams/                 # Team bundle definitions (YAML)
│   ├── data/                  # Templates (project-context-template.md)
│   └── workflows/             # All development lifecycle workflows
│       ├── 1-analysis/        # Brainstorming, market/domain/tech research, product brief
│       ├── 2-plan-workflows/  # PRD creation/validation/editing, UX design
│       ├── 3-solutioning/     # Architecture, epics & stories, readiness checks
│       ├── 4-implementation/  # Sprint planning, dev story, code review, QA, retro
│       ├── bmad-quick-flow/   # Lean path: quick-spec → quick-dev
│       ├── document-project/  # Brownfield project documentation
│       ├── generate-project-context/  # LLM context optimization
│       └── qa/                # Automated test generation
├── _config/                   # Central registries and manifests
│   ├── manifest.yaml          # Installation metadata
│   ├── agent-manifest.csv     # All agents registry
│   ├── workflow-manifest.csv  # All workflows registry (27 workflows)
│   ├── task-manifest.csv      # All tasks registry
│   ├── files-manifest.csv     # Complete file registry
│   ├── bmad-help.csv          # Help system entries
│   ├── agents/                # Agent customization overrides
│   └── custom/                # Custom extension point
└── _memory/                   # Persistent agent memory storage
    └── tech-writer-sidecar/   # Technical writing standards

.claude/commands/              # 41 Claude Code slash command definitions
docs/
├── planning-artifacts/        # Output: PRDs, architecture, UX designs, briefs
└── implementation-artifacts/  # Output: stories, sprint plans, test suites
```

### Workflow Step-File Pattern

Every workflow follows a strict sequential step-file architecture:
```
<workflow>/
├── workflow.yaml          # Metadata: config_source, variables, paths
├── instructions.xml       # (optional) Advanced execution instructions
├── checklist.md           # (optional) Validation checklist
├── *.template.md          # (optional) Output document template
└── steps/
    ├── step-01-init.md
    ├── step-02-*.md
    └── ...
```

Steps must be executed in order. State is saved to frontmatter after each step. Execution halts at menus/checkpoints and waits for user input.

### Agent Activation Protocol

Every agent command follows the same pattern:
1. Load agent file → read persona, menu, and instructions
2. Load `config.yaml` → store `{user_name}`, `{communication_language}`, `{output_folder}` as session variables
3. Display greeting and numbered menu
4. Wait for user input (number, command trigger, or fuzzy text match)
5. On selection, follow the corresponding menu handler (workflow, exec, action, data, validate-workflow)

### Four Development Phases (BMM)

1. **Analysis** — Research and product brief creation
2. **Planning** — PRD creation, validation, UX design
3. **Solutioning** — Architecture, epics/stories, implementation readiness
4. **Implementation** — Sprint planning, story execution, code review, QA, retrospectives

Alternative lean path: **Quick Flow** (quick-spec → quick-dev) for simpler tasks.

## Critical Rules When Modifying This Project

- **Never pre-load files** — all resources must be loaded at runtime, on-demand only
- **Preserve step-file sequencing** — workflows execute steps in strict numbered order; never skip steps
- **Maintain CSV manifest consistency** — if adding/removing agents, workflows, or tasks, update the corresponding manifest CSV in `_bmad/_config/`
- **Config is the source of truth** — session variables (`{user_name}`, `{output_folder}`, etc.) come from `config.yaml` files, not hardcoded
- **Artifacts go to `docs/`** — planning outputs to `docs/planning-artifacts/`, implementation outputs to `docs/implementation-artifacts/`
- **Agent personas are sacrosanct** — each agent has a defined role, identity, communication style, and principles; stay in character
