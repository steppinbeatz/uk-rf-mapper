# UK RF Mapper - modular build

This is a drop-in GitHub replacement based on the supplied working application.

## Changes

- Removed browser-side NetFinder/RSGB/AllOrigins scraping.
- Nets are supplied as validated static data in `data/nets.json`.
- `data/nets.js` is generated from that JSON for reliable static/PWA loading.
- Extracted CSS to `assets/css/app.css`.
- Extracted application JavaScript to `assets/js/app.js`.
- Updated the service worker and cache version.
- Preserved the repeater CSV, map, terrain, DMR, filters and distance sorting.
- The former Sync controls now reload the bundled validated datasets and make no scraping requests.

## Deploy

Replace the repository contents with these files, commit, and deploy. After deployment, unregister the old service worker or perform a hard refresh once.

## Edit nets

1. Edit `data/nets.json`.
2. Run `python3 scripts/build-nets-js.py`.
3. Run `node tests/data-tests.mjs`.
4. Commit both `nets.json` and the generated `nets.js`.

## Important

The JSON file is now the authoritative net dataset. A future server-side scheduled importer can update it, but that importer should validate and review source changes before publishing. `scripts/build-nets-js.py` is a build tool, not a web scraper.

## Local test

Serve the folder over HTTP, not `file://`:

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`.
