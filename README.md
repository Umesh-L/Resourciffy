# Resource Manager (Static)

A tiny static web app to save website resources (name, description, link) into browser localStorage.

How to use

- Open `index.html` in a browser.
- Add resources using the form. They will be saved locally in your browser.
- Edit or delete cards using the buttons on each resource.

Device storage (save/load)

- This version uses device file save/load instead of relying solely on localStorage. You can save your resources to a JSON file on your device or load a JSON file back into the app.
- If the browser supports the File System Access API (Chromium-based browsers like Chrome, Edge), the app will prompt you to pick a file to save to or open. Otherwise it falls back to a file download (export) and a manual import via an "Import JSON" file input.

Buttons added to the UI:

- "Save to device" — save current resources to a device file (or download JSON if File System Access API is not available).
- "Load from device" — open a JSON file from your device and load resources (or open file picker UI where supported).
- "Export JSON" — triggers a download of the current resources as `resources.json`.
- "Import JSON" — open a local JSON file to import resources.

Notes

- This is still a client-only app with no central server.
- As a convenience the app maintains a copy in `localStorage` as a cache; the file save/load is the canonical device storage method you should use for backups and transfers.
- Imported JSON must be an array of resources with the same shape used by the app (objects with `id`, `name`, `description`, `link`, etc.).
