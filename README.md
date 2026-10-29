# Free Fire Tournament Management System — Windows Desktop

An esports-inspired, production-quality Windows desktop application for managing Free Fire tournaments. Built with **Electron**, **React**, **TypeScript**, **Tailwind CSS**, **SQLite (WASM)**, **SheetJS (`xlsx`)**, **Framer Motion**, and **`discord.js`**.

---

## 🌟 Key Features

1. **Excel Roster Import & Validation**
   - Import `.xlsx` and `.xls` files with full squad rosters (Captain, Starters 2/3/4, Substitute, Coach, Custom Guild UIDs).
   - Automatically detects variations in column headers (`squad_name`, `leader`, `discord uid`, `mobile`, `sub`, etc.).
   - Pre-import preview with validation, duplicate detection, and inline row editing/removal.
   - Preserves all extra custom columns in persistent SQLite JSON storage.

2. **Esports Random Spin Wheel**
   - High-performance, 60fps canvas spin wheel with dark obsidian and glowing neon green esports aesthetics.
   - **Privacy First**: Displays **only** the `Team Name` and `Captain Name` on the wheel segments. No phone numbers, Discord IDs, or starter names are ever exposed during live draws.
   - **True Cryptographic Fairness**: Winner is chosen using Node.js `crypto.randomInt()`. The wheel uses physics deceleration to land precisely on the cryptographically selected team.
   - Built-in Web Audio API sound effects (tick sounds on segment passes, victory fanfare, mute toggle).
   - Configurable target count (default: 12 teams for Free Fire custom rooms).
   - If fewer than 12 eligible teams remain, prompts the organizer with clear choices (continue with remaining teams or reset rotation)—**never fabricates fake teams**.
   - Immediate SQLite persistence after every spin (recovers the active draw if the app is closed).

3. **Team Rotation & Player Participation Enforcement**
   - Prevents teams that have already played from being selected in subsequent draws by default.
   - Team status lifecycle: `Eligible` ➔ `Selected` ➔ `Played` (or `Withdrawn` / `Disqualified`).
   - "Complete Match & Update Excel" workflow:
     1. Review selected squads and full starter/substitute rosters.
     2. Mark teams that actually played (unchecking marks no-show/forfeit).
     3. Check individual player participation (e.g., substitute played instead of starter).
     4. Saves participation in an ACID database transaction.
     5. Automatically marks played teams as ineligible while keeping unplayed teams eligible.
     6. Updates the eligible pool for the next spin wheel draw.
     7. Prompts to download the updated 5-Sheet Excel workbook.

4. **Automatic 5-Sheet Excel Workbook Generation**
   - **Sheet 1: All Teams** — Complete database of all squads, captain contact, full rosters, and current status.
   - **Sheet 2: Eligible Teams** — Clean pool of squads currently eligible for the next draw.
   - **Sheet 3: Played Teams** — History of squads that have already competed.
   - **Sheet 4: Match History** — Match #, custom Room ID, selection orders, actually played status, player notes, and organizer notes.
   - **Sheet 5: Selected Teams** — Latest draw selections and Discord DM notification delivery statuses.
   - Maintains stable team UUIDs to ensure re-importing never duplicates teams or loses history.

5. **Discord Bot DM Integration**
   - Legitimate Discord bot implemented with `discord.js`.
   - Setup instructions built directly into the app.
   - Bot token stored securely in local SQLite settings (never exposed to renderer).
   - Identifies captains using their Discord User ID (numeric Snowflake).
   - Selection DM Approval preview modal with the exact required congratulations message:
     ```text
     🎉 Congratulations, [Captain Name]!

     Your team, [Team Name], has been selected for today's Free Fire tournament match.

     Your match details and room password will be sent later. Please stay ready and keep an eye on your Discord messages.

     Good luck! 🔥
     ```
   - Delayed Match Room ID & Password announcement template:
     ```text
     🔥 Free Fire Tournament — Match Details

     Hello [Captain Name]!

     Your team [Team Name] has been selected for this match.

     Room ID: [Room ID]
     Room Password: [Room Password]
     Match Time: [Match Time]

     Please join on time and follow the tournament rules.

     Good luck! 🎮
     ```
   - Delivery tracking (Pending, Sending, Sent, Failed) with single-click retry and manual notification fallbacks.

6. **SQLite Relational Persistence & Backup**
   - Authoritative SQLite database storing tournaments, squads, players, draws, selections, matches, participation, notifications, settings, and audit logs.
   - One-click full database backup (`.db`) and restoration.

---

## 🚀 Quick Start Guide

### 1. Launch the Application
- **From Source (Development Mode)**:
  ```powershell
  npm run dev
  ```
- **From Packaged Executable**:
  Run `release\win-unpacked\Free Fire Tournament Manager.exe` or install via `release\Free Fire Tournament Manager Setup 1.0.0.exe`.

### 2. Sample Data
A pre-populated sample workbook containing 24 realistic Free Fire squads with 4 starters, substitutes, coaches, and guild IDs is included:
```text
samples/free_fire_sample_teams.xlsx
```
You can import this file via the **Import Excel** page or download a fresh template from the application at any time.

---

## 🧪 Automated Testing

Run the automated test suite with Vitest:
```powershell
npm test
```
The test suite validates:
- Cryptographic fairness & unique 12-team selection
- Excel header alias detection & validation
- Duplicate squad prevention
- Team rotation exclusion & eligibility preservation
- Database transaction atomicity, recovery across crashes, and backup/restore

---

## 🛠 Project Structure

```text
Tournament/
├── electron/
│   ├── main.ts              # Electron main process & IPC handlers
│   ├── preload.ts           # Secure contextBridge interface
│   ├── database.ts          # SQLite database service & migrations
│   ├── excelService.ts      # Excel parser & 5-sheet workbook generator
│   ├── discordService.ts    # Discord bot manager & DM transmitter
│   └── cryptoRandom.ts      # Node.js crypto.randomInt selector
├── src/
│   ├── components/
│   │   ├── Header.tsx       # Custom titlebar & window controls
│   │   ├── Sidebar.tsx      # Esports collapsible navigation
│   │   ├── SpinWheel.tsx    # 60fps canvas spin wheel with Web Audio ticks
│   │   └── ConfirmationModal.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx            # Overview & stats cards
│   │   ├── ImportExcel.tsx          # Excel import & validation
│   │   ├── AllTeams.tsx             # All squads & manual overrides
│   │   ├── TeamRosters.tsx          # 4-player rosters & privacy masking
│   │   ├── RandomSpinWheelPage.tsx  # Interactive live draw
│   │   ├── SelectedTeams.tsx        # Selected squads list
│   │   ├── DiscordNotifications.tsx # Discord bot dashboard & DMs
│   │   ├── MatchDetails.tsx         # Room credentials & announcements
│   │   ├── CompleteMatch.tsx        # Post-match rotation & participation
│   │   ├── DrawHistory.tsx          # Past draw archives
│   │   ├── MatchHistory.tsx         # Historical match records
│   │   ├── ExcelExport.tsx          # 5-sheet export & DB backup
│   │   └── Settings.tsx             # Tournament rules & bot configuration
│   ├── utils/
│   │   ├── audio.ts         # Web Audio API sound synthesizer
│   │   └── helpers.ts       # Formatters & Snowflake validators
│   ├── App.tsx              # Application layout & state
│   ├── main.tsx             # React entry point
│   └── index.css            # Tailwind CSS esports theme
├── samples/
│   └── free_fire_sample_teams.xlsx  # 24-team sample roster
├── release/                 # Packaged Windows executables & installer
├── tests/                   # Automated Vitest test suite
└── package.json
```
