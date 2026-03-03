import { useState, useEffect, useRef, useMemo, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════
//  TERRAMATCH MOBILE v3 — Download/Upload, Edit, My Location
// ═══════════════════════════════════════════════════════════════

// --- PROJECT DATA ---
const RAW_PROJECTS = [
  { name: "A Rocha Ghana", landscape: "Ghana Cocoa Belt", sites: ["Abuakwa South Municipality", "Atewa Forest", "Atiwa West District", "Ayensuano District", "Degraded Mine Site"] },
  { name: "APEFA", landscape: "Lake Kivu & Rusizi", sites: ["KIBATAMA SITE - AF", "KAMUREHE SITE -AF", "MURURU-NYAKARENZO- River", "Nyungu Site"] },
  { name: "AEE Rwanda", landscape: "Lake Kivu & Rusizi", sites: ["Gikundamvura Site", "Gitambi Site", "Nyabintare Site", "Rwimbogo Site"] },
  { name: "Ahadi Achievers CBO", landscape: "Greater Rift Valley", sites: ["Ngiluni Location Village Ecosystem"] },
  { name: "ARCOS Network", landscape: "Lake Kivu & Rusizi", sites: ["FCPEEP BUGORHE PROJECT SITE", "FCPEEP IRAMBI-KATANA PROJECT SITE"] },
  { name: "APROCUVI", landscape: "Lake Kivu & Rusizi", sites: ["Kirehe Site", "Nyanza Site"] },
  { name: "ADIC", landscape: "Lake Kivu & Rusizi", sites: ["GASUMO SITE", "MURAMBI SITE", "RUBONA SITE", "SHOLI SITE"] },
  { name: "ARDE/KUBAHO", landscape: "Lake Kivu & Rusizi", sites: ["BUSASAMANA", "MUTUNTU", "RUGENDABARI"] },
  { name: "BIOCOOR", landscape: "Lake Kivu & Rusizi", sites: ["Kalehe Site", "Uvira Site"] },
  { name: "BirdLife Kenya", landscape: "Greater Rift Valley", sites: ["RWAMBOGO_MURWA"] },
  { name: "CCAO", landscape: "Lake Kivu & Rusizi", sites: ["Nyaruguru Site", "Rusizi Site"] },
  { name: "Communities of Hope", landscape: "Lake Kivu & Rusizi", sites: ["NKOTSI", "SHYIRA"] },
  { name: "COSEO", landscape: "Lake Kivu & Rusizi", sites: ["Cyamudongo", "Gisakura", "Kitabi"] },
  { name: "CDCT", landscape: "Lake Kivu & Rusizi", sites: ["Buheba", "Butole", "Langala", "Rushemeza"] },
  { name: "COPICAD", landscape: "Lake Kivu & Rusizi", sites: ["CIBITOKE SITE", "KAYANZA SITE"] },
  { name: "DREK", landscape: "Greater Rift Valley", sites: ["Baringo Site", "Elgeyo Marakwet Site", "Nakuru Site"] },
  { name: "Eden Reforestation", landscape: "Greater Rift Valley", sites: ["Ol Mariko Restoration Project in Mau"] },
  { name: "Emfed Farms", landscape: "Ghana Cocoa Belt", sites: ["Beposo Site", "Foso Site"] },
  { name: "ENDAO WRUA", landscape: "Greater Rift Valley", sites: ["Kirdam"] },
  { name: "EAF", landscape: "Greater Rift Valley", sites: ["Kericho", "Kipkelion", "Londiani"] },
  { name: "Fanteakwa CCP", landscape: "Ghana Cocoa Belt", sites: ["Abuakwa South District Site", "Atiwa East District Site"] },
  { name: "Farmlife Health", landscape: "Greater Rift Valley", sites: ["KURESOI", "MAUCHE NJORO"] },
  { name: "FESD", landscape: "Greater Rift Valley", sites: ["Mau Forest West Block", "Olpusimoru"] },
  { name: "Forest of Hope (FHA)", landscape: "Lake Kivu & Rusizi", sites: ["Cyamudongo", "Gishwati-Mukura", "Nyungwe Buffer"] },
  { name: "Goshen Farm Exporters", landscape: "Greater Rift Valley", sites: ["Kaiti", "Kilome", "Mbooni"] },
  { name: "GOSHEN GLOBAL VISION", landscape: "Greater Rift Valley", sites: ["Baringo North", "Marigat"] },
  { name: "Greening Burundi", landscape: "Lake Kivu & Rusizi", sites: ["Gihungwe", "Kagwema", "Rubanga", "Rugazi", "Rumonge", "Vyanda"] },
  { name: "GROOTS Kenya", landscape: "Greater Rift Valley", sites: ["Igwamiti Restoration site", "Marmanet Restoration site"] },
  { name: "Grow Tech Nurseries", landscape: "Greater Rift Valley", sites: ["Mau Sustainability Zone"] },
  { name: "Hen Mpoano", landscape: "Ghana Cocoa Belt", sites: ["Ankobra"] },
  { name: "Herp-Ghana", landscape: "Ghana Cocoa Belt", sites: ["Akrobi_Site", "Badu Site", "Nsawkaw_Site"] },
  { name: "IADL", landscape: "Lake Kivu & Rusizi", sites: ["KABARE CENTRE-KINJUBA", "KABARE SUD-KALAGANE"] },
  { name: "INES Ruhengeri", landscape: "Lake Kivu & Rusizi", sites: ["Kigali Site", "Musanze Site"] },
  { name: "Justdiggit", landscape: "Greater Rift Valley", sites: ["Lower Loita", "Magadi", "Upper Loita"] },
  { name: "Kukuom Cooperative", landscape: "Ghana Cocoa Belt", sites: ["Ahafo Ano South", "Atwima Mponua"] },
  { name: "Leona Foundation", landscape: "Greater Rift Valley", sites: ["Subukia Site"] },
  { name: "Moto Feeds", landscape: "Greater Rift Valley", sites: ["Eburru Farmlands", "Eburru Forest", "Mau Forest"] },
  { name: "PLATE FORME DIOBASS", landscape: "Lake Kivu & Rusizi", sites: ["IBAMBIRO", "ISHAMBA-RUSHEBEYI", "KAFUNDA-MISUNYU", "KAMANYOLA", "MULAMBA", "NYANGEZI-LUBERIZI"] },
  { name: "RECEVOR", landscape: "Lake Kivu & Rusizi", sites: ["Bugarama Site", "Nyakabuye Site"] },
  { name: "TIST Kenya", landscape: "Greater Rift Valley", sites: ["Meru Cluster", "Mt Kenya East", "Nanyuki Cluster"] },
  { name: "Vi Agroforestry", landscape: "Greater Rift Valley", sites: ["Kisumu Site", "Siaya Site"] },
  { name: "Well For Zoe", landscape: "Lake Kivu & Rusizi", sites: ["Bugesera", "Gisagara", "Nyamagabe"] },
];
const PROJECTS = RAW_PROJECTS.filter((p, i, a) => a.findIndex(x => x.name === p.name) === i);

// --- SCHEMA ---
const POLY_FIELDS = {
  poly_name: { label: "Polygon Name", type: "text", placeholder: "e.g. Coset Chebuliot", required: true },
  plantstart: { label: "Planting Start Date", type: "date", required: true },
  practice: { label: "Restoration Practice", type: "select", required: true, options: ["Tree Planting", "Direct Seeding", "Assisted Natural Regeneration (ANR)"] },
  target_sys: { label: "Target Land Use System", type: "select", required: true, options: ["Natural Forest", "Agroforest", "Woodlot/Plantation", "Silvopasture", "Riparian"] },
  distr: { label: "Distribution", type: "select", required: true, options: ["Partial", "Full", "Line"] },
  num_trees: { label: "Number of Trees", type: "number", placeholder: "e.g. 18000", required: true },
};
const REQUIRED_ATTRS = Object.keys(POLY_FIELDS);

const QA_CHECKS = [
  { id: "q1", cat: "Geometry", label: "No self-intersections", critical: true },
  { id: "q2", cat: "Geometry", label: "Polygon is closed", critical: true },
  { id: "q3", cat: "Geometry", label: "No spike artifacts", critical: true },
  { id: "q4", cat: "Geometry", label: "Area < 1,000 ha flag", critical: false },
  { id: "q5", cat: "Spatial", label: "Within expected project area", critical: true },
  { id: "q6", cat: "Spatial", label: "No overlap with other polygons", critical: true },
  { id: "q7", cat: "Spatial", label: "Aligns with satellite imagery", critical: true },
  { id: "q8", cat: "Attributes", label: "All required fields populated", critical: true },
  { id: "q9", cat: "Attributes", label: "Tree count plausible for area", critical: false },
  { id: "q10", cat: "Attributes", label: "Planting date is valid", critical: false },
  { id: "q11", cat: "Attributes", label: "Practice matches land use", critical: false },
];

// --- THEME ---
const C = {
  bg: "#080d0a", s1: "#101a14", s2: "#182720", s3: "#1f3129",
  border: "#263d31", borderL: "#35574a",
  g: "#27c993", gDim: "#1a9e73", gBg: "rgba(39,201,147,0.07)", gBg2: "rgba(39,201,147,0.14)",
  amber: "#f59e0b", amberBg: "rgba(245,158,11,0.1)",
  red: "#ef4444", redBg: "rgba(239,68,68,0.08)",
  blue: "#3b82f6", blueBg: "rgba(59,130,246,0.1)",
  ok: "#22c55e",
  t1: "#e4ede7", t2: "#94b3a1", t3: "#5e8570",
  f: "'Instrument Sans', 'DM Sans', system-ui, sans-serif",
  fm: "'IBM Plex Mono', 'JetBrains Mono', monospace",
};

// --- ICON COMPONENT ---
const I = ({ d, size = 20, color = C.t3, style: sx }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0, ...sx }}>
    {typeof d === "string" ? <path d={d} stroke={color} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /> : d}
  </svg>
);
const ic = {
  back: "M15 18l-6-6 6-6",
  folder: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z",
  pin: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zM12 11.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z",
  polygon: "M4 6l4-3 8 2 4 5-2 8-6 2-6-4z",
  plus: "M12 5v14M5 12h14",
  cam: "M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2zM12 13a4 4 0 100-8 4 4 0 000 8z",
  check: "M5 13l4 4L19 7",
  gps: "M12 12m-3 0a3 3 0 106 0 3 3 0 10-6 0M12 2v4M12 18v4M2 12h4M18 12h4",
  walk: "M13 4a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM7 21l3-9 3 3v6M14 13l2-3-3-3-3 3",
  qa: "M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11",
  upload: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12",
  download: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3",
  search: "M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z",
  user: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  logout: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
  globe: "M12 22a10 10 0 100-20 10 10 0 000 20zM2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z",
  layers: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  flag: "M4 15s1-1 4-1 3 0 4 1 4 1 3 0 4-1 4-1V3s-1 1-4 1-3 0-4-1-4-1-3 0-4 1-4 1zM4 22v-7",
  edit: "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  trash: "M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2",
  myLoc: "M12 12m-3 0a3 3 0 106 0 3 3 0 10-6 0M12 2v2M12 20v2M2 12h2M20 12h2",
  move: "M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20",
  copy: "M20 9h-9a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-9a2 2 0 00-2-2zM5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1",
  fileUp: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M12 18v-6M9 15l3-3 3 3",
  fileDn: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M12 12v6M9 15l3 3 3-3",
  x: "M18 6L6 18M6 6l12 12",
  vert: "M5 12h14M5 12l4-4M5 12l4 4",
};

// --- BADGE ---
const Badge = ({ status }) => {
  const m = { approved: [C.ok, "rgba(34,197,94,0.12)", "Approved"], "needs-review": [C.amber, C.amberBg, "Needs Review"], draft: [C.t3, "rgba(94,133,112,0.12)", "Draft"], submitted: [C.blue, C.blueBg, "Submitted"], synced: [C.g, C.gBg2, "Synced"] };
  const [col, bg, txt] = m[status] || m.draft;
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, background: bg, color: col, fontSize: 10, fontWeight: 700, letterSpacing: 0.3 }}><span style={{ width: 5, height: 5, borderRadius: "50%", background: col }} />{txt}</span>;
};

// --- GEOJSON HELPERS ---
function polygonsToGeoJSON(polygons, siteName, projectName) {
  return {
    type: "FeatureCollection",
    name: `${projectName} - ${siteName}`,
    features: polygons.map(pg => ({
      type: "Feature",
      properties: {
        poly_name: pg.poly_name || "",
        plantstart: pg.plantstart || "",
        practice: pg.practice || "",
        target_sys: pg.target_sys || "",
        distr: pg.distr || "",
        num_trees: Number(pg.num_trees) || 0,
        status: pg.status || "draft",
      },
      geometry: {
        type: "Polygon",
        coordinates: [pg.coordinates || [
          [36.817 + Math.random() * 0.01, -1.286 + Math.random() * 0.01],
          [36.820 + Math.random() * 0.01, -1.284 + Math.random() * 0.01],
          [36.822 + Math.random() * 0.01, -1.288 + Math.random() * 0.01],
          [36.818 + Math.random() * 0.01, -1.290 + Math.random() * 0.01],
          [36.817 + Math.random() * 0.01, -1.286 + Math.random() * 0.01],
        ]]
      }
    }))
  };
}

function validateGeoJSON(geojson) {
  const errors = [];
  if (!geojson || geojson.type !== "FeatureCollection") {
    return { valid: false, errors: ["Not a valid GeoJSON FeatureCollection"], features: [] };
  }
  if (!geojson.features || !Array.isArray(geojson.features)) {
    return { valid: false, errors: ["No features array found"], features: [] };
  }
  const validFeatures = [];
  geojson.features.forEach((f, i) => {
    const fErrors = [];
    if (!f.geometry || (f.geometry.type !== "Polygon" && f.geometry.type !== "MultiPolygon")) {
      fErrors.push(`Feature ${i + 1}: geometry must be Polygon or MultiPolygon`);
    }
    const props = f.properties || {};
    REQUIRED_ATTRS.forEach(attr => {
      if (!props[attr] && attr !== "num_trees") {
        fErrors.push(`Feature ${i + 1}: missing "${attr}"`);
      }
    });
    if (fErrors.length === 0) {
      validFeatures.push({
        ...props,
        poly_name: props.poly_name || `Imported-${i + 1}`,
        num_trees: String(props.num_trees || 0),
        status: "draft",
        pointCount: f.geometry?.coordinates?.[0]?.length || 0,
        coordinates: f.geometry?.coordinates?.[0] || [],
        id: Date.now() + i,
      });
    } else {
      errors.push(...fErrors);
    }
  });
  return { valid: errors.length === 0, errors, features: validFeatures, totalImported: validFeatures.length, totalSkipped: geojson.features.length - validFeatures.length };
}

// ═══════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════
export default function App() {
  const [screen, setScreen] = useState("login");
  const [user, setUser] = useState(null);
  const [selProject, setSelProject] = useState(null);
  const [selSite, setSelSite] = useState(null);
  const [selPolygon, setSelPolygon] = useState(null);
  const [search, setSearch] = useState("");
  const [landscapeFilter, setLandscapeFilter] = useState("all");
  const [trackState, setTrackState] = useState("idle");
  const [trackPts, setTrackPts] = useState([]);
  const [trackTime, setTrackTime] = useState(0);
  const [polyForm, setPolyForm] = useState({ poly_name: "", plantstart: "", practice: "", target_sys: "", distr: "", num_trees: "" });
  const [showCollect, setShowCollect] = useState(false);
  const [qaChecks, setQaChecks] = useState({});
  const [sitePolygons, setSitePolygons] = useState({});
  const [editingPolygon, setEditingPolygon] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [uploadResult, setUploadResult] = useState(null);
  const [myLocVisible, setMyLocVisible] = useState(false);
  const [myLocPos, setMyLocPos] = useState({ x: 185, y: 75 });
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);

  // GPS tracking sim
  useEffect(() => {
    if (trackState !== "tracking") return;
    const iv = setInterval(() => {
      setTrackPts(p => { const last = p.length ? p[p.length - 1] : [0, 0]; return [...p, [last[0] + (Math.random() - 0.5) * 0.8, last[1] + (Math.random() - 0.3) * 0.6]]; });
      setTrackTime(t => t + 1);
    }, 800);
    return () => clearInterval(iv);
  }, [trackState]);

  // My location drift animation
  useEffect(() => {
    if (!myLocVisible) return;
    const iv = setInterval(() => {
      setMyLocPos(p => ({ x: p.x + (Math.random() - 0.5) * 2, y: p.y + (Math.random() - 0.5) * 2 }));
    }, 2000);
    return () => clearInterval(iv);
  }, [myLocVisible]);

  // Toast auto-hide
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  const go = (scr, data = {}) => {
    setScreen(scr);
    if (data.project !== undefined) setSelProject(data.project);
    if (data.site !== undefined) setSelSite(data.site);
    if (data.polygon !== undefined) setSelPolygon(data.polygon);
    setShowCollect(false);
    setUploadResult(null);
  };

  const fmtTime = s => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const visibleProjects = useMemo(() => {
    let list = PROJECTS;
    if (user?.role === "champion") list = list.filter(p => p.name === user.org);
    if (landscapeFilter !== "all") list = list.filter(p => p.landscape === landscapeFilter);
    if (search) { const q = search.toLowerCase(); list = list.filter(p => p.name.toLowerCase().includes(q) || p.landscape.toLowerCase().includes(q) || p.sites.some(s => s.toLowerCase().includes(q))); }
    return list;
  }, [user, landscapeFilter, search]);

  const landscapes = ["all", "Greater Rift Valley", "Lake Kivu & Rusizi", "Ghana Cocoa Belt"];

  // --- Download GeoJSON ---
  const handleDownload = () => {
    if (!selSite) return;
    const polys = sitePolygons[selSite.key] || [];
    if (polys.length === 0) { showToast("No polygons to download", "warn"); return; }
    const geojson = polygonsToGeoJSON(polys, selSite.name, selSite.projectName);
    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selSite.projectName}_${selSite.name}_polygons.geojson`.replace(/\s+/g, "_");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${polys.length} polygons as GeoJSON`);
  };

  // --- Upload GeoJSON ---
  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const geojson = JSON.parse(ev.target.result);
        const result = validateGeoJSON(geojson);
        setUploadResult(result);
        if (result.features.length > 0) {
          setSitePolygons(prev => ({
            ...prev,
            [selSite.key]: [...(prev[selSite.key] || []), ...result.features]
          }));
        }
      } catch (err) {
        setUploadResult({ valid: false, errors: ["Invalid JSON file: " + err.message], features: [], totalImported: 0, totalSkipped: 0 });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // --- Delete polygon ---
  const handleDeletePolygon = (polyId) => {
    if (!selSite) return;
    setSitePolygons(prev => ({
      ...prev,
      [selSite.key]: (prev[selSite.key] || []).filter(p => p.id !== polyId)
    }));
    showToast("Polygon deleted");
    go("site");
  };

  // --- Save polygon edit ---
  const handleSaveEdit = () => {
    if (!selSite || !editingPolygon) return;
    setSitePolygons(prev => ({
      ...prev,
      [selSite.key]: (prev[selSite.key] || []).map(p => p.id === editingPolygon.id ? { ...p, ...editForm } : p)
    }));
    const updatedPoly = { ...editingPolygon, ...editForm };
    setSelPolygon(updatedPoly);
    setEditingPolygon(null);
    showToast("Polygon updated");
    go("polygon-detail", { polygon: updatedPoly });
  };

  // ─── SHARED COMPONENTS ───
  const Header = ({ title, sub, back, right }) => (
    <div style={{ padding: "14px 18px 10px", borderBottom: `1px solid ${C.border}`, background: C.s1, position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
          {back && <button onClick={back} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><I d={ic.back} size={20} color={C.g} /></button>}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: title?.length > 28 ? 14 : 16, fontWeight: 700, color: C.t1, fontFamily: C.f, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
            {sub && <div style={{ fontSize: 11, color: C.t3, fontFamily: C.f, marginTop: 1 }}>{sub}</div>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>{right}</div>
      </div>
    </div>
  );

  const Btn = ({ children, primary, danger, warn, small, ghost, style: sx, ...props }) => (
    <button {...props} style={{
      padding: small ? "7px 12px" : "13px 16px", borderRadius: small ? 9 : 12, cursor: "pointer",
      fontFamily: C.f, fontWeight: 700, fontSize: small ? 11 : 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
      background: danger ? C.redBg : warn ? C.amberBg : primary ? `linear-gradient(135deg, ${C.g}, ${C.gDim})` : ghost ? "transparent" : C.s2,
      color: danger ? C.red : warn ? C.amber : primary ? C.bg : ghost ? C.t2 : C.t1,
      border: danger ? `1px solid ${C.red}` : warn ? `1px solid ${C.amber}` : primary ? "none" : ghost ? "none" : `1px solid ${C.border}`,
      ...sx
    }} />
  );

  const Card = ({ children, onClick, style: sx }) => (
    <div onClick={onClick} style={{ padding: "13px 15px", marginBottom: 7, borderRadius: 12, background: C.s2, border: `1px solid ${C.border}`, cursor: onClick ? "pointer" : "default", transition: "border-color 0.15s", ...sx }}
      onMouseEnter={onClick ? e => e.currentTarget.style.borderColor = C.gDim : undefined}
      onMouseLeave={onClick ? e => e.currentTarget.style.borderColor = C.border : undefined}>
      {children}
    </div>
  );

  const FormField = ({ field, value, onChange }) => (
    <div style={{ marginBottom: 13 }}>
      <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: C.t3, marginBottom: 4, fontFamily: C.f }}>
        {field.label}{field.required && <span style={{ color: C.red, fontSize: 10 }}>*</span>}
      </label>
      {field.type === "select" ? (
        <select value={value} onChange={e => onChange(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, background: C.bg, border: `1px solid ${C.border}`, color: value ? C.t1 : C.t3, fontSize: 13, fontFamily: C.f, outline: "none" }}>
          <option value="">Select...</option>
          {field.options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={field.type} value={value} placeholder={field.placeholder || ""} onChange={e => onChange(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, background: C.bg, border: `1px solid ${C.border}`, color: C.t1, fontSize: 13, fontFamily: C.f, outline: "none", boxSizing: "border-box" }} />
      )}
    </div>
  );

  // ═══════════════════════════════════════
  //  SCREENS
  // ═══════════════════════════════════════

  // ─── LOGIN ───
  const LoginScreen = () => {
    const [role, setRole] = useState(null);
    const [org, setOrg] = useState("");
    const [name, setName] = useState("");
    const orgs = PROJECTS.map(p => p.name).sort();
    return (
      <div style={{ padding: 24, display: "flex", flexDirection: "column", minHeight: 640, justifyContent: "center" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: `linear-gradient(135deg, ${C.g}, ${C.gDim})`, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
            <I d={ic.globe} size={28} color={C.bg} />
          </div>
          <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 800, color: C.t1, fontFamily: C.f, letterSpacing: -0.5 }}>TerraMatch</h1>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.g, background: C.gBg2, padding: "3px 10px", borderRadius: 6, letterSpacing: 1 }}>MOBILE</span>
          <p style={{ marginTop: 12, fontSize: 13, color: C.t3, fontFamily: C.f, lineHeight: 1.5 }}>Field data collection for restoration monitoring</p>
        </div>
        {!role ? (
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.t3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, fontFamily: C.f }}>I am a...</p>
            {[{ id: "champion", icon: ic.user, label: "Restoration Champion", desc: "Collect field data for my project" }, { id: "dqa", icon: ic.shield, label: "WRI Data Quality Analyst", desc: "Review & validate all project data" }].map(r => (
              <Card key={r.id} onClick={() => setRole(r.id)}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: C.gBg2, display: "flex", alignItems: "center", justifyContent: "center" }}><I d={r.icon} size={20} color={C.g} /></div>
                  <div><div style={{ fontSize: 15, fontWeight: 700, color: C.t1, fontFamily: C.f }}>{r.label}</div><div style={{ fontSize: 11, color: C.t3, fontFamily: C.f, marginTop: 2 }}>{r.desc}</div></div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div>
            <button onClick={() => setRole(null)} style={{ background: "none", border: "none", color: C.g, fontSize: 12, fontFamily: C.f, cursor: "pointer", marginBottom: 16, display: "flex", alignItems: "center", gap: 4 }}><I d={ic.back} size={14} color={C.g} /> Back</button>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: C.t3, marginBottom: 5, display: "block", fontFamily: C.f }}>Your Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Elias" style={{ width: "100%", padding: "12px 14px", borderRadius: 12, background: C.s2, border: `1px solid ${C.border}`, color: C.t1, fontSize: 14, fontFamily: C.f, outline: "none", boxSizing: "border-box" }} />
            </div>
            {role === "champion" && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: C.t3, marginBottom: 5, display: "block", fontFamily: C.f }}>Your Organization</label>
                <select value={org} onChange={e => setOrg(e.target.value)} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, background: C.s2, border: `1px solid ${C.border}`, color: org ? C.t1 : C.t3, fontSize: 13, fontFamily: C.f, outline: "none" }}>
                  <option value="">Select your organization...</option>
                  {orgs.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            )}
            <Btn primary style={{ width: "100%", marginTop: 8 }} onClick={() => {
              if (!name || (role === "champion" && !org)) return;
              const proj = role === "champion" ? PROJECTS.find(p => p.name === org) : null;
              setUser({ name, role, org: role === "champion" ? org : "WRI", landscape: proj?.landscape || "all" });
              setScreen("home");
            }}>{role === "champion" ? "Enter as Champion" : "Enter as DQA"}</Btn>
          </div>
        )}
      </div>
    );
  };

  // ─── HOME ───
  const HomeScreen = () => {
    const stats = { projects: visibleProjects.length, sites: visibleProjects.reduce((a, p) => a + p.sites.length, 0), polygons: Object.values(sitePolygons).reduce((a, ps) => a + ps.length, 0) };
    return (
      <div>
        <div style={{ padding: "16px 18px 14px", borderBottom: `1px solid ${C.border}`, background: C.s1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: `linear-gradient(135deg, ${C.g}, ${C.gDim})`, display: "flex", alignItems: "center", justifyContent: "center" }}><I d={ic.globe} size={14} color={C.bg} /></div>
              <span style={{ fontSize: 17, fontWeight: 800, color: C.t1, fontFamily: C.f }}>TerraMatch</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: C.g, background: C.gBg2, padding: "2px 7px", borderRadius: 4, letterSpacing: 0.8 }}>MOBILE</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.3, padding: "4px 10px", borderRadius: 8, background: user?.role === "dqa" ? C.amberBg : C.gBg, border: `1px solid ${user?.role === "dqa" ? C.amber : C.gDim}`, color: user?.role === "dqa" ? C.amber : C.g }}>{user?.role === "dqa" ? "DQA" : "Champion"}</span>
              <button onClick={() => { setUser(null); setScreen("login"); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><I d={ic.logout} size={16} color={C.t3} /></button>
            </div>
          </div>
          <div style={{ fontSize: 13, color: C.t2, fontFamily: C.f, marginBottom: 14 }}>Welcome back, <strong style={{ color: C.t1 }}>{user?.name}</strong>{user?.role === "champion" && <> · <span style={{ color: C.g }}>{user?.org}</span></>}</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {[{ n: stats.projects, label: "Projects", icon: ic.folder }, { n: stats.sites, label: "Sites", icon: ic.pin }, { n: stats.polygons, label: "Collected", icon: ic.polygon }].map((s, i) => (
              <div key={i} style={{ flex: 1, padding: "10px 8px", borderRadius: 10, background: C.bg, border: `1px solid ${C.border}`, textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.t1, fontFamily: C.fm }}>{s.n}</div>
                <div style={{ fontSize: 9, color: C.t3, fontFamily: C.f, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
          {user?.role === "dqa" && (
            <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
              {landscapes.map(l => <button key={l} onClick={() => setLandscapeFilter(l)} style={{ padding: "5px 10px", borderRadius: 8, fontSize: 10, fontWeight: 600, fontFamily: C.f, cursor: "pointer", background: landscapeFilter === l ? C.gBg2 : C.bg, color: landscapeFilter === l ? C.g : C.t3, border: `1px solid ${landscapeFilter === l ? C.gDim : C.border}` }}>{l === "all" ? "All Landscapes" : l}</button>)}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", borderRadius: 10, background: C.bg, border: `1px solid ${C.border}` }}>
            <I d={ic.search} size={15} color={C.t3} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects or sites..." style={{ flex: 1, background: "none", border: "none", outline: "none", color: C.t1, fontSize: 13, fontFamily: C.f }} />
          </div>
        </div>
        <div style={{ padding: "14px 18px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.t3, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10, fontFamily: C.f }}>{user?.role === "dqa" ? `${visibleProjects.length} Projects` : "My Projects"}</div>
          {visibleProjects.map((project, idx) => (
            <Card key={idx} onClick={() => go("project", { project })}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.t1, fontFamily: C.f, marginBottom: 5 }}>{project.name}</div>
              <div style={{ display: "flex", gap: 12, fontSize: 11, color: C.t3, flexWrap: "wrap" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 3 }}><I d={ic.layers} size={11} color={C.t3} /> {project.landscape}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 3 }}><I d={ic.pin} size={11} color={C.t3} /> {project.sites.length} sites</span>
              </div>
            </Card>
          ))}
          {visibleProjects.length === 0 && <div style={{ textAlign: "center", padding: 40, color: C.t3, fontSize: 13, fontFamily: C.f }}>No projects found</div>}
        </div>
      </div>
    );
  };

  // ─── PROJECT ───
  const ProjectScreen = () => {
    if (!selProject) return null;
    return (
      <div>
        <Header title={selProject.name} sub={selProject.landscape} back={() => go("home")} />
        <div style={{ padding: "14px 18px" }}>
          <div style={{ padding: 12, borderRadius: 11, background: C.gBg, border: "1px solid rgba(39,201,147,0.12)", marginBottom: 16, fontSize: 12, color: C.g, fontFamily: C.f, lineHeight: 1.6 }}><strong>Landscape:</strong> {selProject.landscape}<br /><strong>Sites:</strong> {selProject.sites.length}</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.t3, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10, fontFamily: C.f }}>Sites</div>
          {selProject.sites.map((site, i) => {
            const key = `${selProject.name}::${site}`;
            const polys = sitePolygons[key] || [];
            return (
              <Card key={i} onClick={() => go("site", { site: { name: site, projectName: selProject.name, key } })}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.t1, fontFamily: C.f, marginBottom: 3 }}><I d={ic.pin} size={13} color={C.g} style={{ marginRight: 6, verticalAlign: -1 }} />{site}</div>
                    <div style={{ fontSize: 11, color: C.t3, fontFamily: C.f }}>{polys.length} polygons</div>
                  </div>
                  <span style={{ fontSize: 20, color: C.t3 }}>›</span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  // ─── SITE (with Download/Upload, My Location) ───
  const SiteScreen = () => {
    if (!selSite) return null;
    const polys = sitePolygons[selSite.key] || [];

    return (
      <div>
        <Header title={selSite.name} sub={selSite.projectName} back={() => go("project")}
          right={
            <button onClick={() => setShowCollect(!showCollect)} style={{ background: `linear-gradient(135deg, ${C.g}, ${C.gDim})`, border: "none", borderRadius: 10, padding: "7px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              <I d={ic.plus} size={14} color={C.bg} />
              <span style={{ fontSize: 11, fontWeight: 700, color: C.bg, fontFamily: C.f }}>Collect</span>
            </button>
          }
        />

        {/* Collect dropdown */}
        {showCollect && (
          <div style={{ position: "absolute", right: 18, top: 54, zIndex: 200, background: C.s2, border: `1px solid ${C.border}`, borderRadius: 14, padding: 6, boxShadow: "0 12px 40px rgba(0,0,0,0.6)", minWidth: 195 }}>
            {[
              { icon: ic.walk, label: "Track Polygon", desc: "Walk & trace boundary", act: () => { setShowCollect(false); setTrackPts([]); setTrackTime(0); setTrackState("idle"); setPolyForm({ poly_name: "", plantstart: "", practice: "", target_sys: "", distr: "", num_trees: "" }); go("track"); } },
              { icon: ic.gps, label: "Collect Point", desc: "Drop a GPS point", act: () => { setShowCollect(false); go("point"); } },
              { icon: ic.cam, label: "Capture Photo", desc: "Geotagged photo", act: () => { setShowCollect(false); showToast("📸 Photo captured with GPS tag!"); } },
            ].map((item, i) => (
              <button key={i} onClick={item.act} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", background: "none", border: "none", borderRadius: 10, cursor: "pointer", textAlign: "left" }}
                onMouseEnter={e => e.currentTarget.style.background = C.s3} onMouseLeave={e => e.currentTarget.style.background = "none"}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: C.gBg2, display: "flex", alignItems: "center", justifyContent: "center" }}><I d={item.icon} size={16} color={C.g} /></div>
                <div><div style={{ fontSize: 12, fontWeight: 700, color: C.t1, fontFamily: C.f }}>{item.label}</div><div style={{ fontSize: 10, color: C.t3, fontFamily: C.f }}>{item.desc}</div></div>
              </button>
            ))}
          </div>
        )}

        {/* SITE MAP with My Location */}
        <div style={{ margin: "14px 18px", height: 160, borderRadius: 13, background: "#0b1810", border: `1px solid ${C.border}`, position: "relative", overflow: "hidden" }}>
          <svg width="100%" height="100%" style={{ position: "absolute", top: 0, left: 0, opacity: 0.12 }}>
            {Array.from({ length: 18 }).map((_, i) => <line key={i} x1="0" y1={i * 10} x2="400" y2={i * 10} stroke={C.g} strokeWidth="0.5" />)}
            {Array.from({ length: 40 }).map((_, i) => <line key={i} x1={i * 10} y1="0" x2={i * 10} y2="200" stroke={C.g} strokeWidth="0.5" />)}
          </svg>
          {/* Rendered polygons */}
          <svg width="100%" height="100%" style={{ position: "absolute", top: 0, left: 0 }}>
            {polys.map((pg, i) => {
              const shapes = [
                `${40 + i * 65},30 ${75 + i * 65},18 ${95 + i * 65},40 ${85 + i * 65},75 ${50 + i * 65},70`,
                `${45 + i * 65},25 ${80 + i * 65},22 ${90 + i * 65},55 ${70 + i * 65},78 ${38 + i * 65},60`,
              ];
              const col = pg.status === "approved" ? C.ok : pg.status === "needs-review" ? C.amber : C.g;
              return <polygon key={i} points={shapes[i % 2]} fill={col} fillOpacity="0.15" stroke={col} strokeWidth="1.5" />;
            })}
            {/* My Location dot */}
            {myLocVisible && (
              <>
                <circle cx={myLocPos.x} cy={myLocPos.y} r="12" fill={C.blue} opacity="0.15">
                  <animate attributeName="r" values="10;18;10" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx={myLocPos.x} cy={myLocPos.y} r="5" fill={C.blue} stroke="#fff" strokeWidth="2" />
              </>
            )}
          </svg>
          {/* Map controls */}
          <div style={{ position: "absolute", top: 8, right: 8, display: "flex", flexDirection: "column", gap: 4 }}>
            <button onClick={() => setMyLocVisible(!myLocVisible)} title="My Location" style={{
              width: 32, height: 32, borderRadius: 8, border: `1px solid ${myLocVisible ? C.blue : C.border}`,
              background: myLocVisible ? C.blueBg : "rgba(8,13,10,0.85)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <I d={ic.myLoc} size={16} color={myLocVisible ? C.blue : C.t3} />
            </button>
          </div>
          <div style={{ position: "absolute", bottom: 8, left: 8, right: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 10, color: C.t3, fontFamily: C.f, background: "rgba(8,13,10,0.85)", padding: "4px 10px", borderRadius: 6 }}>
              🗺 {polys.length} polygons{myLocVisible ? " · 📍 Live" : ""}
            </span>
          </div>
        </div>

        {/* DOWNLOAD / UPLOAD BAR */}
        <div style={{ margin: "0 18px 12px", display: "flex", gap: 8 }}>
          <Btn small style={{ flex: 1 }} onClick={handleDownload}>
            <I d={ic.fileDn} size={14} color={C.t1} /> Download GeoJSON
          </Btn>
          <Btn small style={{ flex: 1 }} onClick={() => fileInputRef.current?.click()}>
            <I d={ic.fileUp} size={14} color={C.t1} /> Upload GeoJSON
          </Btn>
          <input ref={fileInputRef} type="file" accept=".geojson,.json" onChange={handleUpload} style={{ display: "none" }} />
        </div>

        {/* Upload result banner */}
        {uploadResult && (
          <div style={{ margin: "0 18px 12px", padding: 12, borderRadius: 11, background: uploadResult.valid ? "rgba(34,197,94,0.08)" : C.redBg, border: `1px solid ${uploadResult.valid ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: uploadResult.errors.length > 0 ? 6 : 0 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: uploadResult.valid ? C.ok : C.red, fontFamily: C.f }}>
                {uploadResult.valid ? `✓ Imported ${uploadResult.totalImported} polygons` : `Import completed with issues`}
              </span>
              <button onClick={() => setUploadResult(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}><I d={ic.x} size={14} color={C.t3} /></button>
            </div>
            {uploadResult.totalImported > 0 && !uploadResult.valid && (
              <div style={{ fontSize: 11, color: C.ok, fontFamily: C.f, marginBottom: 4 }}>✓ {uploadResult.totalImported} polygons imported successfully</div>
            )}
            {uploadResult.totalSkipped > 0 && (
              <div style={{ fontSize: 11, color: C.amber, fontFamily: C.f, marginBottom: 4 }}>⚠ {uploadResult.totalSkipped} features skipped</div>
            )}
            {uploadResult.errors.length > 0 && (
              <div style={{ maxHeight: 80, overflow: "auto" }}>
                {uploadResult.errors.slice(0, 5).map((err, i) => (
                  <div key={i} style={{ fontSize: 10, color: C.red, fontFamily: C.fm, marginTop: 2 }}>• {err}</div>
                ))}
                {uploadResult.errors.length > 5 && <div style={{ fontSize: 10, color: C.t3, marginTop: 2 }}>...and {uploadResult.errors.length - 5} more</div>}
              </div>
            )}
          </div>
        )}

        {/* Polygon list */}
        <div style={{ padding: "0 18px 18px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.t3, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10, fontFamily: C.f }}>Polygons</div>
          {polys.length === 0 ? (
            <div style={{ padding: 28, textAlign: "center", borderRadius: 13, background: C.s2, border: `1px dashed ${C.border}` }}>
              <I d={ic.polygon} size={28} color={C.t3} style={{ margin: "0 auto 8px", display: "block" }} />
              <p style={{ fontSize: 12, color: C.t3, fontFamily: C.f, margin: "0 0 8px" }}>No polygons yet.</p>
              <p style={{ fontSize: 11, color: C.t3, fontFamily: C.f, margin: 0 }}>Tap <strong style={{ color: C.g }}>+ Collect</strong> or <strong style={{ color: C.t1 }}>Upload GeoJSON</strong></p>
            </div>
          ) : polys.map((pg, i) => (
            <Card key={pg.id || i} onClick={() => go("polygon-detail", { polygon: pg })}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.t1, fontFamily: C.f }}>{pg.poly_name}</span>
                <Badge status={pg.status} />
              </div>
              <div style={{ display: "flex", gap: 8, fontSize: 10, color: C.t3, flexWrap: "wrap" }}>
                <span>{pg.practice}</span><span>·</span><span>{pg.target_sys}</span><span>·</span>
                <span>{Number(pg.num_trees).toLocaleString()} trees</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  // ─── POLYGON DETAIL (with Edit/Delete) ───
  const PolygonDetailScreen = () => {
    if (!selPolygon) return null;
    return (
      <div>
        <Header title={selPolygon.poly_name} sub={selSite?.name} back={() => go("site")}
          right={<>
            <button onClick={() => { setEditingPolygon(selPolygon); setEditForm({ ...selPolygon }); go("edit"); }} style={{ background: C.gBg2, border: `1px solid ${C.gDim}`, borderRadius: 9, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              <I d={ic.edit} size={13} color={C.g} /><span style={{ fontSize: 10, fontWeight: 700, color: C.g, fontFamily: C.f }}>Edit</span>
            </button>
            {user?.role === "dqa" && (
              <button onClick={() => go("qa")} style={{ background: C.amberBg, border: `1px solid ${C.amber}`, borderRadius: 9, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                <I d={ic.qa} size={13} color={C.amber} /><span style={{ fontSize: 10, fontWeight: 700, color: C.amber, fontFamily: C.f }}>QA</span>
              </button>
            )}
          </>}
        />
        <div style={{ padding: "14px 18px" }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            <Badge status={selPolygon.status} />
            {selPolygon.pointCount && <span style={{ fontSize: 10, color: C.t3, fontFamily: C.fm, padding: "4px 8px", background: C.s2, borderRadius: 6 }}>{selPolygon.pointCount} vertices</span>}
          </div>

          {/* Polygon mini-map */}
          <div style={{ height: 100, borderRadius: 11, background: "#0b1810", border: `1px solid ${C.border}`, marginBottom: 14, position: "relative", overflow: "hidden" }}>
            <svg width="100%" height="100%">
              <polygon points="60,15 140,10 170,45 155,80 70,85 40,55" fill={C.g} fillOpacity="0.12" stroke={C.g} strokeWidth="2" />
              {/* Vertex handles */}
              {[[60,15],[140,10],[170,45],[155,80],[70,85],[40,55]].map(([x,y], i) => (
                <circle key={i} cx={x} cy={y} r="4" fill={C.g} stroke={C.bg} strokeWidth="2" />
              ))}
            </svg>
            <div style={{ position: "absolute", bottom: 6, right: 6, fontSize: 9, color: C.t3, fontFamily: C.fm, background: "rgba(8,13,10,0.8)", padding: "3px 7px", borderRadius: 5 }}>
              Tap Edit to modify vertices
            </div>
          </div>

          <div style={{ borderRadius: 12, background: C.s2, border: `1px solid ${C.border}`, overflow: "hidden", marginBottom: 14 }}>
            {Object.entries(POLY_FIELDS).map(([key, field], i) => (
              <div key={key} style={{ display: "flex", justifyContent: "space-between", padding: "11px 14px", borderBottom: i < 5 ? `1px solid ${C.border}` : "none" }}>
                <span style={{ fontSize: 11, color: C.t3, fontFamily: C.f }}>{field.label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.t1, fontFamily: C.f, textAlign: "right", maxWidth: "55%" }}>{selPolygon[key] || "—"}</span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            {user?.role === "champion" && <Btn primary style={{ flex: 1 }}><I d={ic.upload} size={15} color={C.bg} /> Submit to TerraMatch</Btn>}
            {user?.role === "dqa" && (
              <>
                <Btn style={{ flex: 1, background: "rgba(34,197,94,0.1)", borderColor: C.ok, color: C.ok, border: `1px solid ${C.ok}` }}>✓ Approve</Btn>
                <Btn danger style={{ flex: 1 }}><I d={ic.flag} size={14} color={C.red} /> Flag</Btn>
              </>
            )}
          </div>

          {/* Delete */}
          <Btn ghost style={{ width: "100%", marginTop: 12, color: C.red }} onClick={() => {
            if (confirm(`Delete "${selPolygon.poly_name}"?`)) handleDeletePolygon(selPolygon.id);
          }}>
            <I d={ic.trash} size={14} color={C.red} /> Delete Polygon
          </Btn>
        </div>
      </div>
    );
  };

  // ─── EDIT POLYGON ───
  const EditScreen = () => {
    if (!editingPolygon) return null;
    return (
      <div>
        <Header title="Edit Polygon" sub={editingPolygon.poly_name} back={() => go("polygon-detail")}
          right={<Btn small primary onClick={handleSaveEdit}>Save</Btn>}
        />
        <div style={{ padding: "14px 18px" }}>
          {/* Geometry editor preview */}
          <div style={{ height: 130, borderRadius: 12, background: "#0b1810", border: `1px solid ${C.g}`, marginBottom: 16, position: "relative", overflow: "hidden" }}>
            <svg width="100%" height="100%">
              <polygon points="60,15 140,10 170,45 155,80 70,85 40,55" fill={C.g} fillOpacity="0.08" stroke={C.g} strokeWidth="1.5" strokeDasharray="4 3" />
              {/* Draggable vertex handles */}
              {[[60,15],[140,10],[170,45],[155,80],[70,85],[40,55]].map(([x,y], i) => (
                <g key={i}>
                  <circle cx={x} cy={y} r="10" fill={C.g} opacity="0.15" />
                  <circle cx={x} cy={y} r="5" fill={C.g} stroke={C.bg} strokeWidth="2" style={{ cursor: "grab" }} />
                </g>
              ))}
              {/* Midpoint add handles */}
              {[[100,12],[155,27],[162,62],[112,82],[55,50],[50,35]].map(([x,y], i) => (
                <g key={`m${i}`}>
                  <circle cx={x} cy={y} r="4" fill="none" stroke={C.g} strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
                  <line x1={x-3} y1={y} x2={x+3} y2={y} stroke={C.g} strokeWidth="1" opacity="0.5" />
                  <line x1={x} y1={y-3} x2={x} y2={y+3} stroke={C.g} strokeWidth="1" opacity="0.5" />
                </g>
              ))}
            </svg>
            <div style={{ position: "absolute", top: 8, left: 8, display: "flex", gap: 4 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: C.g, background: "rgba(8,13,10,0.85)", padding: "3px 8px", borderRadius: 5, fontFamily: C.f }}>
                <I d={ic.move} size={10} color={C.g} style={{ marginRight: 3, verticalAlign: -1 }} /> Drag vertices to reshape
              </span>
            </div>
            <div style={{ position: "absolute", bottom: 8, left: 8, right: 8, display: "flex", gap: 4 }}>
              <span style={{ fontSize: 9, color: C.t3, background: "rgba(8,13,10,0.85)", padding: "3px 8px", borderRadius: 5, fontFamily: C.fm }}>
                + Tap midpoints to add vertex
              </span>
            </div>
          </div>

          {/* Edit tools row */}
          <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
            {[
              { icon: ic.move, label: "Move vertex", active: true },
              { icon: ic.plus, label: "Add vertex" },
              { icon: ic.trash, label: "Remove vertex" },
            ].map((tool, i) => (
              <div key={i} style={{
                flex: 1, padding: "8px 6px", borderRadius: 9, textAlign: "center", cursor: "pointer",
                background: tool.active ? C.gBg2 : C.s2, border: `1px solid ${tool.active ? C.gDim : C.border}`
              }}>
                <I d={tool.icon} size={14} color={tool.active ? C.g : C.t3} style={{ margin: "0 auto 3px", display: "block" }} />
                <div style={{ fontSize: 9, fontWeight: 600, color: tool.active ? C.g : C.t3, fontFamily: C.f }}>{tool.label}</div>
              </div>
            ))}
          </div>

          {/* Attribute editing */}
          <div style={{ borderRadius: 12, background: C.s2, border: `1px solid ${C.border}`, padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.t3, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12, fontFamily: C.f }}>Edit Attributes</div>
            {Object.entries(POLY_FIELDS).map(([key, field]) => (
              <FormField key={key} field={field} value={editForm[key] || ""} onChange={v => setEditForm(f => ({ ...f, [key]: v }))} />
            ))}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <Btn style={{ flex: 1 }} onClick={() => go("polygon-detail")}>Cancel</Btn>
            <Btn primary style={{ flex: 1 }} onClick={handleSaveEdit}>
              <I d={ic.check} size={15} color={C.bg} /> Save Changes
            </Btn>
          </div>
        </div>
      </div>
    );
  };

  // ─── TRACK POLYGON ───
  const TrackScreen = () => (
    <div>
      <Header title="Track Polygon" sub={selSite?.name} back={() => go("site")} />
      <div style={{ margin: "14px 18px", height: 200, borderRadius: 13, background: "#091210", border: `1px solid ${trackState === "tracking" ? C.g : C.border}`, position: "relative", overflow: "hidden", transition: "border-color 0.3s" }}>
        <svg width="100%" height="100%">
          {trackPts.length > 1 && (
            <>
              <polyline points={trackPts.map((_, i) => `${30 + i * 6},${100 + Math.sin(i * 0.4) * 35 + Math.cos(i * 0.25) * 25}`).join(" ")} fill="none" stroke={C.g} strokeWidth="2.5" strokeLinejoin="round" opacity="0.7" />
              {trackState === "complete" && <polygon points={trackPts.map((_, i) => `${30 + i * 6},${100 + Math.sin(i * 0.4) * 35 + Math.cos(i * 0.25) * 25}`).join(" ")} fill={C.g} fillOpacity="0.12" stroke={C.g} strokeWidth="2" />}
              {trackState === "tracking" && (
                <>
                  <circle cx={30 + (trackPts.length - 1) * 6} cy={100 + Math.sin((trackPts.length - 1) * 0.4) * 35 + Math.cos((trackPts.length - 1) * 0.25) * 25} r="6" fill={C.g} opacity="0.25"><animate attributeName="r" values="4;10;4" dur="1.2s" repeatCount="indefinite" /></circle>
                  <circle cx={30 + (trackPts.length - 1) * 6} cy={100 + Math.sin((trackPts.length - 1) * 0.4) * 35 + Math.cos((trackPts.length - 1) * 0.25) * 25} r="3.5" fill={C.g} />
                </>
              )}
              <circle cx="30" cy={100} r="4" fill={C.amber} />
            </>
          )}
          {/* My location on tracking map too */}
          <circle cx="185" cy="25" r="10" fill={C.blue} opacity="0.12"><animate attributeName="r" values="8;14;8" dur="2s" repeatCount="indefinite" /></circle>
          <circle cx="185" cy="25" r="4" fill={C.blue} stroke="#fff" strokeWidth="1.5" />
        </svg>
        <div style={{ position: "absolute", top: 10, left: 10, right: 10, display: "flex", justifyContent: "space-between" }}>
          <span style={{ background: "rgba(8,13,10,0.85)", padding: "5px 10px", borderRadius: 7, fontSize: 14, fontFamily: C.fm, color: trackState === "tracking" ? C.g : C.t3, fontWeight: 700 }}>{fmtTime(trackTime)}</span>
          <span style={{ background: "rgba(8,13,10,0.85)", padding: "5px 10px", borderRadius: 7, fontSize: 11, fontFamily: C.fm, color: C.t2 }}>{trackPts.length} pts · 📍 Live</span>
        </div>
        {trackState === "idle" && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 12, color: C.t3, fontFamily: C.f }}>Tap <strong style={{ color: C.g }}>Start</strong> to begin walking</span></div>}
      </div>
      <div style={{ margin: "0 18px 14px", display: "flex", gap: 7 }}>
        {[{ l: "Accuracy", v: "±3.2m", c: C.ok }, { l: "Elevation", v: "2,140m", c: C.t1 }, { l: "Satellites", v: "12", c: C.t1 }].map((s, i) => (
          <div key={i} style={{ flex: 1, padding: "8px", borderRadius: 9, background: C.s2, border: `1px solid ${C.border}`, textAlign: "center" }}>
            <div style={{ fontSize: 9, color: C.t3, fontFamily: C.f }}>{s.l}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: s.c, fontFamily: C.fm }}>{s.v}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: "0 18px", display: "flex", gap: 8 }}>
        {trackState === "idle" && <Btn primary style={{ flex: 1 }} onClick={() => setTrackState("tracking")}>▶ Start Tracking</Btn>}
        {trackState === "tracking" && (<><Btn warn style={{ flex: 1 }} onClick={() => setTrackState("paused")}>⏸ Pause</Btn><Btn style={{ flex: 1, background: "rgba(34,197,94,0.1)", borderColor: C.ok, color: C.ok, border: `1px solid ${C.ok}` }} onClick={() => setTrackState("complete")}>⏹ Finish</Btn></>)}
        {trackState === "paused" && (<><Btn primary style={{ flex: 1 }} onClick={() => setTrackState("tracking")}>▶ Resume</Btn><Btn style={{ flex: 1, background: "rgba(34,197,94,0.1)", borderColor: C.ok, color: C.ok, border: `1px solid ${C.ok}` }} onClick={() => setTrackState("complete")}>⏹ Finish</Btn></>)}
      </div>
      {trackState === "complete" && (
        <div style={{ padding: "14px 18px" }}>
          <div style={{ padding: 12, borderRadius: 11, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", marginBottom: 14, textAlign: "center" }}>
            <I d={ic.check} size={22} color={C.ok} style={{ margin: "0 auto 4px", display: "block" }} />
            <div style={{ fontSize: 13, fontWeight: 700, color: C.ok, fontFamily: C.f }}>Polygon tracked!</div>
            <div style={{ fontSize: 11, color: C.t2, fontFamily: C.fm }}>{trackPts.length} points · {fmtTime(trackTime)}</div>
          </div>
          <div style={{ borderRadius: 12, background: C.s2, border: `1px solid ${C.border}`, padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.t3, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12, fontFamily: C.f }}>Polygon Attributes</div>
            {Object.entries(POLY_FIELDS).map(([key, field]) => <FormField key={key} field={field} value={polyForm[key]} onChange={v => setPolyForm(f => ({ ...f, [key]: v }))} />)}
          </div>
          <Btn primary style={{ width: "100%" }} onClick={() => {
            if (!polyForm.poly_name || !polyForm.practice) { showToast("Fill in Polygon Name and Practice", "warn"); return; }
            const newPoly = { ...polyForm, status: "draft", pointCount: trackPts.length, id: Date.now() };
            setSitePolygons(prev => ({ ...prev, [selSite.key]: [...(prev[selSite.key] || []), newPoly] }));
            showToast(`"${polyForm.poly_name}" saved!`);
            go("site");
          }}><I d={ic.upload} size={16} color={C.bg} /> Save & Submit</Btn>
        </div>
      )}
    </div>
  );

  // ─── COLLECT POINT ───
  const PointScreen = () => {
    const [captured, setCaptured] = useState(false);
    return (
      <div>
        <Header title="Collect Point" sub={selSite?.name} back={() => go("site")} />
        <div style={{ padding: 18 }}>
          <div style={{ height: 180, borderRadius: 13, background: "#091210", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", marginBottom: 14 }}>
            <svg width="50" height="50" viewBox="0 0 50 50">
              <circle cx="25" cy="25" r="18" fill="none" stroke={C.g} strokeWidth="1.2" opacity="0.25" />
              <circle cx="25" cy="25" r="9" fill="none" stroke={C.g} strokeWidth="1.2" opacity="0.4" />
              <circle cx="25" cy="25" r="2.5" fill={C.g} />
              <line x1="25" y1="2" x2="25" y2="16" stroke={C.g} strokeWidth="0.8" opacity="0.35" />
              <line x1="25" y1="34" x2="25" y2="48" stroke={C.g} strokeWidth="0.8" opacity="0.35" />
              <line x1="2" y1="25" x2="16" y2="25" stroke={C.g} strokeWidth="0.8" opacity="0.35" />
              <line x1="34" y1="25" x2="48" y2="25" stroke={C.g} strokeWidth="0.8" opacity="0.35" />
            </svg>
            {/* My location on point screen */}
            <div style={{ position: "absolute", top: 12, right: 12 }}>
              <div style={{ fontSize: 9, color: C.blue, fontFamily: C.fm, background: "rgba(8,13,10,0.85)", padding: "3px 7px", borderRadius: 5 }}>📍 Live location</div>
            </div>
            <div style={{ position: "absolute", bottom: 10, left: 10, fontSize: 10, fontFamily: C.fm, color: C.t2, background: "rgba(8,13,10,0.85)", padding: "4px 8px", borderRadius: 5 }}>-1.28632°, 36.81741°</div>
          </div>
          {!captured ? (
            <Btn primary style={{ width: "100%" }} onClick={() => setCaptured(true)}><I d={ic.gps} size={18} color={C.bg} /> Capture Point</Btn>
          ) : (
            <>
              <div style={{ padding: 12, borderRadius: 11, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", marginBottom: 12, textAlign: "center" }}>
                <I d={ic.check} size={20} color={C.ok} style={{ margin: "0 auto 4px", display: "block" }} />
                <div style={{ fontSize: 13, fontWeight: 700, color: C.ok, fontFamily: C.f }}>Point captured!</div>
                <div style={{ fontSize: 10, color: C.t2, fontFamily: C.fm }}>±2.8m · 14 satellites</div>
              </div>
              <Btn primary style={{ width: "100%" }} onClick={() => { showToast("Point saved!"); go("site"); }}>Save Point</Btn>
            </>
          )}
        </div>
      </div>
    );
  };

  // ─── QA REVIEW ───
  const QAScreen = () => {
    const toggle = id => setQaChecks(p => ({ ...p, [id]: !p[id] }));
    const checked = Object.values(qaChecks).filter(Boolean).length;
    const total = QA_CHECKS.length;
    const allDone = checked === total;
    const grouped = {};
    QA_CHECKS.forEach(c => { if (!grouped[c.cat]) grouped[c.cat] = []; grouped[c.cat].push(c); });
    return (
      <div>
        <Header title="QA Review" sub={selPolygon?.poly_name} back={() => go("polygon-detail")} />
        <div style={{ padding: "14px 18px" }}>
          <div style={{ padding: "12px 14px", borderRadius: 11, background: C.s2, border: `1px solid ${C.border}`, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 11, fontFamily: C.f }}>
              <span style={{ color: C.t2 }}>QA Progress</span><span style={{ color: C.g, fontWeight: 700 }}>{checked}/{total}</span>
            </div>
            <div style={{ height: 5, borderRadius: 3, background: C.bg, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(checked / total) * 100}%`, borderRadius: 3, background: allDone ? C.ok : `linear-gradient(90deg, ${C.g}, ${C.gDim})`, transition: "width 0.3s" }} />
            </div>
          </div>
          {Object.entries(grouped).map(([cat, checks]) => (
            <div key={cat} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6, fontFamily: C.f }}>{cat}</div>
              {checks.map(c => (
                <button key={c.id} onClick={() => toggle(c.id)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", marginBottom: 3, borderRadius: 9, background: qaChecks[c.id] ? "rgba(34,197,94,0.05)" : C.s2, border: `1px solid ${qaChecks[c.id] ? "rgba(34,197,94,0.15)" : C.border}`, cursor: "pointer", textAlign: "left" }}>
                  <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${qaChecks[c.id] ? C.ok : C.borderL}`, background: qaChecks[c.id] ? C.ok : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {qaChecks[c.id] && <I d={ic.check} size={12} color={C.bg} />}
                  </div>
                  <span style={{ flex: 1, fontSize: 12, color: C.t1, fontFamily: C.f }}>{c.label}</span>
                  {c.critical && <span style={{ fontSize: 8, fontWeight: 700, color: C.red, background: C.redBg, padding: "2px 5px", borderRadius: 3, letterSpacing: 0.5 }}>CRITICAL</span>}
                </button>
              ))}
            </div>
          ))}
          {allDone && <Btn primary style={{ width: "100%", marginTop: 8 }} onClick={() => { showToast("Polygon approved!"); go("site"); }}>✓ Approve & Push to TerraMatch</Btn>}
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════
  return (
    <div style={{ maxWidth: 420, margin: "16px auto", fontFamily: C.f, position: "relative" }}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;700&display=swap" rel="stylesheet" />

      <div style={{ borderRadius: 30, border: `2px solid ${C.border}`, background: C.bg, overflow: "hidden", boxShadow: `0 0 0 1px ${C.border}, 0 20px 70px rgba(0,0,0,0.6)`, minHeight: 700, maxHeight: 780, overflowY: "auto", position: "relative" }}>
        {/* Status bar */}
        <div style={{ height: 32, background: C.s1, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px", fontSize: 11, fontWeight: 600, color: C.t2, fontFamily: C.f }}>
          <span>9:41</span><div style={{ display: "flex", gap: 5, fontSize: 10 }}><span>📶</span><span>🔋 87%</span></div>
        </div>

        {screen === "login" && <LoginScreen />}
        {screen === "home" && <HomeScreen />}
        {screen === "project" && <ProjectScreen />}
        {screen === "site" && <SiteScreen />}
        {screen === "polygon-detail" && <PolygonDetailScreen />}
        {screen === "edit" && <EditScreen />}
        {screen === "track" && <TrackScreen />}
        {screen === "point" && <PointScreen />}
        {screen === "qa" && <QAScreen />}

        {/* Bottom nav */}
        {screen !== "login" && (
          <div style={{ position: "sticky", bottom: 0, display: "flex", justifyContent: "space-around", padding: "10px 0 14px", background: C.s1, borderTop: `1px solid ${C.border}` }}>
            {[{ icon: ic.folder, label: "Projects", scr: "home" }, { icon: ic.polygon, label: "Collect", scr: "collect" }, { icon: ic.qa, label: "QA", scr: "qaTab" }].map(tab => (
              <button key={tab.label} onClick={() => { if (tab.scr === "home") { go("home"); setSelProject(null); setSelSite(null); } }}
                style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <I d={tab.icon} size={18} color={screen === "home" && tab.scr === "home" ? C.g : C.t3} />
                <span style={{ fontSize: 9, fontWeight: 600, color: screen === "home" && tab.scr === "home" ? C.g : C.t3, fontFamily: C.f }}>{tab.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Toast notification */}
        {toast && (
          <div style={{
            position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", zIndex: 999,
            padding: "10px 20px", borderRadius: 12, fontFamily: C.f, fontSize: 12, fontWeight: 600,
            background: toast.type === "warn" ? C.amberBg : "rgba(34,197,94,0.15)",
            color: toast.type === "warn" ? C.amber : C.ok,
            border: `1px solid ${toast.type === "warn" ? C.amber : C.ok}`,
            boxShadow: "0 8px 30px rgba(0,0,0,0.4)", whiteSpace: "nowrap",
            animation: "fadeIn 0.2s ease-out"
          }}>
            {toast.msg}
          </div>
        )}
      </div>

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateX(-50%) translateY(10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }`}</style>
    </div>
  );
}
