# 3D T³ - Three-Dimensional Tic-Tac-Toe

<div align="center">

**A strategic twist on the classic game - Tic-Tac-Toe in 3D with takeovers, multiplayer, and tournaments**

[Play Now](https://your-deployment-url.com) • [Report Bug](https://github.com/yourusername/3d-tic-tac-toe/issues) • [Request Feature](https://github.com/yourusername/3d-tic-tac-toe/issues)

</div>

---

## 📖 Table of Contents

- [About](#about)
- [Features](#features)
- [Game Rules](#game-rules)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Database Setup](#database-setup)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)
- [Credits](#credits)

---

## 🎮 About

**3D T³** (3D Tic-Tac-Toe) is a modern, strategic reimagining of the classic Tic-Tac-Toe game. Instead of a flat 3×3 grid, players compete on a **3×3×3 cube** with 27 cells across 3 layers, creating **49 possible winning lines**!

The game features:
- **Strategic Takeovers**: Replace opponent pieces (limited to 5 per player)
- **Multiple Game Modes**: Local play, online lobbies, and tournament brackets
- **Real-time Multiplayer**: Powered by Supabase for instant synchronization
- **Stunning 3D Graphics**: Built with Three.js and React Three Fiber
- **Timer Options**: Unlimited, per-move, or time bank modes
- **Responsive Design**: Beautiful dark/light themes with smooth animations

---

## ✨ Features

### 🎯 Core Gameplay
- **3D Board**: 27 cells arranged in a 3×3×3 cube
- **49 Winning Lines**: Horizontal, vertical, diagonal, and through-layer combinations
- **Takeover Mechanic**: Each player gets 5 takeovers to replace opponent pieces
- **Anti-Instant-Win Rule**: Takeovers cannot directly complete a winning line
- **2-3 Players**: Support for 2 or 3 simultaneous players

### 🌐 Multiplayer Modes
- **Local Play**: Pass-and-play on a single device
- **Online Lobbies**: Create or join games with 6-character codes
- **Tournament Mode**: 4 or 8-player single-elimination brackets
- **Real-time Sync**: Instant updates via Supabase Realtime

### ⏱️ Timer System
- **Unlimited**: No time pressure
- **Per-Move Timer**: Fixed time per move (customizable)
- **Time Bank**: Total time pool with per-move limits

### 🎨 User Experience
- **Interactive 3D Board**: Rotate, zoom, and click cells in 3D space
- **Dark/Light Themes**: Persistent theme preferences
- **Sound Effects**: Audio feedback for moves and events
- **Responsive UI**: Works on desktop and mobile devices
- **Nickname System**: Persistent player identification

---

## 📜 Game Rules

### Objective
Get **3 of your pieces in a row** in any direction across the 3D cube.

### The Board
- **3 Layers** stacked vertically (Bottom, Middle, Top)
- **9 Cells per layer** in a 3×3 grid
- **27 Total cells**
- **49 Possible winning lines**:
  - 9 rows per layer (27 total)
  - 9 columns per layer (27 total)
  - 6 diagonals per layer (18 total)
  - 4 vertical pillars through all layers
  - 4 diagonal pillars through all layers
  - 4 space diagonals corner-to-corner

### Gameplay
1. **Players take turns** placing their pieces on empty cells
2. **Takeovers**: Once per turn, use a takeover to replace an opponent's piece
   - Each player has **5 takeovers** per game
   - **Cannot use takeovers to instantly win** (no immediate 3-in-a-row)
3. **First to 3-in-a-row wins**
4. **Draw**: If all cells are filled with no winner

### Strategic Tips
- The **center cell** (middle layer, middle position) is part of **13 winning lines**!
- Control corners and edges to maximize winning opportunities
- Save takeovers for critical defensive or offensive plays
- Think in 3D - lines can go through layers!

---

## 🛠️ Tech Stack

### Frontend
- **[Next.js 16](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Three.js](https://threejs.org/)** - 3D graphics engine
- **[@react-three/fiber](https://docs.pmnd.rs/react-three-fiber)** - React renderer for Three.js
- **[@react-three/drei](https://github.com/pmndrs/drei)** - Useful helpers for R3F
- **[Zustand](https://zustand-demo.pmnd.rs/)** - State management

### Backend & Database
- **[Supabase](https://supabase.com/)** - PostgreSQL database with real-time subscriptions
- **Supabase Realtime** - WebSocket-based live updates
- **PostgreSQL** - Relational database for lobbies, tournaments, and players

### Utilities
- **[UUID](https://www.npmjs.com/package/uuid)** - Unique identifier generation
- **CSS Modules** - Scoped styling

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18.x or higher
- **npm** or **yarn** or **pnpm**
- **Supabase account** (free tier works!)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/3d-tic-tac-toe.git
   cd 3d-tic-tac-toe
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up the database**
   
   Run the SQL scripts in your Supabase SQL Editor:
   - First: `supabase/tournament_tables.sql`
   - Then: `supabase/lobby_enhancements.sql`

5. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
3d-tic-tac-toe/
├── public/                    # Static assets
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── demo/             # Demo/testing page
│   │   ├── game/[code]/      # Active game page
│   │   ├── lobby/            # Lobby creation and joining
│   │   │   ├── create/       # Create lobby page
│   │   │   └── [code]/       # Lobby waiting room
│   │   ├── local/            # Local multiplayer page
│   │   ├── rules/            # Game rules page
│   │   ├── tournament/       # Tournament mode
│   │   │   ├── create/       # Create tournament
│   │   │   └── [code]/       # Tournament bracket view
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Home page
│   │   └── globals.css       # Global styles
│   │
│   ├── components/
│   │   ├── game/             # Game UI components
│   │   │   ├── GameHUD.tsx   # Heads-up display
│   │   │   ├── GameTimer.tsx # Game timer display
│   │   │   └── MoveTimer.tsx # Per-move timer
│   │   ├── three/            # 3D components
│   │   │   ├── Cell.tsx      # Individual 3D cell
│   │   │   ├── GameBoard.tsx # 3D board container
│   │   │   └── GamePiece.tsx # Player piece (X/O)
│   │   └── ui/               # Reusable UI components
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Input.tsx
│   │       ├── Modal.tsx
│   │       ├── ThemeToggle.tsx
│   │       └── index.ts
│   │
│   └── lib/                  # Core logic and utilities
│       ├── game/             # Game logic
│       │   ├── logic.ts      # Win detection, move validation
│       │   ├── store.ts      # Zustand state management
│       │   └── types.ts      # TypeScript types
│       ├── supabase/         # Supabase integration
│       │   ├── client.ts     # Supabase client
│       │   ├── lobby.ts      # Lobby operations
│       │   ├── realtime.ts   # Realtime subscriptions
│       │   └── tournament.ts # Tournament operations
│       └── sounds.ts         # Audio management
│
├── supabase/                 # Database schemas
│   ├── tournament_tables.sql # Tournament tables
│   └── lobby_enhancements.sql # Lobby timer columns
│
├── .env.example              # Environment variables template
├── next.config.ts            # Next.js configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Dependencies
```

---

## 🗄️ Database Setup

### Supabase Tables

The application uses the following database tables:

#### 1. `lobbies`
Stores online game lobbies.

```sql
- id (UUID, primary key)
- code (VARCHAR(6), unique) - 6-character join code
- host_session_id (VARCHAR(100)) - Creator's session ID
- status (VARCHAR(20)) - 'waiting', 'in_progress', 'completed'
- player_count (INTEGER) - 2 or 3
- time_mode (VARCHAR(20)) - 'unlimited', 'per_move', 'time_bank'
- time_per_move (INTEGER) - Seconds per move
- time_bank (INTEGER) - Total time bank in seconds
- created_at (TIMESTAMPTZ)
```

#### 2. `tournaments`
Stores tournament lobbies.

```sql
- id (UUID, primary key)
- code (VARCHAR(6), unique)
- name (VARCHAR(50))
- host_session_id (VARCHAR(100))
- status (VARCHAR(20)) - 'waiting', 'in_progress', 'completed'
- player_count (INTEGER) - 4 or 8
- current_round (INTEGER)
- winner_id (UUID)
- created_at (TIMESTAMPTZ)
```

#### 3. `tournament_participants`
Players in a tournament.

```sql
- id (UUID, primary key)
- tournament_id (UUID, foreign key)
- session_id (VARCHAR(100))
- nickname (VARCHAR(50))
- seed (INTEGER) - Bracket position (1-8)
- eliminated (BOOLEAN)
- placement (INTEGER) - Final standing
- created_at (TIMESTAMPTZ)
```

#### 4. `tournament_matches`
Individual matches within tournaments.

```sql
- id (UUID, primary key)
- tournament_id (UUID, foreign key)
- round (INTEGER) - Round number
- match_order (INTEGER) - Position within round
- player1_id (UUID, foreign key)
- player2_id (UUID, foreign key)
- winner_id (UUID, foreign key)
- lobby_code (VARCHAR(6)) - Links to lobbies table
- status (VARCHAR(20)) - 'pending', 'ready', 'in_progress', 'completed'
- created_at (TIMESTAMPTZ)
```

### Setup Instructions

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor in your Supabase dashboard
3. Run `supabase/tournament_tables.sql` first
4. Run `supabase/lobby_enhancements.sql` second
5. Enable Realtime for all tables (already included in the SQL scripts)

---

## 🔐 Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
# Get these from: https://app.supabase.com/project/_/settings/api

NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: For server-side operations requiring elevated privileges
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Where to Find Your Supabase Credentials

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 💻 Development

### Available Scripts

```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run ESLint
npm run lint
```

### Development Tips

1. **Local Testing**: Use `/local` route for quick offline testing
2. **Demo Mode**: Visit `/demo` for a standalone demo board
3. **Theme Testing**: Toggle between dark/light themes to test styling
4. **Realtime Debugging**: Check Supabase Realtime logs in the dashboard

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Next.js recommended config
- **CSS Modules**: Component-scoped styles
- **Naming Conventions**:
  - Components: PascalCase (`GameBoard.tsx`)
  - Utilities: camelCase (`checkWin.ts`)
  - CSS Modules: camelCase (`styles.container`)

---

## 🚢 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Click **Deploy**

3. **Configure Domain** (optional)
   - Add a custom domain in Vercel project settings

### Other Deployment Options

- **Netlify**: Works with Next.js
- **Railway**: Supports Next.js deployments
- **Self-hosted**: Use `npm run build` and `npm run start`

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m "Add amazing feature"
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Contribution Ideas

- 🎨 New themes or color schemes
- 🔊 Additional sound effects
- 🌍 Internationalization (i18n)
- 📱 Mobile app version
- 🤖 AI opponent
- 📊 Statistics and leaderboards
- ♿ Accessibility improvements

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Credits

**Developed by [Monish Saravana](https://monishsaravana.com)**

### Technologies Used

- [Next.js](https://nextjs.org/) - React framework
- [Three.js](https://threejs.org/) - 3D graphics
- [Supabase](https://supabase.com/) - Backend and database
- [Zustand](https://zustand-demo.pmnd.rs/) - State management
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) - React renderer for Three.js

### Inspiration

3D Tic-Tac-Toe has been around since the 1970s, but this modern implementation brings it to the web with real-time multiplayer, tournaments, and stunning 3D graphics.

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/3d-tic-tac-toe/issues)
- **Email**: monish.sd.2008@gmail.com
- **Website**: [monishsaravana.com](https://monishsaravana.com)

---

<div align="center">

**Enjoy playing 3D T³!** 🎮

If you like this project, please consider giving it a ⭐ on GitHub!

</div>
