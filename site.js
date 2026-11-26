/* ==========================================================
   Aashray Properties: shared settings and behaviour.
   Edit the SETTINGS block. Both pages read it.
   ========================================================== */

/* ================= SETTINGS ================= */
const CONFIG = {
  // Listings sheet published as CSV (File > Share > Publish to web > CSV)
  SHEET_CSV_URL: "",
  // WhatsApp number with country code, digits only
  WHATSAPP_NUMBER: "917359033540",
  // Social and contact links (leave "" to hide)
  INSTAGRAM_URL: "https://www.instagram.com/aashray.ahmedabad/",
  FACEBOOK_URL: "",
  EMAIL_ADDRESS: "",
  // Google review link (Google Business Profile > Get more reviews)
  GOOGLE_REVIEW_URL: "",
  // Optional embeds: a Google Calendar appointment page, and a Google Form for feedback
  APPOINTMENT_EMBED_URL: "",
  FEEDBACK_FORM_EMBED_URL: "",
  // Client reviews you have permission to show: { name, rating, text }
  REVIEWS: [],
  // How many rentals appear on the home page
  FEATURED_COUNT: 4
};
/* ============================================ */

const SAMPLE = [
  { id: "L001", area: "Vatva", type: "Residential", kind: "Rent", bhk: "2", price: "9000", deposit: "18000", size_sqft: "650", furnishing: "Semi-furnished", available: "1 Dec 2026", status: "Active", featured: "yes", features: "Water 24 hours, Lift, Parking", notes: "Ground floor, close to the bus stop." },
  { id: "L002", area: "Maninagar", type: "Residential", kind: "Rent", bhk: "RK", price: "5500", deposit: "11000", size_sqft: "260", furnishing: "Unfurnished", available: "Now", status: "Active", featured: "yes", features: "Lift", notes: "Compact studio in a quiet society." },
  { id: "L003", area: "Isanpur", type: "Residential", kind: "Rent", bhk: "3", price: "14000", deposit: "28000", size_sqft: "1150", furnishing: "Furnished", available: "15 Dec 2026", status: "Active", featured: "yes", features: "Parking for two cars, Balcony", notes: "Top floor with a large balcony." },
  { id: "L004", area: "Narol", type: "Commercial", kind: "Rent", bhk: "", price: "22000", deposit: "66000", size_sqft: "300", furnishing: "Shell", available: "Now", status: "Active", featured: "yes", features: "Main road frontage", notes: "Ground-floor shop on the main road." },
  { id: "L005", area: "Ghodasar", type: "Residential", kind: "Rent", bhk: "Bungalow", price: "38000", deposit: "120000", size_sqft: "2400", furnishing: "Furnished", available: "1 Jan 2027", status: "Active", featured: "", features: "Garden, Private parking, Security", notes: "Independent bungalow with a garden." }
];

/* ---------- helpers ---------- */
const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const num = v => Number(String(v).replace(/[^0-9.]/g, "")) || 0;
const money = n => "Rs " + Number(n).toLocaleString("en-IN");
const digits = s => String(s || "").replace(/\D/g, "");
const prettyPhone = () => "+" + CONFIG.WHATSAPP_NUMBER.replace(/^(\d{2})(\d{5})(\d{5})$/, "$1 $2 $3");
const waLink = text => `https://wa.me/${CONFIG.WHATSAPP_NUMBER}${text ? "?text=" + encodeURIComponent(text) : ""}`;

function parseCSV(text) {
  const rows = []; let row = [], field = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const head = rows.shift().map(h => h.trim().toLowerCase());
  return rows.filter(r => r.some(x => x.trim())).map(r => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? "").trim()])));
}

/* ---------- data ---------- */
const KNOWN = new Set(["id","area","type","kind","bhk","price","deposit","size_sqft","furnishing","available","status","featured", ...Array.from({length:20},(_,i)=>"photo_"+(i+1)), ...Array.from({length:3},(_,i)=>"video_"+(i+1)), "notes","whatsapp","features"]);
const SAMPLE_MODE = { on: false };

async function loadListings() {
  try {
    const res = await fetch(
      "https://aashray-api.xen-sam08.workers.dev/api/public/properties",
      { cache: "no-store" }
    );

    if (!res.ok) throw new Error(res.status);

    const data = await res.json();

    if (!data.success || !Array.isArray(data.properties)) {
      throw new Error("Invalid properties response");
    }

    SAMPLE_MODE.on = false;

    return data.properties.filter(p =>
      (p.status || "").toLowerCase() === "active" &&
      (p.kind || "").toLowerCase() === "rent"
    );

  } catch (e) {
    console.error("Could not load live properties:", e);
    SAMPLE_MODE.on = true;
    return SAMPLE;
  }
}
function normalise(r) {
  const bhkRaw = String(r.bhk || "").trim();
  const bhkNum = num(bhkRaw);
  let bhkKey = "";
  if (/^rk$/i.test(bhkRaw)) bhkKey = "RK";
  else if (/bungalow/i.test(bhkRaw)) bhkKey = "Bungalow";
  else if (bhkNum >= 4) bhkKey = "4+";
  else if (bhkNum >= 1) bhkKey = String(bhkNum);
  const commercial = /commercial/i.test(r.type || "") || (/shop|office/i.test(r.notes || "") && !bhkKey);
  const extras = Object.entries(r).filter(([k, v]) => !KNOWN.has(k) && String(v).trim())
    .map(([k, v]) => [k.replace(/_/g, " "), v]);
  return {
    id: r.id, area: r.area || "", category: commercial ? "Commercial" : "House",
    bhkKey, bhkLabel: bhkKey === "RK" ? "RK" : bhkKey === "Bungalow" ? "Bungalow" : bhkKey ? bhkKey + " BHK" : "",
    price: num(r.price), deposit: num(r.deposit), size: num(r.size_sqft),
    furnishing: r.furnishing, available: r.available, notes: r.notes,
    featured: /^(yes|true|1)$/i.test(String(r.featured || "").trim()),
    features: String(r.features || "").split(",").map(s => s.trim()).filter(Boolean),
    extras,
    photos: Array.from({length:20},(_,i)=>r["photo_"+(i+1)]).filter(Boolean),
    videos: Array.from({length:3},(_,i)=>r["video_"+(i+1)]).filter(Boolean),
    photo: r.photo_1 || "",
    wa: digits(r.whatsapp) || CONFIG.WHATSAPP_NUMBER
  };
}

const photoHtml = (l, alt) => {
  const photos = l.photos?.length ? l.photos : (l.photo ? [l.photo] : []);
  const slides = [
    ...photos.map((url,i)=>`<div class="media-slide"><img src="${esc(url)}" alt="${esc((alt || "Photo of " + l.area + " rental") + " " + (i+1))}" loading="lazy"></div>`),
    ...(l.videos || []).map((url,i)=>`<div class="media-slide"><video controls muted playsinline preload="metadata" aria-label="Property video ${i+1}"><source src="${esc(url)}"></video></div>`)
  ];
  if (!slides.length) return `<span>Photo coming soon</span>`;
  return `<div class="media-carousel">${slides.join("")}</div>`;
};

function setupMediaAutoplay(root = document) {
  if (!("IntersectionObserver" in window)) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const video = entry.target;
      if (entry.isIntersecting && entry.intersectionRatio >= 0.7) video.play().catch(() => {});
      else { video.pause(); video.currentTime = 0; }
    });
  }, { threshold: [0, 0.7, 1] });
  root.querySelectorAll(".media-carousel video").forEach(video => observer.observe(video));
};

const titleOf = l => l.category === "Commercial" ? `Commercial space for rent in ${l.area}`
  : `${l.bhkLabel || "Home"} for rent in ${l.area}`;

function specsHtml(l) {
  const rows = [
    ["Type", l.category === "Commercial" ? "Commercial" : (l.bhkLabel || "Home")],
    ["Size", l.size ? l.size + " sq ft" : "-"],
    ["Available", l.available || "-"]
  ];
  return rows.map(([k, v]) => `<div class="spec"><div class="k">${esc(k)}</div><div class="v">${esc(v)}</div></div>`).join("");
}

function rentCard(l, detailHref) {
  const feats = l.features.slice(0, 3).map(f => `<span class="chip-f">${esc(f)}</span>`).join("");
  return `
    <article class="card">
      <a class="photo" href="${esc(detailHref)}" aria-label="View details for ${esc(l.id)}">${photoHtml(l)}<span class="badge">For rent</span></a>
      <div class="body">
        <div class="price">${money(l.price)} <small>/ month</small></div>
        <h3>${esc(titleOf(l))}</h3>
        <p class="muted small">${esc(l.furnishing || "")}${l.deposit ? " · Deposit " + money(l.deposit) : ""}</p>
        <div class="specs">${specsHtml(l)}</div>
        ${feats ? `<div class="chips">${feats}</div>` : ""}
        <div class="actions">
          <a class="btn-navy" href="${esc(detailHref)}">View details</a>
          <a class="btn-line" href="${esc(waLink("Hi, I'm interested in " + l.id + " in " + l.area))}" target="_blank" rel="noopener">WhatsApp</a>
        </div>
      </div>
    </article>`;
}

/* ---------- shared setup ---------- */
function setupCommon() {
  document.querySelectorAll("[data-wa]").forEach(a => { a.href = waLink(a.dataset.wa || ""); a.target = "_blank"; a.rel = "noopener"; });
  document.querySelectorAll("[data-phone]").forEach(el => el.textContent = prettyPhone());
  document.querySelectorAll("[data-year]").forEach(el => el.textContent = new Date().getFullYear());
}

function setupReviews() {
  const review = $("reviewBtn");
  if (review) {
    if (CONFIG.GOOGLE_REVIEW_URL) { review.href = CONFIG.GOOGLE_REVIEW_URL; review.target = "_blank"; review.rel = "noopener"; }
    else { review.setAttribute("aria-disabled", "true"); review.removeAttribute("href"); }
  }
  const list = $("reviewList");
  if (list) {
    list.innerHTML = CONFIG.REVIEWS.length
      ? CONFIG.REVIEWS.map(r => `
          <div class="review">
            <span class="stars">${"★".repeat(Math.max(1, Math.min(5, r.rating || 5)))}</span>
            <strong>${esc(r.name)}</strong>
            <p class="muted">${esc(r.text)}</p>
          </div>`).join("")
      : `<p class="muted">Client reviews will appear here. You can also read our Google reviews.</p>`;
  }
  const slot = $("feedbackSlot");
  if (slot) {
    slot.innerHTML = CONFIG.FEEDBACK_FORM_EMBED_URL
      ? `<iframe class="embed" src="${esc(CONFIG.FEEDBACK_FORM_EMBED_URL)}" title="Feedback form"></iframe>`
      : `<p class="muted">Tell us about your experience, or a problem we can fix.</p>
         <a class="btn-line" href="${esc(waLink("Hi, I'd like to share feedback about Aashray Properties."))}" target="_blank" rel="noopener">Send feedback on WhatsApp</a>`;
  }
}

function setupContactCards() {
  const host = $("contactCards");
  if (!host) return;
  const cards = [
    { k: "WhatsApp", v: prettyPhone(), href: waLink("Hi, I'd like to know more about your rentals."), ext: true },
    CONFIG.INSTAGRAM_URL && { k: "Instagram", v: "@aashray.ahmedabad", href: CONFIG.INSTAGRAM_URL, ext: true },
    CONFIG.FACEBOOK_URL && { k: "Facebook", v: "Aashray Properties", href: CONFIG.FACEBOOK_URL, ext: true },
    CONFIG.EMAIL_ADDRESS && { k: "Email", v: CONFIG.EMAIL_ADDRESS, href: "mailto:" + CONFIG.EMAIL_ADDRESS, ext: false },
    { k: "Enquiry form", v: "Tell us what you need", href: "#enquiry", ext: false }
  ].filter(Boolean);
  host.innerHTML = cards.map(c => `
    <a class="contact-card" href="${esc(c.href)}"${c.ext ? ' target="_blank" rel="noopener"' : ""}>
      <span class="k">${esc(c.k)}</span>
      <span class="v">${esc(c.v)}</span>
    </a>`).join("");
}

/* ---------- forms (visit and enquiry, both open WhatsApp with the details) ---------- */
function formNote(el, text, ok) {
  el.textContent = text;
  el.className = ok ? "form-note ok" : "form-note err";
}

function setupVisitForm() {
  const form = $("apptForm");
  if (!form) return;
  if (CONFIG.APPOINTMENT_EMBED_URL) $("apptEmbedSlot").innerHTML = `<iframe class="embed" src="${esc(CONFIG.APPOINTMENT_EMBED_URL)}" title="Book a visit"></iframe>`;
  const min = new Date(); min.setDate(min.getDate() + 1);
  $("aDate").min = min.toISOString().slice(0, 10);
  form.addEventListener("submit", e => {
    e.preventDefault();
    const name = $("aName").value.trim(), phone = $("aPhone").value.trim(), date = $("aDate").value;
    if (!name || digits(phone).length < 10 || !date) {
      formNote($("apptNote"), "Please enter your name, a 10-digit WhatsApp number, and a date.", false);
      return;
    }
    const d = new Date(date + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    const prop = $("aProp").value.trim();
    const msg = `Visit request\nName: ${name}\nWhatsApp: ${phone}\nDate: ${d}\nTime: ${$("aTime").value}` + (prop ? `\nProperty: ${prop}` : "");
    window.open(waLink(msg), "_blank", "noopener");
    formNote($("apptNote"), "WhatsApp opened with your visit request. Send it to confirm.", true);
  });
}

function setupEnquiryForm() {
  const form = $("enqForm");
  if (!form) return;
  form.addEventListener("submit", e => {
    e.preventDefault();
    const name = $("eName").value.trim(), phone = $("ePhone").value.trim();
    if (!name || digits(phone).length < 10) {
      formNote($("enqStatus"), "Please enter your name and a 10-digit WhatsApp number.", false);
      return;
    }
    const budget = $("eBudget").value.trim(), note = $("eMsg").value.trim();
    const msg = `Enquiry\nName: ${name}\nWhatsApp: ${phone}\nLooking for: ${$("eNeed").value}\nArea: ${$("eArea").value}` +
      (budget ? `\nBudget: Rs ${budget}` : "") + (note ? `\nMessage: ${note}` : "");
    window.open(waLink(msg), "_blank", "noopener");
    formNote($("enqStatus"), "WhatsApp opened with your enquiry. Send it to finish.", true);
  });
}

function showSampleNotice() {
  if (SAMPLE_MODE.on) document.querySelectorAll("[data-sample-notice]").forEach(el => el.hidden = false);
}

/* ---------- home page ---------- */
async function initHome() {
  setupCommon();
  setupReviews();
  setupContactCards();
  setupVisitForm();
  setupEnquiryForm();
  const rows = (await loadListings()).map(normalise);
  showSampleNotice();
  const featured = rows.filter(r => r.featured);
  const pick = (featured.length ? featured : rows).slice(0, CONFIG.FEATURED_COUNT);
  $("featuredGrid").innerHTML = pick.length
    ? pick.map(l => rentCard(l, `properties.html#${encodeURIComponent(l.id)}`)).join("")
    : `<p class="muted">New rentals are being added. Message us on WhatsApp to see what's available.</p>`;
  setupMediaAutoplay($("featuredGrid"));
  $("featuredCount").textContent = rows.length;
}

/* ---------- properties page ---------- */
const state = { category: "", bhk: "", area: "", applied: false, sort: "new" };
let ROWS = [];

function hasFilter() { return !!(state.category || state.bhk || state.area); }

function matches(l) {
  if (state.category && l.category !== state.category) return false;
  if (state.bhk) {
    if (l.category === "Commercial") return false;
    if (l.bhkKey !== state.bhk) return false;
  }
  if (state.area && l.area !== state.area) return false;
  return true;
}

function sortRows(rows) {
  switch (state.sort) {
    case "low": return rows.sort((a, b) => a.price - b.price);
    case "high": return rows.sort((a, b) => b.price - a.price);
    case "size": return rows.sort((a, b) => b.size - a.size);
    default: return rows.sort((a, b) => String(b.id).localeCompare(String(a.id)));
  }
}

function buildTypeChips() {
  const host = $("typeSeg");
  host.innerHTML = "";
  [["Any", ""], ["Commercial", "Commercial"], ["House", "House"]].forEach(([label, value]) => {
    const b = document.createElement("button");
    b.type = "button"; b.textContent = label;
    b.setAttribute("aria-pressed", String(state.category === value));
    b.addEventListener("click", () => { state.category = value; buildTypeChips(); updateHint(); });
    host.appendChild(b);
  });
}

function updateHint() {
  $("filterHint").textContent = hasFilter()
    ? "Press Show rentals to see matches."
    : "Pick at least one filter to see rentals.";
}

function toggleSearch(open) {
  const panel = $("searchPanel");
  const show = open ?? panel.hidden;
  panel.hidden = !show;
  $("searchToggle").setAttribute("aria-expanded", String(show));
  if (show) panel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function showRentals() {
  state.bhk = $("fBhk").value;
  state.area = $("fArea").value;
  if (!hasFilter()) { updateHint(); return; }
  state.applied = true;
  $("resultsWrap").classList.add("show");
  toggleSearch(false);
  render();
  $("resultsWrap").scrollIntoView({ behavior: "smooth", block: "start" });
}

function clearSearch() {
  Object.assign(state, { category: "", bhk: "", area: "", applied: false });
  $("fBhk").value = ""; $("fArea").value = "";
  buildTypeChips(); updateHint();
  $("resultsWrap").classList.remove("show");
}

function render() {
  if (!state.applied) return;
  const rows = sortRows(ROWS.filter(matches));
  $("grid").innerHTML = rows.map(l => rentCard(l, `#${encodeURIComponent(l.id)}`)).join("");
  setupMediaAutoplay($("grid"));
  $("count").textContent = rows.length + (rows.length === 1 ? " rental" : " rentals");
  $("empty").hidden = rows.length !== 0;
}

function openDetail(id) {
  const l = ROWS.find(x => String(x.id) === String(id));
  if (!l) return;
  $("dlgTitle").textContent = titleOf(l);
  $("dlgNote").textContent = l.notes || "";
  $("dlgPhoto").innerHTML = photoHtml(l, "Photo of " + l.id);
  setupMediaAutoplay($("dlgPhoto"));
  const facts = [
    ["Reference", l.id],
    ["Rent", money(l.price) + " / month"],
    l.deposit ? ["Deposit", money(l.deposit)] : null,
    l.size ? ["Size", l.size + " sq ft"] : null,
    ["Furnishing", l.furnishing || "-"],
    ["Available", l.available || "-"]
  ].filter(Boolean);
  l.extras.forEach(([k, v]) => facts.push([k.charAt(0).toUpperCase() + k.slice(1), v]));
  $("dlgFacts").innerHTML = facts.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("");
  $("dlgMore").innerHTML = l.features.map(f => `<span class="chip-f">${esc(f)}</span>`).join("");
  $("dlgWa").href = waLink(`Hi, I'm interested in ${l.id} in ${l.area}`);
  $("detail").showModal();
}

function openFromHash() {
  const id = decodeURIComponent(location.hash.slice(1));
  if (!id || !ROWS.some(r => String(r.id) === id)) return;
  openDetail(id);
}

async function initProperties() {
  setupCommon();
  buildTypeChips();
  updateHint();
  $("searchToggle").addEventListener("click", () => toggleSearch());
  $("showBtn").addEventListener("click", showRentals);
  $("clearBtn").addEventListener("click", clearSearch);
  $("fBhk").addEventListener("change", () => { state.bhk = $("fBhk").value; updateHint(); });
  $("fArea").addEventListener("change", () => { state.area = $("fArea").value; updateHint(); });
  $("sort").addEventListener("change", e => { state.sort = e.target.value; render(); });
  $("dlgClose").addEventListener("click", () => $("detail").close());
  $("detail").addEventListener("click", e => { if (e.target === $("detail")) $("detail").close(); });
  $("detail").addEventListener("close", () => { if (location.hash) history.replaceState(null, "", location.pathname + location.search); });
  window.addEventListener("hashchange", openFromHash);
  ROWS = (await loadListings()).map(normalise);
  showSampleNotice();
  $("grid").addEventListener("click", e => {
    const a = e.target.closest("a[href^='#']");
    if (a) { e.preventDefault(); openDetail(decodeURIComponent(a.getAttribute("href").slice(1))); }
  });
  // Deep link from the home page: properties.html#L001 opens that listing
  if (location.hash) openFromHash();
}
