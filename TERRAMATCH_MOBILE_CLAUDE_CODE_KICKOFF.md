# TerraMatch Mobile — Claude Code Engineering Spec

## KICKOFF PROMPT FOR CLAUDE CODE

> Paste everything below into Claude Code as your initial prompt. It contains the full context, architecture, data model, current v3 state, and build instructions.

---

## PROJECT OVERVIEW

Build **TerraMatch Mobile** — a cross-platform (iOS + Android) React Native (Expo) mobile app for field data collection and quality assurance of restoration project polygons. This app is built for **World Resources Institute (WRI)** and serves two user types:

1. **Restoration Champions** — Field data collectors from ~90 restoration organizations across Africa who collect geospatial polygons, points, and geotagged photos for their restoration sites
2. **WRI Data Quality Analysts (DQAs)** — WRI staff who review, validate, and approve polygon data before it enters TerraMatch (WRI's central restoration monitoring platform)

### The Problem This Solves

Currently, champions collect data using Flority (a third-party app) → data goes to Greenhouse (another third-party web app for preliminary QA) → data is pushed to TerraMatch (WRI's platform) for final approval. This pipeline has unnecessary friction. TerraMatch Mobile **eliminates the Greenhouse middleman** — data flows directly from this app to TerraMatch.

### Current State

We have a **working interactive prototype** built as a React JSX component (v3). It demonstrates the full UX flow with real project data. The task now is to convert this into a real, installable React Native app. **We are building from v3 forward — v3 is the definitive UX reference.**

---

## TECHNICAL STACK

```
Framework:     React Native (Expo SDK 51+, managed workflow)
Language:      TypeScript
Navigation:    React Navigation (native stack)
Maps:          react-native-maps (or MapLibre GL) with satellite basemap
GPS:           expo-location (foreground + background tracking)
Camera:        expo-camera + expo-image-picker
Local Storage: expo-sqlite (offline-first architecture)
File System:   expo-file-system (GeoJSON import/export)
Sharing:       expo-sharing (share GeoJSON files)
State:         React Context + useReducer (no Redux needed)
Build:         Expo EAS (for APK/IPA distribution)
```

---

## DATA MODEL

### Hierarchy

```
Organization (1) → Project (1) → Sites (many) → Polygons (many)
                                              → Points (many)
                                              → Photos (many)
```

### Database Schema (SQLite)

```sql
-- Users table (local auth cache)
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('champion', 'dqa')),
  organization TEXT NOT NULL,
  landscape TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Projects table (pre-loaded from CSV data)
CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  organization TEXT NOT NULL,
  landscape TEXT NOT NULL CHECK(landscape IN (
    'Greater Rift Valley', 'Lake Kivu & Rusizi', 'Ghana Cocoa Belt', 'Unassigned'
  )),
  synced INTEGER DEFAULT 0
);

-- Sites table (pre-loaded from CSV data)
CREATE TABLE sites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- Polygons table (the core data collected in the field)
CREATE TABLE polygons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id INTEGER NOT NULL,
  poly_name TEXT NOT NULL,
  plantstart TEXT NOT NULL,
  practice TEXT NOT NULL CHECK(practice IN (
    'Tree Planting', 'Direct Seeding', 'Assisted Natural Regeneration (ANR)'
  )),
  target_sys TEXT NOT NULL CHECK(target_sys IN (
    'Natural Forest', 'Agroforest', 'Woodlot/Plantation', 'Silvopasture', 'Riparian'
  )),
  distr TEXT NOT NULL CHECK(distr IN ('Partial', 'Full', 'Line')),
  num_trees INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN (
    'draft', 'submitted', 'needs-review', 'approved'
  )),
  coordinates TEXT,
  point_count INTEGER DEFAULT 0,
  area_hectares REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  synced INTEGER DEFAULT 0,
  FOREIGN KEY (site_id) REFERENCES sites(id)
);

-- Points table
CREATE TABLE points (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id INTEGER NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  accuracy REAL,
  elevation REAL,
  satellites INTEGER,
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  synced INTEGER DEFAULT 0,
  FOREIGN KEY (site_id) REFERENCES sites(id)
);

-- Photos table
CREATE TABLE photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id INTEGER NOT NULL,
  polygon_id INTEGER,
  file_path TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  accuracy REAL,
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  synced INTEGER DEFAULT 0,
  FOREIGN KEY (site_id) REFERENCES sites(id),
  FOREIGN KEY (polygon_id) REFERENCES polygons(id)
);

-- QA Reviews table (DQA workflow)
CREATE TABLE qa_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  polygon_id INTEGER NOT NULL,
  reviewer_name TEXT NOT NULL,
  checks_json TEXT NOT NULL,
  result TEXT CHECK(result IN ('approved', 'flagged', 'pending')),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (polygon_id) REFERENCES polygons(id)
);
```

---

## POLYGON ATTRIBUTE SCHEMA

This is the exact field schema for every polygon. Enforced on collection, editing, and GeoJSON import:

| Field Key    | Label                   | Type   | Options / Constraints                                                      | Required |
|-------------|-------------------------|--------|---------------------------------------------------------------------------|----------|
| poly_name   | Polygon Name            | text   | Free text, e.g. "Coset Chebuliot"                                        | Yes      |
| plantstart  | Planting Start Date     | date   | Calendar picker, ISO format                                               | Yes      |
| practice    | Restoration Practice    | select | "Tree Planting", "Direct Seeding", "Assisted Natural Regeneration (ANR)" | Yes      |
| target_sys  | Target Land Use System  | select | "Natural Forest", "Agroforest", "Woodlot/Plantation", "Silvopasture", "Riparian" | Yes |
| distr       | Distribution            | select | "Partial", "Full", "Line"                                                | Yes      |
| num_trees   | Number of Trees         | number | Integer, e.g. 18000                                                       | Yes      |

---

## QA VALIDATION CHECKLIST

DQAs run these 11 checks on each polygon. Critical checks must pass for approval:

| ID  | Category   | Check                              | Critical |
|-----|------------|-------------------------------------|----------|
| q1  | Geometry   | No self-intersections              | Yes      |
| q2  | Geometry   | Polygon is closed                  | Yes      |
| q3  | Geometry   | No spike artifacts                 | Yes      |
| q4  | Geometry   | Area < 1,000 ha flag               | No       |
| q5  | Spatial    | Within expected project area       | Yes      |
| q6  | Spatial    | No overlap with other polygons     | Yes      |
| q7  | Spatial    | Aligns with satellite imagery      | Yes      |
| q8  | Attributes | All required fields populated      | Yes      |
| q9  | Attributes | Tree count plausible for area      | No       |
| q10 | Attributes | Planting date is valid             | No       |
| q11 | Attributes | Practice matches land use system   | No       |

---

## SCREEN-BY-SCREEN SPECIFICATION

All screens are already implemented in v3. Port them to React Native with real native components.

### 1. LOGIN SCREEN
- Globe logo (green gradient background) with "TerraMatch MOBILE" branding — **DO NOT CHANGE THIS LOGO**
- Step 1: Role selection — "Restoration Champion" or "WRI Data Quality Analyst" cards
- Step 2: Name input + Organization dropdown (champions only, populated from projects DB)
- On login: store user in SQLite, navigate to Home
- No backend auth yet (mock auth) — TerraMatch OAuth comes later

### 2. HOME SCREEN
- Top bar: Globe logo + "TerraMatch MOBILE" badge + role indicator (green=Champion, amber=DQA) + logout
- Welcome message with user name and org
- Stats row: Projects count, Sites count, Polygons collected count
- DQA only: Landscape filter pills — "All", "Greater Rift Valley", "Lake Kivu & Rusizi", "Ghana Cocoa Belt"
- Search bar: filters projects by name, landscape, or site name
- Project list: Cards with project name, landscape, site count
- Champion role: Only shows their organization's project(s)
- DQA role: Shows all projects, filterable by landscape

### 3. PROJECT SCREEN
- Header with project name + landscape
- Info card: landscape, site count
- Sites list: Cards showing site name + polygon count

### 4. SITE SCREEN (core screen)
- Header with site name + project name + green "+ Collect" button
- Collect dropdown: Track Polygon / Collect Point / Capture Photo
- **Map view**: Real map with satellite basemap showing site polygons
  - "My Location" toggle button (top-right) — blue pulsing dot at real GPS position
  - Polygons colored by status: green=approved, amber=needs-review, gray=draft
- **Download GeoJSON**: Export all site polygons as FeatureCollection
  - Filename: {ProjectName}_{SiteName}_polygons.geojson
  - Uses expo-file-system + expo-sharing
- **Upload GeoJSON**: Import from .geojson file
  - Validates FeatureCollection, geometry type, all 6 required attributes
  - Shows result banner: imported count, skipped count, error details
  - Valid features inserted into SQLite
- Polygon list: Cards with poly_name, status badge, practice, target_sys, num_trees

### 5. TRACK POLYGON SCREEN
- Map showing path drawn in real-time as user walks
- My Location blue dot always visible
- Timer (MM:SS) + point count
- GPS stats: Accuracy, Elevation, Satellites
- Controls: Start → Tracking (Pause/Finish) → Paused (Resume/Finish) → Complete
- On Complete: success banner + attribute form + Save & Submit
- GPS: expo-location watchPositionAsync, foreground+background, accuracy filter (default ±10m)
- Coordinates stored as [[lng, lat], ...] (GeoJSON standard)
- Auto-close ring, calculate area (Shoelace formula)

### 6. COLLECT POINT SCREEN
- Map centered on user location with crosshair
- Coordinate display + My Location
- Capture Point → confirmation with accuracy + satellites → Save

### 7. POLYGON DETAIL SCREEN
- Edit button → Edit screen; QA button (DQA only) → QA Review
- Status badge + vertex count
- Polygon rendered on mini-map
- Attribute table (6 fields)
- Champion: "Submit to TerraMatch"; DQA: "Approve" + "Flag"
- Delete Polygon with confirmation

### 8. EDIT POLYGON SCREEN
- Geometry editor: map with draggable vertex handles + midpoint add handles
- Tool palette: Move vertex / Add vertex / Remove vertex
- Attribute editor: all 6 fields editable
- Cancel / Save Changes

### 9. QA REVIEW SCREEN (DQA only)
- Progress bar: X/11 checks
- Grouped by category with checkboxes + CRITICAL badges
- All checks done → "Approve & Push to TerraMatch" button
- Saved to qa_reviews table

---

## GEOJSON FORMAT

### Export

```json
{
  "type": "FeatureCollection",
  "name": "ProjectName - SiteName",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "poly_name": "Coset Chebuliot",
        "plantstart": "2024-08-15",
        "practice": "Tree Planting",
        "target_sys": "Natural Forest",
        "distr": "Full",
        "num_trees": 18000,
        "status": "draft"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[36.817,-1.286],[36.820,-1.284],[36.822,-1.288],[36.818,-1.290],[36.817,-1.286]]]
      }
    }
  ]
}
```

### Import Validation Rules

1. Root type = "FeatureCollection"
2. features array exists
3. Each feature geometry = "Polygon" or "MultiPolygon"
4. Each feature properties must include all 6 required attributes
5. practice must be one of 3 allowed values
6. target_sys must be one of 5 allowed values
7. distr must be one of 3 allowed values
8. num_trees must be non-negative number
9. Valid features imported; invalid skipped with specific errors

---

## PRE-LOADED PROJECT DATA

90 projects across 3 landscapes with ~242 sites. Ship as JSON seed data in SQLite.

### Landscapes

| Landscape             | Region                    |
|-----------------------|---------------------------|
| Greater Rift Valley   | Kenya                     |
| Lake Kivu & Rusizi    | Rwanda, Burundi, DRC      |
| Ghana Cocoa Belt      | Ghana                     |

### Projects (abbreviated, 90 total)

GRV: Ahadi Achievers, BirdLife Kenya, DREK, Eden Reforestation, ENDAO WRUA, EAF, Farmlife Health, FESD, Goshen Farm Exporters, GOSHEN GLOBAL VISION, Green Belt Movement, GROOTS Kenya, Grow Tech Nurseries, ILEG, ITF, Jumuisha Initiative, Justdiggit, KENVO, Kimplanter, Kula, Laikipia Wildlife Forum, LOCCOG, Leona Foundation, Moto Feeds, Nabahya Food Institute, Nature Kenya, OPDP, Orchard Juice, PACJA, Paran Women Group, Prime Biodiversity, RESCONI, SAVE KENYA WATER TOWERS, SCOPE INTERVENTION, SEED SAVERS, Slow Food Kenya, SAFI, Talmond, NGARA, Wezesha CBO, WCI, WWF-Kenya, Y&M Regeneration, TIST Kenya, Vi Agroforestry

LKR: APEFA, AEE Rwanda, ARCOS Network, APROCUVI, ADIC, ARDE/KUBAHO, BIOCOOR, CCAO, Communities of Hope, COSEO, CDCT, COPICAD, Forest of Hope, Green Action Developpement, Greening Burundi, IADL, INES Ruhengeri, IGH, J&R Engineering, MIHOSO, ODEB, OSEPCCA, PVC Burundi, PLATE FORME DIOBASS, RECEVOR, RESEAU BURUNDI 2000, RDI, REDO, RCCDN, RECOR, ROAM, RWARRI, UESEF, UNIPROBA, WDI, WWANC, Well For Zoe, Consortium APRN/3C

GCB: A Rocha Ghana, Emfed Farms, Fanteakwa CCP, Hen Mpoano, Herp-Ghana, INEC Ghana, Kukuom Cooperative, Sakam Savana, Solidaridad, Tropenbos Ghana

Full CSV data should be parsed and loaded during first app launch.

---

## DESIGN SYSTEM

### Colors (dark theme)

```typescript
export const colors = {
  bg:       '#080d0a',
  surface1: '#101a14',
  surface2: '#182720',
  surface3: '#1f3129',
  border:   '#263d31',
  borderL:  '#35574a',
  green:    '#27c993',
  greenDim: '#1a9e73',
  greenBg:  'rgba(39,201,147,0.07)',
  greenBg2: 'rgba(39,201,147,0.14)',
  amber:    '#f59e0b',
  amberBg:  'rgba(245,158,11,0.1)',
  red:      '#ef4444',
  redBg:    'rgba(239,68,68,0.08)',
  blue:     '#3b82f6',
  blueBg:   'rgba(59,130,246,0.1)',
  ok:       '#22c55e',
  text1:    '#e4ede7',
  text2:    '#94b3a1',
  text3:    '#5e8570',
};
```

### Typography

```typescript
export const fonts = {
  sans: 'InstrumentSans',  // or system default
  mono: 'IBMPlexMono',     // for coordinates, timers
};
```

### Logo — DO NOT CHANGE

Green gradient rounded square (16px radius) with globe SVG icon. "TerraMatch" (800 weight) + "MOBILE" badge (green bg, 700 weight, letter-spacing 1).

---

## FILE STRUCTURE

```
terramatch-mobile/
├── app.json
├── tsconfig.json
├── package.json
├── assets/
│   ├── icon.png
│   ├── splash.png
│   └── seed/
│       ├── projects.json
│       └── sites.json
├── src/
│   ├── App.tsx
│   ├── navigation/
│   │   └── RootNavigator.tsx
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── ProjectScreen.tsx
│   │   ├── SiteScreen.tsx
│   │   ├── TrackPolygonScreen.tsx
│   │   ├── CollectPointScreen.tsx
│   │   ├── PolygonDetailScreen.tsx
│   │   ├── EditPolygonScreen.tsx
│   │   └── QAReviewScreen.tsx
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Card.tsx
│   │   ├── Button.tsx
│   │   ├── Badge.tsx
│   │   ├── FormField.tsx
│   │   ├── SiteMap.tsx
│   │   ├── PolygonOverlay.tsx
│   │   ├── MyLocationDot.tsx
│   │   ├── Toast.tsx
│   │   └── Logo.tsx
│   ├── database/
│   │   ├── db.ts
│   │   ├── seed.ts
│   │   ├── polygons.ts
│   │   ├── points.ts
│   │   ├── photos.ts
│   │   └── qa.ts
│   ├── services/
│   │   ├── location.ts
│   │   ├── geojson.ts
│   │   ├── camera.ts
│   │   └── geometry.ts
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   └── AppContext.tsx
│   ├── constants/
│   │   ├── colors.ts
│   │   ├── schema.ts
│   │   └── landscapes.ts
│   └── types/
│       └── index.ts
```

---

## BUILD & DISTRIBUTION

### Development
```bash
npx create-expo-app terramatch-mobile --template expo-template-blank-typescript
cd terramatch-mobile
npx expo install expo-location expo-camera expo-image-picker expo-file-system \
  expo-sharing expo-sqlite expo-document-picker react-native-maps \
  @react-navigation/native @react-navigation/native-stack \
  react-native-safe-area-context react-native-screens
npx expo start
```

### Build APK (internal testing, no Play Store)
```bash
npm install -g eas-cli
eas build:configure
eas build --platform android --profile preview
# Generates downloadable APK link
```

---

## BUILD PRIORITY (Sprint Order)

### Sprint 1: Foundation
1. Init Expo + TypeScript
2. React Navigation stack
3. SQLite schema + migrations
4. Parse CSV seed data → JSON → SQLite
5. AuthContext (mock login)
6. LoginScreen + HomeScreen

### Sprint 2: Navigation + Data
7. ProjectScreen + SiteScreen
8. Polygon list with SQLite queries
9. PolygonDetailScreen
10. Polygon CRUD

### Sprint 3: GPS + Maps
11. expo-location tracking service
12. TrackPolygonScreen with real GPS
13. CollectPointScreen with real GPS
14. react-native-maps with satellite tiles
15. Polygon rendering on map + My Location

### Sprint 4: Camera + GeoJSON + Editing
16. Camera with geotagging
17. GeoJSON export (download)
18. GeoJSON import with validation
19. EditPolygonScreen with vertex editing

### Sprint 5: QA + Polish + Build
20. QAReviewScreen
21. Toast notifications
22. Offline testing
23. EAS build → APK for internal distribution

---

## FUTURE (design for, but don't build yet)

- **TerraMatch API**: REST endpoints for auth, project/site pulls, polygon push. No access yet. Design so a services/api.ts can replace local-only operations.
- **Sync queue**: synced column on all tables + SyncService for batch uploads
- **Push notifications**: QA status updates

---

## CRITICAL CONSTRAINTS

- **Offline-first is mandatory** — champions are in remote Africa with poor connectivity
- **Low-end Android** (Android 8+, 2GB RAM) — keep bundle lean
- **Coordinate order: [longitude, latitude]** in GeoJSON. GPS gives lat/lng — always convert
- **Polygon ring must be closed** (first point === last point)
- **Area**: Shoelace formula with appropriate projection for equatorial Africa
- **Language**: English only for now. i18n (French, Swahili, Kinyarwanda) is future
- **Logo**: DO NOT CHANGE the globe logo. Ever.
