# Study Planner ✨

A lightweight browser-based study planner (HTML/CSS/JS) with a pastel/girly theme.

Quick Start
----------
- Open `index.html` directly (double-click). If you see layout issues, serve with a local server:

```powershell
cd /d "c:\Users\mariem\OneDrive\Desktop\study-planner"
python -m http.server 8000
# then open http://localhost:8000 in your browser
```

Files
-----
- `index.html` — UI and layout.
- `styles.css` — theme and layout rules.
- `app.js` — app logic: calendar, events, subjects, storage, import/export.

Features
--------
- Add and manage **subjects** (name, color, weekly hours).
- Monthly calendar with weekday headers and day modal for full event details.
- Add **events**: exams, holidays, tasks. Tasks can be marked completed.
- Weekly overview for the selected week.
- Automatic save to `localStorage` and JSON import/export.

Troubleshooting (buttons/caching/calendar alignment)
-------------------------------------------------
- If the top controls (Export / Import / Clear) or style changes don't appear, your browser may be using a cached CSS/JS file. Do a hard reload (Ctrl+F5 on Windows) or open the page in an incognito/private window.
- If the calendar alignment looks wrong: prefer serving the folder (see Quick Start) rather than opening `index.html` via `file:///`.
- If the date badges or day layout still look incorrect, try Ctrl+F5, then check the browser console (F12) for errors and share any messages.

Usage
-----
- Add a subject in the left panel (choose color).
- Use the quick-add form to place exams/holidays/tasks on the calendar, or click any day cell to open the full day modal and add items there.
- Use the weekly view to inspect items for the current selected week.
- Export your data via the top-left `Export` button to save a JSON backup; import via the file input to restore.

Development notes
-----------------
- Edit `app.js` and `styles.css`; reload the page to see changes.
- If you want a single-file bundle (all CSS/JS inline) so you can open the app without caching issues, I can generate it for you.

Next steps I can implement
-------------------------
- A weekly study-block editor (drag to schedule hourly blocks). 
- Recurring events (e.g., weekly study sessions). 
- Printable/Exportable PDF views.

If you'd like, tell me which next feature to build and I'll start implementing it.
