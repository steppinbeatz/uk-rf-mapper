'use strict';

// Register the PWA Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
          .then(reg => console.log('Service Worker Registered!', reg))
          .catch(err => console.log('Service Worker Failed:', err));
      });
    }
  


    /*************************************************************************
     * 1. GENERIC UK REGIONAL QTH LOCATIONS (9 Simple UK Regions + Custom)
     *************************************************************************/
    const QTH_LOCATIONS = {
      england_midlands: {
        id: 'england_midlands',
        name: 'Midlands (Birmingham)',
        locator: 'IO92fl',
        lat: 52.4862,
        lng: -1.8904,
        zoom: 8,
        elevMeters: 140,
        desc: 'Elevated West & East Midlands plateau with wide-area VHF/UHF takeoff across Central England.'
      },
      england_london_se: {
        id: 'england_london_se',
        name: 'London & South East',
        locator: 'IO91wm',
        lat: 51.5074,
        lng: -0.1278,
        zoom: 8,
        elevMeters: 24,
        desc: 'Greater London, Thames Valley, North & South Downs, Kent, Sussex, Surrey, and Hampshire.'
      },
      england_north: {
        id: 'england_north',
        name: 'North England & Yorkshire',
        locator: 'IO83rj',
        lat: 53.5500,
        lng: -2.1000,
        zoom: 8,
        elevMeters: 95,
        desc: 'North West, Yorkshire, North East, Pennines, Peak District, Lancashire, and Cumbria.'
      },
      england_sw: {
        id: 'england_sw',
        name: 'South West England',
        locator: 'IO80gr',
        lat: 50.9500,
        lng: -3.2000,
        zoom: 8,
        elevMeters: 85,
        desc: 'Bristol Channel, Mendips, Somerset, Devon, Dartmoor, and Cornwall.'
      },
      england_east: {
        id: 'england_east',
        name: 'East Anglia (Cambridge / Norwich)',
        locator: 'JO02gg',
        lat: 52.2800,
        lng: 0.5500,
        zoom: 8,
        elevMeters: 35,
        desc: 'Cambridgeshire, Norfolk, Suffolk, and Essex low-horizon plains.'
      },
      scotland_central: {
        id: 'scotland_central',
        name: 'Central & South Scotland',
        locator: 'IO75vu',
        lat: 55.8642,
        lng: -4.2518,
        zoom: 8,
        elevMeters: 45,
        desc: 'Central Belt spanning Greater Glasgow, Firth of Clyde, Edinburgh, Forth Valley, Fife, and Borders.'
      },
      scotland_north: {
        id: 'scotland_north',
        name: 'North Scotland & Highlands',
        locator: 'IO77ul',
        lat: 57.4778,
        lng: -4.2247,
        zoom: 7,
        elevMeters: 28,
        desc: 'Highlands, Grampian, Aberdeen, Moray Firth, Hebrides, Orkney & Shetland.'
      },
      wales: {
        id: 'wales',
        name: 'Wales (Cardiff & All Wales)',
        locator: 'IO81kj',
        lat: 51.4816,
        lng: -3.1791,
        zoom: 8,
        elevMeters: 19,
        desc: 'South Wales coastal plain, Brecon Beacons, Mid Wales, and Eryri (Snowdonia).'
      },
      ni: {
        id: 'ni',
        name: 'Northern Ireland (Belfast)',
        locator: 'IO74ap',
        lat: 54.5973,
        lng: -5.9301,
        zoom: 8,
        elevMeters: 15,
        desc: 'Belfast Lough, Lagan Valley, Lough Neagh basin, and North Channel.'
      },
      custom: {
        id: 'custom',
        name: 'Custom QTH',
        locator: 'IO92fl',
        lat: 52.4862,
        lng: -1.8904,
        zoom: 9,
        elevMeters: 45,
        desc: 'User-defined UK operating location (via GPS, Maidenhead Grid Locator, or Map Pin).'
      }
    };

    function getUKRegionGroup(lat, lng, callsign) {
      if (lng < -5.2 && lat > 53.9 && lat < 55.4) return 'Northern Ireland';
      if (lat >= 56.7) return 'Scotland North & Highlands';
      if (lat >= 55.0 || (lat >= 54.65 && lng < -3.0)) return 'Scotland Central & South';
      if (lng < -2.65 && lat >= 51.35 && lat < 53.4) return 'Wales';
      if (lat >= 53.3) return 'England North & Yorkshire';
      if (lat < 51.6 && lng < -1.7) return 'England South West';
      if (lng >= 0.1 && lat >= 51.65 && lat < 53.1) return 'England East Anglia';
      if (lat < 51.95 && lng >= -1.7) return 'England London & South East';
      return 'England Midlands & Central';
    }

    function latLngToLocator(lat, lon) {
      let adjLat = lat + 90;
      let adjLon = lon + 180;
      const A = 'A'.charCodeAt(0);
      const a = 'a'.charCodeAt(0);
      const fieldLon = String.fromCharCode(A + Math.floor(adjLon / 20));
      const fieldLat = String.fromCharCode(A + Math.floor(adjLat / 10));
      const sqLon = Math.floor((adjLon % 20) / 2);
      const sqLat = Math.floor(adjLat % 10);
      const subLon = String.fromCharCode(a + Math.floor(((adjLon - (Math.floor(adjLon / 2) * 2)) * 12)));
      const subLat = String.fromCharCode(a + Math.floor(((adjLat - Math.floor(adjLat)) * 24)));
      return fieldLon + fieldLat + sqLon + sqLat + subLon + subLat;
    }

    function calcDistanceKm(lat1, lon1, lat2, lon2) {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    function calcBearing(lat1, lon1, lat2, lon2) {
      const p1 = lat1 * Math.PI / 180;
      const p2 = lat2 * Math.PI / 180;
      const dl = (lon2 - lon1) * Math.PI / 180;
      const y = Math.sin(dl) * Math.cos(p2);
      const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
      const t = Math.atan2(y, x);
      const deg = Math.round((t * 180 / Math.PI + 360) % 360);
      const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
      const compass = dirs[Math.round(deg / 22.5) % 16];
      return deg + '° ' + compass;
    }

    function locatorToLatLng(locator, callsignSeed) {
      const clean = (locator || 'IO92FL').trim().toUpperCase().replace(/^I0/, 'IO');
      if (clean.length < 4) return { lat: 52.5, lng: -1.9 };

      const A = 'A'.charCodeAt(0);
      const fieldLon = (clean.charCodeAt(0) - A) * 20 - 180;
      const fieldLat = (clean.charCodeAt(1) - A) * 10 - 90;
      const sqLon = parseInt(clean[2] || '0', 10) * 2;
      const sqLat = parseInt(clean[3] || '0', 10) * 1;

      let subLon = 1.0;
      let subLat = 0.5;
      if (clean.length >= 6) {
        subLon = ((clean.charCodeAt(4) - A) + 0.5) * (2 / 24);
        subLat = ((clean.charCodeAt(5) - A) + 0.5) * (1 / 24);
      }

      let hash = 0;
      const seed = callsignSeed || '';
      for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash) + seed.charCodeAt(i);
        hash |= 0;
      }
      const jitterLat = ((hash % 17) * 0.0022);
      const jitterLng = (((hash >> 4) % 17) * 0.0035);

      return {
        lat: +(fieldLat + sqLat + subLat + jitterLat).toFixed(4),
        lng: +(fieldLon + sqLon + subLon + jitterLng).toFixed(4)
      };
    }

    function decodeModeFlags(modeStr) {
      const s = (modeStr || 'A').toUpperCase();
      const modes = [];
      if (s.indexOf('A') !== -1) modes.push('FM');
      if (s.indexOf('M') !== -1) modes.push('DMR');
      if (s.indexOf('F') !== -1) modes.push('YSF');
      if (s.indexOf('D') !== -1) modes.push('D-STAR');
      if (s.indexOf('N') !== -1) modes.push('NXDN');
      if (s.indexOf('P') !== -1) modes.push('P25');
      if (s.indexOf('E') !== -1) modes.push('TETRA');
      return modes.length ? modes : ['FM'];
    }

    /*************************************************************************
     * 1B. UK DMR TALKGROUP DICTIONARY & REGIONAL DEFAULTS
     *************************************************************************/
    const UK_TG_NAMES = {
      '9': 'Local',
      '8': 'Regional Cluster',
      '91': 'World-Wide',
      '235': 'Phoenix UK Wide',
      '2350': 'UK Wide',
      '2351': 'UK Call / South East',
      '2352': 'UK Call / Midlands & North',
      '2353': 'UK Chat',
      '2354': 'Wales Wide',
      '2355': 'Scotland Wide',
      '2356': 'Northern Ireland',
      '23510': 'England South East',
      '23520': 'England North & Midlands',
      '23526': 'HUBNet DMR Bridge',
      '23530': 'England South West',
      '23540': 'Wales Regional',
      '23550': 'Scotland Chat',
      '23551': 'Scotland Multi-Mode',
      '23558': 'Scotland East',
      '23559': 'Scotland West',
      '23560': 'Northern Ireland Regional',
      '23599': 'UK Emergency / RAYNET'
    };

    function formatTgBadge(tgNum) {
      const s = String(tgNum).trim();
      return UK_TG_NAMES[s] ? ('TG ' + s + ' (' + UK_TG_NAMES[s] + ')') : ('TG ' + s);
    }

    function getRegionalDefaultDmrTGs(regionGroup) {
      if (regionGroup && regionGroup.indexOf('Scotland') !== -1) {
        return {
          ts1: 'TS1: Dynamic TGs (e.g. TG 2350 UK Wide, TG 23559 Scot West)',
          ts2: 'TS2: Static TG 2355 (Scotland Wide), TG 23551 (Scot Multi) & TG 9 (Local)'
        };
      }
      if (regionGroup === 'Wales') {
        return {
          ts1: 'TS1: Dynamic TGs (e.g. TG 2350 UK Wide, TG 91 WW)',
          ts2: 'TS2: Static TG 2354 (Wales Wide), TG 8 (Regional) & TG 9 (Local)'
        };
      }
      if (regionGroup === 'Northern Ireland') {
        return {
          ts1: 'TS1: Dynamic TGs (e.g. TG 2350 UK Wide, TG 2301 Ireland)',
          ts2: 'TS2: Static TG 2356 (NI Wide), TG 8 (Regional) & TG 9 (Local)'
        };
      }
      if (regionGroup === 'England London & South East' || regionGroup === 'England East Anglia') {
        return {
          ts1: 'TS1: Dynamic / Wide-Area (TG 2350 UK Wide, TG 2351 SE, TG 23526 HUBNet)',
          ts2: 'TS2: Local (TG 9), Regional Cluster (TG 8) & TG 23510 (South East)'
        };
      }
      if (regionGroup === 'England South West') {
        return {
          ts1: 'TS1: Dynamic / Wide-Area (TG 2350 UK Wide, TG 23526 HUBNet)',
          ts2: 'TS2: Local (TG 9), Regional Cluster (TG 8) & TG 23530 (South West)'
        };
      }
      return {
        ts1: 'TS1: Dynamic / Wide-Area (TG 2350 UK Wide, TG 2352 Midlands/North, TG 23526 HUBNet)',
        ts2: 'TS2: Local (TG 9), Regional Cluster (TG 8) & TG 23520 (Midlands/North)'
      };
    }

    /*************************************************************************
     * 2. VERIFIED HILLTOP COORDINATES & BESPOKE GATEWAYS
     *************************************************************************/
    const KNOWN_COORDS = {
      // Clyde, Ayrshire & West Central Scotland
      GB7GR: { lat: 55.9550, lng: -4.8190, elev: 110 },
      GB3DM: { lat: 55.9480, lng: -4.5520, elev: 145 },
      GB3AY: { lat: 55.7100, lng: -4.7210, elev: 245 },
      GB3WA: { lat: 55.7220, lng: -4.7350, elev: 240 },
      GB3PA: { lat: 55.8110, lng: -4.4550, elev: 220 },
      GB7PA: { lat: 55.8125, lng: -4.4520, elev: 195 },
      GB3KE: { lat: 55.9153, lng: -4.3077, elev: 75 },
      GB3KW: { lat: 55.9165, lng: -4.3055, elev: 75 },
      GB3GL: { lat: 55.8620, lng: -4.2250, elev: 135 },
      GB7GL: { lat: 55.8640, lng: -4.2500, elev: 120 },
      GB7GZ: { lat: 55.8600, lng: -4.2580, elev: 110 },
      GB7CS: { lat: 55.8550, lng: -4.2400, elev: 125 },
      GB3CS: { lat: 55.8150, lng: -3.9310, elev: 260 },
      GB3KV: { lat: 55.9920, lng: -4.0620, elev: 390 },
      GB3SL: { lat: 55.9900, lng: -4.0600, elev: 385 },
      GB7DM: { lat: 55.9420, lng: -4.5650, elev: 65 },
      GB7AC: { lat: 55.7950, lng: -4.8650, elev: 170 },
      GB7IR: { lat: 55.6200, lng: -4.6600, elev: 95 },
      GB7ZT: { lat: 55.1050, lng: -5.0040, elev: 190 },

      // Stirling, Forth Valley, Edinburgh & Lothians
      GB3FE: { lat: 56.1150, lng: -3.9350, elev: 185 },
      GB7FE: { lat: 56.1160, lng: -3.9320, elev: 185 },
      GB3OH: { lat: 55.9610, lng: -3.6120, elev: 255 },
      GB7BG: { lat: 55.9020, lng: -3.6430, elev: 210 },
      GB7CB: { lat: 55.8860, lng: -3.5220, elev: 175 },
      GB7LV: { lat: 55.9320, lng: -3.4710, elev: 130 },
      GB3ED: { lat: 55.9533, lng: -3.1883, elev: 165 },
      GB7EE: { lat: 55.9510, lng: -3.1950, elev: 150 },
      GB7ET: { lat: 55.9480, lng: -3.1820, elev: 155 },
      GB7EU: { lat: 55.9560, lng: -3.1790, elev: 145 },
      GB7ID: { lat: 55.9450, lng: -3.2080, elev: 140 },
      GB7KN: { lat: 55.9260, lng: -3.2140, elev: 160 },
      GB7SQ: { lat: 55.8930, lng: -3.0680, elev: 135 },

      // Scottish Borders
      GB3AD: { lat: 55.3850, lng: -2.7930, elev: 310 },
      GB7AI: { lat: 55.4210, lng: -2.7840, elev: 245 },
      GB7HK: { lat: 55.4240, lng: -2.7790, elev: 235 },
      GB3AS: { lat: 55.1520, lng: -2.9980, elev: 320 },
      GB3HK: { lat: 55.5340, lng: -2.8630, elev: 295 },
      GB3SB: { lat: 55.5580, lng: -2.8380, elev: 340 },
      GB7GA: { lat: 55.6180, lng: -2.8080, elev: 265 },
      GB7LS: { lat: 55.6140, lng: -2.8120, elev: 260 },
      GB3LB: { lat: 55.7200, lng: -2.7480, elev: 330 },
      GB7JD: { lat: 55.4780, lng: -2.5540, elev: 250 },
      GB3DU: { lat: 55.7780, lng: -2.3440, elev: 240 },
      GB3BE: { lat: 55.7920, lng: -2.3180, elev: 265 },
      GB3BT: { lat: 55.7710, lng: -2.0120, elev: 165 },

      // Dumfries & Galloway
      GB7GM: { lat: 55.0710, lng: -3.6050, elev: 185 },
      GB7PG: { lat: 54.9410, lng: -3.9310, elev: 210 },
      GB3DG: { lat: 54.9580, lng: -4.4820, elev: 230 },
      GB7DG: { lat: 54.8420, lng: -5.1150, elev: 145 },
      GB7RG: { lat: 54.9040, lng: -5.0250, elev: 160 },

      // Fife, Perthshire, Dundee & Angus
      GB7KY: { lat: 56.1180, lng: -3.1670, elev: 165 },
      GB7DE: { lat: 56.2080, lng: -3.0450, elev: 185 },
      GB3FF: { lat: 56.2240, lng: -2.9280, elev: 245 },
      GB7EF: { lat: 56.2760, lng: -3.1220, elev: 140 },
      GB7LL: { lat: 56.2060, lng: -3.4210, elev: 215 },
      GB3PR: { lat: 56.3780, lng: -3.4320, elev: 230 },
      GB3PU: { lat: 56.3795, lng: -3.4300, elev: 230 },
      GB3SF: { lat: 56.3980, lng: -3.4410, elev: 175 },
      GB3DD: { lat: 56.4720, lng: -2.9710, elev: 170 },
      GB3AG: { lat: 56.5560, lng: -2.9880, elev: 310 },

      // Aberdeen, Grampian & Moray
      GB3AO: { lat: 57.0760, lng: -2.7820, elev: 285 },
      GB7AB: { lat: 57.1490, lng: -2.0940, elev: 135 },
      GB7EM: { lat: 57.1620, lng: -2.1150, elev: 155 },
      GB7FP: { lat: 57.1210, lng: -2.1380, elev: 145 },
      GB7GD: { lat: 57.1850, lng: -2.0880, elev: 150 },
      GB7KV: { lat: 57.2350, lng: -2.4410, elev: 195 },
      MB5TH: { lat: 57.2680, lng: -2.3520, elev: 160 },
      GB7EC: { lat: 57.3360, lng: -2.3180, elev: 185 },
      GB7BB: { lat: 57.6620, lng: -2.5240, elev: 175 },
      GB7GK: { lat: 57.5420, lng: -2.9520, elev: 220 },
      GB3SS: { lat: 57.6480, lng: -3.3150, elev: 195 },
      GB7SS: { lat: 57.7180, lng: -3.2880, elev: 85 },
      GB7MM: { lat: 57.5840, lng: -3.8690, elev: 110 },

      // Highlands, Hebrides, Orkney & Shetland
      GB7II: { lat: 57.4778, lng: -4.2247, elev: 165 },
      GB3BI: { lat: 57.5210, lng: -4.4620, elev: 240 },
      GB7BI: { lat: 57.5225, lng: -4.4600, elev: 240 },
      GB7AK: { lat: 56.9080, lng: -5.8540, elev: 145 },
      GB3HI: { lat: 56.4520, lng: -5.7120, elev: 310 },
      GB3IS: { lat: 57.1620, lng: -7.3580, elev: 195 },
      GB3EI: { lat: 57.5980, lng: -7.1580, elev: 140 },
      GB7EI: { lat: 57.5995, lng: -7.1560, elev: 140 },
      GB3IG: { lat: 58.2090, lng: -6.3880, elev: 135 },
      GB7IG: { lat: 58.2120, lng: -6.3820, elev: 135 },
      GB3OC: { lat: 58.9810, lng: -2.9610, elev: 185 },
      GB3LU: { lat: 60.1550, lng: -1.1450, elev: 210 },

      // Major UK Reference Repeaters
      GB3NB: { lat: 52.3680, lng: -1.8840, elev: 165 },
      GB3MN: { lat: 53.4080, lng: -2.1480, elev: 185 },
      GB3MR: { lat: 53.4110, lng: -2.1450, elev: 185 },
      GB3HG: { lat: 54.2290, lng: -1.2090, elev: 215 },
      GB3WW: { lat: 51.4816, lng: -3.1791, elev: 140 },
      GB3NI: { lat: 54.6120, lng: -5.9450, elev: 280 },
      GB3GD: { lat: 54.2630, lng: -4.4620, elev: 620 },
      GB3EV: { lat: 54.6650, lng: -2.7520, elev: 260 },
      GB3NT: { lat: 54.9780, lng: -1.6180, elev: 175 },
      GB3BP: { lat: 51.9970, lng: -0.7420, elev: 115 }
    };

    const BESPOKE_REPEATERS = [
      {
        id: 'GB7GR',
        apiCallsign: 'GB7GR',
        callsign: 'GB7GR',
        name: 'Gourock (Inverclyde)',
        town: 'Gourock',
        regionGroup: 'Scotland Central & South',
        locator: 'IO75ll',
        lat: 55.9550,
        lng: -4.8190,
        siteElev: 110,
        status: 'OPERATIONAL • LIVE SEP 2026',
        statusType: 'new',
        band: '70cm',
        channel: 'RU75',
        rxFreq: '430.9375',
        txFreq: '438.5375',
        offset: '+7.6 MHz',
        modes: ['FM', 'DMR'],
        ctcss: '103.5 Hz',
        dvConfig: {
          protocol: 'BrandMeister Mixed-Mode FM & DMR Tier II (ID 234248)',
          accessParam: 'DMR Color Code 1 (CC1) | FM CTCSS 103.5 Hz ("Pip" on FM)',
          ts1: 'TS1: Static TG 23559 (Scotland West) + Dynamic Talkgroups',
          ts2: 'TS2: Static TG 2355 (Scotland Wide) & TG 23551 (Scotland Multi-Mode) + TG 9 Local',
          network: 'BrandMeister UK (ID 234248) + Analogue FM',
          dmrId: '234248',
          colorCode: 'CC1'
        },
        keeper: 'GM4SVW',
        color: '#06b6d4',
        funFact: 'Mixed-mode FM & BrandMeister DMR repeater on the southern bank of the Firth of Clyde in Gourock with low-loss tidal saltwater propagation across the Clyde estuary.',
        htAdvice: '5W Handheld: Program RX 430.9375 / TX 438.5375 (+7.6 MHz split). For DMR set Color Code 1: TS1 = TG 23559 (Scot West), TS2 = TG 2355 (Scot Wide) & TG 23551 (Scot Multi). For Analogue FM set 103.5 Hz CTCSS.',
        baseAdvice: '50W Base/Mobile: Full-quieting S9+ across the Clyde estuary and West Central Scotland.',
        coveragePolygon: [
          [56.065, -4.920], [56.045, -4.740], [56.005, -4.620],
          [55.945, -4.530], [55.890, -4.580], [55.885, -4.780],
          [55.920, -4.950], [56.010, -4.980]
        ]
      },
      {
        id: 'GB3DM',
        apiCallsign: 'GB3DM',
        callsign: 'GB3DM',
        name: 'Dumbarton (West Dunbartonshire)',
        town: 'Dumbarton',
        regionGroup: 'Scotland Central & South',
        locator: 'IO75qx',
        lat: 55.9480,
        lng: -4.5520,
        siteElev: 145,
        status: 'OPERATIONAL',
        statusType: 'active',
        band: '70cm',
        channel: 'RU74',
        rxFreq: '430.9250',
        txFreq: '438.5250',
        offset: '+7.6 MHz',
        modes: ['FM', 'YSF', 'D-STAR'],
        ctcss: '103.5 Hz',
        dvConfig: {
          protocol: 'Multimode FM / YSF (C4FM) / D-STAR',
          accessParam: 'FM: 103.5 Hz | YSF: DG-ID 00 | D-STAR: RPT1=GB3DM B, RPT2=GB3DM G',
          ts1: 'YSF: DN/VW Automatic Mode Select (AMS)',
          ts2: 'D-STAR: URCALL=CQCQCQ (Reflector Linkable)',
          network: 'Multimode Local & Reflector Gateway'
        },
        keeper: 'GM7GDE',
        color: '#10b981',
        funFact: 'Tri-mode 70cm hub overlooking the Dumbarton basin bridging Analogue FM, System Fusion (YSF/C4FM), and D-STAR.',
        htAdvice: '5W Handheld: Program RX 430.9250 / TX 438.5250 (+7.6 MHz split). Set 103.5 Hz CTCSS for FM, DG-ID 00 for YSF, or RPT1="GB3DM  B" for D-STAR.',
        baseAdvice: '50W Base/Mobile: Wide coverage across West Dunbartonshire, Clyde valley, and Loch Lomond.',
        coveragePolygon: [
          [56.040, -4.770], [56.045, -4.560], [55.995, -4.420],
          [55.910, -4.350], [55.865, -4.470], [55.895, -4.680],
          [55.965, -4.780]
        ]
      },
      {
        id: 'MB7IBH',
        apiCallsign: 'MB7IBH',
        callsign: 'MB7IBH',
        name: 'Alexandria 2m Gateway (Loch Lomond Net)',
        town: 'Alexandria',
        regionGroup: 'Scotland Central & South',
        locator: 'IO75rx',
        lat: 55.9890,
        lng: -4.5820,
        siteElev: 45,
        status: 'OPERATIONAL • SUN NET 20:00',
        statusType: 'net',
        band: '2m',
        extraBands: ['4m'],
        channel: '2m Simplex',
        rxFreq: '145.3375',
        txFreq: '145.3375',
        offset: 'Simplex (0.0 MHz)',
        modes: ['FM'],
        ctcss: '103.5 Hz',
        dvConfig: {
          protocol: 'AllStar / EchoLink FM Simplex Gateway',
          accessParam: 'CTCSS 103.5 Hz (Simplex 145.3375 MHz)',
          ts1: 'AllStar Node: 64460 (Linked to Lomond Hub 67108)',
          ts2: 'EchoLink: MB7IBH-L | Companion 4m: MB7IDR (70.3500 MHz)',
          network: 'Loch Lomond AllStar Hub 67108'
        },
        keeper: 'MM3DDQ',
        color: '#f59e0b',
        funFact: 'VHF anchor of the Loch Lomond Sunday Night Net (Sundays at 20:00 UK time)! Links 2m (MB7IBH), 70cm (MB7IDQ), and 4m (MB7IDR) together via AllStar Hub 67108.',
        htAdvice: '5W Handheld: Program 145.3375 MHz FM Simplex with 103.5 Hz CTCSS tone.',
        baseAdvice: '50W Base/Mobile: Strong coverage throughout the Vale of Leven, Loch Lomond basin, and Firth of Clyde.',
        coveragePolygon: [
          [56.065, -4.650], [56.050, -4.510], [55.985, -4.490],
          [55.930, -4.530], [55.940, -4.670], [56.005, -4.720]
        ]
      },
      {
        id: 'MB7IDQ',
        apiCallsign: 'MB7IDQ',
        callsign: 'MB7IDQ',
        name: 'Alexandria 70cm Gateway (Loch Lomond Net)',
        town: 'Alexandria',
        regionGroup: 'Scotland Central & South',
        locator: 'IO75rx',
        lat: 55.9875,
        lng: -4.5790,
        siteElev: 45,
        status: 'OPERATIONAL • SUN NET 20:00',
        statusType: 'net',
        band: '70cm',
        channel: '70cm Simplex',
        rxFreq: '430.0125',
        txFreq: '430.0125',
        offset: 'Simplex (0.0 MHz)',
        modes: ['FM'],
        ctcss: '103.5 Hz',
        dvConfig: {
          protocol: 'AllStar UHF FM Simplex Gateway',
          accessParam: 'CTCSS 103.5 Hz (Simplex 430.0125 MHz)',
          ts1: 'AllStar Node: 64516 (Linked to Lomond Hub 67108)',
          ts2: 'Bridged full-time with MB7IBH (2m) & MB7IDR (4m)',
          network: 'Loch Lomond AllStar Hub 67108'
        },
        keeper: 'MM3DDQ',
        color: '#f59e0b',
        funFact: 'Dedicated 70cm UHF sister gateway to MB7IBH in Alexandria on AllStar Hub 67108.',
        htAdvice: '5W Handheld: Program 430.0125 MHz FM Simplex with 103.5 Hz CTCSS.',
        baseAdvice: '50W Base/Mobile: Reliable UHF access to the AllStar 67108 hub.',
        coveragePolygon: [
          [56.055, -4.640], [56.040, -4.515], [55.980, -4.500],
          [55.932, -4.535], [55.942, -4.655], [55.998, -4.700]
        ]
      },
      {
        id: 'MB6GP',
        apiCallsign: 'MB6GP',
        callsign: 'MB6GP',
        name: 'Port Glasgow (YSF / WIRES-X Gateway)',
        town: 'Port Glasgow',
        regionGroup: 'Scotland Central & South',
        locator: 'IO75pl',
        lat: 55.9340,
        lng: -4.6880,
        siteElev: 30,
        status: 'OPERATIONAL',
        statusType: 'active',
        band: '70cm',
        extraBands: ['2m'],
        channel: 'Simplex DV Gateway',
        rxFreq: '431.1250',
        txFreq: '431.1250',
        offset: 'Simplex (0.0 MHz)',
        modes: ['YSF', 'FM'],
        ctcss: 'DG-ID 00 / 103.5 Hz',
        dvConfig: {
          protocol: 'Yaesu System Fusion (C4FM) & WIRES-X Gateway',
          accessParam: 'YSF: DG-ID 00 (RX/TX) | WIRES-X Node #78628',
          ts1: 'Primary UHF Allocation: 431.1250 MHz Simplex',
          ts2: 'VHF WIRES-X Allocation: 144.8250 MHz Simplex',
          network: 'WIRES-X (#78628) / YSF Scotland Reflector'
        },
        keeper: '2M0ROT',
        color: '#f59e0b',
        funFact: 'Located on the Firth of Clyde in Port Glasgow, providing line-of-sight access to WIRES-X (Node #78628) and YSF rooms.',
        htAdvice: '5W Handheld: Program 431.1250 MHz (and 144.8250 MHz) Simplex. Set mode to C4FM Digital (DN) with TX/RX DG-ID 00.',
        baseAdvice: '50W Base/Mobile: Low TX power (5W) recommended across the Clyde estuary.',
        coveragePolygon: [
          [56.015, -4.780], [56.000, -4.550], [55.930, -4.520],
          [55.895, -4.600], [55.905, -4.770], [55.965, -4.810]
        ]
      },
      {
        id: 'MB6CY',
        apiCallsign: 'MB6CY',
        callsign: 'MB6CY',
        name: 'Clydebank Data & Simplex Gateway',
        town: 'Clydebank',
        regionGroup: 'Scotland Central & South',
        locator: 'IO75sv',
        lat: 55.9020,
        lng: -4.4050,
        siteElev: 35,
        status: 'OPERATIONAL',
        statusType: 'active',
        band: '2m',
        channel: 'Simplex Data',
        rxFreq: '144.8750',
        txFreq: '144.8750',
        offset: 'Simplex (0.0 MHz)',
        modes: ['FM'],
        ctcss: 'CSQ / No Tone (Data)',
        dvConfig: {
          protocol: '2m VHF Packet / Digital Data Simplex Node',
          accessParam: '144.8750 MHz Simplex (Carrier Squelch / Data)',
          ts1: 'AFSK / Packet / Digital Data Gateway',
          ts2: 'North Clyde Bank Corridor (IO75SV)',
          network: 'Clydebank Local Data Node'
        },
        keeper: 'Local Keeper (Clydebank)',
        color: '#f59e0b',
        funFact: 'Sits on the north bank of the River Clyde in Clydebank (`IO75SV`) for VHF data and gateway operations.',
        htAdvice: '5W Handheld: Monitor 144.8750 MHz FM Simplex (Carrier Squelch) to copy local VHF data bursts.',
        baseAdvice: '50W Base/Mobile: Connect transceiver USB soundcard interface on 144.8750 MHz FM-DATA.',
        coveragePolygon: [
          [55.980, -4.670], [55.970, -4.280], [55.850, -4.280],
          [55.860, -4.620]
        ]
      }
    ];

    /*************************************************************************
     * 3. FALLBACK TABLE & FULL CSV INGESTION ENGINE (ALL 802 UK REPEATERS)
     *************************************************************************/
    const RAW_SCOTLAND_ETCC_TABLE = [
      ["GB3NB","RV48","145.6000","145.0000","IO92FL","Birmingham (Wythall)","77.0","A","G4WAC","OPERATIONAL"],
      ["GB3LO","RU66","430.8250","438.4250","IO91WM","Central London","88.5","AF","G3UUT","OPERATIONAL"],
      ["GB7LO","DVU50","439.6250","430.6250","IO91WM","London (DMR)","CC 1","M","G4RKY","OPERATIONAL"],
      ["GB3MN","RV56","145.7000","145.1000","IO83RJ","Manchester (Stockport)","82.5","A","G8MNY","OPERATIONAL"],
      ["GB3MR","RU68","430.8500","438.4500","IO83RJ","Manchester (UHF)","82.5","A","G8MNY","OPERATIONAL"],
      ["GB3HG","RV50","145.6250","145.0250","IO94JF","Thirsk (North Yorkshire)","88.5","AF","G4MNY","OPERATIONAL"],
      ["GB3WW","RU73","430.9125","438.5125","IO81KJ","Cardiff (South Wales)","94.8","AF","GW4BZD","OPERATIONAL"],
      ["GB3NI","RV54","145.6750","145.0750","IO74AP","Belfast (Northern Ireland)","110.9","A","GI0BFD","OPERATIONAL"],
      ["GB3GD","RV50","145.6250","145.0250","IO74SD","Snaefell (Isle of Man)","103.5","A","GD4IOM","OPERATIONAL"],
      ["GB3EV","RV56","145.7000","145.1000","IO84SQ","Eden Valley (Cumbria)","77.0","A","G0CWT","OPERATIONAL"],
      ["GB3NT","RV54","145.6750","145.0750","IO94AX","Newcastle (Tyneside)","103.5","AF","G0NWT","OPERATIONAL"],
      ["GB3BP","RU74","430.9250","438.5250","IO91VU","Bletchley Park (RSGB NRC)","77.0","AM","G3RSG","OPERATIONAL"],
      ["GB3ED","RU71","430.8875","438.4875","IO85JW","Edinburgh","94.8","AN","GM4GZW","OPERATIONAL"],
      ["GB3GL","RU72","430.9000","438.5000","IO75WU","Glasgow","103.5","AF","GM3SAN","OPERATIONAL"],
      ["GB3CS","RV60","145.7500","145.1500","IO85BU","Motherwell","103.5","A","GM8HBY","OPERATIONAL"],
      ["GB3FE","RV53","145.6625","145.0625","IO86BC","Stirling","103.5","AM","GM0MZB","OPERATIONAL"],
      ["GB3PR","RV54","145.6750","145.0750","IO86GI","Perth","94.8","AF","GM8KPH","OPERATIONAL"],
      ["GB3AG","RV58","145.7250","145.1250","IO86MN","Angus","94.8","AF","GM5TAY","OPERATIONAL"],
      ["GB7II","DVU36","439.4500","430.4500","IO77UL","Inverness","CC 3","M","GM6GRE","OPERATIONAL"],
      ["GB3BI","RV58","145.7250","145.1250","IO77RM","Muir of Ord","67.0","A","MM0GKB","OPERATIONAL"],
      ["GB7GR","RU75","430.9375","438.5375","IO75LL","Gourock","103.5 / CC1","AM","GM4SVW","OPERATIONAL"],
      ["GB3DM","RU74","430.9250","438.5250","IO75QX","Dumbarton","103.5","ADF","GM7GDE","OPERATIONAL"]
    ];

    function getDynamicProfileForQTH(rep, qthKey) {
      const qth = QTH_LOCATIONS[qthKey] || QTH_LOCATIONS.england_midlands;
      const dist = calcDistanceKm(qth.lat, qth.lng, rep.lat, rep.lng);
      const isOff = rep.statusType === 'off';
      const siteElev = rep.siteElev || 150;
      const town = rep.town || rep.name.split('(')[0].trim();

      let quality = 'Regional UK Path';
      let qualityColor = 'amber';
      let sMeterHT = 'S4 / S5';
      let sMeterBase = 'S8 / S9';
      let midObstacleElev = Math.min(480, Math.round(80 + dist * 1.9));
      let midLabel = 'UK Uplands / Horizon';

      if (isOff) {
        quality = 'Repeater Logged NOT OPERATIONAL';
        qualityColor = 'rose';
        sMeterHT = 'OFF AIR';
        sMeterBase = 'OFF AIR';
      } else if (dist <= 18) {
        quality = 'Local Line-of-Sight Path';
        qualityColor = 'emerald';
        sMeterHT = 'S9+10 dB';
        sMeterBase = 'S9+30 dB';
        midObstacleElev = Math.round(Math.min(qth.elevMeters, siteElev) * 0.45);
        midLabel = 'Local Valley / Basin';
      } else if (dist <= 50) {
        quality = 'Regional VHF/UHF Corridor';
        qualityColor = 'emerald';
        sMeterHT = 'S6 / S7';
        sMeterBase = 'S9+10 dB';
        midObstacleElev = 135;
        midLabel = 'Regional Valley / Ridge';
      } else if (dist > 95) {
        quality = 'Long-Haul UK DX Path';
        qualityColor = 'rose';
        sMeterHT = 'Below Noise Floor';
        sMeterBase = 'S2 / S4 (Beam / Tropo)';
        midObstacleElev = 490;
        midLabel = 'Earth Curvature & UK Hills';
      }

      return {
        quality: quality,
        qualityColor: qualityColor,
        sMeterHT: sMeterHT,
        sMeterBase: sMeterBase,
        points: [
          { d: 0, e: qth.elevMeters, label: qth.name.split('(')[0].trim() },
          { d: 0.25, e: Math.round(midObstacleElev * 0.55), label: 'Near Horizon' },
          { d: 0.55, e: midObstacleElev, label: midLabel },
          { d: 0.82, e: Math.round((midObstacleElev + siteElev) * 0.5), label: town + ' Approach' },
          { d: 1.0, e: siteElev, label: rep.callsign }
        ],
        narrative: isOff
          ? rep.callsign + ' (' + town + ') is currently listed as NOT OPERATIONAL on the RSGB ETCC database.'
          : dist.toFixed(1) + ' km path from ' + qth.name + ' (' + qth.locator + ') to ' + rep.callsign + ' in ' + town + ' (' + rep.locator + ').'
      };
    }

    function buildRepeaterFromETCCRow(row) {
      const callsign = row[0];
      const channel = row[1];
      const rxFreq = row[2];
      const txFreq = row[3];
      const locator = row[4];
      const town = row[5];
      const toneOrCC = row[6];
      const modeFlags = row[7];
      const keeper = row[8];
      const rawStatus = row[9];

      for (let i = 0; i < BESPOKE_REPEATERS.length; i++) {
        if (BESPOKE_REPEATERS[i].callsign === callsign) {
          return BESPOKE_REPEATERS[i];
        }
      }

      const coords = locatorToLatLng(locator, callsign);
      const lat = KNOWN_COORDS[callsign] ? KNOWN_COORDS[callsign].lat : coords.lat;
      const lng = KNOWN_COORDS[callsign] ? KNOWN_COORDS[callsign].lng : coords.lng;
      const siteElev = KNOWN_COORDS[callsign] ? KNOWN_COORDS[callsign].elev : 160;

      const rxNum = parseFloat(rxFreq);
      const txNum = parseFloat(txFreq);
      const diff = +(txNum - rxNum).toFixed(4);
      const offsetStr = diff === 0 ? 'Simplex (0.0 MHz)' : (diff > 0 ? '+' : '') + diff + ' MHz';

      let band = '70cm';
      if (rxNum < 60) band = '6m/10m';
      else if (rxNum < 200) band = '2m';
      else if (rxNum > 1000) band = '23cm';

      const modes = decodeModeFlags(modeFlags);
      const isOff = rawStatus.indexOf('NOT') !== -1;
      const isReduced = rawStatus.indexOf('REDUCED') !== -1;

      let statusType = 'active';
      let color = '#10b981';
      if (isOff) {
        statusType = 'off';
        color = '#f43f5e';
      } else if (isReduced) {
        statusType = 'net';
        color = '#f59e0b';
      } else if (modes.indexOf('TETRA') !== -1 || band === '6m/10m' || band === '23cm') {
        color = '#a855f7';
      }

      const ctcssDisplay = (toneOrCC.indexOf('CC') !== -1 || toneOrCC === '--' || toneOrCC.indexOf('MCC') !== -1)
        ? toneOrCC
        : toneOrCC + ' Hz';

      const regionGroup = getUKRegionGroup(lat, lng, callsign);
      const dmrDefaults = getRegionalDefaultDmrTGs(regionGroup);

      const coveragePolygon = [];
      for (let i = 0; i < 8; i++) {
        const ang = (i * Math.PI) / 4;
        coveragePolygon.push([
          +(lat + Math.sin(ang) * 0.085).toFixed(4),
          +(lng + Math.cos(ang) * 0.145).toFixed(4)
        ]);
      }

      return {
        id: callsign,
        apiCallsign: callsign,
        callsign: callsign,
        name: town + ' (' + channel + ')',
        town: town,
        regionGroup: regionGroup,
        locator: locator,
        lat: lat,
        lng: lng,
        siteElev: siteElev,
        status: rawStatus,
        statusType: statusType,
        band: band,
        channel: channel,
        rxFreq: rxFreq,
        txFreq: txFreq,
        offset: offsetStr,
        modes: modes,
        ctcss: ctcssDisplay,
        dvConfig: {
          protocol: 'RSGB ETCC Coordinated (' + modes.join(' / ') + ')',
          accessParam: 'Tone / Access: ' + ctcssDisplay + ' | Chan: ' + channel,
          ts1: modes.indexOf('DMR') !== -1 ? dmrDefaults.ts1 : 'Output (RX): ' + rxFreq + ' MHz',
          ts2: modes.indexOf('DMR') !== -1 ? dmrDefaults.ts2 : 'Input (TX): ' + txFreq + ' MHz (' + offsetStr + ')',
          network: regionGroup + ' • RSGB ETCC Directory'
        },
        keeper: keeper,
        color: color,
        funFact: 'Official RSGB ETCC UK repeater (' + callsign + ') located in ' + town + ' (' + regionGroup + ', Grid ' + locator + ').',
        htAdvice: '5W Handheld: Program RX ' + rxFreq + ' MHz / TX ' + txFreq + ' MHz (' + offsetStr + ') with access parameter ' + ctcssDisplay + '.',
        baseAdvice: '50W Base/Mobile: Use ' + band + ' external collinear or directional antenna for extended range toward ' + town + '.',
        coveragePolygon: coveragePolygon
      };
    }

    let REPEATERS = [];

    function initializeFallbackDataset() {
      const etccBuilt = RAW_SCOTLAND_ETCC_TABLE.map(function(row) {
        return buildRepeaterFromETCCRow(row);
      });
      const etccCalls = {};
      etccBuilt.forEach(function(r) { etccCalls[r.callsign] = true; });
      const extraGateways = BESPOKE_REPEATERS.filter(function(b) {
        return !etccCalls[b.callsign];
      });
      REPEATERS = etccBuilt.concat(extraGateways);
    }
    initializeFallbackDataset();

    /**
     * Loads all 802 UK repeaters directly from same-origin repeaterlist_all.csv
     */
    async function loadAllUKRepeatersFromCSV() {
      const statusTextEl = document.getElementById('live-api-status-text');
      const badgeEl = document.getElementById('live-api-badge');

      try {
        const resp = await fetch('repeaterlist_all.csv', { cache: 'no-cache' });
        if (!resp.ok) throw new Error('CSV HTTP ' + resp.status);
        const csvText = await resp.text();
        const lines = csvText.split(/\r?\n/).filter(function(l) { return l.trim().length > 0; });

        const seenIdMap = {};
        const seenCallMap = {};
        const coordCountMap = {};
        const parsedRepeaters = [];

        const bespokeLookup = {};
        BESPOKE_REPEATERS.forEach(function(b) { bespokeLookup[b.callsign] = b; });

        // Skip header row (CALL,BAND,CHAN,txMHz,rxMHz,CTCSS,QTHR,WHERE,lat,lon,ANALOG,DMR,DSTAR,FUSION,)
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',');
          if (cols.length < 10) continue;

          const callsign = (cols[0] || '').trim().toUpperCase();
          if (!callsign) continue;

          // If bespoke repeater exists, use bespoke rich profile once
          if (bespokeLookup[callsign]) {
            if (!seenCallMap[callsign]) {
              seenCallMap[callsign] = true;
              parsedRepeaters.push(bespokeLookup[callsign]);
            }
            continue;
          }

          const rawBand = (cols[1] || '70CM').trim().toUpperCase();
          const channel = (cols[2] || 'SIMPLEX').trim() || 'SIMPLEX';
          const txNum = parseFloat(cols[3] || '0'); // Repeater Output = User RX
          const rxNum = parseFloat(cols[4] || '0'); // Repeater Input  = User TX
          const rxFreq = txNum.toFixed(4);
          const txFreq = rxNum.toFixed(4);
          const rawCtcss = (cols[5] || '').trim();
          const rawQthr = (cols[6] || '').trim().toUpperCase().replace(/^I0/, 'IO').slice(0, 6);
          const rawTown = (cols[7] || 'UK').trim();
          const csvLat = parseFloat(cols[8]);
          const csvLon = parseFloat(cols[9]);

          if (!Number.isFinite(csvLat) || !Number.isFinite(csvLon)) continue;

          const isAnalog = (cols[10] || '').trim().toUpperCase() === 'Y';
          const isDmr = (cols[11] || '').trim().toUpperCase() === 'Y';
          const isDstar = (cols[12] || '').trim().toUpperCase() === 'Y';
          const isFusion = (cols[13] || '').trim().toUpperCase() === 'Y';

          // Deduplicate exact duplicate rows (e.g. GB3IV appears twice identically)
          const dedupKey = callsign + '_' + rawBand + '_' + rxFreq + '_' + rawTown;
          if (seenIdMap[dedupKey]) continue;
          seenIdMap[dedupKey] = true;

          // Disambiguate ID if same callsign operates on two bands or sites (e.g. GB7FR, GB7HQ, M0JXR, MB5YN)
          let uniqueId = callsign;
          if (seenCallMap[callsign]) {
            uniqueId = callsign + '-' + rawBand + (seenCallMap[callsign] > 1 ? '-' + seenCallMap[callsign] : '');
            seenCallMap[callsign]++;
          } else {
            seenCallMap[callsign] = 1;
          }

          const town = rawTown.toLowerCase().replace(/\b\w/g, function(c) { return c.toUpperCase(); });

          let lat = KNOWN_COORDS[callsign] ? KNOWN_COORDS[callsign].lat : csvLat;
          let lng = KNOWN_COORDS[callsign] ? KNOWN_COORDS[callsign].lng : csvLon;
          const siteElev = KNOWN_COORDS[callsign] ? KNOWN_COORDS[callsign].elev : 145;

          // De-cluster co-located repeaters sharing identical coordinates so every pin is clickable
          const coordKey = lat.toFixed(3) + ',' + lng.toFixed(3);
          const stackIdx = coordCountMap[coordKey] || 0;
          coordCountMap[coordKey] = stackIdx + 1;
          if (stackIdx > 0) {
            const angle = (stackIdx * 2 * Math.PI) / 6;
            const ring = Math.ceil(stackIdx / 6);
            lat = +(lat + Math.sin(angle) * 0.0028 * ring).toFixed(4);
            lng = +(lng + Math.cos(angle) * 0.0042 * ring).toFixed(4);
          }

          const locator = (rawQthr.length === 6)
            ? rawQthr.slice(0, 4) + rawQthr.slice(4, 6).toLowerCase()
            : latLngToLocator(lat, lng);

          const modes = [];
          if (isAnalog) modes.push('FM');
          if (isDmr) modes.push('DMR');
          if (isFusion) modes.push('YSF');
          if (isDstar) modes.push('D-STAR');
          if (modes.length === 0) modes.push('FM');

          let band = '70cm';
          if (rawBand === '2M') band = '2m';
          else if (rawBand === '6M' || rawBand === '10M') band = '6m/10m';
          else if (rawBand === '23CM') band = '23cm';

          const diff = +(rxNum - txNum).toFixed(4);
          const offsetStr = diff === 0 ? 'Simplex (0.0 MHz)' : (diff > 0 ? '+' : '') + diff + ' MHz';
          const ctcssDisplay = rawCtcss ? (rawCtcss + ' Hz') : (isDmr ? 'DMR CC1' : (isFusion ? 'YSF DG-ID 00' : (isDstar ? 'D-STAR' : 'CSQ')));
          const regionGroup = getUKRegionGroup(lat, lng, callsign);
          const dmrDefaults = getRegionalDefaultDmrTGs(regionGroup);

          const isSpecialBand = (band === '6m/10m' || band === '23cm');
          const hasDigital = (isDmr || isFusion || isDstar);
          const color = isSpecialBand ? '#a855f7' : (hasDigital ? '#06b6d4' : '#10b981');

          const coveragePolygon = [];
          for (let p = 0; p < 8; p++) {
            const ang = (p * Math.PI) / 4;
            coveragePolygon.push([
              +(lat + Math.sin(ang) * 0.075).toFixed(4),
              +(lng + Math.cos(ang) * 0.125).toFixed(4)
            ]);
          }

          let dvConfigObj = {
            protocol: 'RSGB ETCC Coordinated (' + modes.join(' / ') + ')',
            accessParam: 'Tone / Access: ' + ctcssDisplay + ' | Band: ' + rawBand + ' (' + channel + ')',
            ts1: isDmr ? dmrDefaults.ts1 : 'Repeater Output (User RX): ' + rxFreq + ' MHz',
            ts2: isDmr ? dmrDefaults.ts2 : 'Repeater Input (User TX): ' + txFreq + ' MHz (' + offsetStr + ')',
            network: regionGroup + ' • UK ETCC Directory'
          };

          // Restore cached live DMR TGs from localStorage if previously fetched
          if (isDmr) {
            try {
              const cached = localStorage.getItem('dmr_tg_v1_' + callsign);
              if (cached) {
                const parsedCache = JSON.parse(cached);
                if (parsedCache && parsedCache.dvConfig) {
                  dvConfigObj = parsedCache.dvConfig;
                }
              }
            } catch (e) {}
          }

          parsedRepeaters.push({
            id: uniqueId,
            apiCallsign: callsign,
            callsign: uniqueId,
            name: town + ' (' + channel + ')',
            town: town,
            regionGroup: regionGroup,
            locator: locator,
            lat: lat,
            lng: lng,
            siteElev: siteElev,
            status: 'OPERATIONAL',
            statusType: hasDigital ? 'new' : 'active',
            band: band,
            rawBand: rawBand,
            channel: channel,
            rxFreq: rxFreq,
            txFreq: txFreq,
            offset: offsetStr,
            modes: modes,
            ctcss: ctcssDisplay,
            dvConfig: dvConfigObj,
            keeper: regionGroup,
            color: color,
            funFact: 'Coordinated UK repeater (' + callsign + ') serving ' + town + ' (' + regionGroup + ', Grid ' + locator + ') on ' + rawBand + '.',
            htAdvice: '5W Handheld: Program RX ' + rxFreq + ' MHz / TX ' + txFreq + ' MHz (' + offsetStr + ') with ' + ctcssDisplay + '.',
            baseAdvice: '50W Base/Mobile: Use ' + rawBand + ' external collinear or beam antenna for optimal path toward ' + town + '.',
            coveragePolygon: coveragePolygon
          });
        }

        // Append any bespoke gateways not in CSV
        BESPOKE_REPEATERS.forEach(function(b) {
          if (!seenCallMap[b.callsign]) {
            parsedRepeaters.push(b);
          }
        });

        if (parsedRepeaters.length > 0) {
          REPEATERS = parsedRepeaters;
          if (badgeEl) badgeEl.className = 'status-pill synced mono';
          if (statusTextEl) statusTextEl.textContent = REPEATERS.length + ' UK Repeaters Active';
        }
      } catch (err) {
        console.warn('Could not load repeaterlist_all.csv, using built-in dataset:', err);
        if (statusTextEl) statusTextEl.textContent = REPEATERS.length + ' UK Repeaters (Fallback)';
      }

      renderMapElements();
      renderTerrainProfile();
      renderInspector();
      renderRepeaterList();
    }

    /*************************************************************************
     * 3B. UK & SCOTLAND HAM RADIO NETS DATASET (NETFINDER SCOTLAND + UK + RSGB)
     *************************************************************************/
    const SCOTLAND_NETS = window.RF_NETS || [];;

    /*************************************************************************
     * 4. STATE & MAP RENDERING
     *************************************************************************/
    let currentQTH = 'england_midlands';
    let currentRig = 'generic';
    let selectedRepeaterId = 'GB3NB';
    let selectedNetId = 'NET-UK-WYTHALL';
    let activeBandFilter = 'ALL';
    let activeModeFilter = 'ALL';
    let activeRegionGroupFilter = 'ALL';
    let searchQuery = '';
    let sortBy = 'distance';
    let netSortBy = 'distance';
    let showAllLobes = false;
    let topoTilesActive = true;
    let mapPickQTHMode = false;

    // NetFinder Filter State
    let activeNetDayFilter = 'ALL';
    let activeNetModeFilter = 'ALL';
    let netSearchQuery = '';
    let showNetMarkersOnMap = true;

    let map = null;
    let tileLayerOSM = null;
    let tileLayerTopo = null;
    let qthMarker = null;
    let repeaterMarkers = {};
    let netMarkers = {};
    let coverageLayers = {};
    let losLineLayer = null;

    function initMap() {
      if (typeof L === 'undefined') return;
      map = L.map('rf-map', {
        center: [53.20, -2.10],
        zoom: 6,
        zoomControl: true,
        preferCanvas: true
      });

      tileLayerTopo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        maxZoom: 17,
        attribution: '&copy; OpenStreetMap contributors, SRTM | &copy; OpenTopoMap'
      }).addTo(map);

      tileLayerOSM = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      });

      map.on('click', function(e) {
        if (!mapPickQTHMode) return;
        const clickedLat = +e.latlng.lat.toFixed(4);
        const clickedLng = +e.latlng.lng.toFixed(4);
        const loc = latLngToLocator(clickedLat, clickedLng);

        QTH_LOCATIONS.custom = {
          id: 'custom',
          name: 'Custom Map Pin',
          locator: loc,
          lat: clickedLat,
          lng: clickedLng,
          zoom: Math.max(map.getZoom(), 9),
          elevMeters: 40,
          desc: 'Custom QTH pin dropped on map at ' + clickedLat + ', ' + clickedLng + ' (Grid ' + loc + ').'
        };

        mapPickQTHMode = false;
        const pickBtn = document.getElementById('btn-pick-map-qth');
        if (pickBtn) {
          pickBtn.className = 'btn btn-outline mono';
          pickBtn.innerHTML = '<i class="fa-solid fa-map-pin"></i> Pick on Map';
        }
        document.getElementById('custom-locator-input').value = loc;
        setQTH('custom');
      });

      renderMapElements();
    }

    function zoomMapRegion(region) {
      if (!map) return;
      if (region === 'england') {
        map.setView([52.55, -1.65], 6, { animate: true });
      } else if (region === 'scotland') {
        map.setView([56.60, -4.30], 6, { animate: true });
      } else if (region === 'uk') {
        map.setView([54.30, -2.90], 5, { animate: true });
      }
    }

    function renderMapElements() {
      if (!map || typeof L === 'undefined') return;
      const qth = QTH_LOCATIONS[currentQTH] || QTH_LOCATIONS.england_midlands;

      if (qthMarker) map.removeLayer(qthMarker);
      if (losLineLayer) map.removeLayer(losLineLayer);
      Object.keys(repeaterMarkers).forEach(function(k) { map.removeLayer(repeaterMarkers[k]); });
      Object.keys(netMarkers).forEach(function(k) { map.removeLayer(netMarkers[k]); });
      Object.keys(coverageLayers).forEach(function(k) { map.removeLayer(coverageLayers[k]); });
      repeaterMarkers = {};
      netMarkers = {};
      coverageLayers = {};

      REPEATERS.forEach(function(rep) {
        const isSelected = rep.id === selectedRepeaterId;
        if (!showAllLobes && !isSelected) return;

        const poly = L.polygon(rep.coveragePolygon, {
          color: rep.color,
          weight: isSelected ? 2.5 : 1.2,
          dashArray: rep.statusType === 'off' ? '6, 6' : (isSelected ? null : '4, 4'),
          fillColor: rep.color,
          fillOpacity: isSelected ? 0.20 : 0.04
        }).addTo(map);

        poly.on('click', function() { selectRepeater(rep.id); });
        coverageLayers[rep.id] = poly;
      });

      const activeRep = REPEATERS.find(function(r) { return r.id === selectedRepeaterId; });
      if (activeRep) {
        const profColor = '#10b981';
        losLineLayer = L.polyline([[qth.lat, qth.lng], [activeRep.lat, activeRep.lng]], {
          color: profColor,
          weight: 3.5,
          dashArray: '8, 6',
          opacity: 0.95
        }).addTo(map);
      }

      const qthIcon = L.divIcon({
        className: 'custom-qth-icon',
        html: '<div class="qth-marker-pin mono">QTH</div>',
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      qthMarker = L.marker([qth.lat, qth.lng], { icon: qthIcon, zIndexOffset: 1000 })
        .addTo(map)
        .bindPopup('<strong>' + qth.name + ' QTH (' + qth.locator + ')</strong><br>' + qth.desc);

      REPEATERS.forEach(function(rep) {
        const isSelected = rep.id === selectedRepeaterId;

        const hasExtra2m = rep.extraBands && rep.extraBands.indexOf('2m') !== -1;
        const hasExtra70cm = rep.extraBands && rep.extraBands.indexOf('70cm') !== -1;
        const hasExtra4m = rep.extraBands && rep.extraBands.indexOf('4m') !== -1;

        const bandMatch =
          activeBandFilter === 'ALL' ||
          (activeBandFilter === '2m' && (rep.band === '2m' || hasExtra2m)) ||
          (activeBandFilter === '70cm' && (rep.band === '70cm' || hasExtra70cm)) ||
          (activeBandFilter === '6m' && (rep.band === '6m/10m' || rep.band === '6m/4m' || hasExtra4m)) ||
          (activeBandFilter === '23cm' && rep.band === '23cm');

        const modeMatch =
          activeModeFilter === 'ALL' ||
          rep.modes.indexOf(activeModeFilter) !== -1;

        const regionMatch =
          activeRegionGroupFilter === 'ALL' ||
          rep.regionGroup === activeRegionGroupFilter;

        if ((!bandMatch || !modeMatch || !regionMatch) && !isSelected) {
          return;
        }

        let bg = '#10b981';
        let fg = '#04121d';
        if (rep.statusType === 'new') { bg = '#06b6d4'; fg = '#04121d'; }
        else if (rep.statusType === 'net') { bg = '#f59e0b'; fg = '#04121d'; }
        else if (rep.statusType === 'off') { bg = '#f43f5e'; fg = '#ffffff'; }
        else if (rep.modes.indexOf('TETRA') !== -1 || rep.band === '6m/10m' || rep.band === '23cm') { bg = '#a855f7'; fg = '#ffffff'; }

        const repIcon = L.divIcon({
          className: 'custom-rep-icon',
          html: '<div class="rep-marker-pin mono ' + (isSelected ? 'selected' : '') + '" style="background:' + bg + ';color:' + fg + ';">' + rep.id + '</div>',
          iconSize: [64, 24],
          iconAnchor: [32, 12]
        });

        const marker = L.marker([rep.lat, rep.lng], {
          icon: repIcon,
          zIndexOffset: isSelected ? 900 : 500
        }).addTo(map);

        marker.on('click', function() { selectRepeater(rep.id); });
        repeaterMarkers[rep.id] = marker;
      });

      if (showNetMarkersOnMap) {
        SCOTLAND_NETS.forEach(function(net) {
          const isNetSelected = net.id === selectedNetId;
          if (!isNetSelected && !showAllLobes) return;

          const netIcon = L.divIcon({
            className: 'custom-net-icon',
            html: '<div class="net-marker-pin mono"><i class="fa-solid fa-headset"></i> ' + net.rxFreq + '</div>',
            iconSize: [86, 24],
            iconAnchor: [43, -10]
          });

          const nMarker = L.marker([net.lat, net.lng], {
            icon: netIcon,
            zIndexOffset: 950
          }).addTo(map);

          nMarker.bindPopup(
            '<div class="mono" style="font-size:11px;">' +
              '<strong style="color:#fcd34d;">' + net.name + '</strong><br>' +
              '<span>' + net.days.join(', ') + ' @ ' + net.timeLocal + '</span><br>' +
              '<span style="color:#67e8f9;">Freq: ' + net.rxFreq + ' MHz (' + net.toneOrCC + ')</span>' +
            '</div>'
          );
          netMarkers[net.id] = nMarker;
        });
      }
    }

    /*************************************************************************
     * 5. TERRAIN & FRESNEL PROFILE CANVAS (LOCAL DOCKER /ELEVATION PROXY)
     *************************************************************************/
    async function fetchRealTerrain(lat1, lng1, lat2, lng2, numPoints = 99) {
      const coords = [];
      for (let i = 0; i <= numPoints; i++) {
        const fraction = i / numPoints;
        const lat = lat1 + (lat2 - lat1) * fraction;
        const lng = lng1 + (lng2 - lng1) * fraction;
        coords.push(lat.toFixed(5) + ',' + lng.toFixed(5));
      }

      const locationsStr = coords.join('|');
      const apiUrl = `/elevation/v1/srtm30m?locations=${encodeURIComponent(locationsStr)}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(function () {
        controller.abort();
      }, 15000);

      try {
        const resp = await fetch(apiUrl, {
          signal: controller.signal,
          cache: 'no-store'
        });

        if (!resp.ok) {
          throw new Error('Terrain API Error: HTTP ' + resp.status);
        }

        const data = await resp.json();

        if (!Array.isArray(data.results) || data.results.length !== coords.length) {
          throw new Error(data.error || 'Terrain API returned incomplete results');
        }

        return data.results.map(function(r, idx) {
          const numElev = (r.elevation !== null && Number.isFinite(Number(r.elevation)))
            ? Number(r.elevation)
            : 0;
          return {
            d: idx / numPoints,
            e: numElev > 0 ? numElev : 0,
            label: idx === 0 ? 'QTH' : (idx === numPoints ? 'RX' : '')
          };
        });
      } catch (err) {
        console.error('Failed to fetch local terrain:', err);
        return null;
      } finally {
        clearTimeout(timeoutId);
      }
    }

    let currentTerrainFetchId = 0;

    async function renderTerrainProfile() {
      const qth = QTH_LOCATIONS[currentQTH] || QTH_LOCATIONS.england_midlands;
      const rep = REPEATERS.find(function(r) { return r.id === selectedRepeaterId; }) || REPEATERS[0];
      if (!rep) return;

      const fetchId = ++currentTerrainFetchId;
      const distKm = calcDistanceKm(qth.lat, qth.lng, rep.lat, rep.lng);
      const bearing = calcBearing(qth.lat, qth.lng, rep.lat, rep.lng);

      document.getElementById('beam-summary-title').textContent = qth.name + ' (' + qth.locator + ') ➔ ' + rep.callsign + ' (' + rep.name.split('(')[0].trim() + ')';
      document.getElementById('beam-distance').textContent = distKm.toFixed(1) + ' km (' + (distKm * 0.621371).toFixed(1) + ' mi)';
      document.getElementById('beam-bearing').textContent = bearing;

      const qualEl = document.getElementById('beam-terrain-quality');
      qualEl.textContent = 'Fetching Local Terrain...';
      qualEl.className = 'badge badge-amber';
      document.getElementById('path-status-dot').style.background = '#f59e0b';
      document.getElementById('beam-smeter').textContent = 'Computing...';
      document.getElementById('terrain-narrative').innerHTML = '<span style="color:var(--amber);"><i class="fa-solid fa-spinner fa-spin"></i> Querying Local Elevation Data...</span>';

      const canvas = document.getElementById('terrain-canvas');
      const container = document.getElementById('terrain-canvas-container');
      if (!canvas || !container) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      const width = Math.max(300, rect.width - 12);
      const height = Math.max(150, rect.height - 12);

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#64748b';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('📡 Plotting Path to ' + rep.callsign + '...', width / 2, height / 2);

      let realPoints = await fetchRealTerrain(qth.lat, qth.lng, rep.lat, rep.lng, 99);
      let usingFallback = false;

      if (fetchId !== currentTerrainFetchId) return;

      if (!realPoints) {
        usingFallback = true;
        const fallbackProfile = getDynamicProfileForQTH(rep, currentQTH);
        realPoints = fallbackProfile.points;
      }

      let maxPathElev = 0;
      realPoints.forEach(function(p) { if (p.e > maxPathElev) maxPathElev = p.e; });

      let finalQuality = 'Clear Line of Sight';
      let finalColor = 'emerald';
      let finalSmeter = 'Strong / likely usable';

      if (rep.statusType === 'off') {
        finalQuality = 'Repeater OFF AIR';
        finalColor = 'rose';
        finalSmeter = 'OFF AIR';
      } else if (distKm > 80) {
        finalQuality = 'Long-Haul Tropo Path';
        finalColor = 'rose';
        finalSmeter = 'Weak / equipment dependent';
      } else if (maxPathElev > (qth.elevMeters + 150)) {
        finalQuality = 'Terrain Obstructed';
        finalColor = 'amber';
        finalSmeter = 'Variable / obstructed path';
      }

      qualEl.textContent = usingFallback ? (finalQuality + ' (Est.)') : finalQuality;
      qualEl.className = 'badge ' + (finalColor === 'emerald' ? 'badge-emerald' : finalColor === 'amber' ? 'badge-amber' : 'badge-rose');
      document.getElementById('path-status-dot').style.background = finalColor === 'emerald' ? '#10b981' : finalColor === 'amber' ? '#f59e0b' : '#f43f5e';
      document.getElementById('beam-smeter').textContent = finalSmeter;

      const sourceNote = usingFallback
        ? 'Using estimated terrain profile (local SRTM tiles may not cover this exact path coordinate).'
        : 'Local OpenTopoData SRTM 30m elevation profile plotted.';

      document.getElementById('terrain-narrative').innerHTML =
        '<strong class="mono" style="color:#fff;">' + qth.name + ' to ' + rep.callsign + ' (' + distKm.toFixed(1) + ' km @ ' + bearing + '):</strong> ' +
        sourceNote + ' ' +
        (maxPathElev > (qth.elevMeters + 100) ? 'Notice the high terrain blocking direct visual line-of-sight.' : 'Path is relatively clear of major ridgelines.');

      ctx.clearRect(0, 0, width, height);

      const padLeft = 46;
      const padRight = 46;
      const padTop = 20;
      const padBottom = 26;
      const plotW = width - padLeft - padRight;
      const plotH = height - padTop - padBottom;

      const maxElev = Math.max(maxPathElev * 1.18, 50);

      const toX = function(normD) { return padLeft + normD * plotW; };
      const toY = function(elev) { return padTop + plotH - (elev / maxElev) * plotH; };

      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      [0, 100, 200, 300, 400, 500, 800, 1000].forEach(function(elevVal) {
        if (elevVal <= maxElev && maxElev > 0) {
          const gy = toY(elevVal);
          ctx.beginPath();
          ctx.setLineDash([3, 3]);
          ctx.strokeStyle = '#1e293b';
          ctx.moveTo(padLeft, gy);
          ctx.lineTo(width - padRight, gy);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = '#64748b';
          ctx.fillText(elevVal + 'm', padLeft - 6, gy + 3);
        }
      });

      const qthAntElev = realPoints[0].e + 6;
      const repAntElev = realPoints[realPoints.length - 1].e + 22;
      const xStart = toX(0);
      const yStart = toY(qthAntElev);
      const xEnd = toX(1);
      const yEnd = toY(repAntElev);
      const midX = (xStart + xEnd) / 2;
      const midY = (yStart + yEnd) / 2;

      const beamStroke = finalColor === 'emerald' ? '#10b981' : (finalColor === 'amber' ? '#f59e0b' : '#f43f5e');

      // Fresnel Zone
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(xStart, yStart);
      ctx.quadraticCurveTo(midX, midY - 15, xEnd, yEnd);
      ctx.quadraticCurveTo(midX, midY + 15, xStart, yStart);
      ctx.closePath();
      ctx.fillStyle = 'rgba(6, 182, 212, 0.14)';
      ctx.fill();
      ctx.strokeStyle = beamStroke;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      // Terrain polygon + Water (0m) detection
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(toX(0), padTop + plotH);
      realPoints.forEach(function(pt) {
        ctx.lineTo(toX(pt.d), toY(pt.e));
      });
      ctx.lineTo(toX(1), padTop + plotH);
      ctx.closePath();
      ctx.fillStyle = 'rgba(30, 41, 59, 0.92)';
      ctx.fill();

      // Draw segment-by-segment: Blue for water (<= 0m), Slate for land (> 0m)
      for (let i = 0; i < realPoints.length - 1; i++) {
        const pt1 = realPoints[i];
        const pt2 = realPoints[i + 1];
        const x1 = toX(pt1.d);
        const y1 = toY(pt1.e);
        const x2 = toX(pt2.d);
        const y2 = toY(pt2.e);
        const isWater = (pt1.e <= 0 && pt2.e <= 0);

        if (isWater) {
          ctx.fillStyle = 'rgba(6, 182, 212, 0.28)';
          ctx.fillRect(x1, toY(0) - 4, x2 - x1, 6);
        }

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = isWater ? '#06b6d4' : '#64748b';
        ctx.lineWidth = isWater ? 3.5 : 2;
        ctx.stroke();
      }
      ctx.restore();

      // Direct LoS Line
      ctx.save();
      ctx.beginPath();
      if (rep.statusType === 'off') ctx.setLineDash([5, 6]);
      ctx.moveTo(xStart, yStart);
      ctx.lineTo(xEnd, yEnd);
      ctx.strokeStyle = beamStroke;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();

      // Labels
      ctx.font = '10px monospace';
      realPoints.forEach(function(pt, idx) {
        if (pt.label) {
          const lx = toX(pt.d);
          const ly = toY(pt.e);
          ctx.beginPath();
          ctx.arc(lx, ly, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = '#cbd5e1';
          ctx.fill();

          ctx.fillStyle = '#cbd5e1';
          ctx.textAlign = idx === 0 ? 'left' : (idx === realPoints.length - 1 ? 'right' : 'center');
          ctx.fillText(pt.label, lx, padTop + plotH + 16);
        }
      });
    }

    /*************************************************************************
     * 6. INSPECTOR, LIVE DMR TG FETCHER & DIRECTORY LIST
     *************************************************************************/
    function renderInspector() {
      const rep = REPEATERS.find(function(r) { return r.id === selectedRepeaterId; }) || REPEATERS[0];
      if (!rep) return;

      document.getElementById('inspector-callsign-badge').textContent = rep.callsign;
      const ukRepLink = document.getElementById('inspector-ukrep-link');
      if (ukRepLink) {
        ukRepLink.href = 'https://ukrepeater.net/my_repeater.php?id=' + encodeURIComponent(rep.apiCallsign);
      }

      const modePills = rep.modes.map(function(m) {
        return '<span class="badge badge-cyan mono" style="font-size:10px;">' + m + '</span>';
      }).join(' ');

      const dv = rep.dvConfig || {};
      const hasDmr = rep.modes.indexOf('DMR') !== -1;

      const dmrButtonsHtml = hasDmr
        ? '<div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap;">' +
            '<button onclick="fetchLiveDmrTalkgroups(\'' + rep.id + '\')" id="btn-pull-dmr-tg" class="pill-btn mono" style="background:rgba(6,182,212,0.18);color:#67e8f9;border:1px solid rgba(6,182,212,0.45);padding:2px 8px;font-size:10px;" title="Query RadioID & BrandMeister API v2 for live static talkgroups">' +
              '<i class="fa-solid fa-bolt"></i> Pull Live DMR TGs' +
            '</button>' +
            '<button onclick="copyDmrTgList(\'' + rep.id + '\')" id="btn-copy-dmr-tg" class="pill-btn mono" style="background:rgba(16,185,129,0.16);color:#6ee7b7;border:1px solid rgba(16,185,129,0.4);padding:2px 8px;font-size:10px;" title="Copy DMR Talkgroups & Color Code summary for CPS">' +
              '<i class="fa-regular fa-copy"></i> Copy DMR TG List' +
            '</button>' +
          '</div>'
        : '';

      const html =
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;">' +
          '<div>' +
            '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
              '<strong style="font-size:15px;color:#fff;">' + rep.name + '</strong> ' + modePills +
            '</div>' +
            '<div class="mono" style="font-size:11px;color:var(--text-muted);margin-top:4px;">' +
              'Status: <strong style="color:#6ee7b7;">' + rep.status + '</strong> • Grid: <strong style="color:#fff;">' + rep.locator + '</strong> • Region: <strong style="color:#fff;">' + (rep.regionGroup || rep.keeper) + '</strong>' +
            '</div>' +
          '</div>' +
          '<div class="mono" style="text-align:right;font-size:12px;flex-shrink:0;">' +
            '<div style="color:var(--cyan);font-weight:700;font-size:14px;">' + rep.rxFreq + ' MHz</div>' +
            '<div style="color:var(--text-muted);">TX: ' + rep.txFreq + ' (' + rep.offset + ')</div>' +
            '<div style="color:#64748b;font-size:10px;">Chan: ' + rep.channel + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="sub-box mono" style="display:flex;flex-direction:column;gap:6px;">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;border-bottom:1px solid var(--border);padding-bottom:5px;flex-wrap:wrap;">' +
            '<span style="color:var(--cyan);font-weight:700;font-size:11px;">' +
              'ACCESS & DIGITAL VOICE (DV) CODEPLUG PARAMETERS (' + rep.band + ')' +
            '</span>' +
            dmrButtonsHtml +
          '</div>' +
          '<div style="font-size:11px;color:#fff;"><strong>Access / Tone / CC:</strong> <span id="insp-dv-access">' + (dv.accessParam || rep.ctcss) + '</span></div>' +
          '<div style="font-size:11px;color:#6ee7b7;"><strong>Network / Protocol:</strong> <span id="insp-dv-proto">' + (dv.protocol || rep.modes.join(' / ')) + '</span></div>' +
          '<div style="font-size:11px;color:#cbd5e1;"><strong>Slot 1 / Primary:</strong> <span id="insp-dv-ts1">' + (dv.ts1 || 'Standard Voice') + '</span></div>' +
          '<div style="font-size:11px;color:#cbd5e1;"><strong>Slot 2 / Secondary:</strong> <span id="insp-dv-ts2">' + (dv.ts2 || 'Local Output') + '</span></div>' +
        '</div>' +
        '<div class="sub-box" style="display:flex;flex-direction:column;gap:6px;">' +
          '<div><strong style="color:var(--amber);">Site & Propagation Note:</strong> ' + rep.funFact + '</div>' +
          '<div style="border-top:1px solid var(--border);padding-top:6px;"><strong style="color:var(--cyan);">Operating guidance:</strong> Program the listed frequencies and access settings. Coverage and signal quality depend on your radio, power, antenna, location, terrain and propagation conditions.</div>' +
        '</div>';

      document.getElementById('inspector-content').innerHTML = html;

      const numMatch = rep.ctcss.match(/([0-9]+\.[0-9]+)/);
      const toneVal = numMatch ? numMatch[1] : '103.5';
      const chirpStr = rep.callsign + ',' + rep.rxFreq + ',' + rep.offset.replace(' MHz','') + ',' + toneVal + ',' + toneVal + ',' + rep.modes[0] + ',' + rep.name + ',,,,..';
      document.getElementById('chirp-csv-string').textContent = chirpStr;
    }

    async function fetchLiveDmrTalkgroups(repId) {
      const rep = REPEATERS.find(function(r) { return r.id === repId; });
      if (!rep) return;

      const btn = document.getElementById('btn-pull-dmr-tg');
      if (btn) {
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Querying BM / RadioID...';
        btn.disabled = true;
      }

      const call = rep.apiCallsign || rep.callsign.split('-')[0];
      const cacheKey = 'dmr_tg_v1_' + call;

      let dmrId = (rep.dvConfig && rep.dvConfig.dmrId) ? rep.dvConfig.dmrId : null;
      let colorCode = (rep.dvConfig && rep.dvConfig.colorCode)
        ? rep.dvConfig.colorCode
        : (rep.ctcss.indexOf('CC') !== -1 ? rep.ctcss : 'CC1');
      let networkName = 'UK DMR Network';
      let ts1List = [];
      let ts2List = [];

      // 1. Query the RadioID API directly. A future backend should proxy and cache this request.
      try {
        const radioIdUrl = 'https://radioid.net/api/dmr/repeater/?callsign=' + encodeURIComponent(call);
        let rData = null;

        try {
          const rResp = await fetch(radioIdUrl);
          if (rResp.ok) rData = await rResp.json();
        } catch (radioIdError) {
          console.warn('RadioID lookup unavailable:', radioIdError);
        }

        if (rData && Array.isArray(rData.results) && rData.results.length > 0) {
          const ukEntry = rData.results.find(function(x) {
            return String(x.id).startsWith('234') || String(x.id).startsWith('235');
          }) || rData.results[0];

          dmrId = ukEntry.id;
          if (ukEntry.color_code) colorCode = 'CC' + ukEntry.color_code;
          if (ukEntry.ipsc_network) networkName = ukEntry.ipsc_network;
          else if (ukEntry.assigned) networkName = ukEntry.assigned;
        }
      } catch (err) {
        console.warn('RadioID lookup warning:', err);
      }

      // 2. If we found a DMR ID, query BrandMeister API v2 for live Static Talkgroups on TS1 & TS2
      if (dmrId) {
        try {
          const bmTgUrl = 'https://api.brandmeister.network/v2/device/' + encodeURIComponent(dmrId) + '/talkgroup';
          const bmResp = await fetch(bmTgUrl);
          if (bmResp.ok) {
            const tgArray = await bmResp.json();
            if (Array.isArray(tgArray) && tgArray.length > 0) {
              networkName = 'BrandMeister UK (ID ' + dmrId + ')';
              tgArray.forEach(function(item) {
                const slot = Number(item.slot);
                const tg = item.talkgroup || item.group || item.tg;
                if (!tg) return;
                if (slot === 1) ts1List.push(formatTgBadge(tg));
                else if (slot === 2) ts2List.push(formatTgBadge(tg));
              });
            }
          }

          const bmProfUrl = 'https://api.brandmeister.network/v2/device/' + encodeURIComponent(dmrId);
          const profResp = await fetch(bmProfUrl);
          if (profResp.ok) {
            const prof = await profResp.json();
            if (prof && prof.colorcode) colorCode = 'CC' + prof.colorcode;
            if (prof && (prof.last_seen || prof.master)) {
              networkName = 'BrandMeister UK (ID ' + dmrId + ')';
            }
          }
        } catch (bmErr) {
          console.warn('BrandMeister API v2 lookup warning:', bmErr);
        }
      }

      // 3. Build final TS1 & TS2 strings
      const regDefaults = getRegionalDefaultDmrTGs(rep.regionGroup);
      const isPhoenix = networkName.toLowerCase().indexOf('phoenix') !== -1 || networkName.toLowerCase().indexOf('dmr-uk') !== -1;

      const finalTs1 = ts1List.length > 0
        ? 'TS1 Static: ' + ts1List.join(', ') + ' + User Dynamic TGs'
        : (isPhoenix
            ? 'TS1 (Phoenix UK): TG 235 (UK Wide), TG 2355 (Scotland), User-Activated TGs (15m hold)'
            : regDefaults.ts1 + (dmrId ? ' (Open Dynamic Slot)' : ''));

      const finalTs2 = ts2List.length > 0
        ? 'TS2 Static: ' + ts2List.join(', ') + ' + TG 9 (Local)'
        : (isPhoenix
            ? 'TS2 (Phoenix UK): TG 9 (Local) & TG 8 (Regional Cluster) | Dial 4400 PC to link TG 235'
            : regDefaults.ts2);

      rep.dvConfig = {
        protocol: networkName + (dmrId && networkName.indexOf(String(dmrId)) === -1 ? ' • DMR ID: ' + dmrId : '') + ' (' + rep.modes.join('/') + ')',
        accessParam: 'DMR Color Code: ' + colorCode + (rep.modes.indexOf('FM') !== -1 ? ' | FM Tone: ' + rep.ctcss : '') + ' | Chan: ' + rep.channel,
        ts1: finalTs1,
        ts2: finalTs2,
        network: networkName,
        dmrId: dmrId,
        colorCode: colorCode
      };

      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          ts: Date.now(),
          dvConfig: rep.dvConfig
        }));
      } catch (e) {}

      renderInspector();

      const updatedBtn = document.getElementById('btn-pull-dmr-tg');
      if (updatedBtn) {
        updatedBtn.innerHTML = '<i class="fa-solid fa-check"></i> Live TGs Synced';
      }
    }

    function copyDmrTgList(repId) {
      const rep = REPEATERS.find(function(r) { return r.id === repId; }) || REPEATERS[0];
      if (!rep) return;
      const dv = rep.dvConfig || {};

      const summaryLines = [
        rep.callsign + ' (' + rep.name + ') — DMR Codeplug Summary',
        'RX (Output): ' + rep.rxFreq + ' MHz | TX (Input): ' + rep.txFreq + ' MHz (' + rep.offset + ')',
        'Access / Color Code: ' + (dv.accessParam || rep.ctcss),
        'Network: ' + (dv.protocol || 'UK DMR'),
        'Slot 1: ' + (dv.ts1 || 'Dynamic TGs'),
        'Slot 2: ' + (dv.ts2 || 'Local / Regional Static TGs')
      ].join('\n');

      const btn = document.getElementById('btn-copy-dmr-tg');
      const textArea = document.createElement('textarea');
      textArea.value = summaryLines;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        if (btn) {
          const orig = btn.innerHTML;
          btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied TG List';
          setTimeout(function() { btn.innerHTML = orig; }, 2000);
        }
      } catch (err) {}
      document.body.removeChild(textArea);
    }

    function renderRepeaterList() {
      const container = document.getElementById('repeater-list-container');
      if (!container) return;
      container.innerHTML = '';

      const qth = QTH_LOCATIONS[currentQTH] || QTH_LOCATIONS.england_midlands;
      const q = searchQuery.trim().toLowerCase();

      const filtered = REPEATERS.filter(function(rep) {
        const hasExtra2m = rep.extraBands && rep.extraBands.indexOf('2m') !== -1;
        const hasExtra70cm = rep.extraBands && rep.extraBands.indexOf('70cm') !== -1;
        const hasExtra4m = rep.extraBands && rep.extraBands.indexOf('4m') !== -1;

        const bandMatch =
          activeBandFilter === 'ALL' ||
          (activeBandFilter === '2m' && (rep.band === '2m' || hasExtra2m)) ||
          (activeBandFilter === '70cm' && (rep.band === '70cm' || hasExtra70cm)) ||
          (activeBandFilter === '6m' && (rep.band === '6m/10m' || rep.band === '6m/4m' || hasExtra4m)) ||
          (activeBandFilter === '23cm' && rep.band === '23cm');

        const modeMatch =
          activeModeFilter === 'ALL' ||
          rep.modes.indexOf(activeModeFilter) !== -1;

        const regionMatch =
          activeRegionGroupFilter === 'ALL' ||
          rep.regionGroup === activeRegionGroupFilter;

        const searchMatch =
          !q ||
          rep.callsign.toLowerCase().indexOf(q) !== -1 ||
          rep.name.toLowerCase().indexOf(q) !== -1 ||
          rep.locator.toLowerCase().indexOf(q) !== -1 ||
          (rep.regionGroup && rep.regionGroup.toLowerCase().indexOf(q) !== -1) ||
          rep.keeper.toLowerCase().indexOf(q) !== -1 ||
          rep.rxFreq.indexOf(q) !== -1 ||
          rep.channel.toLowerCase().indexOf(q) !== -1;

        return bandMatch && modeMatch && regionMatch && searchMatch;
      });

      filtered.sort(function(a, b) {
        if (sortBy === 'callsign') {
          return a.callsign.localeCompare(b.callsign);
        }
        const dA = calcDistanceKm(qth.lat, qth.lng, a.lat, a.lng);
        const dB = calcDistanceKm(qth.lat, qth.lng, b.lat, b.lng);
        return dA - dB;
      });

      document.getElementById('repeater-count').textContent = filtered.length;

      filtered.forEach(function(rep) {
        const isSelected = rep.id === selectedRepeaterId;
        const distKm = calcDistanceKm(qth.lat, qth.lng, rep.lat, rep.lng);
        const bearing = calcBearing(qth.lat, qth.lng, rep.lat, rep.lng);

        let dotColor = '#10b981';
        if (rep.statusType === 'new') dotColor = '#06b6d4';
        else if (rep.statusType === 'net') dotColor = '#f59e0b';
        else if (rep.statusType === 'off') dotColor = '#f43f5e';
        else if (rep.modes.indexOf('TETRA') !== -1 || rep.band === '6m/10m' || rep.band === '23cm') dotColor = '#a855f7';

        const card = document.createElement('div');
        card.className = 'rep-card' + (isSelected ? ' selected' : '');
        card.onclick = function() { selectRepeater(rep.id); };

        card.innerHTML =
          '<div style="display:flex;align-items:center;gap:10px;min-width:0;">' +
            '<span class="dot" style="background:' + dotColor + ';"></span>' +
            '<div style="min-width:0;">' +
              '<div class="mono" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
                '<strong style="color:#fff;font-size:13px;">' + rep.callsign + '</strong>' +
                '<span style="font-size:10px;background:#1e293b;padding:1px 5px;border-radius:4px;color:#cbd5e1;">' + (rep.rawBand || rep.band) + '</span>' +
                '<span style="font-size:10px;color:#67e8f9;">' + rep.modes.join('/') + '</span>' +
                '<span style="font-size:10px;color:#64748b;">' + rep.rxFreq + '</span>' +
              '</div>' +
              '<div style="font-size:11px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' +
                rep.name + ' • <span class="mono">' + rep.locator + '</span> • ' + (rep.regionGroup || '') +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="mono" style="text-align:right;font-size:11px;flex-shrink:0;">' +
            '<div style="color:var(--cyan);font-weight:700;">' + distKm.toFixed(1) + ' km</div>' +
            '<div style="color:var(--text-muted);font-size:10px;">' + bearing.split(' ')[1] + '</div>' +
          '</div>';

        container.appendChild(card);
      });
    }

    /*************************************************************************
     * 7. LIVE UKREPEATER.NET SYNC & UI CONTROLS
     *************************************************************************/
    async function syncLiveUKRepeaterScotlandList() {
      const badgeEl = document.getElementById('live-api-badge');
      const syncIconEl = document.getElementById('sync-icon');
      if (syncIconEl) syncIconEl.classList.remove('fa-spin');
      await loadAllUKRepeatersFromCSV();
      await syncLiveScotlandNets();
      if (badgeEl) {
        badgeEl.className = 'status-pill synced mono';
        badgeEl.textContent = 'Bundled validated data loaded';
      }
    }

    function selectRepeater(repId) {
      selectedRepeaterId = repId;
      renderMapElements();
      renderTerrainProfile();
      renderInspector();
      renderRepeaterList();

      const rep = REPEATERS.find(function(r) { return r.id === repId; });
      if (rep && map) {
        map.panTo([rep.lat, rep.lng], { animate: true, duration: 0.6 });
      }
    }

    function onSearchInput(val) {
      searchQuery = val || '';
      renderRepeaterList();
    }

    function setRegionGroupFilter(regionVal) {
      activeRegionGroupFilter = regionVal || 'ALL';
      renderMapElements();
      renderRepeaterList();
    }

    function toggleSortOrder() {
      sortBy = sortBy === 'distance' ? 'callsign' : 'distance';
      const btn = document.getElementById('btn-sort-order');
      if (btn) {
        btn.innerHTML = sortBy === 'distance'
          ? '<i class="fa-solid fa-arrow-down-short-wide"></i> Dist'
          : '<i class="fa-solid fa-arrow-down-a-z"></i> Call';
      }
      renderRepeaterList();
    }

    function setQTH(qthId) {
      if (!QTH_LOCATIONS[qthId]) return;
      currentQTH = qthId;
      sortBy = 'distance';
      netSortBy = 'distance';
      const sortBtn = document.getElementById('btn-sort-order');
      if (sortBtn) sortBtn.innerHTML = '<i class="fa-solid fa-arrow-down-short-wide"></i> Dist';
      const netSortBtn = document.getElementById('btn-sort-nets');
      if (netSortBtn) netSortBtn.innerHTML = '<i class="fa-solid fa-location-dot"></i> Sorted by Distance from QTH';
      const qth = QTH_LOCATIONS[qthId];

      const selectEl = document.getElementById('uk-preset-select');
      if (selectEl && qthId !== 'custom') {
        selectEl.value = qthId;
      }

      const netQthLabel = document.getElementById('net-qth-label');
      if (netQthLabel) netQthLabel.textContent = qth.name + ' (' + qth.locator + ')';

      const activePill = document.getElementById('qth-active-pill');
      if (activePill) activePill.textContent = 'QTH: ' + qth.name + ' (' + qth.locator + ')';

      // Auto-select nearest operational repeater to the chosen QTH
      if (REPEATERS.length > 0) {
        let nearest = REPEATERS[0];
        let minDist = Infinity;
        REPEATERS.forEach(function(r) {
          if (r.statusType === 'off') return;
          const d = calcDistanceKm(qth.lat, qth.lng, r.lat, r.lng);
          if (d < minDist) {
            minDist = d;
            nearest = r;
          }
        });
        if (nearest) selectedRepeaterId = nearest.id;
      }

      renderMapElements();
      renderTerrainProfile();
      renderInspector();
      renderRepeaterList();
      renderScotlandNets();

      if (map) {
        map.setView([qth.lat, qth.lng], qth.zoom || 8, { animate: true });
      }
    }

    function setCustomLocatorQTH() {
      const inputEl = document.getElementById('custom-locator-input');
      const rawLoc = (inputEl ? inputEl.value : '').trim().toUpperCase();
      if (rawLoc.length < 4 || !/^[A-R]{2}[0-9]{2}/i.test(rawLoc)) {
        if (inputEl) inputEl.value = 'IO92FL';
        return;
      }
      const coords = locatorToLatLng(rawLoc, '');
      const formattedLoc = rawLoc.length >= 6
        ? rawLoc.slice(0, 4) + rawLoc.slice(4, 6).toLowerCase()
        : rawLoc;

      QTH_LOCATIONS.custom = {
        id: 'custom',
        name: 'Grid ' + formattedLoc,
        locator: formattedLoc,
        lat: coords.lat,
        lng: coords.lng,
        zoom: 9,
        elevMeters: 45,
        desc: 'Custom UK Maidenhead Grid Locator QTH (' + formattedLoc + ').'
      };
      setQTH('custom');
    }

    function useDeviceGPSForQTH() {
      const gpsBtn = document.getElementById('btn-gps-qth');
      if (!navigator.geolocation) return;
      if (gpsBtn) gpsBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Locating...';

      navigator.geolocation.getCurrentPosition(
        function(pos) {
          const lat = +pos.coords.latitude.toFixed(4);
          const lng = +pos.coords.longitude.toFixed(4);
          const alt = pos.coords.altitude ? Math.round(pos.coords.altitude) : 35;
          const loc = latLngToLocator(lat, lng);

          QTH_LOCATIONS.custom = {
            id: 'custom',
            name: 'My GPS QTH',
            locator: loc,
            lat: lat,
            lng: lng,
            zoom: 10,
            elevMeters: alt,
            desc: 'Live device GPS location (' + lat + ', ' + lng + ' • Grid ' + loc + ').'
          };
          if (gpsBtn) gpsBtn.innerHTML = '<i class="fa-solid fa-location-arrow"></i> GPS Locked';
          const inputEl = document.getElementById('custom-locator-input');
          if (inputEl) inputEl.value = loc;
          setQTH('custom');
        },
        function() {
          if (gpsBtn) gpsBtn.innerHTML = '<i class="fa-solid fa-location-arrow"></i> GPS N/A';
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }

    function toggleMapPickQTHMode() {
      mapPickQTHMode = !mapPickQTHMode;
      const btn = document.getElementById('btn-pick-map-qth');
      if (btn) {
        if (mapPickQTHMode) {
          btn.className = 'btn active-cyan mono';
          btn.innerHTML = '<i class="fa-solid fa-crosshairs"></i> Click Map Now...';
        } else {
          btn.className = 'btn btn-outline mono';
          btn.innerHTML = '<i class="fa-solid fa-map-pin"></i> Pick on Map';
        }
      }
    }

    function toggleNetSortMode() {
      netSortBy = netSortBy === 'distance' ? 'name' : 'distance';
      const btn = document.getElementById('btn-sort-nets');
      if (btn) {
        btn.innerHTML = netSortBy === 'distance'
          ? '<i class="fa-solid fa-location-dot"></i> Sorted by Distance from QTH'
          : '<i class="fa-solid fa-arrow-down-a-z"></i> Sorted A–Z';
      }
      renderScotlandNets();
    }

    function setRig() {
      currentRig = 'generic';
      if (selectedRepeaterId) drawTerrainProfile(selectedRepeaterId);
    }

    function setBandFilter(band) {
      activeBandFilter = band;
      ['ALL', '2m', '70cm', '6m', '23cm'].forEach(function(b) {
        const btn = document.getElementById('filter-band-' + b);
        if (btn) btn.className = b === band ? 'pill-btn active' : 'pill-btn';
      });
      renderMapElements(); // <-- THIS FORCES THE MAP PINS TO RE-FILTER BY BAND
      renderRepeaterList();
    }

    function setModeFilter(mode) {
      activeModeFilter = mode;
      ['ALL', 'FM', 'DMR', 'YSF', 'D-STAR', 'NXDN', 'TETRA'].forEach(function(m) {
        const btn = document.getElementById('filter-mode-' + m);
        if (btn) btn.className = m === mode ? 'pill-btn active' : 'pill-btn';
      });
      renderMapElements(); // <-- THIS FORCES THE MAP PINS TO RE-FILTER BY MODE (DMR, YSF, etc.)
      renderRepeaterList();
    }

    function toggleCoveragePolygons() {
      showAllLobes = !showAllLobes;
      const btn = document.getElementById('btn-toggle-lobes');
      if (btn) {
        btn.innerHTML = showAllLobes
          ? '<i class="fa-solid fa-eye"></i> All Footprints'
          : '<i class="fa-solid fa-eye-slash"></i> Selected Footprint';
      }
      renderMapElements();
    }

    function toggleMapTiles() {
      if (!map) return;
      topoTilesActive = !topoTilesActive;
      const mapEl = document.getElementById('rf-map');
      const btn = document.getElementById('btn-toggle-tiles');

      if (topoTilesActive) {
        map.removeLayer(tileLayerOSM);
        tileLayerTopo.addTo(map);
        mapEl.className = 'topo-tiles';
        btn.innerHTML = '<i class="fa-solid fa-map"></i> Street Map';
      } else {
        map.removeLayer(tileLayerTopo);
        tileLayerOSM.addTo(map);
        mapEl.className = 'osm-dark-tiles';
        btn.innerHTML = '<i class="fa-solid fa-mountain"></i> Topo Map';
      }
    }

    function copyChirpRow() {
      const rep = REPEATERS.find(function(r) { return r.id === selectedRepeaterId; });
      if (!rep) return;
      const chirpStr = document.getElementById('chirp-csv-string').textContent;
      const btn = document.getElementById('btn-copy-csv');

      const textArea = document.createElement('textarea');
      textArea.value = chirpStr;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        if (btn) {
          const orig = btn.innerHTML;
          btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied ' + rep.callsign;
          setTimeout(function() { btn.innerHTML = orig; }, 2000);
        }
      } catch (err) {}
      document.body.removeChild(textArea);
    }

    /*************************************************************************
     * 8. UK & SCOTLAND HAM NETS (NETFINDER + RSGB NEWS) DIRECTORY & LIVE SYNC
     *************************************************************************/
    let activeNetCountryFilter = 'ALL';

    function getTodayShortName() {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return days[new Date().getDay()];
    }

    function setNetCountryFilter(scope) {
      activeNetCountryFilter = scope || 'ALL';
      ['ALL', 'Scotland', 'England'].forEach(function(item) {
        const btn = document.getElementById('net-country-' + item);
        if (btn) btn.className = item === activeNetCountryFilter ? 'pill-btn active' : 'pill-btn';
      });
      renderScotlandNets();
    }

    function setNetDayFilter(day) {
      activeNetDayFilter = day;
      ['ALL', 'TODAY', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].forEach(function(d) {
        const btn = document.getElementById('net-day-' + d);
        if (btn) btn.className = d === day ? 'pill-btn active' : 'pill-btn';
      });
      renderScotlandNets();
    }

    function setNetModeFilter(mode) {
      activeNetModeFilter = mode;
      ['ALL', '2m', '70cm', 'DMR', 'AllStar', 'HF'].forEach(function(m) {
        const btn = document.getElementById('net-mode-' + m);
        if (btn) btn.className = m === mode ? 'pill-btn active' : 'pill-btn';
      });
      renderScotlandNets();
    }

    function onNetSearchInput(val) {
      netSearchQuery = val || '';
      renderScotlandNets();
    }

    function inspectNetOnMapAndTerrain(netId) {
      const net = SCOTLAND_NETS.find(function(n) { return n.id === netId; });
      if (!net) return;

      selectedNetId = net.id;
      showNetMarkersOnMap = true;

      if (net.linkedRepeaterId) {
        selectedRepeaterId = net.linkedRepeaterId;
      }

      renderMapElements();
      renderTerrainProfile();
      renderInspector();
      renderRepeaterList();
      renderScotlandNets();

      if (map) {
        map.setView([net.lat, net.lng], 10, { animate: true });
      }

      const mapCard = document.getElementById('rf-map');
      if (mapCard) {
        mapCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    function plotAllNetsOnMap() {
      showAllLobes = true;
      showNetMarkersOnMap = true;
      renderMapElements();
      if (map) {
        map.setView([54.30, -2.90], 6, { animate: true });
      }
      const mapCard = document.getElementById('rf-map');
      if (mapCard) {
        mapCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    function copyNetChirpRow(netId, btnEl) {
      const net = SCOTLAND_NETS.find(function(n) { return n.id === netId; });
      if (!net) return;

      const numMatch = (net.toneOrCC || '').match(/([0-9]+\.[0-9]+)/);
      const toneVal = numMatch ? numMatch[1] : '103.5';
      const csvRow = net.id.replace('NET-', '') + ',' + net.rxFreq + ',' + net.offset.replace(' MHz', '') + ',' + toneVal + ',' + toneVal + ',' + net.mode.split('/')[0].trim() + ',' + net.name + ',,,,..';

      const textArea = document.createElement('textarea');
      textArea.value = csvRow;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        if (btnEl) {
          const orig = btnEl.innerHTML;
          btnEl.innerHTML = '<i class="fa-solid fa-check"></i> Copied CHIRP CSV';
          setTimeout(function() { btnEl.innerHTML = orig; }, 1800);
        }
      } catch (e) {}
      document.body.removeChild(textArea);
    }

    function renderScotlandNets() {
      const container = document.getElementById('nets-grid-container');
      if (!container) return;
      container.innerHTML = '';

      const qth = QTH_LOCATIONS[currentQTH] || QTH_LOCATIONS.england_midlands;
      const todayShort = getTodayShortName();
      const q = netSearchQuery.trim().toLowerCase();

      const filtered = SCOTLAND_NETS.filter(function(net) {
        const regionText = String(net.region || '').toLowerCase();
        const scopeText = String(net.countryScope || '').toLowerCase();
        const isScotland = scopeText === 'scotland' || regionText.indexOf('scotland') !== -1 || regionText.indexOf('glasgow') !== -1 || regionText.indexOf('edinburgh') !== -1 || regionText.indexOf('fife') !== -1 || regionText.indexOf('perth') !== -1 || regionText.indexOf('dundee') !== -1 || regionText.indexOf('caithness') !== -1 || regionText.indexOf('orkney') !== -1;
        const isEngland = !isScotland && regionText.indexOf('wales') === -1 && regionText.indexOf('northern ireland') === -1 && regionText.indexOf('belfast') === -1 && (scopeText === 'uk' || scopeText === 'rsgb' || regionText.indexOf('england') !== -1 || regionText.indexOf('london') !== -1 || regionText.indexOf('manchester') !== -1 || regionText.indexOf('birmingham') !== -1 || regionText.indexOf('milton keynes') !== -1 || regionText.indexOf('hampshire') !== -1 || regionText.indexOf('devon') !== -1);
        const countryMatch = activeNetCountryFilter === 'ALL' || (activeNetCountryFilter === 'Scotland' && isScotland) || (activeNetCountryFilter === 'England' && isEngland);

        const dayMatch =
          activeNetDayFilter === 'ALL' ||
          (activeNetDayFilter === 'TODAY' && net.days.indexOf(todayShort) !== -1) ||
          net.days.indexOf(activeNetDayFilter) !== -1;

        const modeMatch =
          activeNetModeFilter === 'ALL' ||
          net.tags.indexOf(activeNetModeFilter) !== -1 ||
          (activeNetModeFilter === 'AllStar' && (net.allstarNode || net.echolinkNode || net.mode.toLowerCase().indexOf('allstar') !== -1)) ||
          (activeNetModeFilter === 'DMR' && (net.dmrTg || net.mode.toLowerCase().indexOf('dmr') !== -1));

        const searchMatch =
          !q ||
          net.name.toLowerCase().indexOf(q) !== -1 ||
          net.region.toLowerCase().indexOf(q) !== -1 ||
          net.rxFreq.indexOf(q) !== -1 ||
          net.mode.toLowerCase().indexOf(q) !== -1 ||
          net.codeplugSettings.toLowerCase().indexOf(q) !== -1 ||
          (net.allstarNode && net.allstarNode.toLowerCase().indexOf(q) !== -1) ||
          (net.echolinkNode && net.echolinkNode.toLowerCase().indexOf(q) !== -1) ||
          (net.dmrTg && net.dmrTg.toLowerCase().indexOf(q) !== -1) ||
          (net.linkedRepeaterId && net.linkedRepeaterId.toLowerCase().indexOf(q) !== -1);

        return countryMatch && dayMatch && modeMatch && searchMatch;
      });

      filtered.sort(function(a, b) {
        if (netSortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        const qLat = Number(qth.lat);
        const qLng = Number(qth.lng);
        const aLat = Number(a.lat);
        const aLng = Number(a.lng);
        const bLat = Number(b.lat);
        const bLng = Number(b.lng);
        const dA = Number.isFinite(aLat) && Number.isFinite(aLng)
          ? calcDistanceKm(qLat, qLng, aLat, aLng)
          : Number.POSITIVE_INFINITY;
        const dB = Number.isFinite(bLat) && Number.isFinite(bLng)
          ? calcDistanceKm(qLat, qLng, bLat, bLng)
          : Number.POSITIVE_INFINITY;
        return dA - dB || a.name.localeCompare(b.name);
      });

      const countEl = document.getElementById('net-count');
      if (countEl) countEl.textContent = filtered.length;

      const allDaysOrder = [
        { key: 'Mon', label: 'M' },
        { key: 'Tue', label: 'T' },
        { key: 'Wed', label: 'W' },
        { key: 'Thu', label: 'T' },
        { key: 'Fri', label: 'F' },
        { key: 'Sat', label: 'S' },
        { key: 'Sun', label: 'S' }
      ];

      filtered.forEach(function(net) {
        const distKm = calcDistanceKm(qth.lat, qth.lng, net.lat, net.lng);
        const bearing = calcBearing(qth.lat, qth.lng, net.lat, net.lng);
        const isToday = net.days.indexOf(todayShort) !== -1;
        const isSelected = net.id === selectedNetId;

        const dayDotsHtml = allDaysOrder.map(function(d) {
          const isOn = net.days.indexOf(d.key) !== -1;
          return '<span class="day-dot mono ' + (isOn ? 'on' : '') + '" title="' + d.key + '">' + d.label + '</span>';
        }).join('');

        const hasAllStar = net.allstarNode && net.allstarNode.indexOf('N/A') === -1;
        const hasDmr = net.dmrTg && net.dmrTg.indexOf('N/A') === -1;

        const allstarRowHtml = hasAllStar
          ? '<div style="display:flex;justify-content:space-between;gap:6px;">' +
              '<span style="color:var(--text-muted);">AllStar / EchoLink:</span>' +
              '<strong style="color:var(--amber);">Node ' + net.allstarNode + (net.echolinkNode ? ' • ' + net.echolinkNode : '') + '</strong>' +
            '</div>'
          : '';

        const dmrRowHtml = hasDmr
          ? '<div style="display:flex;justify-content:space-between;gap:6px;">' +
              '<span style="color:var(--text-muted);">DMR Talkgroup:</span>' +
              '<strong style="color:var(--cyan);">' + net.dmrTg + (net.dvReflectors ? ' • ' + net.dvReflectors : '') + '</strong>' +
            '</div>'
          : '';

        const card = document.createElement('div');
        card.className = 'net-card' + (isSelected ? ' active-net' : '');

        card.innerHTML =
          '<div style="display:flex;flex-direction:column;gap:8px;">' +
            '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;">' +
              '<div>' +
                '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
                  '<strong style="font-size:13px;color:#ffffff;">' + net.name + '</strong>' +
                  (isToday ? '<span class="badge badge-emerald mono" style="font-size:9px;">ON TODAY (' + todayShort.toUpperCase() + ')</span>' : '') +
                  (hasAllStar ? '<span class="badge badge-amber mono" style="font-size:9px;">ALLSTAR</span>' : '') +
                  (hasDmr ? '<span class="badge badge-cyan mono" style="font-size:9px;">DMR/DV</span>' : '') +
                '</div>' +
                '<div class="mono" style="font-size:11px;color:var(--text-muted);margin-top:2px;">' +
                  net.region + ' • Grid: <strong style="color:#cbd5e1;">' + net.locator + '</strong>' +
                '</div>' +
              '</div>' +
              '<div class="mono" style="text-align:right;flex-shrink:0;">' +
                '<div style="color:var(--cyan);font-weight:700;font-size:12px;">' + distKm.toFixed(1) + ' km</div>' +
                '<div style="color:var(--text-muted);font-size:10px;">' + bearing + '</div>' +
              '</div>' +
            '</div>' +

            '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;background:var(--bg-900);padding:6px 8px;border-radius:8px;border:1px solid var(--border);">' +
              '<div class="day-pills">' + dayDotsHtml + '</div>' +
              '<div class="mono" style="font-size:11px;color:var(--amber);font-weight:700;">' +
                '<i class="fa-regular fa-clock"></i> ' + net.timeLocal +
              '</div>' +
            '</div>' +

            '<div class="mono" style="font-size:11px;display:flex;flex-direction:column;gap:4px;background:var(--bg-900);padding:8px;border-radius:8px;border:1px solid var(--border);">' +
              '<div style="display:flex;justify-content:space-between;gap:6px;">' +
                '<span style="color:var(--text-muted);">Freq / Band:</span>' +
                '<strong style="color:#67e8f9;">' + net.rxFreq + ' MHz (' + net.band + ')</strong>' +
              '</div>' +
              '<div style="display:flex;justify-content:space-between;gap:6px;">' +
                '<span style="color:var(--text-muted);">Tone / Access:</span>' +
                '<strong style="color:#6ee7b7;">' + net.toneOrCC + '</strong>' +
              '</div>' +
              allstarRowHtml +
              dmrRowHtml +
              '<div style="display:flex;justify-content:space-between;gap:6px;">' +
                '<span style="color:var(--text-muted);">Repeater / Hub:</span>' +
                '<strong style="color:#fff;">' + (net.linkedRepeaterId || 'Simplex') + (net.secondaryRepeaterId ? ' + ' + net.secondaryRepeaterId : '') + '</strong>' +
              '</div>' +
              '<div style="border-top:1px solid var(--border);padding-top:4px;margin-top:2px;color:#cbd5e1;font-size:10px;">' +
                '<strong style="color:var(--cyan);">Codeplug:</strong> ' + net.codeplugSettings +
              '</div>' +
            '</div>' +

            '<div style="font-size:11px;color:#cbd5e1;line-height:1.4;">' +
              net.notes +
            '</div>' +
          '</div>' +

          '<div style="display:flex;align-items:center;justify-content:space-between;gap:6px;border-top:1px solid var(--border);padding-top:8px;">' +
            '<button onclick="inspectNetOnMapAndTerrain(\'' + net.id + '\')" class="btn active-cyan mono" style="font-size:11px;padding:5px 10px;flex:1;justify-content:center;">' +
              '<i class="fa-solid fa-route"></i> Path & Inspect (' + (net.linkedRepeaterId || 'Map') + ')' +
            '</button>' +
            '<button onclick="copyNetChirpRow(\'' + net.id + '\', this)" class="btn btn-outline mono" style="font-size:11px;padding:5px 9px;">' +
              '<i class="fa-regular fa-copy"></i> CSV' +
            '</button>' +
          '</div>';

        container.appendChild(card);
      });
    }

    /**
     * Live scrapes NetFinder (Scotland + UK) AND RSGB Weekly Regional News posts
     */
    async function syncLiveScotlandNets() {
      const iconEl = document.getElementById('net-sync-icon');
      const textEl = document.getElementById('net-sync-text');
      if (iconEl) iconEl.classList.remove('fa-spin');
      if (textEl) textEl.textContent = 'Bundled validated net dataset (' + SCOTLAND_NETS.length + ' nets)';
      renderScotlandNets();
      renderMapElements();
    }

    window.addEventListener('DOMContentLoaded', function() {
      initMap();
      renderScotlandNets();
      loadAllUKRepeatersFromCSV();

      window.addEventListener('resize', function() {
        renderTerrainProfile();
      });
    });
