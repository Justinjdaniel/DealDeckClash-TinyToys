# DealDeckClash-TinyToys

A high-performance, gamified web application implementing the Monopoly Deal card game. Designed with modern web standards, it features an intelligent client-side AI bot, zero-dependency procedural Web Audio sound synthesis, smooth Framer Motion animations, and a decoupled action dispatcher architecture ready for WebSocket multiplayer integration.

---

## 🌟 Key Features

- **Full Monopoly Deal Rules Engine**: Accurate game loop covering property sets, rent cards, action cards (Sly Deal, Forced Deal, Deal Breaker, Debt Collector, It's My Birthday, Just Say No), house/hotel upgrades, banking, hand limits, and reaction/counter queues.
- **Client-Side Smart AI Bot**: Heuristic-based bot AI powered by scoring matrices (`TRAINED_BOT_MODELS` / `evaluateBotTurnWithBrain`) supporting customizable playstyles (e.g., Aggressive, Balanced, Tactical).
- **Zero-Dependency Procedural Audio**: Custom sound synthesizer leveraging the Web Audio API (`AudioContext`) to deliver rich sound effects without external audio assets or 404 risks.
- **Mobile-First Zero-Scroll Layout**: 3-zone grid layout (`h-[100dvh] overflow-hidden`) optimized for touch and desktop devices with clear visual SVG card representations, vertical property set stacking, and light/dark theme support.
- **Decoupled Serializable State & Dispatcher**: Reducer and API action layer designed to separate UI rendering from core game logic, allowing seamless client-side state execution or server-side sync.
- **Error Resilient UI**: Global React Error Boundary (`ErrorBoundary`) catching rendering anomalies and offering instant recovery without interrupting application state.

---

## 🛠 Tech Stack & Tools

- **Framework & Runtime**: React 19, Vite 6, TypeScript
- **Styling**: Tailwind CSS, Lucide React icons
- **Animations**: Framer Motion
- **Sound**: Web Audio API (Custom Procedural Synthesizer)
- **Testing**: Vitest, React Testing Library, Playwright (E2E)
- **Code Quality**: ESLint 9, Prettier
- **Package Manager**: `pnpm` (>=9.0.0)

---

## 🏗 Architecture & Design Principles

### 1. Action Dispatcher & API Layer (`src/features/game-engine/api.ts`)
Game state modifications are handled via a pure serializable action dispatcher pattern (`dispatchAction`, `canDispatch`). This encapsulates game rules, phase transitions, reaction queues, and turn mechanics while keeping the UI purely presentational.

### 2. Safe Asset & Net Worth Evaluation (`src/features/game-engine/rules.ts`)
Game state evaluation functions (`getPlayerBankCards`, `getPlayerPropertyCards`, `getPlayerNetWorth`) guarantee safe calculations across empty arrays or undefined property sets, preventing runtime errors during bot analysis or rendering.

### 3. Procedural Web Audio Engine (`src/features/audio/AudioContext.tsx`)
Rather than hosting static `.mp3` or `.wav` files, sound effects (card draws, plays, banking, rent actions, victory chimes) are generated dynamically on demand using Web Audio oscillators and envelope generators.

### 4. Zero-Scroll Responsive Board (`src/components/layout/GameLayout.tsx`)
The UI fits fixed viewport heights (`100dvh`) without page scrolling, organizing opponent board, central deck/discard/action log, and player hand/assets in dedicated zones with selection modals for complex actions (e.g., wild card color choices, targeted rent, payments).

---

## 📁 Project Structure

```
.
├── .github/workflows/   # CI/CD & GitHub Pages automated deployment
├── e2e/                 # Playwright end-to-end test suite
├── src/
│   ├── bot/             # AI Bot brain, evaluation scoring matrices, & hook
│   ├── components/      # UI layout, modals, visual cards, & error boundary
│   ├── context/         # ThemeContext (Light/Dark mode)
│   ├── features/
│   │   ├── audio/       # Web Audio API procedural sound engine
│   │   ├── cards/       # Visual card rendering & SVGs
│   │   └── game-engine/ # State management, rules, deck generation, & API dispatcher
│   ├── hooks/           # Custom React hooks
│   ├── services/        # Auxiliary services
│   ├── types/           # TypeScript interfaces & types
│   ├── App.tsx          # Root orchestrator & provider setup
│   ├── index.css        # Global styles & Tailwind CSS imports
│   └── main.tsx         # Application entry point
├── package.json
├── playwright.config.ts
├── tsconfig.json
└── vite.config.ts
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `^18.0.0` or `>=20.0.0`
- **pnpm**: `>=9.0.0`

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Judtinjdaniel/DealDeckClash-TinyToys.git
   cd DealDeckClash-TinyToys
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Start the development server:
   ```bash
   pnpm dev
   ```

Open `http://localhost:5173` in your browser.

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Starts the Vite development server with HMR. |
| `pnpm build` | Compiles TypeScript types and builds production artifacts with Vite. |
| `pnpm lint` | Runs ESLint across the codebase. |
| `pnpm format:check` | Checks code formatting using Prettier. |
| `pnpm format:write` | Formats codebase files with Prettier. |
| `pnpm test:unit` | Executes unit tests with Vitest. |
| `pnpm test:e2e` | Runs Playwright end-to-end tests. |
| `pnpm quality-gate` | Runs `lint`, `format:check`, `test:unit`, and `build` in sequence. |

---

## 🚢 Deployment

Automated static deployment to **GitHub Pages** is configured via GitHub Actions Workflow (`.github/workflows/deploy.yml`). Pushing changes to the main branch automatically triggers linting, testing, building, and deployment to GitHub Pages.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
