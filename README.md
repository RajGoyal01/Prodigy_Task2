# Prodigy InfoTech Internship — Full Stack Development
## ⏱️ Task 02: Precision Chronograph & Stopwatch Web Application

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Precision](https://img.shields.io/badge/Timing-Zero%20Drift%2060FPS-success?style=for-the-badge)

---

### 📖 Project Overview
This repository contains the official submission for **Task-02** of the **Prodigy InfoTech Full Stack Web Development Internship Program**.

The objective of this task is to engineer a **highly precise, responsive, and dynamic stopwatch web application** with dedicated functions for **starting, pausing, resuming, resetting**, as well as **tracking, analyzing, and exporting lap times**.

**Product Concept:** **CHRONO-PRO** — Luxury Swiss-Inspired Instrument Chronograph with Zero-Drift Timestamp Math, Continuous Sweep Needle, and Statistical Lap Performance Analytics.

---

### ✨ Key Features Implemented

#### 1. ⏱️ Zero-Drift Timestamp Math Engine (Task Requirement)
- Implements high-resolution `performance.now()` timestamp difference calculation instead of naive interval counters to eliminate browser event-loop drift.
- Synchronized with `requestAnimationFrame` for a silky-smooth 60 FPS sweep dial animation.
- Ultra-crisp digital readout formatting: `HH:MM:SS.mmm` (Hours, Minutes, Seconds, Milliseconds).

#### 2. 🧭 Dynamic Analog Chronograph Instrument Dial
- **Outer Bezel & 60-Second Radial Markers:** 60 dynamically generated radial SVG ticks with bold 5-second markers and numeric time stamps.
- **Continuous Sweep Hand:** Real-time rotating needle with mechanical counterweight and glowing tip.
- **Subdial Complication:** Dedicated 60-minute interval counter subdial with its own sweep hand and arc track.
- **Radial Progress Arc:** Neon gradient SVG circle arc tracking elapsed seconds in real time.

#### 3. 🏁 Comprehensive Lap Recording & Analytics (Task Requirement)
- **Lap / Split Recording:** Captures instantaneous lap intervals and cumulative split times with a single click.
- **Delta Comparison:** Automatically computes and displays the time difference relative to the previous lap (`+0.32s` in red, `-0.15s` in emerald green).
- **Automated Performance Tagging:**
  - ⚡ **Fastest Lap:** Highlighted in radiant emerald green with an analysis pill badge.
  - 🐢 **Slowest Lap:** Highlighted in coral red when multiple laps exist.
- **Live Lap Summary Strip:** Real-time calculation of Total Laps, Fastest Lap, Slowest Lap, and Average Lap Duration.

#### 4. 📊 Data Export & Clipboard Tools
- **Export to CSV:** Generates and downloads a clean `ChronoPro_Laps_YYYY-MM-DD.csv` file with all lap data.
- **Copy to Clipboard:** Copies formatted text table to the clipboard with one-click toast feedback.
- **Clear Lap History:** Safely resets lap logs without resetting the main timer.

#### 5. 🔊 Synthesized Mechanical Audio (Web Audio API)
- Zero external MP3 files! Procedurally synthesized high-frequency mechanical clicks for Start, Pause, Lap, and Reset.
- Full mute/unmute toggle that persists across sessions via `localStorage`.

#### 6. 🎨 Multi-Theme Chrono Aura Presets
Switch seamlessly between 5 luxury instrument themes:
- 🟣 **Cyber Violet** (Default Luxury)
- 🔵 **Monaco Cyan** (Modern Marine)
- 🟢 **Le Mans Emerald** (Motorsport Chronograph)
- 🔴 **Grand Prix Red** (High Intensity)
- 🟡 **Titanium Gold** (Prestige Swiss Watchmaker)

#### 7. ⌨️ Professional Keyboard Shortcuts
| Key | Action |
| :--- | :--- |
| <kbd>Space</kbd> | Start / Pause / Resume |
| <kbd>L</kbd> | Record Lap Split |
| <kbd>R</kbd> | Reset to Zero |
| <kbd>M</kbd> | Toggle Mechanical Audio |
| <kbd>T</kbd> | Cycle Visual Aura Theme |
| <kbd>F</kbd> | Toggle Fullscreen Mode |
| <kbd>Esc</kbd> | Close Modal Dialogs |

---

### 📂 File Structure

```text
PRODIGY_FS_02/
├── index.html        # Semantic HTML5 markup, SVG chronograph dial, lap tables
├── style.css         # Luxury obsidian glassmorphism, responsive grid & animations
├── script.js         # Zero-drift timing engine, 60fps dial math, Web Audio API, CSV export
└── README.md         # Comprehensive project documentation
```

---

### 🚀 How to Run Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/RajGoyal01/Prodigy_Task2.git
   cd Prodigy_Task2
   ```

2. **Open in browser:**
   - Double-click `index.html` to open in any web browser.
   - Or run a local HTTP server:
     ```powershell
     python -m http.server 3001
     ```
     Then open `http://localhost:3001`.

---

### 📱 Responsive Breakpoints
- **Desktop (1024px+):** Full expansive 440px analog dial, 4-column metrics strip, and shortcuts bar.
- **Tablets (768px – 1024px):** Scaled 360px dial with 2-column metrics.
- **Mobile Phones (320px – 480px):** Ultra-compact 310px dial, touch-optimized oversized master buttons, and vertical lap list.

---

### 👨‍💻 Submission Info
- **Intern Name:** Raj Goyal
- **GitHub:** [@RajGoyal01](https://github.com/RajGoyal01)
- **Domain:** Full Stack Web Development
- **Task ID:** PRODIGY_FS_02 / Task-02
- **Organization:** [Prodigy InfoTech](https://prodigyinfotech.dev)
