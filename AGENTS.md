# Tap In — Developer & Agent Guide

Tap In is a framework for building phone-based local multiplayer games using Next.js and Supabase Realtime. One person creates a party, shares a QR code, everyone joins on their phones, and the game runs in real time.

## Architecture

### Three-Layer Design

1. **Party System** — lobby management, QR codes, player join flow, presence tracking
2. **Game Engine** — state synchronization, action dispatch, per-player views via Supabase Realtime
3. **Game Definitions** — individual games that plug into the engine with a standardized interface

### Host-Authoritative Model

The **host's browser is the single source of truth**. There is no server-side game state. The host runs the game reducer, processes actions from all players, and broadcasts state updates. If the host disconnects, the game session ends. This is intentional — the system is designed for ephemeral party games, not persistent lobbies.

### Realtime Channels (Supabase)

All communication uses Supabase Realtime. No database tables exist.

| Channel | Purpose |
|---|---|
| `tapin:{code}` | Party presence — tracks connected players |
| `tapin:{code}:game` | Game actions — players send actions, host listens |
| `tapin:{code}:private:{playerId}` | Per-player state — secrets only that player should see |

**Broadcast** is used for game state and actions. **Presence** is used for player tracking in the lobby.

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Home — game picker, host profile, join by code
│   ├── join/[code]/page.tsx        # Join page — scanned from QR code
│   ├── party/[code]/page.tsx       # Party lobby + active game renderer
│   ├── layout.tsx                  # Root layout with Tap In metadata + fonts
│   └── globals.css                 # Tailwind imports + CSS variables
├── lib/
│   ├── fonts.ts                    # Shared next/font (wordmark)
│   ├── supabase/
│   │   └── client.ts               # Supabase browser client singleton
│   ├── party/
│   │   ├── types.ts                # Party, Player interfaces
│   │   ├── party-code.ts           # Short code generator (nanoid)
│   │   ├── session.ts              # sessionStorage for passing party intent between pages
│   │   └── useParty.ts             # Hook: connect to party, presence
│   └── engine/
│       ├── types.ts                # GameDefinition, JoinField, view props
│       ├── registry.ts             # Register + look up game definitions
│       ├── useGameEngine.ts        # Host-side: reducer loop, broadcasts
│       └── usePlayerEngine.ts      # Player-side: receive state, dispatch
├── components/
│   ├── brand/
│   │   └── TapInWordmark.tsx       # Typographic logo (Outfit)
│   ├── party/
│   │   ├── GamePicker.tsx          # Search + grid game selection
│   │   ├── JoinForm.tsx            # Dynamic form from JoinField schema (join or host)
│   │   ├── QRCodeDisplay.tsx       # QR code + party code display
│   │   ├── PlayerList.tsx          # Connected player list
│   │   └── Lobby.tsx               # Pre-game lobby with start button
│   └── ui/
│       ├── Button.tsx              # Shared button component
│       ├── Input.tsx               # Shared text input
│       └── Select.tsx              # Shared select dropdown
└── games/
    ├── registry.ts                 # Imports and registers all games
    └── hot-take/
        ├── index.ts                # Hot Take GameDefinition
        └── PlayerView.tsx          # Hot Take player UI
```

## Home page: creating a party

1. **Pick a game** — [`GamePicker`](src/components/party/GamePicker.tsx) loads games from [`getAllGames()`](src/lib/engine/registry.ts). Search filters by name/description; cards show title, description, and player range. **Continue** moves to the profile step.
2. **Host profile** — [`JoinForm`](src/components/party/JoinForm.tsx) with `variant="host"` collects display name and the selected game’s `joinFields` (same schema joiners use for that game). Copy explains that a party code appears after this step.
3. **Session** — On submit, the app generates a code and `playerId`, then [`savePartySession`](src/lib/party/session.ts) with `{ intent: "create", code, playerId, name, data, gameId }`. The host is no longer hardcoded as `"Host"`; `name` and `data` are passed into presence via [`useParty`](src/lib/party/useParty.ts).
4. **Join by code** — Secondary action on the home page still navigates to `/join/[code]` for players entering a code manually.

## How to Create a New Game

### Step 1: Create a game folder

Create `src/games/my-game/` with at least two files: `index.ts` and `PlayerView.tsx`.

### Step 2: Define the game state, actions, and definition

In `src/games/my-game/index.ts`:

```typescript
import type { GameDefinition } from "@/lib/engine/types";
import { MyGamePlayerView } from "./PlayerView";

// 1. Define your game state shape
export interface MyGameState {
  phase: "playing" | "finished";
  currentTurn: string;
  scores: Record<string, number>;
  // ... any game-specific state
}

// 2. Define the actions players can send
export type MyGameAction =
  | { type: "make-move"; data: string }
  | { type: "end-turn" };

// 3. Export the game definition
export const myGame: GameDefinition<MyGameState, MyGameAction> = {
  id: "my-game",              // Unique ID, used in URLs and registry
  name: "My Game",            // Display name
  description: "A fun game!", // Shown in game picker
  minPlayers: 2,
  maxPlayers: 8,

  // Fields shown on the join form (in addition to name, which is always collected).
  // Return [] if you only need the player's name.
  joinFields: [
    {
      name: "favoriteColor",
      label: "Favorite Color",
      type: "color",
      required: true,
    },
    {
      name: "team",
      label: "Team",
      type: "select",
      options: [
        { label: "Red Team", value: "red" },
        { label: "Blue Team", value: "blue" },
      ],
      required: true,
    },
  ],

  // Called once when the host starts the game
  createInitialState(players) {
    const scores: Record<string, number> = {};
    for (const p of players) {
      scores[p.id] = 0;
    }
    return {
      phase: "playing",
      currentTurn: players[0].id,
      scores,
    };
  },

  // Runs on the HOST only. Must be a pure function.
  // Returns the new state after processing an action.
  reducer(state, action, playerId) {
    switch (action.type) {
      case "make-move":
        // ... handle the move
        return { ...state };
      case "end-turn":
        // ... advance turn
        return { ...state };
      default:
        return state;
    }
  },

  // Controls what each player sees. Use this to hide secrets.
  // For example, in a card game, only show a player their own hand.
  getPlayerView(state, playerId) {
    return {
      ...state,
      // Strip out any data this player shouldn't see
    };
  },

  PlayerView: MyGamePlayerView,
};
```

### Step 3: Build the player view component

In `src/games/my-game/PlayerView.tsx`:

```typescript
"use client";

import type { PlayerViewProps } from "@/lib/engine/types";
import type { MyGameState, MyGameAction } from "./index";
import { Button } from "@/components/ui/Button";

export function MyGamePlayerView({
  state,
  playerId,
  players,
  dispatch,
}: PlayerViewProps<MyGameState, MyGameAction>) {
  const isMyTurn = state.currentTurn === playerId;

  return (
    <div>
      <h2>My Game</h2>
      {isMyTurn && (
        <Button onClick={() => dispatch({ type: "make-move", data: "hello" })}>
          Make Move
        </Button>
      )}
    </div>
  );
}
```

### Step 4: Register the game

In `src/games/registry.ts`, add:

```typescript
import { registerGame } from "@/lib/engine/registry";
import { hotTakeGame } from "./hot-take";
import { myGame } from "./my-game";

registerGame(hotTakeGame);
registerGame(myGame);
```

That's it. The game will now appear in the game picker on the home page.

## Key Types Reference

### `GameDefinition<TState, TAction, TPlayerData>`

The main interface every game implements. See `src/lib/engine/types.ts`.

| Property | Type | Description |
|---|---|---|
| `id` | `string` | Unique game identifier |
| `name` | `string` | Display name |
| `description` | `string` | Short description for game picker |
| `minPlayers` | `number` | Minimum players required |
| `maxPlayers` | `number` | Maximum players allowed |
| `joinFields` | `JoinField[]` | Extra fields on the join form |
| `createInitialState` | `(players) => TState` | Creates starting game state |
| `reducer` | `(state, action, playerId) => TState` | Pure function, processes actions |
| `getPlayerView` | `(state, playerId) => Partial<TState>` | Filters state per player |
| `PlayerView` | React component | What each player sees during the game |
| `LobbyView` | React component (optional) | Custom lobby UI |

### `JoinField`

Defines a field on the join form. The player's name is always collected automatically.

| Property | Type | Description |
|---|---|---|
| `name` | `string` | Field key in the player's `data` object |
| `label` | `string` | Label shown to the player |
| `type` | `"text" \| "select" \| "color" \| "number"` | Input type |
| `required` | `boolean` | Whether the field must be filled |
| `options` | `{ label, value }[]` | Options for `select` type |
| `placeholder` | `string` | Placeholder text |
| `defaultValue` | `string` | Default value |

### `Player<TData>`

```typescript
interface Player<TData = Record<string, unknown>> {
  id: string;        // Unique ID (UUID)
  name: string;      // From join form
  isHost: boolean;
  joinedAt: number;   // Timestamp
  data: TData;       // Custom data from joinFields
}
```

### `PlayerViewProps<TState, TAction>`

Props passed to your `PlayerView` component:

| Prop | Type | Description |
|---|---|---|
| `state` | `TState` | Game state (filtered by `getPlayerView` for non-hosts) |
| `playerId` | `string` | This player's ID |
| `players` | `Player[]` | All players in the party |
| `dispatch` | `(action: TAction) => void` | Send an action to the host |

## Navigation & Session Pattern

Because Next.js App Router unmounts components on navigation, WebSocket connections cannot survive page transitions. The platform uses **sessionStorage** to pass intent between pages:

1. **Home page** (`/`) — generates a party code and player ID, saves a `PartySession` to sessionStorage with `intent: "create"`, then navigates to `/party/[code]`. No WebSocket is opened here.
2. **Join page** (`/join/[code]`) — collects the player's name and form data, saves a `PartySession` with `intent: "join"`, then navigates to `/party/[code]`. No WebSocket is opened here.
3. **Party page** (`/party/[code]`) — calls `useParty({ code, autoConnect: true })`, which reads the session from sessionStorage and opens the WebSocket connection.

The `PartySession` interface (`src/lib/party/session.ts`):

```typescript
interface PartySession {
  intent: "create" | "join";
  code: string;
  playerId: string;
  name: string;
  gameId?: string;
  data?: Record<string, unknown>;
}
```

Use `savePartySession()` before navigating and `loadPartySession()` / `clearPartySession()` on the destination page.

## Hooks Reference

### `useParty(options?)`

Connects to a party channel and manages presence.

**Returns:** `{ party, playerId, isHost, channel, connected, leaveParty, updatePartyStatus, setGameId }`

- `connected` — true once the WebSocket is subscribed
- `leaveParty()` — disconnects and clears session
- `updatePartyStatus(status)` — host only, broadcasts status change
- `setGameId(gameId)` — host only, broadcasts gameId to players
- `broadcastUpdate(partial)` — host only, broadcasts arbitrary partial party update (e.g., `{ gameId, status }` together)

**Options:**
- `code?: string` — party code to connect to
- `autoConnect?: boolean` — if true, reads session from sessionStorage and connects on mount
- `onPlayerJoin?: (player) => void`
- `onPlayerLeave?: (player) => void`

### `useGameEngine(options)`

Host-side hook. Runs the game reducer and broadcasts state.

**Options:** `{ game, partyCode, players, isHost, active }`

**Returns:** `{ state, started, start }`

- `start()` — initializes and broadcasts the first game state

### `usePlayerEngine(options)`

Player-side hook. Receives state updates, dispatches actions.

**Options:** `{ partyCode, playerId, active }`

**Returns:** `{ state, playerState, dispatch }`

- `state` — public game state (from Broadcast)
- `playerState` — private state (from per-player channel)
- `dispatch(action)` — sends action to host via Broadcast

## Game Design Patterns

### Phases / Turns

Use a `phase` field in your state to drive conditional rendering:

```typescript
interface State {
  phase: "setup" | "playing" | "scoring" | "finished";
}
```

In the reducer, validate that actions are appropriate for the current phase. In the PlayerView, render different UI per phase.

### Hidden Information

Use `getPlayerView` to strip secrets. The host sees the full state; each player sees only what `getPlayerView` returns for their ID.

```typescript
getPlayerView(state, playerId) {
  return {
    ...state,
    hands: { [playerId]: state.hands[playerId] }, // only your own hand
    secretRole: undefined, // hide from everyone
  };
}
```

The per-player private channel (`tapin:{code}:private:{playerId}`) delivers the filtered state to each player individually.

### Timed Events

The reducer is synchronous and event-driven. For timers (e.g., a 30-second countdown), use `setTimeout` in the `PlayerView` component or a wrapper, and dispatch an action when the timer fires:

```typescript
useEffect(() => {
  if (state.phase === "voting") {
    const timer = setTimeout(() => {
      dispatch({ type: "timeout" });
    }, 30000);
    return () => clearTimeout(timer);
  }
}, [state.phase]);
```

### Player Data from Join Fields

Access custom data collected at join time via `player.data`:

```typescript
createInitialState(players) {
  const teams: Record<string, string> = {};
  for (const p of players) {
    teams[p.id] = p.data.team as string; // from joinFields
  }
  return { teams };
}
```

## Development Setup

### Prerequisites

- Node.js 18+
- A Supabase project (free tier works)

### Environment Variables

Copy `.env.local` and fill in your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://192.168.1.XXX:3000
```

Set `NEXT_PUBLIC_SITE_URL` to your machine's local IP for QR codes to work across devices on the same network.

### Running

```bash
npm run dev
```

The dev server binds to `0.0.0.0` so it's accessible from other devices on the same network. Open `http://192.168.1.XXX:3000` on your phone to test.

### Supabase Setup

Only Realtime is used — no database tables, migrations, or RLS policies needed. Just create a Supabase project and grab the URL and anon key from Settings > API.

## Common Pitfalls

- **Reducer must be pure.** No side effects, no async, no randomness that isn't seeded. The reducer runs on the host only.
- **Always return new state objects** from the reducer. Mutating state in place will break React's change detection.
- **`getPlayerView` must not leak secrets.** Double-check that you're not accidentally including hidden data (like other players' cards or roles).
- **Games must be registered** in `src/games/registry.ts` or they won't appear in the picker.
- **The `"use client"` directive** is required on all components and hooks that use React hooks or browser APIs.
- **Import `@/games/registry`** as a side-effect in any page that needs access to registered games (the home page, join page, and party page all do this).
- **Never open WebSocket connections on pages that navigate away immediately.** The home page and join page save intent to sessionStorage and let the party page connect. Opening connections before navigation will cause "WebSocket closed before connection established" errors.
- **`crypto.randomUUID()` doesn't work over HTTP** (non-secure context). Use `nanoid()` for generating IDs in dev.
- **QR code must use `window.location.origin`**, not `NEXT_PUBLIC_SITE_URL` or hardcoded localhost. The QRCodeDisplay component defers rendering until client-side mount to get the correct origin.
- **All players subscribe to the same game channel** (`tapin:{code}:game`). The host listens for `game:action` events and broadcasts `game:state` events on this channel. Players must be on this exact channel name to receive state and send actions.
- **When starting a game, broadcast `gameId` along with `status`.** Players don't have the `gameId` from session storage (only the host does). Use `broadcastUpdate({ gameId, status: "playing" })` to send both in one message so players can resolve the game definition.

## Tech Stack

| Tool | Purpose |
|---|---|
| Next.js 16 (App Router) | React framework, routing |
| Supabase | Realtime only (Broadcast + Presence) |
| TypeScript | Type safety |
| Tailwind CSS 4 | Styling |
| qrcode.react | QR code rendering |
| nanoid | Short party code generation |
