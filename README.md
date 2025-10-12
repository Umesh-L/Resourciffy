# Resourciffy

A tiny, static web app to save and manage multiple resources (name, description, link, types). It's dependency-free (vanilla HTML/CSS/JS) and designed to be portable — open `index.html` in your browser or serve the folder with a simple static server.

---

## Features

- Create / edit / delete resource cards (name, description, optional link).
- Select one or multiple resource types; add/remove types from the UI.
- Persist data in `localStorage` for quick local access.
- Export and import JSON files for backups and transfers.
- Save as PDF via the browser print dialog (print-friendly CSS hides the UI chrome).
- Themed neon UI, toast notifications, and support for a site icon (see `Assets/Web icon.png`).

## File structure

```
/ (repo root)
├─ index.html         # Main page
├─ styles.css         # Theme, layout and print rules
├─ app.js             # Application logic (persistence, rendering, import/export)
├─ Assets/            # Static assets (icons, images)
│  └─ Web icon.png    # site icon referenced from index.html
├─ README.md          # This file
```

If you add images or other static assets, consider creating an `assets/` folder.

## Quick start — run locally

Option A — Open directly
- Double-click `index.html` or open it in your browser. This is the fastest way to try the app.
- Note: some browsers restrict certain file operations when opened as `file:///`; if you run into issues use a local server.

Option B — Serve with a tiny static server (recommended for best behavior)

Using Python (if installed):
```powershell
# From the repo root (Windows PowerShell)
python -m http.server 5500
# Then open http://127.0.0.1:5500 in your browser
```

Using Node (serve):
```powershell
# if you have `serve` installed (npm i -g serve)
serve -s . -l 5500
```

Option C — VS Code Live Server
- If you use VS Code, install the Live Server extension and open the project with it.

## How to use

1. Open the app in your browser.
2. Use the form on the left to add a resource:
	 - Name (required)
	 - Description
	 - Link (optional) — if present, the card will render a clickable link
	 - Types — choose one or more types; use Manage to add or remove type options
3. Click Save to add the resource. Cards appear on the right.
4. Export / Import:
	 - Export JSON downloads `resources.json` containing your items.
	 - Import JSON loads a previously exported file (must be an array of resource objects).
5. Save as PDF: opens the print dialog; choose "Save as PDF" as the destination to generate a printable PDF with only the cards (form and controls hidden by print CSS).

## Data format

Resources are stored and exported as an array of objects. Example resource:

```json
{
	"id": "abc123",
	"name": "Example Resource",
	"description": "Short note",
	"link": "https://example.com",     
	"types": ["Article", "Tool"],
	"type": "Article",                  
	"createdAt": 1690000000000
}
```

- `link` may be an empty string if omitted.
- `types` is an array (may be empty); `type` is the legacy first type kept for compatibility.

## Tech used

- HTML5, CSS3, vanilla JavaScript
- Browser APIs: localStorage, File/Blob APIs, and `window.print()` for PDF export

## Browser compatibility & notes

- Works in modern Chromium-based browsers (Chrome, Edge), and Firefox. Safari behavior for File System Access API is limited.
- Printing uses the browser print dialog — the app offers print-only CSS so PDFs contain only resource cards.
- If you open the page via `file:///` and some features don't work (download/import restrictions), run a local static server as described above.

## Customization & development notes

- Theme variables exist in `styles.css` (e.g., `--accent`, `--bg`) — tweak them to change colors.
- Data keys in `localStorage`:
	- `resource_manager.items` — resource array
	- `resource_manager.types` — saved types list
	- `resource_manager.project` — optional project metadata (name/icon)
- Print tweaks: the app temporarily adds a `.print-mode` class before `window.print()`; extend `@media print` rules in `styles.css` to adjust PDF layout.

## Troubleshooting

- Data disappears on refresh: ensure your browser allows localStorage and you are not in strict privacy/incognito modes.
- Import failures: imported JSON must be an array of objects matching the structure above.
- Print dialog not opening: try manually printing (Ctrl+P) after selecting "Save as PDF" in the destination.

## Contributing

- Bug fixes and small UI improvements are welcome. Fork the repo, create a branch, and open a PR.
- If you change the data shape, document the migration and update the README.

