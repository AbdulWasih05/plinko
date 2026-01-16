# Plinko Cosmic

A high-performance, deterministic Plinko game featuring a transparent fairness protocol, smooth physics-based animations, and a robust microservices-ready architecture.

---

## Run Locally

### Environment Variables
Create a `.env` file in the `backend` and `frontend` directories using the provided `.env.example` templates.

**Backend (.env):**
```env
PORT=5000
NODE_ENV=development
DB_PROVIDER=sqlite
DATABASE_URL="file:./dev.db"
FRONTEND_URL=http://localhost:3000
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:5000
```

### Installation
```bash
# 1. Start Database (Docker required for postgres, or use SQLite locally)
docker-compose -f docker-compose.dev.yml up -d

# 2. Setup Backend
cd backend
npm install
npx prisma db push
npm run dev

# 3. Setup Frontend
cd ../frontend
npm install
npm run dev
```

---

##  Architecture Overview

The system is split into two primary layers:

1.  **Frontend (React + Matter.js)**: Handles the UI and real-time physics simulation. It uses a deterministic path received from the backend to ensure the visual animation matches the cryptographic result.
2.  **Backend (Node.js + Prisma)**: Manages the Provably Fair lifecycle. It pre-calculates the game outcome using a seeded PRNG and stores the audit trail in the database.

---

##  Fairness Specification

The integrity of every drop is guaranteed by a **Commit-Reveal** protocol.

*   **Hash Algorithm**: SHA-256 for all commitments and seed combinations.
*   **PRNG**: 32-bit **XORShift** implementation (Marsaglia's algorithm).
*   **Peg Map Rules**:
    *   12-Row grid.
    *   Each peg contains a `leftBias` (default 0.5 ± 0.1).
    *   Rounding is enforced at `1e-6` decimal places to ensure cross-platform hash stability.
*   **Protocol Flow**:
    1.  **Server Commit**: `SHA256(serverSeed + nonce)`
    2.  **Client Contribution**: Player provides `clientSeed`.
    3.  **Determination**: `SHA256(serverSeed + clientSeed + nonce)` seeds the XORShift32 engine to calculate the path.

---

## 🤖 AI Usage Summary

This project effectively leveraged **Antigravity (Google DeepMind)** as a pair-programmer to accelerate architectural decisions, optimize complex performance bottlenecks, and refine the end-user experience.

### High-Impact Contributions
*   **Physics-UX Bridge**: 
    - *Prompt*: "implement 13 bins at the bottom... ball stays there."
    - *Optimization*: AI suggested a **velocity-threshold detector** instead of a collision-based trigger. This ensures the game result (multipliers/confetti) only fires when the ball is visually at rest, significantly polishing the "feel" of the win.
*   **Performance Engineering**:
    - *Task*: Implementing the **XORShift32** PRNG and deterministic path engine.
    - *Benefit*: AI assisted in ensuring the backend simulation is computationally lightweight and produces stable hashes with `1e-6` precision, preventing delta-drift between different execution environments (e.g., local SQLite vs. production PostgreSQL).
*   **UI/UX Refinement**:
    - AI was used to refactor the navigation and control systems for better **accessibility**, including implementing the keyboard-mappers (←/→) and cleaning up the component-tree to improve render cycles on lower-end devices.

While AI generated the initial boilerplate and complex logic blocks, all cryptographic implementations and mission-critical physics hooks were manually reviewed and validated against strict test vectors to ensure reliability.

---

##  Time Log & Next Steps

**Total Time Spent: ~36 Hours**
*   Architecture & Seed Protocol Design: 9h
*   Matter.js Physics Integration: 12h
*   Backend API & Prisma Schema: 9h
*   UI Polish & Verification Logic: 6h

### Next Steps
1.  **Multi-Ball Architecture**: Optimize engine to handle 50+ simultaneous drops.
2.  **Auth Integration**: Link rounds to persistent user profiles.
3.  **Real-time Leaderboards**: Implement WebSockets for a global "Big Wins" feed.

---

## Testing

The backend includes a comprehensive test suite covering the PRNG sequence, fairness protocol, and replay determinism.

```bash
cd backend
npm test
```

**Key Test Files:**
- `tests/game.test.js`: Core engine and payout logic.
- `tests/fairness.test.js`: Explicit verification of assignment test vectors and determinism.

---

## Quick Links

*   **Live App**: [plinko-cosmic.vercel.app](#)
