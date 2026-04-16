# 🥷 Sabotage

A stealth-action platformer where you play as a ninja infiltrating heavily guarded buildings. Sneak through shadows, eliminate guards with silent weapons, and reach the target room on each floor.

![Phaser 4](https://img.shields.io/badge/Phaser-4.0-blue)
![Vite](https://img.shields.io/badge/Vite-8-purple)
![JavaScript](https://img.shields.io/badge/JavaScript-ES%20Modules-yellow)

## 🎮 Gameplay

You are a ninja on a sabotage mission. Each level is a floor of a building — a labyrinth of corridors, platforms, and shadow zones. Guards patrol the halls. Your job: reach the **green exit door** without getting killed.

- **Stealth is key** — stay in shadow zones to remain hidden
- **Silent kills** — sneak behind guards to take them out quietly
- **Multiple weapons** — katana for close combat, shurikens for ranged attacks, knife for quick strikes
- **Wall mechanics** — wall-slide and wall-jump to navigate vertical spaces

## 🗺️ Levels

| # | Name | Description |
|---|------|-------------|
| 1 | **Basement** | Learn the shadows — a gentle introduction to stealth |
| 2 | **Ground Floor** | More guards, tighter patrols |
| 3 | **Office Level** | Complex layout with multiple paths |
| 4 | **Server Room** | High security, dense guard coverage |
| 5 | **Rooftop** | The final escape — reach the extraction point |

## 🕹️ Controls

| Action | Key |
|--------|-----|
| Move | `A` / `D` or `←` / `→` |
| Jump | `W` or `↑` |
| Crouch | `S` or `↓` |
| Attack | `J` |
| Throw Shuriken | `K` |
| Switch Weapon | `L` |

## ⚔️ Weapons

- **Katana** — 50 damage, medium range melee, the workhorse
- **Shuriken** — 30 damage, long-range thrown projectile (limited ammo)
- **Knife** — 25 damage, short-range but fast cooldown

## 🤖 Guard AI

Guards have three states:
- **Patrol** (blue) — walking a set route, low awareness
- **Suspicious** (yellow) — heard something, investigating
- **Alert** (red) — spotted you, actively chasing and attacking

Guards have a 60° vision cone. Stay in shadows, crouch, and approach from behind for silent kills.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)

### Install & Run

```bash
git clone https://github.com/glebmaz/Sabotage.git
cd Sabotage
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

## 🏗️ Project Structure

```
Sabotage/
├── index.html              # Entry point
├── vite.config.js          # Vite config
├── package.json
├── src/
│   ├── main.js             # Phaser game config & scene registration
│   ├── scenes/
│   │   ├── BootScene.js    # Minimal boot
│   │   ├── PreloadScene.js # Loading screen
│   │   ├── MenuScene.js    # Title screen with controls
│   │   ├── GameScene.js    # Main gameplay loop
│   │   ├── UIScene.js      # HUD overlay (health, ammo, detection)
│   │   ├── LevelCompleteScene.js
│   │   └── GameOverScene.js
│   ├── entities/
│   │   ├── Player.js       # Ninja player with movement & combat
│   │   ├── Guard.js        # Guard AI with patrol & detection
│   │   └── Shuriken.js     # Thrown projectile
│   ├── managers/
│   │   └── LevelManager.js # Tile-based level loader
│   └── utils/
│       └── constants.js    # Colors, physics, weapons, level maps
└── public/
    └── assets/             # (future art/audio assets)
```

## 🛠️ Tech Stack

- **[Phaser 4](https://phaser.io/)** — HTML5 game framework
- **[Vite](https://vitejs.dev/)** — Fast build tool & dev server
- **Arcade Physics** — Lightweight 2D physics
- **Procedural Graphics** — All visuals generated via Phaser's Graphics API (no external assets needed)

## 📄 License

ISC
