# Spacebar Timing Game - SPEC.md

## Concept & Vision

A precision timing game where players must press spacebar exactly 16 times under specific constraints. The game tests players' ability to sense time intervals through three distinct challenge modes. The experience feels like a rhythm training tool with a clean, arcade-inspired aesthetic that provides immediate visual feedback on performance.

## Design Language

### Aesthetic Direction
Retro-arcade meets modern minimalism. Clean geometric shapes with neon accents on dark backgrounds, reminiscent of 80s arcade cabinets but with contemporary polish.

### Color Palette
- **Primary**: `#6366f1` (Indigo - main interactive elements)
- **Secondary**: `#22d3ee` (Cyan - accents and highlights)
- **Success**: `#10b981` (Emerald - correct actions)
- **Danger**: `#ef4444` (Red - resets/errors)
- **Warning**: `#f59e0b` (Amber - warnings)
- **Background**: `#0f172a` (Dark slate)
- **Surface**: `#1e293b` (Lighter slate for cards)
- **Text Primary**: `#f8fafc` (Near white)
- **Text Secondary**: `#94a3b8` (Muted gray)

### Typography
- **Font**: Inter (Google Fonts) with system-ui fallback
- **Headings**: Bold, tracking-tight
- **Body**: Regular weight, good readability

### Motion Philosophy
- Quick, snappy transitions (150-200ms) for feedback
- Smooth progress animations for the main counter
- Bar chart animations on game end (staggered entrance)
- Shake animation on reset
- Pulse animation on successful press

## Layout & Structure

### Page Structure
1. **Title Bar**: Game title with neon glow effect
2. **Mode Selection**: Three large clickable cards for mode selection
3. **Game Area**: Central focus with:
   - Current press count (large, prominent)
   - Current interval display
   - Last interval indicator
   - Progress ring showing completion
4. **Instructions Panel**: Context-sensitive instructions based on current mode
5. **Results Modal**: Appears on completion with bar chart and stats

### Responsive Strategy
- Centered layout, max-width 600px
- Works on desktop primarily (spacebar required)
- Mobile shows "desktop only" message

## Features & Interactions

### Mode 1: Monotonic Increasing
- Player must press spacebar 16 times
- Each interval must be LARGER than the previous
- If new interval ≤ previous interval: RESET (flash red, shake, restart count)
- On completion: Show bar chart of all 16 intervals + total time
- Bar colors: Gradient from cyan to indigo based on interval size

### Mode 2: Monotonic Decreasing
- Same as Mode 1, but each interval must be SMALLER than the previous
- If new interval ≥ previous interval: RESET

### Mode 3: Equal Intervals Challenge
- Each interval must be > 0.5 seconds (500ms)
- Goal: Make all intervals as equal as possible
- Scoring formula: `max(0, 100 - (stdDev of intervals * 100))`
- If any interval ≤ 0.5s: RESET
- On completion: Show bar chart + score (0-100) + std deviation

### Core Interactions
- **Spacebar Press**: Registers hit, updates interval, advances count
- **Reset**: Brief shake animation, counter returns to 0, intervals cleared
- **Mode Selection**: Click to choose, transition to game view
- **Back Button**: Return to mode selection from game

### Edge Cases
- First press: No interval calculation, just start timer
- Pressing too fast in Mode 3: Show warning before reset
- Browser focus: Pause if window loses focus

## Component Inventory

### Mode Selection Card
- States: Default (dark surface), Hover (border glow), Active (pressed scale)
- Icon + Title + Description
- Subtle gradient on hover

### Press Counter
- Large number display (current/total)
- Circular progress indicator
- Pulse animation on each valid press
- Shake + red flash on invalid press

### Interval Display
- Shows last interval in seconds
- Color-coded: Green (good), Yellow (warning), Red (bad)
- Small text showing "interval" label

### Bar Chart (Results)
- Horizontal bars for each of the 16 intervals
- Y-axis: Interval number (1-16)
- X-axis: Time in milliseconds
- Total time shown as a special highlighted bar
- Hover: Show exact value
- Staggered animation on appear

### Score Display (Mode 3)
- Large score number with circular progress
- Color gradient: Red (0) → Yellow (50) → Green (100)
- Rating text: "Perfect!", "Great!", "Good", "Keep Practicing"

### Reset Toast
- Brief popup showing "Reset! Intervals must be [increasing/decreasing/equal]"
- Auto-dismiss after 1.5s
- Red accent border

## Technical Approach

### Framework
- React with TypeScript
- Vite build tool
- Tailwind CSS for styling
- No external charting library - custom SVG bars

### State Management
- React useState/useReducer for game state
- Game states: 'menu' | 'playing' | 'results'

### Key Data Structures
```typescript
interface GameState {
  mode: 'increasing' | 'decreasing' | 'equal';
  pressCount: number;
  intervals: number[]; // in milliseconds
  startTime: number | null;
  lastPressTime: number | null;
  gameState: 'menu' | 'playing' | 'results';
}
```

### Key Implementation Details
- Use `performance.now()` for high-precision timing
- Event listener on `keydown` for spacebar
- Prevent default spacebar scroll behavior
- Calculate intervals as differences between press times
