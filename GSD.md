# GSD Cheatsheet — kebab.news

Quick reference for my workflow. Not a tutorial — just the commands I actually use day-to-day, and when to reach for which.

---

## The daily loop (90% of the time)

Per phase, in this order:

```
/gsd-discuss-phase N    # Capture vision for phase N (writes CONTEXT.md)
/clear
/gsd-plan-phase N       # Generate detailed plan (writes PLAN.md)
/clear
/gsd-execute-phase N    # Execute, atomic commits, verify
```

`/clear` between steps is **not optional** — it's the single biggest token-saving lever. Discuss output goes to CONTEXT.md, plan output to PLAN.md. The next step reads the file, not the chat.

**Coming back after a break:**
```
/gsd-progress           # Reads STATE.md, points to next action
```

---

## The commands that matter

### Main loop

| Command | When | What it does |
|---|---|---|
| `/gsd-progress` | Entering a session | Shows where I am, what's next |
| `/gsd-discuss-phase N` | Before planning, when I have a vision | Asks questions, writes CONTEXT.md |
| `/gsd-plan-phase N` | Once CONTEXT.md is in place | Generates PLAN.md with tasks + success criteria |
| `/gsd-execute-phase N` | Once PLAN.md is approved | Executes, atomic commits, verifies |
| `/gsd-verify-work N` | After execute, before ship | Conversational UAT — walks through success criteria |
| `/gsd-ship N` | Phase verified | Push + PR with auto-generated body |

### Small work (non-phase)

| Command | When |
|---|---|
| `/gsd-fast "<description>"` | Typo, config tweak, ≤3 file edits. Inline, one commit. |
| `/gsd-quick` | Mid-size ad-hoc work. Lives in `.planning/quick/`, outside phases. |
| `/gsd-quick --validate` | Same as above with plan-check + verifier. For riskier stuff. |

### Idea capture (while working on something else)

| Command | When |
|---|---|
| `/gsd-note <idea>` | Zero-friction capture, no interruption |
| `/gsd-add-todo` | Turn current conversation context into a structured todo |
| `/gsd-check-todos` | Review pending todos, pick one to work on |
| `/gsd-plant-seed "<idea> when <trigger>"` | Idea with a condition for when it should resurface |

### When something's broken

| Command | When |
|---|---|
| `/gsd-debug "<bug>"` | Systematic debugging — survives `/clear` |
| `/gsd-debug` (no args) | Resume an active debug session |
| `/gsd-list-phase-assumptions N` | **Before** execute — what is Claude assuming? Course-correcting here is cheap |

### Roadmap upkeep

| Command | When |
|---|---|
| `/gsd-add-phase "<description>"` | Append a new phase to the current milestone |
| `/gsd-insert-phase <after> "<description>"` | Drop urgent work in as a decimal phase (e.g. 5.1) |
| `/gsd-complete-milestone <version>` | Close out a milestone: archive, tag, prep next |

---

## Token-saving habits I stick to

1. **`/clear` between main steps.** Discuss → clear → plan → clear → execute. Each step reads its input from disk, not from chat history.
2. **`/gsd-fast` instead of editing manually** for tiny stuff. Skips the "let me read the file first…" warm-up.
3. **`/gsd-list-phase-assumptions N` before execute.** If Claude misread something, fixing it while the plan output is still small is way cheaper than after 20 files have changed.
4. **`/gsd-progress` instead of paging through `.planning/` myself** — denser summary than reading docs one-by-one.
5. **Don't park notes and todos in the chat.** `/gsd-note` and `/gsd-add-todo` move ideas out of context.

---

## Not sure which command to use

```
/gsd-do <what I want in natural language>
```

Auto-routes to the right command. I use this when I'm torn between `/gsd-fast`, `/gsd-quick`, and `/gsd-add-phase`.

---

## Files I open directly

| File | What it's for |
|---|---|
| [.planning/STATE.md](.planning/STATE.md) | Where I am, recent decisions |
| [.planning/PROJECT.md](.planning/PROJECT.md) | Vision, constraints, decision log |
| [.planning/ROADMAP.md](.planning/ROADMAP.md) | All 14 phases with goals + success criteria |
| [.planning/REQUIREMENTS.md](.planning/REQUIREMENTS.md) | 74 requirements mapped to phases |
| [.planning/MILESTONES.md](.planning/MILESTONES.md) | v0.1–v1.0 overview |
| [.planning/config.json](.planning/config.json) | Workflow toggles (yolo mode, balanced profile) |

---

## Pro tip: don't let the MVP slip

v0.3 is the MVP that makes the idea stand out — Topic Board + Voting + Objectivity Filter. If during discuss/plan I catch myself wanting to pull v0.4+ features forward (Investigation Timeline, Bias Radar, Comments), I do this:

```
/gsd-plant-seed "<feature> when <condition>"
```

Instead of letting v0.3 grow. The condition makes sure the idea resurfaces at the right time.
