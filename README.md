# BigQuery Release Notes Radar 📡

A premium, glassmorphic web application built with **Python Flask** and **Vanilla Web Technologies** (HTML, CSS, JS) that tracks, parses, and allows you to share Google BigQuery release notes.

![GitHub Repo](https://img.shields.io/badge/GitHub-samuveljohnson1416--event--talks--app-blue?logo=github)
![Python](https://img.shields.io/badge/Python-3.11+-blue?logo=python)
![Flask](https://img.shields.io/badge/Flask-Web%20Framework-darkgreen?logo=flask)

---

## 🚀 Key Features

*   **Real-time Atom Feed Syncing**: Pulls updates directly from the official Google Cloud BigQuery RSS/Atom XML feed.
*   **Intelligent Section Breakdown**: Segments daily aggregated entries into distinct categories: `Feature`, `Announcement`, `Issue`, and `Deprecation`.
*   **Premium Developer Aesthetics**: Sleek dark mode UI with interactive glowing effects, custom scrollbars, and fluid keyframe skeleton loader states.
*   **Client-Side Filtering & Search**: Instant, local keyword search and category tag filtering for an extremely responsive experience.
*   **Single-Click & Combined Tweeting**: Pre-formats release titles and descriptions matching Twitter's 280-character limit, allowing you to tweet a single card or create a combined digest summary for multiple selected updates.

---

## 📂 Project Structure

```text
C:\Users\samuv\agy-cli-projects\
├── app.py                 # Flask server (fetches XML, parses & exposes JSON API)
├── templates/
│   └── index.html         # Main UI layout structure
├── static/
│   ├── app.js             # Client-side filtering, state management & Twitter sharing
│   └── styles.css         # Styling system (Glassmorphism, glows & animations)
├── .gitignore             # Config to ignore virtual environment, IDEs, and build cache
└── README.md              # Project documentation
```

---

## 🛠️ Setup & Running Locally

### 1. Prerequisites
Ensure you have Python 3.11+ installed.

### 2. Install Dependencies
Initialize a virtual environment and install standard requirements:
```bash
# Set up a virtual environment (optional)
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install Flask and BeautifulSoup4
pip install Flask beautifulsoup4
```

### 3. Run the Server
Launch the development server:
```bash
python app.py
```
Visit **[http://127.0.0.1:5000](http://127.0.0.1:5000)** in your web browser.

---

## 🐦 Tweeting Flow
*   **Single Tweet**: Click **Tweet** on any card to share a single pre-formatted update with direct docs links and hashtags.
*   **Combined Tweet**: Check the box next to one or more cards to open the floating selection bar at the bottom. Click **Tweet Selected** to format a multi-update digest.

---

## 📦 Version Control

This repository is synced with GitHub:
*   Remote Repository: [samuveljohnson1416-event-talks-app](https://github.com/samuveljohnson1416/samuveljohnson1416-event-talks-app)
