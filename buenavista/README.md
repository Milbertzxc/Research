# Buenavista — Building Permit Processing System (Frontend Prototype)

React + Vite + Tailwind CSS + Lucide React prototype for the **Municipality of Buenavista
Web-Based Building Permit Processing System**.

Standalone folder — the existing MPDO Express/MySQL app in the repo root is untouched.

## Run

```cmd
cd buenavista
npm.cmd install
npm.cmd run dev
```

Open http://localhost:5174

## Structure

- `src/App.jsx` — state-driven role switcher (`roles → signin → app`), no router needed
- `src/data/mock.js` — all demo data (users, queues, zones, fees totaling ₱2,372.00)
- `src/components/` — `ui.jsx` (Card, Badge, StatCard, Steps, Modal, Timeline, Toggle),
  `Layout.jsx` (navy `#1A365D` sidebar + teal `#0D9488` active states), `ZoneMap.jsx` (SVG GIS)
- `src/pages/` — RoleSelect, SignIn, applicant (dashboard, locational 5-step, building-permit
  5-step, tracking), mpdo, official, inspector, admin

## Design tokens

- Sidebar `bg-[#1A365D]`, accent `bg-[#0D9488]`, canvas `bg-[#F1F5F9]`
- Cards `bg-white rounded-xl border border-slate-200 shadow-sm`
- Badges: emerald (approved/compliant/passed/uploaded), amber (pending/review/revision),
  rose (rejected/non-compliant/failed/missing)
