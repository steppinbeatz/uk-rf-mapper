# 📡 UK & Scotland RF Repeater, NetFinder & Terrain Mapper

[![Version](https://img.shields.io/badge/release-v1.0.0-06b6d4?style=flat-square)](https://github.com/steppinbeatz/uk-rf-mapper/releases)
[![Dataset](https://img.shields.io/badge/SRTM_30m-UK_%26_Ireland-10b981?style=flat-square)](#backend-setup-opentopodata-docker--srtm-30m)
[![PWA](https://img.shields.io/badge/PWA-Installable-f59e0b?style=flat-square)](#features)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)

An interactive Progressive Web App (PWA) built for UK and Scottish amateur radio operators to inspect VHF/UHF/6m repeaters, local simplex gateways, scheduled nets, and real-time **Line-of-Sight (LoS) RF terrain profiles** powered by a self-hosted **OpenTopoData NASA SRTM 30m** elevation backend.

---

## ✨ Key Features

### 🏔️ Real-Time 30m SRTM Terrain & Fresnel Zone Profiler
* **100-Point Cross-Section Sampling:** Queries a local Dockerized OpenTopoData API (`/elevation/v1/srtm30m`) to render accurate topographical ridgelines between your active QTH and any selected repeater or net hub.
* **Saltwater & Estuary Detection:** Automatically detects sea, loch, and river crossings (`0m` elevation, such as the Firth of Clyde, Gare Loch, and Irish Sea) and highlights water paths in cyan-blue against slate-grey land ridges.
* **Station Class Simulation:** Toggle instantly between **5W Handheld (2m AGL Whip)** and **50W Base / Mobile (12m AGL Collinear)** to inspect first Fresnel zone clearance and estimated S-Meter performance.
* **Resilient Fallback:** Automatically falls back to a mathematical horizon/terrain model if the local elevation API is unreachable.

### 🗼 UK & Scotland Repeater + Gateway Directory
* **Complete RSGB ETCC Scottish Directory:** Includes all coordinated Scottish 2m, 70cm, and 6m repeaters alongside major UK regional hubs.
* **Bespoke Clyde & Lomond Gateways:** Pre-configured profiles and coverage footprints for `GB7GR` (Gourock Mixed-Mode FM/DMR), `GB3DM` (Dumbarton FM/YSF/D-STAR), `MB7IBH` (Alexandria 2m AllStar), `MB7IDQ` (Alexandria 70cm AllStar), `MB6GP` (Port Glasgow WIRES-X/YSF), and `MB6CY` (Clydebank Data).
* **Multi-Mode & Band Filtering:** Filter instantly by band (`2m`, `70cm`, `6m/4m`) or mode (`FM`, `DMR`, `YSF`, `D-STAR`, `NXDN`, `TETRA`), and sort by distance from QTH or callsign.
* **Live UK Repeater Sync:** Pulls newly coordinated Scottish repeaters via `ukrepeater.net`.

### 📻 Proximity-Sorted Ham Radio NetFinder & GB2RS Schedule
* **Auto-Sorted by Distance:** Lists Scottish and UK nets & GB2RS news broadcasts ordered from closest to furthest from your active QTH.
* **Day & Band Filters:** Filter by day of the week (including a one-click **Today** filter) or band/mode (`2m VHF`, `70cm UHF`, `DMR / DV`, `AllStar / EchoLink`, `80m / CW`).
* **One-Click Path & Inspect:** Click any net card to pan the map, link its host repeater/gateway, and plot the RF terrain profile immediately.

### 📍 Flexible UK QTH Selection
* **Quick Regional Presets:** Cardross (`IO75px`), Helensburgh (`IO76pa`), Dumbarton (`IO75ri`), Edinburgh, Inverness, Manchester, Birmingham, London, Cardiff, and Belfast.
* **Custom Maidenhead Grid Locator:** Enter any 4- or 6-character grid square (e.g., `IO83RJ`).
* **Live Device GPS & Map Pin Picker:** Lock onto your phone/laptop GPS coordinates or click **Pick on Map** to drop a custom QTH pin anywhere in the UK.

### 💾 DV Codeplug & CHIRP CSV Exporter
* Displays CTCSS tones, DMR Color Codes, Time Slots (`TS1`/`TS2`), static talkgroups, YSF DG-IDs, and D-STAR routing fields.
* One-click **Copy CSV Row** formatted for direct pasting into CHIRP or transceiver codeplug software.

---

## 🚀 Quick Start (Frontend)

Because the frontend is a zero-build, single-page application (`index.html`), you can host it on any static web server (Nginx, Apache, Plesk, GitHub Pages) or run it locally:

```bash
git clone https://github.com/steppinbeatz/uk-rf-mapper.git
cd uk-rf-mapper
npx serve . -l 8080
```

---

## 🐳 Backend Setup (OpenTopoData Docker + SRTM 30m)

To enable real-world 30-metre terrain profiling across the UK, Ireland, and surrounding islands, run the self-hosted **OpenTopoData** container on your server.

### 1. Create the Data Directory & `config.yaml`
```bash
mkdir -p opentopodata/data/srtm30m
cat << 'EOF' > opentopodata/config.yaml
datasets:
- name: srtm30m
  path: data/srtm30m/
EOF
```

### 2. Download UK & Ireland SRTM 30m (`.hgt`) Tiles
This script downloads and unpacks all valid NASA SRTM 30m `.hgt` land tiles covering Latitudes `49°N` to `60°N` and Longitudes `10°W` to `2°E` from the AWS Skadi elevation mirror:

```bash
cd opentopodata/data/srtm30m

for lat in {49..60}; do
    lat_str=$(printf "N%02d" $lat)
    for lon in {-10..2}; do
        if [ $lon -ge 0 ]; then
            lon_str=$(printf "E%03d" $lon)
        else
            lon_str=$(printf "W%03d" $(( -1 * lon )) )
        fi
        
        tile="${lat_str}${lon_str}"
        url="https://s3.amazonaws.com/elevation-tiles-prod/skadi/${lat_str}/${tile}.hgt.gz"
        
        if curl -s -f -o "${tile}.hgt.gz" "$url"; then
            gunzip -f "${tile}.hgt.gz"
            echo "Downloaded & unpacked: ${tile}.hgt"
        fi
    done
done
```

### 3. Run the OpenTopoData Container
```bash
docker run -d \
  --name opentopodata \
  --restart unless-stopped \
  -p 127.0.0.1:5001:5000 \
  -v $(pwd)/opentopodata/data:/app/data:ro \
  -v $(pwd)/opentopodata/config.yaml:/app/config.yaml:ro \
  quay.io/ajnisbet/opentopodata:latest
```

### 4. Configure Nginx Reverse Proxy (Plesk / Nginx)
Add the following directive to your Nginx configuration so same-origin requests to `/elevation/` route cleanly to the Docker container:

```nginx
location ^~ /elevation/ {
    proxy_pass http://127.0.0.1:5001/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    add_header Access-Control-Allow-Origin "*" always;
}
```

### 5. Verify the Elevation Endpoint
```bash
curl -sS "https://your-domain.com/elevation/v1/srtm30m?locations=55.9630,-4.6540|51.5074,-0.1278"
```

---

## 📁 Repository Structure

* `index.html` — Complete application UI, Leaflet topography map, repeater/net datasets, and HTML5 canvas Fresnel/terrain renderer.
* `manifest.json` — Progressive Web App (PWA) manifest for mobile/desktop installation.
* `sw.js` — Service Worker for offline asset caching.
* `README.md` — Project documentation and self-hosted SRTM deployment guide.

---

## 📜 Credits & Data Sources

* **Repeater Coordination Data:** [RSGB ETCC / ukrepeater.net](https://ukrepeater.net/repeaterlist.html?filter=SCOTLAND)
* **UK & Scottish Net Schedules:** [netfinder.radio](https://netfinder.radio/nets/country/scotland) & RSGB GB2RS
* **Elevation Engine:** [OpenTopoData](https://www.opentopodata.org/) using NASA SRTM 30m digital elevation data
* **Map Tiles:** [OpenTopoMap](https://opentopomap.org/) & [OpenStreetMap](https://www.openstreetmap.org/) contributors
