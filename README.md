English | [简体中文](./README.zh-CN.md)

# Reaction Field / 反应域

**Reaction Field** is an open-source chemistry-themed tactical card game built with React, TypeScript, and Vite, currently distributed as a public **Web Playtest Alpha**.

The current published technical version is `0.20.0-alpha.1`, with public tag `web-playtest-v0.20.0-alpha.1`, and the rules version remains strictly frozen at `MVP0-P10` with no additional gameplay rules. **This is not Beta 1.** It is a public playtest build based on React, TypeScript, Vite, Vitest, and Playwright, not a final release. Historical public tags such as `web-playtest-v0.16.0-alpha.2` (Reaction Field Alpha 6) remain preserved as immutable historical milestones.

## Core Rulebook — Extended Tabletop Reference

- [Core Rulebook (OneDrive)](https://1drv.ms/w/c/c8f765bca077d05c/IQARVQbFTILtQowJ0BLUq5V2AWHW1TuJcgOQwLIgWzi7qEo)

The external Core Rulebook is an extended tabletop reference, not the authoritative rules for the current Web Playtest. The current Web Playtest follows the applicable rule-freeze documents in this repository, the implemented engine behavior, and in-game feedback. The linked OneDrive content has not been independently revalidated for this release.

## Try the Web Playtest

- Play: [https://9947447-alt.github.io/reaction-field/](https://9947447-alt.github.io/reaction-field/)
- Current public channel: **Web Playtest Alpha** (not Beta 1)
- Current published technical version: `0.20.0-alpha.1`
- Current public tag: `web-playtest-v0.20.0-alpha.1`
- Peeled SHA: `8db1e95a3454085f57f5c5ca470b102ac19115c1`
- Rules version: `MVP0-P10`
- GitHub tag release: [web-playtest-v0.20.0-alpha.1](https://github.com/9947447-alt/reaction-field/releases/tag/web-playtest-v0.20.0-alpha.1)
- Repository: [https://github.com/9947447-alt/reaction-field](https://github.com/9947447-alt/reaction-field)

The current public build is Web Playtest Alpha `0.20.0-alpha.1` with rules version `MVP0-P10` and public tag `web-playtest-v0.20.0-alpha.1`. The live playtest URL is `https://9947447-alt.github.io/reaction-field/`. **This is not Beta 1** (the client lacks finished commercial artwork, dedicated audio, and finished lobby packaging, and remains in the Alpha stage). Historical tags `web-playtest-v0.16.0-alpha.2` and `web-playtest-v0.13.0-alpha.2` (`57550f70856d5d5e27ac3fcb0fa508cd698d3be6`) remain immutable.

## Product Architecture & Core Routes

The live version provides three mutually exclusive, independently accessible and testable routes:

- `/` **Lobby**: The main entrance. Provides game mode selection (Solo vs AI / Local Two-Player), an interactive scripted tutorial launcher, character lineup setup, and "About & Help".
- `/play` **Landscape Play Desk**: The formal landscape card desk match interface. Optimized for landscape viewports (displays a "Please rotate to landscape" barrier on portrait viewports), featuring click-to-select hand cards and converged desk controls.
- `/debug` **Debug Laboratory**: The developer and rule verification laboratory. Retains full open information (both players' hands face-up, full debug controls, and live state inspection).

## Game Modes & Hand Visibility

The current version strictly separates Solo private view from Local Two-Player open hands:

- **Solo vs AI (NATBA 1 Heuristic, default)**: Play against a heuristic AI opponent.
  - **Human Private View**: The human player's hand is visible face-up; the AI opponent's unplayed hand is strictly rendered as **card backs with hand count** to prevent visibility leaks.
  - **Public Information**: Both characters, current HP, status tokens, skill usage markers, table reference (`tableReference`), discard pile, remaining draw deck count, formal bilingual game logs, and the **public face of the most recently played action** are visible to both sides.
  - **Concealment Boundary**: The AI policy consumes only restricted `AIObservation`; the official desk UI strictly forbids exposing opponent unplayed card definitions or future deck order to the player.
- **Local Two-Player**:
  - Two players take turns on the same device.
  - Both players' hands remain **open and face-up on the same screen**, following physical tabletop and friendly face-to-face play conventions.
- **Interactive Scripted Tutorial**:
  - Launchable directly from the lobby (`?tutorial=1`).
  - Guides new players through hands-on playable script steps covering card play, chemical combination reactions, active skill usage, and turn cycles, rather than requiring them to read static collapsed text.

## Core Gameplay & Rules Scope (MVP0-P10)

- **Card Pool**: The ordinary physical card pool is strictly frozen at **68 cards**. `event_lab_fire` has zero ordinary `CardInstance` entries at initialization and does not enter the draw deck.
- **Character Lineups**: Choose from 7 released characters across 49 ordered two-player lineups (including mirror matches). The Laboratory Teacher and Chemical Factory CEO are selected by default.
  - Laboratory Teacher active skill: **Extra Lesson** (`extra_lesson`, 补课)
  - Chemical Factory CEO active skill: **Emergency Supply** (`emergency_supply`, 紧急调货)
- **Turn Flow & Pipeline**: Preparation card draw, linked card play (`tableReference`) or active DIY in main actions, character skill activation, opponent response windows, turn cycles, turn-start status handling (persistent damage and fire extinguishing), deck reshuffling, elimination, and victory resolution.
- **Structured Chemical Reactions**: Structured support for three core successful reaction events:
  - Acid-base neutralization (`acid_base_neutralization`)
  - Acid-carbonate reaction (`acid_carbonate_co2`)
  - Alkaline absorption of SO2 (`so2_alkaline_absorption`)
  - Successful reactions trigger a non-modal notice for ~2000ms. Virtual H2O and CO2 resolve reaction effects without creating physical card instances.
- **Session Safety Boundary**: A fatal-session boundary unloads the damaged match immediately on unhandled initialization, restart, or engine errors, removing the old `GameState` and allowing only a fresh restart or return to the lobby.

## International Playtest & Bilingual Game Logs

- **Bilingual Presentation**: Native support for Simplified Chinese and English, suggested automatically from browser language preferences and switchable in-page (held in the current page lifecycle).
- **Structured Game Logs**: Formal game logs are generated from a single authoritative payload and typed structured event stream; card play, responses, reactions, DIY, and status handling render with accurate localization.
- **Terminology**: English alkaline damage is displayed as `alkaline` while the internal rule identifier remains `base`.
- **Production Verification**: Formal E2E coverage covers key production paths; the production JavaScript bundle passes the frozen Node 24 size gate with comfortable headroom.

## Feedback

- Feedback entry: [Feedback (opens Microsoft Forms in a new tab)](https://forms.cloud.microsoft/r/QG8PACUnsa)
- The feedback entry is an ordinary external link opened only by an explicit user click. The game does not contact Microsoft Forms before that click and does not automatically send `GameState`, hands, logs, characters, browser information, error diagnostics, language preference, or user data.

## Running Locally

### Pinned Toolchain

- Node.js `24.18.0` (from `.node-version`)
- pnpm `11.9.0` (from `package.json#packageManager`)
- Only Playwright Chromium is installed for E2E tests

```bash
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm run dev
```

Build and preview production output:

```bash
pnpm run build
pnpm run preview
```

### Testing & Verification

Run the regular and fixed-seed Vitest suites:

```bash
pnpm run test:run
pnpm run test:shuffle
```

Run the isolated production-mode fixture build and Chromium E2E suite:

```bash
pnpm run test:e2e
```

Test real `dist/index.html` playtest paths:

```bash
pnpm run test:e2e:production
```

Run production isolation and bundle-size gates:

```bash
pnpm run check:production
pnpm run check:size
```

Audit production dependencies:

```bash
pnpm audit --prod
```

## Error Reporting & Privacy

If an unhandled error occurs, the fatal page exposes only a sanitized, locally copyable diagnostic summary:

```text
Name: Reaction Field
Version: 0.20.0-alpha.1
Rules: MVP0-P10
Commit: <short SHA or dev/unknown>
Error Code: <stable error code>
Environment: <non-sensitive summary>
```

This diagnostic excludes raw `Error.message` strings, stacks, `GameState`, hand cards, logs, or user data, and is never uploaded automatically.

## Known Limitations & Roadmap

- **Alpha Status**: Currently a Web Playtest Alpha without server persistence, accounts, or networking; refreshing resets the match. This is not Beta 1.
- **Hand Visibility**: Solo mode features private hands with opponent card backs; local two-player features same-screen open hands.
- **Viewport**: The match focuses on landscape viewports; portrait displays an orientation barrier.
- **Deferred Scope**: Real metal cards, enthusiast counterattack metal options, chemical equation cards, precipitation reactions, response DIY, online multiplayer, ranked matchmaking, adventure mode, accounts, and replays are deferred to future phases.
- **Known Issue**: In Firefox on iOS 27 beta, opening certain modals may trigger an unhandled focus error (`ROOT_RUNTIME_FAILED`); this remains unresolved.
- **Packaging**: Desktop installers (Tauri/Electron), PWA, native packages, and auto-updates are not implemented.

Release and rollback constraints are documented in [`docs/PHASE12_REACTION_FIELD_WEB_PLAYTEST_FREEZE.md`](docs/PHASE12_REACTION_FIELD_WEB_PLAYTEST_FREEZE.md) and [`docs/PHASE20_OFFICIAL_PLAY_UI_FREEZE.md`](docs/PHASE20_OFFICIAL_PLAY_UI_FREEZE.md). Rules remain frozen by [`docs/MVP0_RULE_FREEZE.md`](docs/MVP0_RULE_FREEZE.md), [`docs/PHASE8_CHARACTER_RULE_FREEZE.md`](docs/PHASE8_CHARACTER_RULE_FREEZE.md), [`docs/PHASE9_DEBUG_UI_RULE_FREEZE.md`](docs/PHASE9_DEBUG_UI_RULE_FREEZE.md), and [`docs/PHASE10_REACTION_EVENT_RULE_FREEZE.md`](docs/PHASE10_REACTION_EVENT_RULE_FREEZE.md). See [`docs/MVP_PLAN.md`](docs/MVP_PLAN.md) for the phase overview.

## License & Brand Assets

- **Source Code**: Licensed under [Apache-2.0](LICENSE), with attribution in [NOTICE](NOTICE). Copyright © 2026 Nulledge and Reaction Field contributors.
- **Brand Assets**: Files under `public/brand/**` are governed by the [Reaction Field Brand Asset Guidance](docs/REACTION_FIELD_BRAND_ASSETS.md) and are not included in the Apache-2.0 license.
- **Third-Party Dependencies**: Subject to their respective licenses.
