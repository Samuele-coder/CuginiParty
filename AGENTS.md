# CuginiParty — Codex Project Instructions

## Project overview

CuginiParty is a real working web platform containing multiple minigames.

Main technologies:

* HTML
* CSS
* Vanilla JavaScript
* Supabase for backend and multiplayer features
* GitHub / Cloudflare Pages depending on the current deployment

The project is NOT a visual-only demo.

Main goals:

* modern and polished UI
* fun but clean visual style
* responsive desktop/mobile layouts
* vertical scrolling only
* no unnecessary horizontal scrolling
* reliable game logic
* simple navigation
* preserve existing functionality when editing
* avoid breaking unrelated features

---

## CRITICAL WORKING RULE

When modifying one game or feature:

1. Modify only files required for the task.
2. Do not rewrite unrelated games.
3. Do not modify Supabase schema unless explicitly requested.
4. Do not change global styles unless necessary.
5. Preserve working behavior.
6. Prefer targeted edits over unnecessary full rewrites.
7. Inspect the existing implementation before editing it.
8. Check dependencies and referenced files before changing code.
9. After editing, verify:

   * JavaScript syntax
   * DOM IDs
   * file paths
   * event listeners
   * screen transitions
   * responsive layout
10. Never assume an old screen, element, function, or selector still exists. Check the current files first.

---

## Project structure

Typical structure:

CuginiParty/
├── AGENTS.md
├── index.html
├── manifest.json
├── css/
│   ├── style.css
│   ├── games.css
│   ├── racing.css
│   ├── memory.css
│   ├── pizza.css
│   ├── balloons.css
│   ├── aquarium.css
│   └── undercover.css
├── js/
│   ├── app.js
│   ├── supabase.js
│   ├── tris.js
│   ├── uno.js
│   ├── racing.js
│   ├── memory.js
│   ├── pizza.js
│   ├── balloons.js
│   ├── aquarium.js
│   └── undercover.js
├── games/
│   ├── tris.html
│   ├── uno.html
│   ├── racing.html
│   ├── memory.html
│   ├── pizza.html
│   ├── balloons.html
│   ├── aquarium.html
│   └── undercover.html
└── admin/
├── index.html
├── admin.js
└── admin.css

The structure may change over time.

Always inspect the actual repository before relying on this structure.

---

## Existing games

Current games include:

* Tris
* UNO
* Racing
* Memory
* Prepara la pizza
* Scoppia il palloncino
* Acquario magico
* Undercover

Possible future games:

* Block Blast
* Tetris
* Geometry-style game

Do not implement future games unless explicitly requested.

---

## UI / UX rules

CuginiParty should feel:

* modern
* clean
* playful
* polished
* easy to understand

Avoid:

* unnecessary screens
* huge empty spaces
* tiny controls
* excessive animations
* horizontal overflow
* cards touching viewport edges
* inconsistent buttons
* duplicated CSS
* browser-default-looking UI when custom styling already exists

### Mobile

Always prioritize:

* vertical scrolling
* content staying inside the viewport
* large enough touch targets
* readable text
* no horizontal scrolling
* no overflowing cards
* no clipped buttons

### Desktop

Prefer:

* centered content
* comfortable spacing
* appropriate max-width
* clean panels
* no unnecessarily narrow game areas

---

## File paths and casing

The project uses lowercase directories:

* `admin/`
* `games/`
* `css/`
* `js/`

Be careful with case sensitivity.

Correct:

`admin/index.html`

Avoid:

`Admin/index.html`

Game pages normally reference shared files using `../`.

Example:

```html
<link rel="stylesheet" href="../css/style.css">
<link rel="stylesheet" href="../css/games.css">
```

---

## Root application

`index.html` is the main CuginiParty homepage.

It contains:

* game cards
* navigation
* settings
* Admin access

Existing Admin access uses:

```html
<button type="button" class="admin-mode-button" id="adminModeButton">
    ACCEDI
</button>
```

The Admin folder is lowercase:

```text
admin/
```

Do not break the current Admin authentication flow.

---

## Supabase

Supabase is already integrated.

Current project URL:

`https://pzjbxrcxlztwjxetnzkw.supabase.co`

Important:

* reuse the existing Supabase client
* do not create a second competing client
* do not replace Supabase
* do not invent project IDs
* do not expose secrets
* do not rotate or replace existing keys unless explicitly requested
* do not modify existing tables unless explicitly requested
* preserve existing Realtime behavior

Existing backend areas include:

* Admin
* UNO
* Undercover

---

# UNDERCOVER

## General design

Undercover is intended to support:

1. One-phone / Pass-the-phone mode
2. Online multiplayer

The one-phone mode is the primary implemented mode at the current stage.

Online can remain unavailable until explicitly implemented.

---

## Roles

Possible roles:

* Civilian
* Undercover
* Mr. White

Settings:

* Undercover count can be 0, 1, 2, 3, etc.
* Mr. White count can be 0, 1, 2
* There must always be at least one Civilian

Words:

Civilian:

* receives the civilian word

Undercover:

* receives a similar but different word

Mr. White:

* receives `???`

---

## Undercover screen philosophy

Keep the number of screens LOW.

Initial screens may include:

1. Mode selection
2. Game settings
3. Player names
4. Private card reveal

During gameplay, use ONLY the essential screens:

5. INIZIA ROUND
6. INIZIA VOTAZIONE / vote registration
7. VOTAZIONE CONCLUSA / elimination result

Special/final screens:
8. Mr. White guess
9. Victory

Do NOT create separate screens for:

* individual clue turns
* discussion
* each voter
* voting intro
* unnecessary round transitions
* unnecessary information screens

---

## Intended Undercover flow

The desired flow is:

INIZIA ROUND
→ players give clues verbally
→ players discuss verbally
→ INIZIA VOTAZIONE
→ phone holder records votes
→ CONCLUDI VOTAZIONE
→ elimination result
→ one of:

* Mr. White guess
* victory
* next round

---

## Important gameplay rule

After the initial card reveal, players should NOT repeatedly pass the phone during the round.

The players:

* give clues verbally
* discuss verbally
* decide votes verbally

The person currently holding the phone records the votes.

---

## Voting UI

Voting must allow manual vote registration.

For every living player show:

* player name
* `+`
* vote count
* `−`

The phone holder manually records the votes decided by the group.

Do NOT change this into one-player-at-a-time phone voting unless explicitly requested.

Vote counts can be corrected using `+` and `−`.

---

## Undercover rounds

Roles and words remain fixed between rounds.

Do NOT redistribute roles after every elimination.

Only living players participate in future rounds.

Eliminated players must not appear as living in:

* round start
* voting
* active player lists

---

## Mr. White

When Mr. White is eliminated:

1. Show the Mr. White guess screen.
2. Allow Mr. White to enter a word.
3. Compare the guess against the civilian word.
4. Comparison should be case-insensitive and ideally accent-insensitive.

Correct guess:

* Mr. White wins immediately.

Wrong guess:

* do NOT automatically end the entire game unless the actual victory conditions require it.
* continue correctly into the next phase or round.

---

## Undercover victory logic

Victory should be checked after eliminations and special phases.

At minimum:

* Civilians win when all special roles are eliminated.
* Special roles can win when their remaining number reaches parity with the Civilians.
* A successful Mr. White guess is an immediate special win.

Before changing exact game rules, verify the intended Undercover rules.

Do not casually change victory conditions during UI work.

---

## Undercover database

Intended tables:

* `undercover_rooms`
* `undercover_players`
* `undercover_votes`
* `undercover_clues`
* `undercover_categories`
* `undercover_word_pairs`

Important data includes:

* room state
* players
* alive state
* round number
* votes
* clues
* civilian word
* undercover word
* category
* difficulty

When the DB-backed word system is implemented:

* prefer the database as the authoritative source
* local fallback data can remain only as fallback
* do not seed unrelated fictional categories unless requested

---

## Undercover word pairs

Preferred categories are real-life categories.

Examples:

* Pizza / Focaccia
* Pasta / Lasagna
* Hamburger / Cheeseburger
* Gelato / Sorbetto
* Divano / Poltrona
* Doccia / Vasca
* Jeans / Pantaloni
* Tennis / Padel
* Auto / Taxi
* Cane / Lupo
* Mare / Oceano
* Hotel / Resort
* Matita / Penna
* Fratello / Cugino

The eventual database should contain a large number of high-quality pairs across many categories.

---

# CSS RULES

Before adding CSS:

1. Search for the selector first.
2. Check whether it already exists.
3. Avoid adding duplicate blocks.
4. Consolidate conflicting CSS where possible.
5. Keep game-specific styles in that game's CSS file.

Undercover-specific CSS belongs in:

`css/undercover.css`

Do not put Undercover-only styles into:

* `style.css`
* `games.css`

unless there is a genuine global requirement.

---

# JAVASCRIPT RULES

Use clear state-driven logic.

Prefer:

* `"use strict";`
* descriptive names
* small functions
* explicit state transitions
* clear event handlers

Avoid:

* random global state
* duplicate event listeners
* stale DOM references
* hidden dependencies
* silent failures
* referencing removed DOM elements
* multiple competing game state objects

For every state transition:

1. update state
2. update DOM
3. display the correct screen

---

# HTML / JAVASCRIPT SYNCHRONIZATION

This is especially important.

Before writing JavaScript for a page:

* inspect the HTML
* verify every referenced ID
* verify every button
* verify every screen
* verify every class used for dynamic rendering

Never reference an element that does not exist.

Never recreate removed screens in JavaScript just because an older version used them.

---

# TESTING CHECKLIST

After editing HTML:

* all tags closed
* all IDs unique
* CSS paths correct
* JS paths correct
* referenced files actually exist

After editing CSS:

* no accidental duplicate rules
* no horizontal overflow
* mobile layout works
* buttons fit inside viewport
* text remains readable

After editing JavaScript:

* no syntax errors
* no null-reference errors
* every event listener targets a real element
* every screen transition works
* reset works
* restart works
* voting works
* elimination works
* Mr. White works
* victory works
* next round works

---

# Known previous bugs

## Tris

A previous bug occurred because:

* HTML had 9 cells
* JavaScript board contained only 8 entries

Correct board size:

* 9

---

## Admin

A previous path bug used:

`Admin/index.html`

Correct path:

`admin/index.html`

---

## Undercover

Previous versions had mismatches between HTML and JavaScript because old screens were removed while JavaScript still referenced them.

Always inspect the current HTML first.

Another previous bug caused the Continue button after voting to appear broken because the victory screen state was prepared without always switching to the victory screen.

Always verify:

* state update
* `showScreen(...)`
* actual DOM visibility

---

# EDITING PHILOSOPHY

When fixing a bug:

1. Find the actual cause.
2. Change the smallest amount of code necessary.
3. Preserve unrelated functionality.
4. Test the complete affected flow.

When redesigning UI:

* make the requested visual difference obvious
* preserve functionality
* keep the CuginiParty visual language
* avoid making unrelated areas huge
* avoid unnecessary animations

When the user asks for a complete file:

* provide the complete file
* do not provide only a fragment

---

# DO NOT DO WITHOUT EXPLICIT REQUEST

Never:

* delete existing games
* rename the project away from CuginiParty
* replace Supabase
* rewrite the whole project using a framework
* install unnecessary dependencies
* expose secrets
* break Admin
* break UNO
* break existing games
* create unnecessary screens
* introduce horizontal scrolling
* change unrelated files
* commit or push to GitHub unless explicitly requested

---

# PRIORITY ORDER

When implementing features, prioritize:

1. Correct game logic
2. Correct state transitions
3. Reliable functionality
4. Responsive design
5. Visual polish
6. Performance

A beautiful interface is not useful if the game logic is broken.
