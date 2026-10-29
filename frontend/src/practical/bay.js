// The 3D practical rooms: the phlebotomy bay (a chair with the patient in it, a
// bench of equipment, a rack of tubes), the specimen reception counter (a ward
// nurse across the counter, a rack of samples to inspect), the chemistry
// bench (an analyser flagging a result, a colleague beside it), and the same lab
// with a blood spill on its floor and the spill trolley, and the haematology
// bench (an analyser, a staining rack, a microscope), and the blood bank (a
// grouping tile, a blood fridge, the issue hatch). Each one draws what
// the server says has happened (sync) and reports what the learner clicked
// (onPick). It decides nothing — the grading lives on the server.
import * as THREE from "three";

const VIEWS_BY_KIND = {
  phlebotomy: {
    patient: { p: [0.34, 1.3, 1.25], l: [0.04, 0.98, 0] },
    wide:    { p: [0.95, 1.75, 1.8],  l: [0.95, 0.8, -0.05] },
    bench:   { p: [1.32, 1.72, 1.35], l: [1.36, 0.9, -0.08] },
    rack:    { p: [1.6, 1.24, 0.45],  l: [1.6, 0.96, -0.14] },
  },
  reception: {
    nurse:   { p: [0.2, 1.62, 1.15], l: [0.05, 1.3, -0.75] },
    counter: { p: [0.2, 1.72, 0.95], l: [0.1, 1.02, -0.12] },
    close:   { p: [0.15, 1.24, 0.42], l: [0.15, 1.2, 0.12] },     // moved onto the sample being inspected
    phone:   { p: [0.95, 1.62, 1.0], l: [1.12, 1.15, -0.08] },
  },
  chemistry: {
    bench:    { p: [0.55, 1.62, 1.85], l: [0.6, 1.02, -0.25] },
    analyser: { p: [0.42, 1.48, 1.0],  l: [0.38, 1.0, -0.25] },
    qc:       { p: [1.18, 1.45, 0.55], l: [1.18, 1.4, -0.6] },
    phone:    { p: [1.55, 1.5, 0.95],  l: [1.75, 1.0, -0.12] },
  },
  haematology: {
    bench:    { p: [1.1, 1.75, 2.3],   l: [1.1, 0.95, -0.25] },
    analyser: { p: [0.5, 1.45, 0.95],  l: [0.5, 1.0, -0.25] },
    stain:    { p: [1.25, 1.5, 0.8],   l: [1.25, 0.95, -0.2] },
    scope:    { p: [1.98, 1.42, 0.62], l: [1.98, 1.05, -0.25] },
    qc:       { p: [1.0, 1.45, 0.55],  l: [1.0, 1.4, -0.6] },
    phone:    { p: [2.45, 1.5, 0.95],  l: [2.6, 1.0, -0.12] },
  },
  bloodbank: {
    bench:  { p: [0.8, 1.7, 2.0],   l: [0.8, 0.95, -0.25] },
    tile:   { p: [0.72, 1.32, 0.55], l: [0.72, 0.9, -0.1] },
    fridge: { p: [1.75, 1.5, 1.45],  l: [2.3, 1.0, -0.2] },
    phone:  { p: [-0.1, 1.45, 0.75], l: [-0.16, 0.95, -0.1] },
  },
  spill: {
    room:  { p: [0.0, 2.0, 3.2],   l: [0.0, 0.5, 0.3] },
    work:  { p: [-0.25, 1.6, 1.85], l: [-0.25, 0.45, 0.45] },
    kit:   { p: [-0.7, 1.45, 1.3],  l: [-0.7, 0.78, 0.5] },
    spill: { p: [0.7, 1.25, 1.45],  l: [0.7, 0.0, 0.55] },
    phone: { p: [1.55, 1.5, 0.95],  l: [1.75, 1.0, -0.12] },
  },
};
export const FIRST_VIEW = { phlebotomy: "patient", reception: "nurse", chemistry: "bench", spill: "room", haematology: "bench", bloodbank: "phone" };
const TOP = 0.9;      // bench height in the phlebotomy bay
const DESK = 1.04;    // counter height at reception

export function createBay(host, { onPick, onView, kind = "phlebotomy" } = {}) {
  const VIEWS = VIEWS_BY_KIND[kind] || VIEWS_BY_KIND.phlebotomy;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  Object.assign(renderer.domElement.style, { position: "absolute", inset: "0", width: "100%", height: "100%", display: "block", touchAction: "none" });
  host.appendChild(renderer.domElement);

  const tip = document.createElement("div");
  Object.assign(tip.style, {
    position: "absolute", left: "0", top: "0", pointerEvents: "none", background: "rgba(16,28,30,.92)", color: "#fff",
    font: "700 12.5px/1.3 system-ui, sans-serif", padding: "5px 9px", borderRadius: "8px", whiteSpace: "nowrap",
    transform: "translate(-50%, -140%)", display: "none", zIndex: "3",
  });
  host.appendChild(tip);

  // Speech bubbles: the patient's over their head (it follows them as the camera
  // moves), yours at the foot of the view, since you are the one behind it.
  function bubble(you) {
    const b = document.createElement("div");
    Object.assign(b.style, {
      position: "absolute", zIndex: "2", pointerEvents: "none", maxWidth: "min(300px, 70%)", padding: "8px 12px",
      borderRadius: "14px", font: "600 13px/1.4 system-ui, sans-serif", boxShadow: "0 6px 18px rgba(0,0,0,.28)",
      background: you ? "#0d6c72" : "#ffffff", color: you ? "#ffffff" : "#1d2b28", display: "none",
      transition: "opacity .25s", left: you ? "50%" : "0", top: you ? "auto" : "0", bottom: you ? "64px" : "auto",
      transform: you ? "translateX(-50%)" : "translate(-50%, -100%)",
    });
    const who = document.createElement("div");
    Object.assign(who.style, { fontSize: "10.5px", fontWeight: "700", letterSpacing: ".06em", textTransform: "uppercase", opacity: ".65", marginBottom: "2px" });
    const text = document.createElement("div");
    const tail = document.createElement("div");
    Object.assign(tail.style, { position: "absolute", left: "50%", bottom: "-6px", width: "12px", height: "12px", marginLeft: "-6px", background: b.style.background, transform: "rotate(45deg)" });
    b.append(who, text, tail); host.appendChild(b);
    return { el: b, who, text, until: 0 };
  }
  const bubbles = { patient: bubble(false), you: bubble(true) };
  const headPos = new THREE.Vector3();

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#dbe4e2");
  const camera = new THREE.PerspectiveCamera(50, 1, 0.05, 40);
  scene.add(new THREE.HemisphereLight("#ffffff", "#9fb0ab", 0.78));
  const sun = new THREE.DirectionalLight("#fff4e4", 0.72);
  sun.position.set(2.2, 4, 3); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -3, right: 3, top: 3, bottom: -2, near: 0.5, far: 12 });
  sun.shadow.bias = -0.0006; scene.add(sun);

  const disposables = [];
  const mat = (c, o = {}) => { const m = new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.7 }, o)); disposables.push(m); return m; };
  const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const C = (rt, rb, h, s = 16, open = false) => new THREE.CylinderGeometry(rt, rb, h, s, 1, open);
  const S = (r, w = 16, h = 12, ...rest) => new THREE.SphereGeometry(r, w, h, ...rest);
  function mesh(geo, m, x = 0, y = 0, z = 0, parent = scene) {
    const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); me.castShadow = true; me.receiveShadow = true; parent.add(me); disposables.push(geo); return me;
  }
  const group = (x, y, z, parent = scene) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
  function canvasTex(w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.anisotropy = 4; disposables.push(t); return t; }

  // ── the floor, in every room ──
  mesh(new THREE.PlaneGeometry(9, 9), mat("#c9d4d1", { roughness: 0.85 })).rotation.x = -Math.PI / 2;

  // ── things you can click ──
  const REG = {}, pickables = [], HIT = new THREE.MeshBasicMaterial({ visible: false });
  disposables.push(HIT);
  function reg(id, root, hitGeo, hitPos = [0, 0, 0], extra = {}) {
    const r = REG[id] || (REG[id] = { mats: [], roots: [] });
    r.roots.push(root);
    root.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); disposables.push(o.material); r.mats.push(o.material); Object.assign(o.userData, { id, ...extra }); pickables.push(o); } });
    if (hitGeo) { const h = new THREE.Mesh(hitGeo, HIT); h.position.set(...hitPos); Object.assign(h.userData, { id, ...extra }); root.add(h); pickables.push(h); disposables.push(hitGeo); }
    return root;
  }

  // ── the phlebotomy bay ──
  function buildPhlebotomy() {
    mesh(B(9, 3, 0.05), mat("#eef2ef"), 0.5, 1.5, -0.48);
    mesh(B(9, 1.1, 0.02), mat("#d3e2de", { roughness: 0.4 }), 0.5, 0.55, -0.45);
    mesh(B(0.05, 3, 6), mat("#e8edea"), -1.5, 1.5, 2.5);
    mesh(B(0.05, 3, 6), mat("#e8edea"), 2.45, 1.5, 2.5);
    mesh(B(0.06, 2.1, 0.95), mat("#7b8f8a"), -1.47, 1.05, 1.4);
    mesh(B(0.48, 0.64, 0.01), mat("#ffffff", { map: canvasTex(240, 320, (c, w) => {
      c.fillStyle = "#ffffff"; c.fillRect(0, 0, w, 320); c.fillStyle = "#0d6c72"; c.fillRect(0, 0, w, 54);
      c.fillStyle = "#fff"; c.font = "800 24px sans-serif"; c.fillText("Clean your hands", 14, 36);
      c.fillStyle = "#1f2522"; c.font = "700 15px sans-serif";
      ["1  Before touching a patient", "2  Before a clean procedure", "3  After body fluid exposure", "4  After touching a patient", "5  After the surroundings"].forEach((t, i) => c.fillText(t, 14, 92 + i * 40));
      c.fillStyle = "#0d6c72"; c.fillRect(14, 292, w - 28, 6);
    }) }), -0.75, 1.55, -0.44).castShadow = false;

    // the phlebotomy chair
    const vinyl = mat("#2f5d62", { roughness: 0.45 }), steel = mat("#aab4b8", { metalness: 0.55, roughness: 0.35 });
    mesh(B(0.52, 0.1, 0.5), vinyl, 0, 0.46, 0); mesh(B(0.52, 0.62, 0.08), vinyl, 0, 0.83, -0.27).rotation.x = -0.12;
    for (const x of [-0.22, 0.22]) for (const z of [-0.2, 0.2]) mesh(C(0.02, 0.02, 0.42, 8), steel, x, 0.21, z);
    mesh(B(0.1, 0.06, 0.42), vinyl, -0.33, 0.7, 0); mesh(B(0.04, 0.24, 0.04), steel, -0.33, 0.55, -0.12);
    mesh(B(0.13, 0.06, 0.62), vinyl, 0.34, 0.715, 0.24); mesh(B(0.04, 0.26, 0.04), steel, 0.34, 0.56, -0.1);

    // the bench
    mesh(B(1.3, 0.86, 0.62), mat("#c3ccd0"), 1.35, 0.43, -0.12);
    mesh(B(1.34, 0.04, 0.66), mat("#f4f6f7", { roughness: 0.3 }), 1.35, 0.88, -0.12);
    for (let x = 0.9; x < 2; x += 0.45) mesh(B(0.01, 0.7, 0.01), mat("#93a0a6"), x, 0.45, 0.195);

    const gSan = group(0.86, TOP, -0.3);
    mesh(C(0.04, 0.045, 0.15, 18), mat("#e9f3f7", { roughness: 0.2 }), 0, 0.075, 0, gSan); mesh(C(0.012, 0.012, 0.05, 8), mat("#ffffff"), 0, 0.17, 0, gSan);
    mesh(B(0.06, 0.015, 0.015), mat("#ffffff"), 0.025, 0.195, 0, gSan); mesh(C(0.041, 0.046, 0.05, 18), mat("#0d6c72"), 0, 0.05, 0, gSan);
    reg("sanitiser", gSan, C(0.06, 0.06, 0.24), [0, 0.11, 0]);
    const gGlv = group(1.07, TOP, -0.3);
    mesh(B(0.24, 0.11, 0.13), mat("#3a7bd5"), 0, 0.055, 0, gGlv); mesh(B(0.1, 0.012, 0.04), mat("#9fd0ff"), 0, 0.112, 0, gGlv); mesh(B(0.05, 0.02, 0.03), mat("#bfe1ff"), 0, 0.12, 0, gGlv);
    reg("gloves", gGlv);
    const gTq = group(0.88, TOP, 0.04);
    mesh(B(0.22, 0.012, 0.035), mat("#2f86d6"), 0, 0.006, 0, gTq); mesh(B(0.04, 0.02, 0.045), mat("#20313a"), 0.07, 0.01, 0, gTq);
    reg("tourniquet", gTq, B(0.26, 0.06, 0.08));
    const gSwab = group(1.07, TOP, 0.05);
    mesh(B(0.11, 0.05, 0.075), mat("#ffffff"), 0, 0.025, 0, gSwab); mesh(B(0.11, 0.012, 0.075), mat("#d64b7a"), 0, 0.052, 0, gSwab);
    for (let i = 0; i < 2; i++) mesh(B(0.045, 0.004, 0.045), mat("#f3d3df"), -0.03 + i * 0.07, 0.062, 0.06, gSwab);
    reg("swab", gSwab);
    mesh(B(0.3, 0.015, 0.19), mat("#cfd6da", { metalness: 0.5, roughness: 0.3 }), 1.36, TOP + 0.008, 0.05);
    const gNeedle = group(1.3, TOP + 0.03, 0.07);
    mesh(C(0.014, 0.014, 0.09, 14), mat("#cfe7f2", { roughness: 0.15, transparent: true, opacity: 0.85 }), 0, 0, 0, gNeedle).rotation.z = Math.PI / 2;
    mesh(C(0.0025, 0.0025, 0.05, 6), mat("#d7dde0", { metalness: 0.9, roughness: 0.2 }), -0.07, 0, 0, gNeedle).rotation.z = Math.PI / 2;
    mesh(C(0.008, 0.008, 0.02, 10), mat("#2e8b57"), -0.045, 0, 0, gNeedle).rotation.z = Math.PI / 2;
    reg("needle", gNeedle, B(0.16, 0.05, 0.06));
    const gCap = group(1.44, TOP + 0.024, 0.1);
    mesh(C(0.007, 0.007, 0.045, 10), mat("#2e8b57"), 0, 0, 0, gCap).rotation.z = Math.PI / 2 - 0.4;
    reg("cap", gCap, B(0.07, 0.04, 0.05));
    const gGauze = group(1.36, TOP, -0.27);
    mesh(B(0.1, 0.025, 0.1), mat("#f6f6f0"), 0, 0.013, 0, gGauze); mesh(B(0.1, 0.004, 0.1), mat("#a7d3cf"), 0, 0.027, 0, gGauze);
    reg("gauze", gGauze, B(0.13, 0.06, 0.13));
    const gSharps = group(1.86, TOP, 0.02);
    mesh(B(0.17, 0.2, 0.15), mat("#f2c524"), 0, 0.1, 0, gSharps); mesh(B(0.18, 0.03, 0.16), mat("#c0392b"), 0, 0.215, 0, gSharps); mesh(B(0.09, 0.005, 0.03), mat("#2b1414"), 0, 0.232, 0, gSharps);
    mesh(B(0.08, 0.06, 0.002), mat("#ffffff", { map: canvasTex(64, 48, (c) => { c.fillStyle = "#fff"; c.fillRect(0, 0, 64, 48); c.fillStyle = "#c0392b"; c.font = "bold 13px sans-serif"; c.fillText("SHARPS", 6, 20); c.fillText("ONLY", 14, 38); }) }), 0, 0.11, 0.076, gSharps);
    reg("sharps", gSharps);
    const gPrinter = group(1.87, TOP, -0.3);
    mesh(B(0.13, 0.07, 0.15), mat("#4a5459"), 0, 0.035, 0, gPrinter); mesh(B(0.07, 0.004, 0.03), mat("#ffffff"), 0, 0.072, 0.07, gPrinter);
    reg("printer", gPrinter);

    // the rack; tubes are built when the run says which ones exist
    const gRack = group(1.6, TOP, -0.14);
    mesh(B(0.36, 0.012, 0.08), mat("#e8eef0"), 0, 0.006, 0, gRack); mesh(B(0.36, 0.012, 0.08), mat("#e8eef0"), 0, 0.07, 0, gRack);
    for (const x of [-0.17, 0.17]) mesh(B(0.012, 0.07, 0.08), mat("#d5dde0"), x, 0.035, 0, gRack);
    const TUBE3D = {};
    const blood = mat("#6e0f12", { roughness: 0.3 });
    function ensureTubes(tubes) {
      for (const k in tubes) {
        if (TUBE3D[k]) continue;
        const g = group(1.6, TOP, -0.14);
        mesh(C(0.0095, 0.0095, 0.085, 12), mat("#eef5f7", { roughness: 0.1, transparent: true, opacity: 0.55 }), 0, 0.045, 0, g);
        const fill = mesh(C(0.0085, 0.0085, 0.07, 12), blood, 0, 0.01, 0, g); fill.scale.y = 0.001; fill.visible = false;
        mesh(C(0.012, 0.012, 0.022, 12), mat(tubes[k].cap, { roughness: 0.4 }), 0, 0.098, 0, g);
        const band = mesh(C(0.0102, 0.0102, 0.035, 12, true), mat("#ffffff", { side: THREE.DoubleSide }), 0, 0.055, 0, g); band.visible = false;
        reg(k, g, C(0.022, 0.022, 0.14), [0, 0.06, 0]);
        TUBE3D[k] = { g, fill, band, level: 0, want: 0 };
      }
    }

    return { gTq, gNeedle, gCap, gGauze, TUBE3D, ensureTubes };
  }

  // ── the reception counter ──
  function buildReception() {
    mesh(B(9, 3, 0.05), mat("#eef2ef"), 0.5, 1.5, -1.6);
    mesh(B(9, 1.1, 0.02), mat("#d3e2de", { roughness: 0.4 }), 0.5, 0.55, -1.57);
    mesh(B(0.05, 3, 6), mat("#e8edea"), -2.2, 1.5, 1.2);
    mesh(B(0.05, 3, 6), mat("#e8edea"), 2.45, 1.5, 1.2);
    mesh(B(0.95, 2.1, 0.06), mat("#7b8f8a"), -1.4, 1.05, -1.57);          // the door back to the wards
    mesh(B(1.3, 0.3, 0.01), mat("#ffffff", { map: canvasTex(520, 120, (c, w, h) => {
      c.fillStyle = "#0d6c72"; c.fillRect(0, 0, w, h); c.fillStyle = "#fff";
      c.font = "800 46px sans-serif"; c.fillText("SPECIMEN RECEPTION", 22, 64);
      c.font = "600 22px sans-serif"; c.fillText("Every sample is checked before it is signed for", 24, 100);
    }) }), 0.3, 2.15, -1.56).castShadow = false;

    // the counter, staff side towards the camera, a raised ledge on the ward side
    mesh(B(2.8, DESK - 0.02, 0.55), mat("#c9d3d6"), 0.2, (DESK - 0.02) / 2, -0.12);
    mesh(B(2.9, 0.04, 0.62), mat("#f4f6f7", { roughness: 0.3 }), 0.2, DESK, -0.12);
    mesh(B(2.9, 0.16, 0.1), mat("#dfe6e8"), 0.2, DESK + 0.1, -0.4);

    // trays for what has been decided
    const tray = (x, color, text) => {
      const g = group(x, DESK + 0.02, 0.06);
      mesh(B(0.32, 0.015, 0.13), mat("#e8eef0"), 0, 0.0075, 0, g);
      for (const [dx, dz, w, d] of [[0, -0.065, 0.32, 0.01], [0, 0.065, 0.32, 0.01], [-0.16, 0, 0.01, 0.13], [0.16, 0, 0.01, 0.13]]) mesh(B(w, 0.03, d), mat(color), dx, 0.015, dz, g);
      mesh(B(0.2, 0.05, 0.004), mat("#ffffff", { map: canvasTex(200, 50, (c) => { c.fillStyle = color; c.fillRect(0, 0, 200, 50); c.fillStyle = "#fff"; c.font = "800 28px sans-serif"; c.fillText(text, 12, 36); }) }), 0, 0.04, 0.069, g).castShadow = false;
    };
    tray(-0.55, "#2e8b57", "ACCEPTED");
    tray(-0.95, "#b3261e", "REJECTED");

    // the rack the samples arrive in
    const gRack = group(0.25, DESK + 0.02, 0);
    mesh(B(0.4, 0.012, 0.08), mat("#e8eef0"), 0, 0.006, 0, gRack); mesh(B(0.4, 0.012, 0.08), mat("#e8eef0"), 0, 0.075, 0, gRack);
    for (const x of [-0.19, 0.19]) mesh(B(0.012, 0.075, 0.08), mat("#d5dde0"), x, 0.037, 0, gRack);

    // the ELIMS terminal, the phone, the specimen bag, the request forms
    const gMon = group(1.0, DESK + 0.02, -0.25);
    mesh(B(0.1, 0.02, 0.1), mat("#3d4448"), 0, 0.01, 0, gMon); mesh(C(0.015, 0.015, 0.2, 8), mat("#3d4448"), 0, 0.11, 0, gMon);
    mesh(B(0.52, 0.32, 0.03), mat("#1e2327"), 0, 0.35, 0, gMon);
    mesh(B(0.48, 0.28, 0.004), mat("#ffffff", { emissive: "#ffffff", emissiveIntensity: 0.25, map: canvasTex(320, 186, (c, w, h) => {
      c.fillStyle = "#f4f7f8"; c.fillRect(0, 0, w, h); c.fillStyle = "#0c7a69"; c.fillRect(0, 0, w, 30);
      c.fillStyle = "#fff"; c.font = "800 17px sans-serif"; c.fillText("ELIMS · Sample reception", 10, 21);
      c.font = "600 12px monospace";
      ["Scan or enter the lab number", "Accept  ·  Reject with a reason", "In transit from the ward: 5"].forEach((t, i) => {
        c.fillStyle = i % 2 ? "#ffffff" : "#e8eef0"; c.fillRect(0, 36 + i * 30, w, 30); c.fillStyle = "#2d3436"; c.fillText(t, 10, 56 + i * 30);
      });
    }) }), 0, 0.35, 0.017, gMon);
    reg("monitor", gMon);
    const gPhone = group(1.3, DESK + 0.02, 0.02);
    mesh(B(0.17, 0.05, 0.2), mat("#2b3034"), 0, 0.025, 0, gPhone); mesh(B(0.05, 0.035, 0.21), mat("#1b1f22"), -0.05, 0.065, 0, gPhone);
    for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) mesh(B(0.022, 0.006, 0.022), mat("#cfd6da"), 0.03 + k * 0.028, 0.053, -0.05 + r * 0.035, gPhone);
    reg("phone", gPhone, B(0.22, 0.12, 0.24), [0, 0.05, 0]);
    const gBag = group(-0.2, DESK + 0.02, -0.18);
    mesh(B(0.22, 0.03, 0.3), mat("#e9f1f4", { transparent: true, opacity: 0.7, roughness: 0.2 }), 0, 0.015, 0, gBag);
    mesh(B(0.22, 0.032, 0.05), mat("#f2c524"), 0, 0.016, -0.12, gBag);
    reg("bag", gBag);
    for (let i = 0; i < 5; i++) mesh(B(0.21, 0.002, 0.29), mat(i % 2 ? "#fffdf5" : "#f7f3e6"), 0.62, DESK + 0.022 + i * 0.002, 0.1).rotation.y = i * 0.04;

    // The samples are built for each run, because every run deals a different set.
    // They are a little larger than life, so a fault can be seen from the counter.
    const SAMPLE3D = {};
    let sig = "";
    const H = 0.1, R = 0.011;
    const labelTex = canvasTex(128, 64, (c) => {
      c.fillStyle = "#ffffff"; c.fillRect(0, 0, 128, 64); c.fillStyle = "#1f2522";
      for (let i = 0; i < 4; i++) c.fillRect(8, 8 + i * 12, 70 + (i % 2) * 30, 4);
      for (let x = 8; x < 120; x += 3 + (x % 7 === 0 ? 2 : 0)) c.fillRect(x, 54, 1 + (x % 3 === 0 ? 1 : 0), 8);
    });
    function ensureSamples(samples) {
      const next = JSON.stringify(samples.map((x) => [x.id, x.cap, x.look]));
      if (next === sig) return;
      sig = next;
      for (const k in SAMPLE3D) { scene.remove(SAMPLE3D[k].g); delete SAMPLE3D[k]; }
      for (let i = pickables.length - 1; i >= 0; i--) if (pickables[i].userData.sample) pickables.splice(i, 1);
      samples.forEach((x, i) => {
        const L = x.look, g = group(0, 0, 0), inner = group(0, 0, 0, g);
        mesh(C(R, R, H, 18), mat("#eef5f7", { roughness: 0.08, transparent: true, opacity: 0.4 }), 0, H / 2, 0, inner);
        for (const [a, b, col] of L.layers) {
          const h = (b - a) * H * 0.95, cells = col === "#5a0c10";
          if (h > 0) mesh(C(R * 0.9, R * 0.9, h, 18), mat(col, { roughness: 0.35, transparent: !cells, opacity: cells ? 1 : 0.85 }), 0, 0.003 + a * H * 0.95 + h / 2, 0, inner);
        }
        const top = 0.003 + L.fill * H * 0.95;
        if (L.clot) {   // a dark clot breaking the surface, fibrin on the glass above it
          mesh(S(R * 0.72, 12, 10), mat("#24030a", { roughness: 0.6 }), 0.002, top - 0.002, 0.002, inner).scale.set(1, 1.4, 1);
          mesh(C(0.0014, 0.0014, H * 0.12, 6), mat("#5c1016"), -0.004, top + H * 0.05, 0.004, inner);
        }
        if (L.smear) {  // blood on the outside of the tube
          mesh(B(0.006, H * 0.55, 0.002), mat("#7a0d12", { roughness: 0.4 }), R * 0.95, H * 0.62, R * 0.25, inner).rotation.y = 0.5;
          mesh(S(0.004, 8, 6), mat("#7a0d12"), R * 0.9, H * 0.32, R * 0.4, inner);
        }
        if (L.labelled) mesh(C(R * 1.03, R * 1.03, H * 0.5, 18, true), mat("#ffffff", { map: labelTex, side: THREE.DoubleSide }), 0, H * 0.52, 0, inner);
        if (L.fillLine) mesh(C(R * 1.05, R * 1.05, 0.0018, 18, true), mat("#111111", { side: THREE.DoubleSide }), 0, 0.003 + L.fillLine * H * 0.95, 0, inner);
        const cap = mesh(C(R * 1.15, R * 1.15, 0.026, 18), mat(x.cap, { roughness: 0.4 }), 0, H + 0.012, 0, inner);
        if (L.capTilt) { cap.rotation.z = 0.28; cap.position.x = 0.004; cap.position.y += 0.004; }
        reg(x.id, g, C(0.026, 0.026, 0.15), [0, 0.06, 0], { sample: true });
        const slot = new THREE.Vector3(0.11 + i * 0.07, DESK + 0.02, 0);
        SAMPLE3D[x.id] = { g, inner, slot, target: slot.clone(), focus: false };
        g.position.copy(slot);
      });
    }
    return { SAMPLE3D, ensureSamples, phonePos: new THREE.Vector3(1.3, DESK + 0.3, 0.02) };
  }

  // ── the chemistry bench ──
  // An analyser flagging the result, the spun sample in front of it, today's QC
  // chart on the wall, the ELIMS terminal and the phone. A colleague stands at
  // the end of the bench.
  function buildChemistry(quiet = false) {
    mesh(B(9, 3, 0.05), mat("#eef2ef"), 0.5, 1.5, -0.62);
    mesh(B(9, 1.1, 0.02), mat("#d3e2de", { roughness: 0.4 }), 0.5, 0.55, -0.59);
    mesh(B(0.05, 3, 6), mat("#e8edea"), -1.6, 1.5, 2.3);
    mesh(B(0.05, 3, 6), mat("#e8edea"), 2.7, 1.5, 2.3);
    mesh(B(1.4, 0.26, 0.01), mat("#ffffff", { map: canvasTex(560, 104, (c, w, h) => {
      c.fillStyle = "#0d6c72"; c.fillRect(0, 0, w, h); c.fillStyle = "#fff";
      c.font = "800 44px sans-serif"; c.fillText("CLINICAL CHEMISTRY", 22, 58);
      c.font = "600 21px sans-serif"; c.fillText("Check it, confirm it, then call it", 24, 90);
    }) }), -0.05, 2.2, -0.59).castShadow = false;

    // the bench
    mesh(B(2.3, 0.86, 0.62), mat("#c3ccd0"), 0.85, 0.43, -0.28);
    mesh(B(2.34, 0.04, 0.66), mat("#f4f6f7", { roughness: 0.3 }), 0.85, 0.88, -0.28);
    for (let x = -0.2; x < 2; x += 0.46) mesh(B(0.01, 0.7, 0.01), mat("#93a0a6"), x, 0.45, 0.035);

    // the analyser, its screen redrawn whenever the result changes
    const gAn = group(0.42, TOP, -0.33);
    mesh(B(0.72, 0.5, 0.48), mat("#e9edef", { roughness: 0.4 }), 0, 0.25, 0, gAn);
    mesh(B(0.72, 0.08, 0.5), mat("#0d6c72"), 0, 0.54, 0, gAn);
    mesh(B(0.3, 0.05, 0.16), mat("#cfd6da", { metalness: 0.4 }), -0.15, 0.6, 0.06, gAn);       // sample carousel
    for (let i = 0; i < 8; i++) mesh(C(0.008, 0.008, 0.06, 8), mat(i % 3 ? "#d4a017" : "#7b2fa1"), -0.27 + i * 0.034, 0.66, 0.06, gAn);
    const scr = document.createElement("canvas"); scr.width = 320; scr.height = 200;
    const scrTex = new THREE.CanvasTexture(scr); disposables.push(scrTex);
    mesh(B(0.3, 0.19, 0.004), mat("#ffffff", { map: scrTex, emissive: "#ffffff", emissiveIntensity: 0.3 }), 0.16, 0.36, 0.242, gAn).castShadow = false;
    reg("analyser", gAn);
    function drawScreen(sp, t = 0) {
      const c = scr.getContext("2d"), w = scr.width, h = scr.height, blink = Math.floor(t * 2) % 2 === 0;
      c.fillStyle = "#101a1c"; c.fillRect(0, 0, w, h);
      if (quiet) {      // nothing flagged: the analyser is just running
        c.fillStyle = "#45bfbd"; c.font = "700 16px monospace"; c.fillText("RUNNING · U&E BATCH", 12, 26);
        c.fillStyle = "#e5f1ef"; c.font = "800 40px monospace"; c.fillText("READY", 12, 90);
        c.font = "600 17px monospace"; c.fillText("Queue: 42 samples", 12, 130);
        scrTex.needsUpdate = true; return;
      }
      c.fillStyle = "#45bfbd"; c.font = "700 16px monospace"; c.fillText(sp?.qcFixed ? "RE-RUN · QC IN CONTROL" : "U&E · BONE PROFILE", 12, 26);
      c.fillStyle = "#e5f1ef"; c.font = "800 52px monospace"; c.fillText(`K+ ${sp ? sp.k.toFixed(1) : "--"}`, 12, 96);
      c.font = "600 17px monospace"; c.fillText("mmol/L", 222, 96);
      if (blink || reduced) { c.fillStyle = "#ff6b5f"; c.fillRect(12, 116, 200, 34); c.fillStyle = "#fff"; c.font = "800 20px monospace"; c.fillText("CRITICAL HIGH", 22, 140); }
      if (sp?.qcFail) { c.fillStyle = "#f0a55c"; c.font = "700 15px monospace"; c.fillText("QC: CHECK LEVEL 2", 12, 182); }
      scrTex.needsUpdate = true;
    }

    // the sample, spun, in a small rack in front of the analyser; a little
    // larger than life so the serum can be seen from the bench
    const gTube = group(0.88, TOP, -0.02);
    mesh(B(0.12, 0.012, 0.07), mat("#e8eef0"), 0, 0.006, 0, gTube); mesh(B(0.12, 0.012, 0.07), mat("#e8eef0"), 0, 0.07, 0, gTube);
    const R = 0.013, H = 0.12;
    mesh(C(R, R, H, 18), mat("#eef5f7", { roughness: 0.08, transparent: true, opacity: 0.4 }), 0, H / 2, 0, gTube);
    mesh(C(R * 0.9, R * 0.9, H * 0.42, 18), mat("#5a0c10", { roughness: 0.35 }), 0, 0.003 + H * 0.21, 0, gTube);
    mesh(C(R * 0.9, R * 0.9, H * 0.06, 18), mat("#ece6c8"), 0, 0.003 + H * 0.45, 0, gTube);
    const serumMat = mat("#e3b94f", { roughness: 0.3, transparent: true, opacity: 0.85 });
    mesh(C(R * 0.9, R * 0.9, H * 0.36, 18), serumMat, 0, 0.003 + H * 0.66, 0, gTube);
    mesh(C(R * 1.03, R * 1.03, H * 0.34, 18, true), mat("#ffffff", { side: THREE.DoubleSide }), 0, H * 0.3, R * 0.05, gTube);
    mesh(C(R * 1.15, R * 1.15, 0.028, 18), mat("#d4a017", { roughness: 0.4 }), 0, H + 0.013, 0, gTube);
    reg("tube", gTube, C(0.04, 0.04, 0.18), [0, 0.07, 0]);

    // QC material, beside the analyser
    const gVials = group(-0.08, TOP, -0.12);
    mesh(B(0.14, 0.05, 0.1), mat("#2f5d62"), 0, 0.025, 0, gVials);
    for (let i = 0; i < 4; i++) mesh(C(0.011, 0.011, 0.06, 10), mat(i < 2 ? "#f2c524" : "#b3261e"), -0.045 + i * 0.03, 0.08, 0, gVials);
    reg("qcvials", gVials, B(0.16, 0.13, 0.12), [0, 0.06, 0]);

    // today's QC chart, pinned to the wall
    const qcCan = document.createElement("canvas"); qcCan.width = 360; qcCan.height = 260;
    const qcTex = new THREE.CanvasTexture(qcCan); disposables.push(qcTex);
    const gQc = group(1.18, 1.4, -0.585);
    mesh(B(0.5, 0.36, 0.012), mat("#ffffff", { map: qcTex }), 0, 0, 0, gQc).castShadow = false;
    reg("qc", gQc, B(0.52, 0.38, 0.05));
    function drawQc(sp) {
      const c = qcCan.getContext("2d"), w = qcCan.width, h = qcCan.height;
      c.fillStyle = "#fffdf5"; c.fillRect(0, 0, w, h);
      c.fillStyle = "#1f2522"; c.font = "800 18px sans-serif"; c.fillText("QC · Potassium", 12, 24);
      const L1 = [0.3, -0.5, 0.8, -1.1, 0.2, 1.4, -0.6, 0.4, -0.2], L2 = [-0.4, 0.6, 1.1, -0.8, 0.2, -1.3, 0.5, 0.9, -0.1];
      const last = sp?.qcFail ? [1.6, 3.3] : [0.7, 0.3], fixed = sp?.qcFixed ? [-0.4, 0.6] : null;
      [[L1, "Level 1", last[0], fixed?.[0]], [L2, "Level 2", last[1], fixed?.[1]]].forEach(([pts, name, end, fx], k) => {
        const top = 40 + k * 110, mid = top + 50, sd = 14;
        c.fillStyle = "#4f5a57"; c.font = "600 12px sans-serif"; c.fillText(name, 12, top + 4);
        for (const [s, col] of [[0, "#1f2522"], [2, "#d68a2a"], [-2, "#d68a2a"], [3, "#c0392b"], [-3, "#c0392b"]]) { c.strokeStyle = col; c.lineWidth = s ? 1 : 1.5; c.setLineDash(Math.abs(s) === 2 ? [4, 3] : []); c.beginPath(); c.moveTo(70, mid - s * sd); c.lineTo(w - 12, mid - s * sd); c.stroke(); }
        c.setLineDash([]);
        const all = [...pts, end, ...(fx != null ? [fx] : [])], dx = (w - 100) / 11;
        c.strokeStyle = "#0d6c72"; c.lineWidth = 1.5; c.beginPath();
        all.forEach((p, i) => { const x = 80 + i * dx, y = mid - Math.max(-3.6, Math.min(3.6, p)) * sd; i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke();
        all.forEach((p, i) => { c.fillStyle = Math.abs(p) > 3 ? "#c0392b" : "#0d6c72"; c.beginPath(); c.arc(80 + i * dx, mid - Math.max(-3.6, Math.min(3.6, p)) * sd, 4, 0, 7); c.fill(); });
      });
      qcTex.needsUpdate = true;
    }

    // the centrifuge, the ELIMS terminal, the phone, the reagent fridge
    const gCf = group(1.12, TOP, -0.3);
    mesh(C(0.17, 0.18, 0.2, 24), mat("#dfe5e8"), 0, 0.1, 0, gCf); mesh(C(0.15, 0.15, 0.02, 24), mat("#8fa0a6", { metalness: 0.4 }), 0, 0.21, 0, gCf);
    reg("centrifuge", gCf);
    const gMon = group(1.5, TOP, -0.38);
    mesh(B(0.1, 0.02, 0.1), mat("#3d4448"), 0, 0.01, 0, gMon); mesh(C(0.015, 0.015, 0.2, 8), mat("#3d4448"), 0, 0.11, 0, gMon);
    mesh(B(0.46, 0.29, 0.03), mat("#1e2327"), 0, 0.34, 0, gMon);
    mesh(B(0.42, 0.25, 0.004), mat("#ffffff", { emissive: "#ffffff", emissiveIntensity: 0.25, map: canvasTex(300, 180, (c, w, h) => {
      c.fillStyle = "#f4f7f8"; c.fillRect(0, 0, w, h); c.fillStyle = "#0c7a69"; c.fillRect(0, 0, w, 30);
      c.fillStyle = "#fff"; c.font = "800 16px sans-serif"; c.fillText("ELIMS · Results", 10, 21);
      c.font = "600 12px monospace";
      ["Validation queue: 14", "Critical results: 1 to call", "Patient history  ·  Delta check"].forEach((t, i) => {
        c.fillStyle = i % 2 ? "#ffffff" : "#e8eef0"; c.fillRect(0, 36 + i * 30, w, 30); c.fillStyle = i === 1 ? "#b3261e" : "#2d3436"; c.fillText(t, 10, 56 + i * 30);
      });
    }) }), 0, 0.34, 0.017, gMon);
    reg("terminal", gMon);
    const gPhone = group(1.82, TOP, -0.12);
    mesh(B(0.17, 0.05, 0.2), mat("#2b3034"), 0, 0.025, 0, gPhone); mesh(B(0.05, 0.035, 0.21), mat("#1b1f22"), -0.05, 0.065, 0, gPhone);
    for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) mesh(B(0.022, 0.006, 0.022), mat("#cfd6da"), 0.03 + k * 0.028, 0.053, -0.05 + r * 0.035, gPhone);
    reg("phone", gPhone, B(0.22, 0.12, 0.24), [0, 0.05, 0]);
    const gFr = group(2.3, 0, -0.3);
    mesh(B(0.6, 1.7, 0.55), mat("#f1f4f5", { roughness: 0.35 }), 0, 0.85, 0, gFr); mesh(B(0.03, 0.4, 0.03), mat("#9aa6ab", { metalness: 0.5 }), -0.24, 1.15, 0.29, gFr);
    reg("fridge", gFr);

    if (quiet) { drawScreen(null); drawQc(null); }
    return { serumMat, drawScreen, drawQc, phonePos: new THREE.Vector3(1.82, TOP + 0.3, -0.12) };
  }

  // ── a blood spill on the chemistry lab floor ──
  // The smashed tube in front of the bench, the spill trolley, the clinical waste
  // bin, and the hand basin with the eyewash beside it.
  function buildSpill() {
    const gSpill = group(0.7, 0.002, 0.6);
    const pool = group(0, 0, 0, gSpill), bloodM = mat("#5e0b10", { roughness: 0.15, metalness: 0.1 });
    for (const [x, z, r, sx] of [[0, 0, 0.16, 1.3], [0.14, 0.06, 0.09, 1], [-0.12, -0.05, 0.08, 1.2], [0.05, -0.1, 0.07, 1], [0.28, 0.14, 0.03, 1], [-0.25, 0.12, 0.025, 1], [0.2, -0.2, 0.02, 1]])
      mesh(C(r, r, 0.003, 20), bloodM, x, 0, z, pool).scale.x = sx;
    const glass = group(0, 0, 0, gSpill), glassM = mat("#e8f2f5", { roughness: 0.05, transparent: true, opacity: 0.6 });
    for (let i = 0; i < 9; i++) mesh(B(0.012 + (i % 3) * 0.008, 0.004, 0.02 + (i % 2) * 0.012), glassM, Math.cos(i * 2.3) * 0.12 * (0.4 + (i % 3) * 0.3), 0.004, Math.sin(i * 2.3) * 0.1 * (0.4 + (i % 4) * 0.25), glass).rotation.y = i * 0.9;
    const half = group(0.1, 0.012, 0.04, glass); half.rotation.set(0, 0.6, Math.PI / 2);      // the top of the tube, gold cap still on
    mesh(C(0.011, 0.011, 0.05, 14), glassM, 0, 0, 0, half); mesh(C(0.0125, 0.0125, 0.024, 14), mat("#d4a017", { roughness: 0.4 }), 0, 0.035, 0, half);
    const paper = group(0, 0, 0, gSpill); paper.visible = false;
    for (const [x, z, ry] of [[-0.1, -0.06, 0.2], [0.1, 0.04, -0.15], [0, 0.1, 0.5], [-0.08, 0.12, -0.3], [0.12, -0.1, 0.1]]) mesh(B(0.2, 0.006, 0.2), mat("#f6f6f0", { roughness: 0.95 }), x, 0.008, z, paper).rotation.y = ry;
    const sheen = mesh(C(0.32, 0.32, 0.002, 28), mat("#cfe0e2", { roughness: 0.05, transparent: true, opacity: 0.45 }), 0, 0, 0, gSpill); sheen.scale.x = 1.3; sheen.visible = false;
    reg("spill", gSpill, B(0.6, 0.06, 0.5), [0, 0.03, 0]);

    // the warning sign, standing by the trolley until it is put out
    const signTex = canvasTex(150, 300, (c, w) => {
      c.fillStyle = "#f2c524"; c.fillRect(0, 0, w, 300); c.fillStyle = "#1f2522";
      c.beginPath(); c.moveTo(w / 2, 26); c.lineTo(w - 22, 128); c.lineTo(22, 128); c.closePath(); c.fill();
      c.fillStyle = "#f2c524"; c.font = "900 64px sans-serif"; c.fillText("!", w / 2 - 10, 118);
      c.fillStyle = "#1f2522"; c.font = "800 25px sans-serif"; ["CAUTION", "BLOOD", "SPILL", "KEEP", "CLEAR"].forEach((t, i) => c.fillText(t, 16, 172 + i * 26));
    });
    const gSign = group(-1.2, 0, 1.0), SIGN_AT = [0.38, 0, 0.2];
    for (const s of [-1, 1]) { const pnl = group(0, 0.6, 0, gSign); pnl.rotation.x = s * 0.2; mesh(B(0.3, 0.6, 0.012), mat("#ffffff", { map: signTex }), 0, -0.3, 0, pnl); }
    gSign.rotation.y = 0.5;
    reg("sign", gSign);

    // the spill trolley
    const T2 = 0.8, steel = mat("#aab4b8", { metalness: 0.55, roughness: 0.35 });
    mesh(B(0.9, 0.03, 0.46), mat("#e4e9eb"), -0.7, T2 - 0.015, 0.5); mesh(B(0.9, 0.03, 0.46), mat("#e4e9eb"), -0.7, 0.25, 0.5);
    for (const x of [-1.12, -0.28]) for (const z of [0.3, 0.7]) mesh(C(0.012, 0.012, T2, 8), steel, x, T2 / 2, z);
    const gKit = group(-0.98, T2, 0.38);
    mesh(B(0.24, 0.13, 0.17), mat("#f2c524"), 0, 0.065, 0, gKit);
    mesh(B(0.2, 0.07, 0.002), mat("#ffffff", { map: canvasTex(200, 70, (c) => { c.fillStyle = "#c0392b"; c.fillRect(0, 0, 200, 70); c.fillStyle = "#fff"; c.font = "800 22px sans-serif"; c.fillText("BIOHAZARD", 34, 30); c.fillText("SPILL KIT", 44, 58); }) }), 0, 0.07, 0.086, gKit).castShadow = false;
    const lid = group(0, 0.13, -0.085, gKit);
    mesh(B(0.25, 0.02, 0.18), mat("#e0b320"), 0, 0.01, 0.09, lid);
    reg("spillkit", gKit);
    const gGlv = group(-0.72, T2, 0.38);
    mesh(B(0.2, 0.09, 0.11), mat("#3a7bd5"), 0, 0.045, 0, gGlv); mesh(B(0.08, 0.012, 0.035), mat("#9fd0ff"), 0, 0.092, 0, gGlv);
    reg("gloves", gGlv);
    const gApron = group(-0.52, T2, 0.38);
    mesh(B(0.15, 0.03, 0.12), mat("#e6eef5", { roughness: 0.3 }), 0, 0.015, 0, gApron); mesh(B(0.15, 0.004, 0.02), mat("#9fb8cc"), 0, 0.032, 0.03, gApron);
    reg("apron", gApron, B(0.17, 0.06, 0.14), [0, 0.03, 0]);
    const gGog = group(-0.36, T2 + 0.03, 0.4);
    mesh(B(0.13, 0.045, 0.01), mat("#cfe7f2", { roughness: 0.05, transparent: true, opacity: 0.7 }), 0, 0, 0.03, gGog);
    for (const s of [-1, 1]) mesh(B(0.006, 0.02, 0.07), mat("#2c3e50"), s * 0.065, 0, -0.005, gGog);
    reg("goggles", gGog, B(0.16, 0.07, 0.1));
    // four bottles, each with its strength on the label
    for (const [i, [id, col, txt]] of [["bleach1", "#c0392b", "1%"], ["bleach05", "#d9822b", "0.5%"], ["bleach01", "#2f86d6", "0.1%"], ["alcohol", "#2e8b57", "70%"]].entries()) {
      const g = group(-1.1 + i * 0.065, T2, 0.62);
      mesh(C(0.026, 0.028, 0.16, 16), mat("#f4f6f7", { roughness: 0.3 }), 0, 0.08, 0, g);
      mesh(C(0.0285, 0.0285, 0.07, 16, true), mat("#ffffff", { side: THREE.DoubleSide, map: canvasTex(128, 64, (c) => { c.fillStyle = col; c.fillRect(0, 0, 128, 64); c.fillStyle = "#fff"; c.font = "900 34px sans-serif"; c.fillText(txt, 64 - c.measureText(txt).width / 2, 46); }) }), 0, 0.08, 0, g);
      mesh(C(0.012, 0.014, 0.03, 12), mat(col, { roughness: 0.4 }), 0, 0.175, 0, g);
      if (id === "alcohol") mesh(B(0.012, 0.03, 0.03), mat(col), 0, 0.19, 0.018, g);
      reg(id, g, C(0.032, 0.032, 0.22), [0, 0.1, 0]);
    }
    const gPaper = group(-0.78, T2, 0.62);
    for (let i = 0; i < 6; i++) mesh(B(0.16, 0.008, 0.14), mat(i % 2 ? "#f6f6f0" : "#ecece4"), 0, 0.004 + i * 0.009, 0, gPaper).rotation.y = i * 0.03;
    reg("paper", gPaper, B(0.18, 0.07, 0.16), [0, 0.03, 0]);
    const gFor = group(-0.6, T2, 0.62);
    mesh(B(0.09, 0.006, 0.07), mat("#cfd6da", { metalness: 0.4 }), 0, 0.004, 0, gFor); mesh(B(0.02, 0.012, 0.06), mat("#cfd6da", { metalness: 0.4 }), 0, 0.01, 0.06, gFor);
    for (const s of [-1, 1]) mesh(B(0.006, 0.006, 0.14), mat("#d7dde0", { metalness: 0.8, roughness: 0.2 }), 0.07 + s * 0.006, 0.006, 0, gFor).rotation.y = s * 0.04;
    reg("forceps", gFor, B(0.16, 0.05, 0.16), [0.02, 0.02, 0.02]);
    const gSharps = group(-0.4, T2, 0.62);
    mesh(B(0.13, 0.16, 0.12), mat("#f2c524"), 0, 0.08, 0, gSharps); mesh(B(0.14, 0.03, 0.13), mat("#c0392b"), 0, 0.175, 0, gSharps); mesh(B(0.07, 0.005, 0.025), mat("#2b1414"), 0, 0.192, 0, gSharps);
    reg("sharps", gSharps);

    // the clinical waste bin, and the basin with the eyewash beside it
    const gBin = group(-0.05, 0, 0.42);
    mesh(C(0.14, 0.12, 0.46, 20), mat("#f2c524"), 0, 0.23, 0, gBin); mesh(C(0.15, 0.15, 0.03, 20), mat("#d9ae14"), 0, 0.475, 0, gBin);
    mesh(B(0.14, 0.1, 0.002), mat("#ffffff", { map: canvasTex(140, 100, (c) => { c.fillStyle = "#f2c524"; c.fillRect(0, 0, 140, 100); c.fillStyle = "#1f2522"; c.font = "800 19px sans-serif"; c.fillText("CLINICAL", 22, 40); c.fillText("WASTE", 34, 68); }) }), 0, 0.3, 0.135, gBin).castShadow = false;
    reg("biobag", gBin);
    const gSink = group(-1.38, 0, -0.25);
    mesh(C(0.05, 0.07, 0.78, 12), mat("#f4f6f7"), 0, 0.39, 0, gSink); mesh(B(0.38, 0.12, 0.32), mat("#f4f6f7", { roughness: 0.2 }), 0, 0.84, 0, gSink);
    mesh(B(0.3, 0.02, 0.24), mat("#c9d6da", { roughness: 0.1 }), 0, 0.895, 0, gSink);
    mesh(C(0.012, 0.012, 0.16, 8), steel, -0.15, 0.98, 0, gSink); mesh(C(0.01, 0.01, 0.1, 8), steel, -0.1, 1.05, 0, gSink).rotation.z = Math.PI / 2;
    mesh(B(0.01, 0.22, 0.32), mat("#ffffff", { map: canvasTex(160, 110, (c) => { c.fillStyle = "#2e8b57"; c.fillRect(0, 0, 160, 110); c.fillStyle = "#fff"; c.font = "800 26px sans-serif"; c.fillText("EYEWASH", 20, 48); c.font = "600 15px sans-serif"; c.fillText("Flush 15 minutes", 22, 80); }) }), -0.2, 1.35, 0, gSink).castShadow = false;
    reg("sink", gSink);

    // Draw what has been done: the sign out, the kit open, PPE worn, the spill
    // covered and wet with disinfectant, the glass gone, the floor wiped.
    function show(v) {
      const used = v.specimen?.used || [], has = (k) => used.includes(k), n = used.filter((k) => k === "bleach").length;
      if (has("sign")) { gSign.position.set(...SIGN_AT); gSign.rotation.y = 0.35; } else { gSign.position.set(-1.2, 0, 1.0); gSign.rotation.y = 0.5; }
      lid.rotation.x = has("spillkit") ? -1.9 : 0;
      gApron.visible = !has("apron"); gGog.visible = !has("goggles");
      paper.visible = has("paper") && !has("biobag");
      paper.traverse((o) => { if (o.isMesh) o.material.color.set(n ? "#e7d9b6" : "#f6f6f0"); });
      glass.visible = !has("forceps"); pool.visible = !has("biobag"); sheen.visible = n >= 2;
    }
    return { show };
  }

  // ── the haematology bench ──
  // The analyser reporting the count, the EDTA sample in front of it, a slide box
  // and spreader, the staining rack over its sink, the microscope, the QC chart,
  // the ELIMS terminal and the phone. A colleague stands at the end of the bench.
  function buildHaematology() {
    mesh(B(9, 3, 0.05), mat("#eef2ef"), 0.8, 1.5, -0.62);
    mesh(B(9, 1.1, 0.02), mat("#d3e2de", { roughness: 0.4 }), 0.8, 0.55, -0.59);
    mesh(B(0.05, 3, 6), mat("#e8edea"), -1.6, 1.5, 2.3);
    mesh(B(0.05, 3, 6), mat("#e8edea"), 3.2, 1.5, 2.3);
    mesh(B(1.4, 0.26, 0.01), mat("#ffffff", { map: canvasTex(560, 104, (c, w, h) => {
      c.fillStyle = "#6b3fa0"; c.fillRect(0, 0, w, h); c.fillStyle = "#fff";
      c.font = "800 44px sans-serif"; c.fillText("HAEMATOLOGY", 22, 58);
      c.font = "600 21px sans-serif"; c.fillText("When the count surprises you, look at a film", 24, 90);
    }) }), 0.0, 2.2, -0.59).castShadow = false;

    // the bench
    mesh(B(2.9, 0.86, 0.62), mat("#c3ccd0"), 1.15, 0.43, -0.28);
    mesh(B(2.94, 0.04, 0.66), mat("#f4f6f7", { roughness: 0.3 }), 1.15, 0.88, -0.28);
    for (let x = -0.2; x < 2.6; x += 0.46) mesh(B(0.01, 0.7, 0.01), mat("#93a0a6"), x, 0.45, 0.035);

    // the analyser, its screen redrawn from the run
    const gAn = group(0.42, TOP, -0.33);
    mesh(B(0.62, 0.52, 0.46), mat("#e9edef", { roughness: 0.4 }), 0, 0.26, 0, gAn);
    mesh(B(0.62, 0.06, 0.48), mat("#6b3fa0"), 0, 0.55, 0, gAn);
    mesh(B(0.12, 0.08, 0.06), mat("#cfd6da", { metalness: 0.4 }), -0.2, 0.18, 0.24, gAn);           // the sample probe
    mesh(C(0.004, 0.004, 0.07, 6), mat("#d7dde0", { metalness: 0.9 }), -0.2, 0.11, 0.25, gAn);
    const scr = document.createElement("canvas"); scr.width = 320; scr.height = 200;
    const scrTex = new THREE.CanvasTexture(scr); disposables.push(scrTex);
    mesh(B(0.3, 0.19, 0.004), mat("#ffffff", { map: scrTex, emissive: "#ffffff", emissiveIntensity: 0.3 }), 0.1, 0.36, 0.232, gAn).castShadow = false;
    reg("analyser", gAn);
    function drawScreen(sp, t = 0) {
      const c = scr.getContext("2d"), w = scr.width, h = scr.height, blink = Math.floor(t * 2) % 2 === 0;
      c.fillStyle = "#101a1c"; c.fillRect(0, 0, w, h);
      if (sp && sp.plt == null) {       // nothing flagged in this practical: the analyser is just running
        c.fillStyle = "#b99be0"; c.font = "700 16px monospace"; c.fillText("FBC · RUNNING", 12, 26);
        c.fillStyle = "#e5f1ef"; c.font = "800 40px monospace"; c.fillText("READY", 12, 90);
        c.font = "600 17px monospace"; c.fillText("Queue: 18 samples", 12, 130);
        scrTex.needsUpdate = true; return;
      }
      c.fillStyle = "#b99be0"; c.font = "700 16px monospace"; c.fillText("FBC · CBC+DIFF", 12, 26);
      c.fillStyle = "#e5f1ef"; c.font = "800 52px monospace"; c.fillText(`PLT ${sp?.plt ?? "--"}`, 12, 96);
      c.font = "600 15px monospace"; c.fillText("x10^9/L", 232, 96);
      if (blink || reduced) { c.fillStyle = "#ff6b5f"; c.fillRect(12, 116, 200, 34); c.fillStyle = "#fff"; c.font = "800 20px monospace"; c.fillText("CRITICAL LOW", 26, 140); }
      c.fillStyle = "#f0a55c"; c.font = "700 15px monospace"; c.fillText("Flags: see results", 12, 182);
      scrTex.needsUpdate = true;
    }

    // the sample: whole blood in a purple-top EDTA tube
    const gTube = group(0.85, TOP, -0.02);
    mesh(B(0.12, 0.012, 0.07), mat("#e8eef0"), 0, 0.006, 0, gTube); mesh(B(0.12, 0.012, 0.07), mat("#e8eef0"), 0, 0.07, 0, gTube);
    const R = 0.013, H = 0.12;
    mesh(C(R, R, H, 18), mat("#eef5f7", { roughness: 0.08, transparent: true, opacity: 0.4 }), 0, H / 2, 0, gTube);
    mesh(C(R * 0.9, R * 0.9, H * 0.7, 18), mat("#6a0d13", { roughness: 0.3 }), 0, 0.003 + H * 0.35, 0, gTube);
    mesh(C(R * 1.03, R * 1.03, H * 0.34, 18, true), mat("#ffffff", { side: THREE.DoubleSide }), 0, H * 0.45, R * 0.05, gTube);
    mesh(C(R * 1.15, R * 1.15, 0.028, 18), mat("#7b2fa1", { roughness: 0.4 }), 0, H + 0.013, 0, gTube);
    reg("tube", gTube, C(0.04, 0.04, 0.18), [0, 0.07, 0]);

    // QC material, beside the analyser
    const gVials = group(-0.08, TOP, -0.12);
    mesh(B(0.14, 0.05, 0.1), mat("#2f5d62"), 0, 0.025, 0, gVials);
    for (let i = 0; i < 3; i++) mesh(C(0.011, 0.011, 0.06, 10), mat("#7b2fa1"), -0.035 + i * 0.035, 0.08, 0, gVials);
    reg("qcvials", gVials, B(0.16, 0.13, 0.12), [0, 0.06, 0]);

    // slides and the spreader; the film appears on them once made
    const gSl = group(1.08, TOP, -0.02);
    mesh(B(0.14, 0.03, 0.09), mat("#dfe6e8"), 0, 0.015, 0, gSl);
    for (let i = 0; i < 4; i++) mesh(B(0.075, 0.002, 0.026), mat("#eef7fa", { transparent: true, opacity: 0.8 }), 0, 0.032 + i * 0.002, -0.02 + i * 0.002, gSl);
    const film = mesh(B(0.075, 0.003, 0.026), mat("#eef7fa", { transparent: true, opacity: 0.85 }), 0.0, 0.004, 0.08, gSl);
    const smear = mesh(B(0.045, 0.001, 0.02), mat("#c46a73"), -0.008, 0.006, 0.08, gSl);
    mesh(B(0.075, 0.003, 0.026), mat("#eef7fa", { transparent: true, opacity: 0.85 }), 0.1, 0.004, 0.06, gSl).rotation.y = 0.5;   // the spreader
    reg("slides", gSl, B(0.24, 0.06, 0.18), [0.03, 0.02, 0.04]);

    // the staining rack over its sink, with the stain and the buffer
    const gSt = group(1.45, TOP, -0.25);
    mesh(B(0.42, 0.04, 0.3), mat("#59656b", { roughness: 0.3 }), 0, 0.02, 0, gSt);
    for (const z of [-0.05, 0.05]) mesh(B(0.38, 0.012, 0.012), mat("#cfd6da", { metalness: 0.6 }), 0, 0.07, z, gSt);
    const stained = mesh(B(0.075, 0.003, 0.026), mat("#8e4a9c"), 0.05, 0.08, 0, gSt);
    for (const [x, col, cap] of [[-0.25, "#4b2a7a", "#2b1640"], [-0.32, "#e9f3f7", "#2f86d6"]]) {
      mesh(C(0.028, 0.03, 0.15, 14), mat(col, { roughness: 0.25 }), x, 0.075, 0.1, gSt); mesh(C(0.012, 0.014, 0.03, 10), mat(cap), x, 0.165, 0.1, gSt);
    }
    mesh(C(0.01, 0.01, 0.2, 8), mat("#aab4b8", { metalness: 0.6 }), 0.17, 0.12, -0.12, gSt);
    reg("stain", gSt, B(0.5, 0.2, 0.34), [-0.05, 0.08, 0]);

    // the microscope
    const gMic = group(1.98, TOP, -0.25);
    const black = mat("#2a3034", { roughness: 0.5 }), ivory = mat("#eceae4", { roughness: 0.4 });
    mesh(B(0.2, 0.04, 0.26), ivory, 0, 0.02, 0, gMic);
    mesh(B(0.06, 0.34, 0.08), ivory, 0, 0.19, -0.09, gMic);
    mesh(B(0.17, 0.014, 0.15), black, 0, 0.15, 0.02, gMic);
    const onStage = mesh(B(0.075, 0.003, 0.026), mat("#8e4a9c"), 0, 0.159, 0.03, gMic);
    mesh(C(0.035, 0.035, 0.03, 16), black, 0, 0.27, 0.02, gMic);
    for (const [x, z] of [[-0.02, 0.0], [0.02, 0.01], [0, 0.04]]) mesh(C(0.009, 0.007, 0.06, 10), mat("#cfd6da", { metalness: 0.7 }), x, 0.22, z + 0.01, gMic);
    const head = group(0, 0.36, -0.03, gMic); head.rotation.x = 0.5;
    mesh(B(0.1, 0.05, 0.1), ivory, 0, 0, 0, head);
    for (const s of [-1, 1]) mesh(C(0.012, 0.012, 0.08, 12), black, s * 0.025, 0.05, 0.03, head);
    for (const s of [-1, 1]) mesh(C(0.03, 0.03, 0.02, 14), black, s * 0.04, 0.15, -0.09, gMic).rotation.z = Math.PI / 2;
    mesh(C(0.02, 0.02, 0.01, 12), mat("#fff7d6", { emissive: "#fff2b0", emissiveIntensity: 0.6 }), 0, 0.045, 0.02, gMic);
    reg("microscope", gMic, B(0.24, 0.5, 0.3), [0, 0.22, 0]);

    // today's QC chart on the wall, ELIMS, the phone, the fridge
    const gQc = group(1.0, 1.4, -0.585);
    mesh(B(0.5, 0.36, 0.012), mat("#ffffff", { map: canvasTex(360, 260, (c, w, h) => {
      c.fillStyle = "#fffdf5"; c.fillRect(0, 0, w, h);
      c.fillStyle = "#1f2522"; c.font = "800 18px sans-serif"; c.fillText("QC · Platelets", 12, 24);
      [[0.4, -0.6, 0.9, -0.2, 1.1, -0.8, 0.3, 0.6, -0.4, 0.2], [-0.3, 0.5, -1, 0.7, 0.1, -0.5, 1.2, -0.2, 0.4, -0.6], [0.6, -0.2, 0.3, -1.1, 0.8, 0.2, -0.4, 0.9, -0.7, 0.5]].forEach((pts, k) => {
        const mid = 62 + k * 72, sd = 9;
        c.fillStyle = "#4f5a57"; c.font = "600 12px sans-serif"; c.fillText(`Level ${k + 1}`, 12, mid + 4);
        for (const [s, col] of [[0, "#1f2522"], [2, "#d68a2a"], [-2, "#d68a2a"], [3, "#c0392b"], [-3, "#c0392b"]]) { c.strokeStyle = col; c.lineWidth = 1; c.beginPath(); c.moveTo(70, mid - s * sd); c.lineTo(w - 12, mid - s * sd); c.stroke(); }
        c.strokeStyle = "#6b3fa0"; c.lineWidth = 1.5; c.beginPath();
        pts.forEach((p, i) => { const x = 80 + i * 27, y = mid - p * sd; i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke();
        pts.forEach((p, i) => { c.fillStyle = "#6b3fa0"; c.beginPath(); c.arc(80 + i * 27, mid - p * sd, 3.5, 0, 7); c.fill(); });
      });
    }) }), 0, 0, 0, gQc).castShadow = false;
    reg("qc", gQc, B(0.52, 0.38, 0.05));
    const gMon = group(2.42, TOP, -0.38);
    mesh(B(0.1, 0.02, 0.1), mat("#3d4448"), 0, 0.01, 0, gMon); mesh(C(0.015, 0.015, 0.2, 8), mat("#3d4448"), 0, 0.11, 0, gMon);
    mesh(B(0.46, 0.29, 0.03), mat("#1e2327"), 0, 0.34, 0, gMon);
    mesh(B(0.42, 0.25, 0.004), mat("#ffffff", { emissive: "#ffffff", emissiveIntensity: 0.25, map: canvasTex(300, 180, (c, w) => {
      c.fillStyle = "#f4f7f8"; c.fillRect(0, 0, w, 180); c.fillStyle = "#0c7a69"; c.fillRect(0, 0, w, 30);
      c.fillStyle = "#fff"; c.font = "800 16px sans-serif"; c.fillText("ELIMS · Haematology", 10, 21);
      c.font = "600 12px monospace";
      ["Validation queue: 9", "Critical results: 1 to call", "Patient history  ·  Delta check"].forEach((t, i) => {
        c.fillStyle = i % 2 ? "#ffffff" : "#e8eef0"; c.fillRect(0, 36 + i * 30, w, 30); c.fillStyle = i === 1 ? "#b3261e" : "#2d3436"; c.fillText(t, 10, 56 + i * 30);
      });
    }) }), 0, 0.34, 0.017, gMon);
    reg("terminal", gMon);
    const gPhone = group(2.62, TOP, -0.08);
    mesh(B(0.17, 0.05, 0.2), mat("#2b3034"), 0, 0.025, 0, gPhone); mesh(B(0.05, 0.035, 0.21), mat("#1b1f22"), -0.05, 0.065, 0, gPhone);
    for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) mesh(B(0.022, 0.006, 0.022), mat("#cfd6da"), 0.03 + k * 0.028, 0.053, -0.05 + r * 0.035, gPhone);
    reg("phone", gPhone, B(0.22, 0.12, 0.24), [0, 0.05, 0]);
    const gFr = group(2.95, 0, 0.2);
    mesh(B(0.45, 1.7, 0.55), mat("#f1f4f5", { roughness: 0.35 }), 0, 0.85, 0, gFr); mesh(B(0.03, 0.4, 0.03), mat("#9aa6ab", { metalness: 0.5 }), -0.24, 1.15, 0.29, gFr);
    reg("fridge", gFr);

    // The film appears as it is made: spread on a slide, then on the staining
    // rack, then on the microscope stage.
    function show(sp) {
      const used = sp?.used || [], spread = used.includes("slides"), dyed = used.includes("stain"), onScope = used.includes("microscope");
      film.visible = smear.visible = spread && !dyed;
      stained.visible = dyed && !onScope;
      onStage.visible = onScope;
    }
    return { drawScreen, show, phonePos: new THREE.Vector3(2.62, TOP + 0.3, -0.08) };
  }

  // ── the blood bank ──
  // The sample and the grouping tile on the bench, gel cards and their
  // centrifuge, the glass-fronted blood fridge, ELIMS, the phone, and the issue
  // register by the hatch where the porter collects.
  function buildBloodBank() {
    mesh(B(9, 3, 0.05), mat("#eef2ef"), 0.5, 1.5, -0.62);
    mesh(B(9, 1.1, 0.02), mat("#e6d9da", { roughness: 0.4 }), 0.5, 0.55, -0.59);
    mesh(B(0.05, 3, 6), mat("#e8edea"), -1.6, 1.5, 2.3);
    mesh(B(0.05, 3, 6), mat("#e8edea"), 2.9, 1.5, 2.3);
    mesh(B(1.4, 0.26, 0.01), mat("#ffffff", { map: canvasTex(560, 104, (c, w, h) => {
      c.fillStyle = "#9b1c2e"; c.fillRect(0, 0, w, h); c.fillStyle = "#fff";
      c.font = "800 44px sans-serif"; c.fillText("BLOOD BANK", 22, 58);
      c.font = "600 21px sans-serif"; c.fillText("Right blood, right patient, every time", 24, 90);
    }) }), 0.1, 2.2, -0.59).castShadow = false;

    // the bench
    mesh(B(2.3, 0.86, 0.62), mat("#c3ccd0"), 0.85, 0.43, -0.28);
    mesh(B(2.34, 0.04, 0.66), mat("#f4f6f7", { roughness: 0.3 }), 0.85, 0.88, -0.28);
    for (let x = -0.2; x < 2; x += 0.46) mesh(B(0.01, 0.7, 0.01), mat("#93a0a6"), x, 0.45, 0.035);

    // the phone and the issue register, by the hatch end of the bench
    const gPhone = group(-0.16, TOP, -0.08);
    mesh(B(0.17, 0.05, 0.2), mat("#2b3034"), 0, 0.025, 0, gPhone); mesh(B(0.05, 0.035, 0.21), mat("#1b1f22"), -0.05, 0.065, 0, gPhone);
    for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) mesh(B(0.022, 0.006, 0.022), mat("#cfd6da"), 0.03 + k * 0.028, 0.053, -0.05 + r * 0.035, gPhone);
    reg("phone", gPhone, B(0.22, 0.12, 0.24), [0, 0.05, 0]);
    const gReg = group(0.1, TOP, -0.34);
    mesh(B(0.26, 0.03, 0.2), mat("#1f3b63"), 0, 0.015, 0, gReg); mesh(B(0.24, 0.004, 0.18), mat("#fbf7ec"), 0, 0.032, 0, gReg);
    reg("register", gReg, B(0.28, 0.06, 0.22), [0, 0.02, 0]);

    // the sample
    const gTube = group(0.36, TOP, -0.05);
    mesh(B(0.12, 0.012, 0.07), mat("#e8eef0"), 0, 0.006, 0, gTube); mesh(B(0.12, 0.012, 0.07), mat("#e8eef0"), 0, 0.07, 0, gTube);
    const R = 0.013, H = 0.12;
    mesh(C(R, R, H, 18), mat("#eef5f7", { roughness: 0.08, transparent: true, opacity: 0.4 }), 0, H / 2, 0, gTube);
    mesh(C(R * 0.9, R * 0.9, H * 0.7, 18), mat("#6a0d13", { roughness: 0.3 }), 0, 0.003 + H * 0.35, 0, gTube);
    mesh(C(R * 1.03, R * 1.03, H * 0.34, 18, true), mat("#ffffff", { side: THREE.DoubleSide }), 0, H * 0.45, R * 0.05, gTube);
    mesh(C(R * 1.15, R * 1.15, 0.028, 18), mat("#e87ca0", { roughness: 0.4 }), 0, H + 0.013, 0, gTube);
    reg("tube", gTube, C(0.04, 0.04, 0.18), [0, 0.07, 0]);

    // the grouping tile: five wells, forward then reverse
    const gTile = group(0.72, TOP, -0.08);
    mesh(B(0.34, 0.014, 0.14), mat("#fbfbf8", { roughness: 0.2 }), 0, 0.007, 0, gTile);
    for (let i = 0; i < 5; i++) mesh(C(0.024, 0.024, 0.004, 20), mat(i < 3 ? "#d98b92" : "#e9b5ad"), -0.13 + i * 0.065, 0.016, 0, gTile);
    reg("tile", gTile, B(0.36, 0.06, 0.16), [0, 0.02, 0]);

    // gel cards in their rack, and the centrifuge they spin in
    const gGel = group(1.1, TOP, -0.2);
    mesh(B(0.2, 0.03, 0.08), mat("#59656b"), 0, 0.015, 0, gGel);
    for (let i = 0; i < 5; i++) mesh(B(0.006, 0.07, 0.05), mat("#f4f6f7", { roughness: 0.3 }), -0.08 + i * 0.04, 0.065, 0, gGel);
    reg("gelcard", gGel, B(0.22, 0.12, 0.1), [0, 0.05, 0]);
    const gCf = group(1.45, TOP, -0.3);
    mesh(C(0.15, 0.16, 0.18, 24), mat("#dfe5e8"), 0, 0.09, 0, gCf); mesh(C(0.13, 0.13, 0.02, 24), mat("#8fa0a6", { metalness: 0.4 }), 0, 0.19, 0, gCf);
    reg("centrifuge", gCf);

    // ELIMS
    const gMon = group(1.85, TOP, -0.38);
    mesh(B(0.1, 0.02, 0.1), mat("#3d4448"), 0, 0.01, 0, gMon); mesh(C(0.015, 0.015, 0.2, 8), mat("#3d4448"), 0, 0.11, 0, gMon);
    mesh(B(0.46, 0.29, 0.03), mat("#1e2327"), 0, 0.34, 0, gMon);
    mesh(B(0.42, 0.25, 0.004), mat("#ffffff", { emissive: "#ffffff", emissiveIntensity: 0.25, map: canvasTex(300, 180, (c, w) => {
      c.fillStyle = "#f4f7f8"; c.fillRect(0, 0, w, 180); c.fillStyle = "#0c7a69"; c.fillRect(0, 0, w, 30);
      c.fillStyle = "#fff"; c.font = "800 16px sans-serif"; c.fillText("ELIMS · Blood bank", 10, 21);
      c.font = "600 12px monospace";
      ["Crossmatch requests: 1 urgent", "Group history · antibody screen", "Issue register · stock"].forEach((t, i) => {
        c.fillStyle = i % 2 ? "#ffffff" : "#e8eef0"; c.fillRect(0, 36 + i * 30, w, 30); c.fillStyle = i === 0 ? "#b3261e" : "#2d3436"; c.fillText(t, 10, 56 + i * 30);
      });
    }) }), 0, 0.34, 0.017, gMon);
    reg("terminal", gMon);

    // the blood fridge: glass door, shelves of units, labelled by group
    const gFr = group(2.45, 0, -0.25);
    mesh(B(0.66, 1.8, 0.56), mat("#3c4448", { roughness: 0.4 }), 0, 0.9, 0, gFr);
    mesh(B(0.58, 1.6, 0.01), mat("#cfe6f2", { roughness: 0.05, transparent: true, opacity: 0.35 }), 0, 0.95, 0.285, gFr);
    const bagCol = ["#f2c524", "#e98aa8", "#5b8fd6", "#f4f6f7"];
    for (let s = 0; s < 4; s++) {
      mesh(B(0.56, 0.01, 0.5), mat("#aab4b8", { metalness: 0.5 }), 0, 0.35 + s * 0.38, 0, gFr);
      for (let k = 0; k < 5; k++) {
        const bag = group(-0.22 + k * 0.11, 0.36 + s * 0.38, 0.05, gFr);
        mesh(B(0.08, 0.13, 0.03), mat("#8d1420", { roughness: 0.3 }), 0, 0.065, 0, bag);
        mesh(B(0.05, 0.03, 0.002), mat(bagCol[(s + k) % 4]), 0, 0.09, 0.016, bag);
      }
    }
    mesh(B(0.2, 0.06, 0.004), mat("#ffffff", { map: canvasTex(160, 48, (c) => { c.fillStyle = "#101a1c"; c.fillRect(0, 0, 160, 48); c.fillStyle = "#45bfbd"; c.font = "800 30px monospace"; c.fillText("4.1 °C", 18, 35); }) }), 0, 1.72, 0.285, gFr).castShadow = false;
    reg("fridge", gFr, B(0.7, 1.8, 0.6), [0, 0.9, 0]);

    // Two units come out for the crossmatch, and sit on the bench.
    const units = group(0.95, TOP, 0.0); units.visible = false;
    for (const x of [-0.05, 0.05]) { mesh(B(0.08, 0.02, 0.13), mat("#8d1420", { roughness: 0.3 }), x, 0.01, 0, units); mesh(B(0.05, 0.003, 0.04), mat("#ffffff"), x, 0.022, 0.03, units); }
    function show(sp) { units.visible = (sp?.used || []).includes("fridge"); }
    return { show, phonePos: new THREE.Vector3(-0.16, TOP + 0.3, -0.08) };
  }

  const ph = kind === "phlebotomy" ? buildPhlebotomy() : null;
  const rc = kind === "reception" ? buildReception() : null;
  const ch = kind === "chemistry" || kind === "spill" ? buildChemistry(kind === "spill") : null;
  const sp = kind === "spill" ? buildSpill() : null;
  const hm = kind === "haematology" ? buildHaematology() : null;
  const bb = kind === "bloodbank" ? buildBloodBank() : null;
  const phonePos = rc?.phonePos || ch?.phonePos || hm?.phonePos || bb?.phonePos || null;

  // ── the patient ──
  let PT = null;
  function printTex(base, dot) {
    return canvasTex(64, 64, (c) => {
      c.fillStyle = base; c.fillRect(0, 0, 64, 64);
      for (const [r, col] of [[9, dot], [4, base]]) { c.fillStyle = col; for (const [x, y] of [[16, 16], [48, 48], [48, 16], [16, 48]]) { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); } }
    });
  }
  // Seated in the phlebotomy chair, or standing across the reception counter.
  function buildPatient(look, standing = false) {
    if (PT) { scene.remove(PT.root); for (let i = pickables.length - 1; i >= 0; i--) if (pickables[i].userData.onPatient) pickables.splice(i, 1); }
    const L = look, skin = mat(L.skin, { roughness: 0.6 });
    let cloth;
    if (L.print) { const t = printTex(L.shirt, L.print); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3); cloth = mat("#ffffff", { map: t }); }
    else cloth = mat(L.shirt);
    const trous = L.print ? cloth : mat(L.trousers), shoe = mat("#2b211b");
    const root = group(0, 0, 0);
    mesh(C(0.16, 0.165, 0.16, 16), trous, 0, 0.53, 0, root).scale.z = 0.8;
    const legs = [-1, 1].map((s) => {
      const th = group(s * 0.09, 0.52, 0, root); mesh(C(0.072, 0.06, 0.42, 12), trous, 0, -0.21, 0, th);
      const kn = group(0, -0.42, 0, th); mesh(C(0.055, 0.045, 0.44, 12), L.print ? skin : trous, 0, -0.22, 0, kn); mesh(B(0.09, 0.06, 0.2), shoe, 0, -0.46, 0.05, kn);
      if (!standing) { th.rotation.x = -1.5; kn.rotation.x = 1.5; }
      return { th, kn, s };
    });
    if (L.print && !standing) mesh(B(0.36, 0.06, 0.5), cloth, 0, 0.6, 0.2, root);
    if (standing) root.position.set(0.05, 0.37, -0.78);
    const torso = group(0, 0.58, 0, root);
    mesh(C(0.17, 0.15, 0.46, 18), cloth, 0, 0.22, 0, torso).scale.z = 0.72;
    mesh(S(0.17, 18, 10), cloth, 0, 0.44, 0, torso).scale.set(1, 0.32, 0.72);
    if (!L.print) { mesh(B(0.1, 0.05, 0.02), mat("#ffffff"), -0.04, 0.46, 0.12, torso).rotation.z = 0.5; mesh(B(0.1, 0.05, 0.02), mat("#ffffff"), 0.04, 0.46, 0.12, torso).rotation.z = -0.5; }
    mesh(C(0.045, 0.05, 0.09, 10), skin, 0, 0.51, 0, torso);
    const head = group(0, 0.63, 0, torso);
    mesh(S(0.105, 22, 18), skin, 0, 0, 0, head).scale.set(0.95, 1.08, 1);
    mesh(S(0.08, 16, 12), skin, 0, -0.045, 0.022, head).scale.set(0.98, 0.8, 0.96);
    mesh(S(0.019, 8, 6), skin, -0.1, -0.005, 0, head); mesh(S(0.019, 8, 6), skin, 0.1, -0.005, 0, head); mesh(S(0.019, 8, 6), skin, 0, -0.02, 0.106, head);
    const eyes = group(0, 0, 0, head);
    for (const s of [-1, 1]) {
      mesh(S(0.017, 10, 8), mat("#ffffff", { roughness: 0.3 }), s * 0.039, 0.017, 0.092, eyes).scale.z = 0.6;
      mesh(S(0.009, 8, 6), mat("#1a120c"), s * 0.039, 0.017, 0.101, eyes);
      mesh(B(0.035, 0.007, 0.01), mat("#1b120c"), s * 0.039, 0.042, 0.099, head);
    }
    const mouth = mesh(B(0.042, 0.01, 0.012), mat("#5a2620"), 0, -0.05, 0.1, head);
    if (L.hair === "headtie") { const tie = mat("#ffffff", { map: printTex("#d4a017", "#7a2b1b") }); mesh(S(0.13, 18, 14), tie, 0, 0.07, -0.01, head).scale.set(1.05, 0.78, 1.12); mesh(S(0.05, 10, 8), tie, 0.06, 0.15, -0.05, head); }
    else mesh(S(0.109, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.4), mat("#151009", { roughness: 0.95 }), 0, 0.03, -0.012, head).scale.set(1, 1.04, 1.04);
    const arms = [-1, 1].map((s) => {
      const up = group(s * 0.2, 0.42, 0, torso);
      mesh(C(0.058, 0.053, 0.13, 12), cloth, 0, -0.065, 0, up); mesh(C(0.046, 0.042, 0.17, 12), skin, 0, -0.19, 0, up);
      const elb = group(0, -0.28, 0, up); mesh(S(0.044, 10, 8), skin, 0, 0, 0, elb); mesh(C(0.042, 0.034, 0.25, 12), skin, 0, -0.125, 0, elb);
      mesh(S(0.045, 10, 8), skin, 0, -0.28, 0.005, elb).scale.set(0.85, 1.25, 0.55);
      const pose = standing ? { ux: -0.05, uz: s * 0.08, ex: -0.25 } : { ux: -0.25, uz: s * 0.12, ex: -1.25 };
      return { up, elb, s, ...pose, tux: pose.ux, tuz: pose.uz, tex: pose.ex };
    });
    const A = arms[1];
    // what ends up on the patient's left arm, by the bench
    const tqArm = group(0, -0.17, 0, A.up);
    mesh(C(0.06, 0.06, 0.035, 18, true), mat("#2f86d6", { side: THREE.DoubleSide }), 0, 0, 0, tqArm); mesh(B(0.03, 0.012, 0.06), mat("#20313a"), 0, 0, 0.07, tqArm); tqArm.visible = false;
    const gauzeArm = mesh(B(0.05, 0.05, 0.012), mat("#f6f6f0"), 0, -0.04, 0.047, A.elb); gauzeArm.visible = false;
    const swabArm = mesh(B(0.045, 0.045, 0.01), mat("#f3d3df"), 0, -0.04, 0.047, A.elb); swabArm.visible = false;
    const needleArm = group(0, -0.085, 0.06, A.elb); needleArm.rotation.x = 0.35;
    mesh(C(0.014, 0.014, 0.09, 14), mat("#cfe7f2", { roughness: 0.15 }), 0, 0, 0, needleArm); mesh(C(0.008, 0.008, 0.02, 10), mat("#2e8b57"), 0, 0.05, 0, needleArm); needleArm.visible = false;
    reg("tourniquet", tqArm, null, undefined, { onPatient: true });
    reg("needle", needleArm, null, undefined, { onPatient: true });
    reg("gauze", gauzeArm, null, undefined, { onPatient: true });
    PT = { root, legs, torso, head, eyes, mouth, arms, tqArm, gauzeArm, swabArm, needleArm, talkUntil: 0, swabT: 0, leaveT: -1, blinkAt: 2, armOut: false, standing };
  }
  function armOut(on) { if (!PT || PT.armOut === on) return; PT.armOut = on; Object.assign(PT.arms[1], on ? { tux: -0.55, tuz: 0.32, tex: -0.95 } : { tux: -0.25, tuz: 0.12, tex: -1.25 }); }

  // ── camera ──
  const V0 = VIEWS[FIRST_VIEW[kind] || "patient"];
  const cam = { p: new THREE.Vector3(...V0.p), l: new THREE.Vector3(...V0.l), tp: new THREE.Vector3(...V0.p), tl: new THREE.Vector3(...V0.l), view: FIRST_VIEW[kind] || "patient" };
  function setView(v) {
    if (!VIEWS[v]) return;
    cam.view = v; cam.tp.set(...VIEWS[v].p); cam.tl.set(...VIEWS[v].l);
    if (reduced) { cam.p.copy(cam.tp); cam.l.copy(cam.tl); }
    onView?.(v);
  }
  // The spill is spread across the room: on a narrow (phone) screen the camera
  // keeps the width it has on a desktop and shows more height instead.
  const WIDE = kind === "spill" || kind === "haematology" || kind === "bloodbank" ? Math.tan((25 * Math.PI) / 180) * 1.3 : 0;
  function resize() {
    const w = host.clientWidth, h = host.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / Math.max(1, h);
    camera.fov = WIDE && camera.aspect < 1.3 ? (2 * Math.atan(WIDE / camera.aspect) * 180) / Math.PI : 50;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize); ro.observe(host);

  // ── picking ──
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  let names = {}, hoverId = null, down = null;
  const shown = (o) => { for (; o; o = o.parent) if (!o.visible) return false; return true; };
  // On a phone a fingertip is wide and the tubes are thin: a tap that misses
  // everything picks the nearest thing on screen, if one is within reach.
  const _sp = new THREE.Vector3(), _bb = new THREE.Box3();
  const inScene = (o) => { for (; o; o = o.parent) { if (!o.visible) return false; if (o === scene) return true; } return false; };
  function nearestTo(e, reach) {
    const r = renderer.domElement.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
    let best = null, bestD = reach;
    for (const id in REG) for (const root of REG[id].roots || []) {
      if (!inScene(root)) continue;
      _bb.setFromObject(root);
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, behind = false;
      for (let k = 0; k < 8; k++) {
        _sp.set(k & 1 ? _bb.max.x : _bb.min.x, k & 2 ? _bb.max.y : _bb.min.y, k & 4 ? _bb.max.z : _bb.min.z).project(camera);
        if (_sp.z > 1) { behind = true; break; }
        const sx = (_sp.x + 1) / 2 * r.width, sy = (1 - _sp.y) / 2 * r.height;
        x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
      }
      if (behind) continue;
      const d = Math.hypot(Math.max(x0 - px, 0, px - x1), Math.max(y0 - py, 0, py - y1));
      if (d < bestD) { bestD = d; best = id; }
    }
    return best;
  }
  function hitAt(e) {
    const r = renderer.domElement.getBoundingClientRect();
    ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, camera);
    for (const h of ray.intersectObjects(pickables, false)) if (h.object.userData.id && shown(h.object)) return h.object.userData.id;
    return e.pointerType === "touch" ? nearestTo(e, 28) : null;
  }
  function setHover(id, e) {
    if (hoverId !== id) {
      if (hoverId) for (const m of REG[hoverId].mats) { m.emissive.set("#000000"); m.emissiveIntensity = 0; }
      hoverId = id;
      if (id) for (const m of REG[id].mats) { m.emissive.set("#16a39a"); m.emissiveIntensity = 0.5; }
    }
    renderer.domElement.style.cursor = id ? "pointer" : "default";
    if (!id || !e) { tip.style.display = "none"; return; }
    const r = host.getBoundingClientRect(), [a, b] = names[id] || [id, ""];
    tip.replaceChildren(document.createTextNode(a));
    if (b) { const s = document.createElement("div"); s.textContent = b; Object.assign(s.style, { fontWeight: "400", color: "#a9d7d2", fontSize: "11.5px" }); tip.append(s); }
    tip.style.display = "block"; tip.style.left = `${e.clientX - r.left}px`; tip.style.top = `${e.clientY - r.top}px`;
  }
  const cv = renderer.domElement;
  const onMove = (e) => { if (e.pointerType !== "touch") setHover(hitAt(e), e); };
  // A finger lifting off the screen also "leaves" it; that must not forget the first tap.
  const onLeave = (e) => { if (e.pointerType !== "touch") setHover(null); };
  const onDown = (e) => { down = { x: e.clientX, y: e.clientY }; };
  const onUp = (e) => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) return; down = null;
    const id = hitAt(e);
    if (e.pointerType === "touch" && id && hoverId !== id) { setHover(id, e); return; }   // first tap names it, second tap uses it
    if (id) onPick?.(id);
  };
  cv.addEventListener("pointermove", onMove); cv.addEventListener("pointerleave", onLeave);
  cv.addEventListener("pointerdown", onDown); cv.addEventListener("pointerup", onUp);

  // ── what the server says has happened ──
  let last = null, patientName = null, spec = null, blinkT = 0;
  function sync(v) {
    names = v.objects || names;
    if (v.patient.name !== patientName) {
      patientName = v.patient.name; buildPatient(v.patient.look, kind !== "phlebotomy"); last = null;
      if (sp) { PT.root.position.set(1.2, 0.37, 0.95); PT.root.rotation.y = -0.45; }     // the colleague who dropped it, beside the spill
      else if (hm) { PT.root.position.set(-0.15, 0.37, 0.25); PT.root.rotation.y = 0.6; }
      else if (bb) { PT.root.position.set(-1.2, 0.37, 0.6); PT.root.rotation.y = 0.8; }     // the porter, at the hatch     // the colleague, at the end of the bench
      else if (ch) { PT.root.position.set(-0.5, 0.37, 0.3); PT.root.rotation.y = 0.55; }     // the colleague, at the end of the bench
    }
    const f = v.flags, was = last?.flags || {};
    if (ph) syncPhlebotomy(v, f, was);
    if (rc) syncReception(v);
    if (hm) { spec = v.specimen; hm.drawScreen(spec, clock.elapsedTime); hm.show(spec); }
    if (bb) bb.show(v.specimen);
    if (sp) sp.show(v);
    else if (ch) { spec = v.specimen; ch.serumMat.color.set(spec?.serum || "#e3b94f"); ch.drawScreen(spec, clock.elapsedTime); ch.drawQc(spec); }
    if (f.gone) { if (!was.gone && last) { PT.leaveT = PT.standing ? 1 : 0; armOut(false); } else if (!last) PT.root.visible = false; }
    else if (ph) armOut(v.step >= 2);
    last = { flags: { ...f }, rack: [...v.rack], selected: v.selected };
  }
  function syncPhlebotomy(v, f, was) {
    const { gTq, gNeedle, gGauze, TUBE3D, ensureTubes } = ph;
    ensureTubes(v.tubes || {});
    if (!last || last.rack.join() !== v.rack.join()) v.rack.forEach((k, i) => TUBE3D[k]?.g.position.set(1.45 + i * 0.06, TOP, -0.14));
    gTq.visible = !f.tq; PT.tqArm.visible = f.tq;
    gNeedle.visible = !(f.needle || f.sharps); PT.needleArm.visible = f.needle;
    gGauze.visible = !f.gauze; PT.gauzeArm.visible = f.gauze;
    if (f.swabbed && !was.swabbed && last) PT.swabT = 1.6;
    for (const k in TUBE3D) {
      const T = TUBE3D[k], drawn = v.drawn.includes(k);
      T.want = drawn ? 1 : 0; T.fill.visible = drawn;
      if (!drawn) { T.level = 0; T.fill.scale.y = 0.001; }
      else if (!last) { T.level = 1; T.fill.scale.y = 1; T.fill.position.y = 0.045; }
      T.band.visible = !!v.labelled[k];
    }
  }
  // Samples sit in the rack until picked up; the one being inspected is lifted
  // towards you and turned; decided ones go to the ACCEPTED or REJECTED tray.
  function syncReception(v) {
    if (!v.samples) return;
    rc.ensureSamples(v.samples);
    let acc = 0, rej = 0;
    for (const x of v.samples) {
      const T = rc.SAMPLE3D[x.id]; if (!T) continue;
      T.focus = false;
      if (x.decision?.verdict === "accept") T.target.set(-0.67 + acc++ * 0.055, DESK + 0.035, 0.06);
      else if (x.decision?.verdict === "reject") T.target.set(-1.07 + rej++ * 0.055, DESK + 0.035, 0.06);
      else if (v.selected === x.id) { T.target.set(T.slot.x, DESK + 0.13, 0.14); T.focus = true; }
      else T.target.copy(T.slot);
      if (!last) T.g.position.copy(T.target);
    }
    const sel = v.selected && rc.SAMPLE3D[v.selected];
    if (sel && v.selected !== last?.selected) {
      VIEWS.close = { p: [sel.slot.x + 0.03, DESK + 0.25, 0.43], l: [sel.slot.x, DESK + 0.17, 0.14] };
      setView("close");
    } else if (!v.selected && last?.selected && cam.view === "close") setView("counter");
  }

  // ── every frame ──
  const clock = new THREE.Clock();
  let raf = 0;
  function animPatient(t, dt) {
    if (!PT) return;
    const k = 1 - Math.exp(-dt * 6);
    PT.torso.scale.y = 1 + Math.sin(t * 1.7) * 0.01;
    if (t > PT.blinkAt + 0.12) PT.blinkAt = t + 2 + Math.random() * 3.5;
    PT.eyes.scale.y = t > PT.blinkAt ? 0.15 : 1;
    PT.mouth.scale.y = t < PT.talkUntil ? 1 + Math.abs(Math.sin(t * 13)) * 2.6 : 1;
    PT.head.rotation.y += ((cam.view === "patient" ? 0.24 : 0.1) + Math.sin(t * 0.4) * 0.06 - PT.head.rotation.y) * k;
    PT.head.rotation.x = Math.sin(t * 0.3) * 0.03;
    for (const A of PT.arms) { A.ux += (A.tux - A.ux) * k; A.uz += (A.tuz - A.uz) * k; A.ex += (A.tex - A.ex) * k; A.up.rotation.x = A.ux; A.up.rotation.z = A.uz; A.elb.rotation.x = A.ex; }
    if (PT.swabT > 0) { PT.swabT -= dt; PT.swabArm.visible = PT.swabT > 0; PT.swabArm.position.y = -0.04 + Math.sin(PT.swabT * 18) * 0.012; }
    if (PT.leaveT >= 0) {
      PT.leaveT += dt; const lt = PT.leaveT, R = PT.root;
      if (lt < 1) {
        const s = lt * lt * (3 - 2 * lt);
        for (const L of PT.legs) { L.th.rotation.x = -1.5 * (1 - s); L.kn.rotation.x = 1.5 * (1 - s); }
        R.position.y = 0.37 * s; for (const A of PT.arms) Object.assign(A, { tux: -0.05, tuz: A.s * 0.08, tex: -0.2 });
      } else if (lt < 4.5) {
        R.rotation.y += (-Math.PI / 2 - R.rotation.y) * Math.min(1, dt * 6); R.position.x -= dt * 0.85;
        for (const L of PT.legs) { const phase = lt * 7 + (L.s > 0 ? Math.PI : 0); L.th.rotation.x = Math.sin(phase) * 0.4; L.kn.rotation.x = Math.max(0, Math.sin(phase - 0.6)) * 0.6; }
      } else { R.visible = false; PT.leaveT = -1; }
    }
  }
  // Keep the patient's bubble over their head, and let both fade when read.
  function placeBubbles(t) {
    const P = bubbles.patient;
    const onPhone = P.anchor === "phone" && phonePos;
    let showP = t < P.until && PT && (onPhone || PT.root.visible);
    if (showP) {
      if (onPhone) headPos.copy(phonePos);
      else { PT.head.getWorldPosition(headPos); headPos.y += 0.2; }
      headPos.project(camera);
      // At the bench the colleague can stand just out of a narrow (phone) view;
      // his bubble then stays on screen at the edge instead of vanishing.
      if (headPos.z > 1 || (!ch && !hm && !bb && (Math.abs(headPos.x) > 1.1 || headPos.y > 1.2 || headPos.y < -1))) showP = false;
      else {
        const w = host.clientWidth, h = host.clientHeight;
        const half = Math.min(w / 2, (P.el.offsetWidth || 180) / 2 + 8);      // keep the whole bubble inside the view
        const x = Math.min(w - half, Math.max(half, (headPos.x + 1) / 2 * w)), y = Math.max((P.el.offsetHeight || 60) + 56, (1 - headPos.y) / 2 * h);     // clear of the camera buttons
        P.el.style.left = `${x}px`; P.el.style.top = `${y}px`;
      }
    }
    P.el.style.display = showP ? "block" : "none";
    bubbles.you.el.style.display = t < bubbles.you.until ? "block" : "none";
  }
  function say(text, who = "patient", name = "", anchor = null) {
    const B = bubbles[who === "you" ? "you" : "patient"];
    if (!text) { B.until = 0; return; }
    B.anchor = anchor;
    B.who.textContent = who === "you" ? "You" : name || "Patient";
    B.text.textContent = text;
    B.until = clock.elapsedTime + Math.max(3.5, String(text).length * 0.07) + 1.5;
    if (who !== "you" && !anchor && PT) PT.talkUntil = clock.elapsedTime + Math.max(1.2, String(text).length * 0.055);
  }

  function frame() {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, clock.getDelta()), t = clock.elapsedTime;
    animPatient(t, dt);
    const kc = reduced ? 1 : 1 - Math.exp(-dt * 4);
    cam.p.lerp(cam.tp, kc); cam.l.lerp(cam.tl, kc); camera.position.copy(cam.p); camera.lookAt(cam.l);
    placeBubbles(t);
    if (ph) for (const k in ph.TUBE3D) { const T = ph.TUBE3D[k]; if (T.level < T.want) { T.level = Math.min(T.want, T.level + dt * 1.2); T.fill.scale.y = Math.max(0.001, T.level); T.fill.position.y = 0.01 + 0.035 * T.level; } }
    if ((hm || (ch && !sp)) && !reduced && Math.floor(t * 2) !== blinkT) { blinkT = Math.floor(t * 2); (hm || ch).drawScreen(spec, t); }    // the critical flag blinks
    if (rc) for (const k in rc.SAMPLE3D) {
      const T = rc.SAMPLE3D[k], km = reduced ? 1 : 1 - Math.exp(-dt * 6);
      T.g.position.lerp(T.target, km);
      T.inner.rotation.y = T.focus ? T.inner.rotation.y + dt * 0.7 : T.inner.rotation.y * (1 - km);
      T.inner.rotation.z = T.focus ? Math.sin(t * 0.9) * 0.18 : 0;          // tilted gently, the way you'd look for a clot
    }
    renderer.render(scene, camera);
  }
  resize(); frame();

  return {
    sync, setView, say,
    get view() { return cam.view; },
    dispose() {
      cancelAnimationFrame(raf); ro.disconnect();
      cv.removeEventListener("pointermove", onMove); cv.removeEventListener("pointerleave", onLeave);
      cv.removeEventListener("pointerdown", onDown); cv.removeEventListener("pointerup", onUp);
      for (const d of new Set(disposables)) d.dispose?.();
      renderer.dispose(); renderer.domElement.remove(); tip.remove(); bubbles.patient.el.remove(); bubbles.you.el.remove();
    },
  };
}
