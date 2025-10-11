# Resource Manager (Static)

A tiny static web app to save website resources (name, description, link) into browser localStorage.

How to use

- Open `index.html` in a browser.
- Add resources using the form. They will be saved locally in your browser.
- Edit or delete cards using the buttons on each resource.

Export and print

- Use "Save as PDF" to open the browser print dialog. Choose "Save as PDF" in the print destination to generate a PDF export of the current page.
- "Export JSON" — triggers a download of the current resources as `resources.json`.
- "Import JSON" — open a local JSON file to import resources.

Notes

- This is still a client-only app with no central server.
- As a convenience the app maintains a copy in `localStorage` as a cache; the file save/load is the canonical device storage method you should use for backups and transfers.
- Imported JSON must be an array of resources with the same shape used by the app (objects with `id`, `name`, `description`, `link`, etc.).
