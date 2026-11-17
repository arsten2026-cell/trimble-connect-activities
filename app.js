// Arsten / MULTIPLAN – Дейности (site activities, user 17.11.2026): things done on site that are not in the model, with
// photos, reported weekly ("Additional site toilets delivered", "Existing concrete has been cut and removed from site").
// Data: shared/arsten-activities.js (the list _AM_Docs/Activities/activities.json, photos _AM_Docs/Activities/Photos/<day>/).
// Who: admin and the GC side (00_ADMIN, 02.GENERAL CONTRACTOR, 02.1 PM), app "activities" in shared/arsten-access.js.
// Writing needs ArstenAccess.canWrite (a Connect project ADMIN outside those groups only reads).
// The client never opens this panel: Статус publishes the dated entries ticked "за клиента" (text, date and up to 6 photos, copied to _AM_Docs/Client/Photos).
// Every save reads the list again first and applies just that one change (arsten-activities.js change).
(() => {
  "use strict";
  const AV = window.ArstenActivities, PH = window.ArstenPhotos, B = window.ArstenBackup, I18N = window.ArstenI18n;
  const $ = (id) => document.getElementById(id);
  const LANG_KEY = "arsten.activities.lang";
  const WEEKS_SHOWN = 4;

  const T = {
    title: ["Дейности", "Site activities"],
    hint: ["Работи и събития извън модела – доставки, разбиване, временни съоръжения – със снимки. Записите с дата и „за клиента“ отиват при клиента при следващото „Публикувай за клиента“ в Статус (текст, дата и до 6 снимки на запис). Без дата = предстои, само вътрешно.",
      "Work and events outside the model – deliveries, demolition, temporary works – with photos. Entries with a date and \"for the client\" reach the client at the next \"Publish for the client\" in Status (text, date and up to 6 photos per entry). No date = planned, internal only."],
    textLbl: ["Какво е направено", "What was done"], ph: ["напр. Доставени допълнителни тоалетни на обекта", "e.g. Additional site toilets delivered"],
    dateLbl: ["Дата (изтрийте я за „предстои“)", "Date (clear it for \"planned\")"],
    forClient: ["за клиента", "for the client"], photos: ["Снимки", "Photos"], photosN: ["снимки избрани", "photos chosen"], photos1: ["снимка избрана", "photo chosen"],
    add: ["Добави", "Add"], save: ["Запази", "Save"], cancel: ["Откажи", "Cancel"],
    planned: ["Предстои", "Planned"], open: ["предстои", "planned"], week: ["Седмица", "Week"], thisWeek: ["тази седмица", "this week"],
    later: ["за клиента, щом има дата", "for the client once dated"],
    isClient: ["✓ за клиента", "✓ for the client"], isInternal: ["само вътрешно", "internal only"],
    showClient: ["Покажи на клиента", "Show to the client"], hideClient: ["Скрий от клиента", "Hide from the client"],
    doneShort: ["✓ днес", "✓ today"], doneToday: ["Отбележи като извършено днес", "Mark as done today"],
    edit: ["Промени", "Edit"], del: ["Изтрий", "Delete"], addPhoto: ["+ снимка", "+ photo"], addPhotoT: ["Добави снимки към този запис", "Add photos to this entry"],
    rmPhoto: ["Махни снимката от записа", "Remove the photo from the entry"],
    rmPhotoQ: ["Да махна ли снимката от записа? Файлът остава в _AM_Docs/Activities.", "Remove the photo from the entry? The file stays in _AM_Docs/Activities."],
    delQ: ["Да изтрия ли този запис?", "Delete this entry?"], delQPhotos: ["Снимките остават като файлове в _AM_Docs/Activities.", "The photos stay as files in _AM_Docs/Activities."],
    none: ["Още няма записани дейности.", "No activities yet."], older: ["Покажи по-старите седмици", "Show older weeks"],
    loading: ["Зареждане…", "Loading…"], del2: ["Изтрий", "Delete"], err: ["Дейностите не се четат", "The activities cannot be read"], retry: ["Опитай пак", "Try again"],
    badText: ["Напишете какво е направено.", "Write what was done."], badDate: ["Датата не е вярна или е в бъдещето.", "The date is not valid or is in the future."],
    gone: ["Записът е изтрит междувременно от друг потребител.", "The entry was deleted meanwhile by another user."],
    full: ["Списъкът е пълен.", "The list is full."], tooMany: ["Най-много {n} снимки на запис.", "At most {n} photos per entry."],
    saved: ["Записано", "Saved"], uploading: ["Качване на снимка", "Uploading photo"], photoFail: ["Снимката не се качи", "The photo was not uploaded"],
    readOnly: ["Само преглед. Записи добавят и променят само членовете на групи 00_ADMIN, 02 и 02.1.", "View only – members of 00_ADMIN, 02 and 02.1 add and change entries."],
    conflict: ["Някой друг записва в същия момент – опитайте пак.", "Someone else is saving at the same moment – try again."],
    unsaved: ["Във формата има незаписан нов запис. Да го изоставя ли?", "The form holds a new entry that is not saved. Discard it?"],
    close: ["Затвори", "Close"], noPhoto: ["снимката не се зарежда", "photo not loading"],
  };
  const storedLang = I18N ? I18N.stored([LANG_KEY]) : "";
  let lang = storedLang || "bg";
  const t = (k) => (T[k] ? T[k][lang === "bg" ? 0 : 1] : k);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pad = (n) => String(n).padStart(2, "0");
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  const fmtDate = (d) => { if (!d) return ""; if (I18N) return I18N.fmtDate(d, lang); const [y, m, dd] = d.split("-"); return `${dd}.${m}.${y}`; };
  const errText = (e) => (e && (e.message || e.toString())) || String(e);
  function setStatus(text, bad) { $("status").textContent = text; $("status").className = "status" + (bad ? " bad" : ""); }
  async function guarded(fn) { try { return await fn(); } catch (e) { setStatus(e && e.shown ? e.message : I18N ? I18N.err(errText(e), lang) : "Грешка: " + errText(e), true); console.error(e); } }

  const state = {
    api: null, project: null, access: null, writable: false,
    items: [], loaded: false, err: null, busy: false, weeks: WEEKS_SHOWN,
    editing: null, editFrom: null, addClient: true, picked: [],   // picked: File objects for the entry in the form
    moreFor: null,                                                // the entry "+ снимка" is adding photos to
    urls: new Map(),                                              // photo file id -> download URL (or "" while loading / failed)
  };
  let tokens = null, core = null;
  const getToken = (refresh) => tokens.getToken(refresh);
  const coreFor = () => window.ARSTEN_CORE || core || (core = B.coreClient(ArstenAccess.coreBase(state.project.location), getToken));
  const fetchFor = () => window.ARSTEN_FETCH || ((...a) => fetch(...a));

  // ---------- render ----------
  function render() {
    document.documentElement.lang = lang;
    $("selLang").value = lang;
    $("title").textContent = t("title");
    $("hint").textContent = state.writable ? t("hint") : t("readOnly");
    $("form").hidden = !state.writable;
    $("form").classList.toggle("editing", !!state.editing);
    $("lblText").textContent = t("textLbl");
    $("inText").placeholder = t("ph");
    $("lblDate").textContent = t("dateLbl"); $("inDate").title = t("dateLbl");
    $("inDate").max = today();
    $("lblClient").textContent = t("forClient");
    $("txtPhotos").textContent = "📷 " + t("photos");
    const n = state.picked.length;
    $("pickInfo").textContent = n ? `${n} ${t(n === 1 ? "photos1" : "photosN")}` : "";
    $("btnSave").textContent = t(state.editing ? "save" : "add");
    $("btnCancel").textContent = t("cancel"); $("btnCancel").hidden = !state.editing;
    const busy = state.busy || !state.loaded;
    for (const id of ["btnSave", "inText", "inDate", "chkClient", "inPhotos", "btnCancel"]) $(id).disabled = id === "btnSave" ? busy : state.busy;
    $("btnViewerClose").textContent = t("close");
    renderList();
  }
  function weekTitle(week) {
    if (!week) return t("planned");
    const end = AV.addDays(week, 6);
    const cur = AV.weekOf(today()) === week ? ` · ${t("thisWeek")}` : "";
    const [, m1, d1] = week.split("-");
    return `${t("week")} ${lang === "bg" ? `${d1}.${m1}` : fmtDate(week).replace(/ \d{4}$/, "")} – ${fmtDate(end)}${cur}`;
  }
  function renderList() {
    if (!state.loaded) {
      $("list").innerHTML = state.err ? `<p class="sub">${esc(`${t("err")}: ${errText(state.err)}`)} <button class="small secondary" data-act="retry" data-id="">${esc(t("retry"))}</button></p>`
        : `<p class="sub">${esc(t("loading"))}</p>`;
      $("btnOlder").hidden = true;
      return;
    }
    const groups = AV.byWeek(state.items);
    const dated = groups.filter((g) => g.week);
    const shown = groups.filter((g) => !g.week).concat(dated.slice(0, state.weeks));
    const busy = state.busy || !state.writable;
    const btn = (act, id, label, title, extra, aria) => `<button class="secondary" data-act="${act}" data-id="${esc(id)}" title="${esc(title)}" aria-label="${esc(aria || title)}"${extra || ""}${busy ? " disabled" : ""}>${esc(label)}</button>`;
    const tag = (x) => (x.client && !x.date ? t("later") : "");   // "само вътрешно" is on the toggle itself
    const thumb = (x, p) => {
      const url = state.urls.get(p.id);
      const img = url ? `<img src="${esc(url)}" alt="${esc(p.name)}" loading="lazy" data-act="view" data-id="${esc(p.id)}" data-photo="${esc(p.id)}">` : `<span class="sub" style="display:block;padding:4px">${url === "" ? esc(t("noPhoto")) : "…"}</span>`;
      return `<span class="thumb">${img}${state.writable ? `<button class="secondary" data-act="rmphoto" data-id="${esc(x.id)}" data-photo="${esc(p.id)}" title="${esc(t("rmPhoto"))}" aria-label="${esc(t("rmPhoto"))}"${busy ? " disabled" : ""}>×</button>` : ""}</span>`;
    };
    const row = (x) => `<li class="${x.date ? "" : "open"}${state.editing === x.id ? " editing" : ""}">
      <div class="hd"><span class="d">${esc(x.date ? fmtDate(x.date) : t("open"))}</span>
      <span class="txt">${esc(x.text)}${tag(x) ? ` <span class="sub">(${esc(tag(x))})</span>` : ""}</span></div>
      ${x.photos.length ? `<div class="thumbs">${x.photos.map((p) => thumb(x, p)).join("")}</div>` : ""}
      ${state.writable ? `<div class="acts">${x.date ? "" : btn("done", x.id, t("doneShort"), t("doneToday"))}${btn("edit", x.id, t("edit"), t("edit"))}${btn("client", x.id, x.client ? t("isClient") : t("isInternal"), x.client ? t("hideClient") : t("showClient"), ` aria-pressed="${x.client}"`, t("forClient"))}${x.photos.length < AV.PHOTOS_MAX ? btn("morephoto", x.id, t("addPhoto"), t("addPhotoT")) : ""}${btn("del", x.id, t("del2"), t("del"))}</div>` : ""}
    </li>`;
    $("list").innerHTML = shown.length ? shown.map((g) => `<div class="wk"><h2>${esc(weekTitle(g.week))}</h2><ul class="act">${g.items.map(row).join("")}</ul></div>`).join("")
      : `<p class="sub" style="margin-top:12px">${esc(t("none"))}</p>`;
    $("btnOlder").textContent = t("older");
    $("btnOlder").hidden = dated.length <= state.weeks;
    loadThumbs(shown.flatMap((g) => g.items));
  }
  /** A thumbnail that did not load (an expired signed URL in a panel left open): ask for a fresh URL once. */
  const retried = new Set();
  function imgFailed(fileId) {
    if (!fileId) return;
    if (retried.has(fileId)) { state.urls.set(fileId, ""); renderList(); return; }
    retried.add(fileId); state.urls.delete(fileId); renderList();
  }
  /** Download URLs of the shown photos, a few at a time; each is asked once per panel open. */
  let thumbRun = null;
  function loadThumbs(items) {
    const want = items.flatMap((x) => x.photos.map((p) => p.id)).filter((id) => !state.urls.has(id));
    if (!want.length || thumbRun) return;
    for (const id of want) state.urls.set(id, undefined);
    thumbRun = (async () => {
      await PH.mapLimit(want, 4, async (id) => {
        try { state.urls.set(id, (await AV.photoUrl(coreFor(), id)) || ""); } catch (e) { console.warn("photo url", e); state.urls.set(id, ""); }
      });
    })().finally(() => { thumbRun = null; renderList(); });
  }

  // ---------- data ----------
  async function refresh() {
    state.err = null; render();
    try { const r = await AV.load(coreFor(), state.project.id, fetchFor()); state.items = r.items; state.loaded = true; }
    catch (e) { state.err = e; console.warn("activities not read", e); }
    render();
  }
  const ERR = { text: "badText", date: "badDate", gone: "gone", full: "full", photos: "tooMany", conflict: "conflict" };
  const errMsg = (k) => t(ERR[k] || "badText").replace("{n}", AV.PHOTOS_MAX);
  /** One change: read afresh, apply, upload. Returns true when it went through (also when nothing changed). */
  async function change(op) {
    const r = await AV.change({ core: coreFor(), projectId: state.project.id, op, today: today(), fetch: fetchFor() });
    state.items = r.items; state.loaded = true;
    if (r.error) { setStatus(errMsg(r.error), true); return false; }
    if (r.changed) setStatus(`${t("saved")}: ${AV.FOLDER.join("/")}/${AV.FILE}`);
    return true;
  }
  async function withBusy(fn) {
    if (state.busy || !state.writable) return false;
    state.busy = true; render();
    try { return await fn(); } finally { state.busy = false; render(); }
  }
  /** Resize and upload photos to _AM_Docs/Activities/Photos/<day>/ (the entry's day, or today for a planned entry). */
  async function uploadPhotos(files, day) {
    const out = [], cache = new Map();
    let k = 0;
    for (const f of files) {
      k++;
      setStatus(`${t("uploading")} ${k} / ${files.length}…`);
      try {
        const img = await PH.prepareImage(f);
        out.push(await AV.uploadPhoto({ core: coreFor(), projectId: state.project.id, blob: img.blob, day: day || today(), fetch: fetchFor(), folderCache: cache }));
      } catch (e) { console.warn("photo upload", e); const err = new Error(`${t("photoFail")} (${f.name}): ${errText(e)}`); err.shown = true; throw err; }
    }
    return out;
  }
  function resetForm() {
    state.editing = null; state.editFrom = null; state.picked = [];
    $("inText").value = ""; $("inDate").value = today(); $("chkClient").checked = state.addClient !== false;
    $("inPhotos").value = "";
  }
  async function submit() {
    const text = $("inText").value, date = $("inDate").value || "";
    if (!String(text).trim()) { setStatus(t("badText"), true); $("inText").focus(); return; }
    if (date && (!AV.realDay(date) || date > today())) { setStatus(t("badDate"), true); return; }
    const editing = state.editing && state.items.find((x) => x.id === state.editing);
    if (state.editing && !editing) { setStatus(t("gone"), true); resetForm(); render(); return; }
    const base = editing ? editing.photos.length : 0;
    if (base + state.picked.length > AV.PHOTOS_MAX) { setStatus(errMsg("photos"), true); return; }
    const ok = await withBusy(async () => {
      const photos = state.picked.length ? await uploadPhotos(state.picked, date) : [];
      if (editing) {
        const e = { id: editing.id }, from = state.editFrom || editing;
        if (AV.parse([{ id: "x", text }])[0].text !== from.text) e.text = text;
        if (date !== from.date) e.date = date;
        if ($("chkClient").checked !== from.client) e.client = $("chkClient").checked;
        if (photos.length) e.addPhotos = photos;
        if (Object.keys(e).length === 1) return true;   // nothing changed
        return change({ edit: e });
      }
      state.addClient = $("chkClient").checked;
      return change({ add: { text, date, client: state.addClient, photos } });
    });
    if (ok) { resetForm(); render(); $("inText").focus(); }
  }
  async function action(act, id, el) {
    if (act === "retry") return refresh();
    if (act === "view") return openPhoto(id);
    const x = state.items.find((i) => i.id === id);
    if (!x) return;
    if (act === "done") return withBusy(() => change({ edit: { id, date: today() } }));
    if (act === "client") return withBusy(() => change({ edit: { id, client: !x.client } }));
    if (act === "rmphoto") {
      if (!window.confirm(t("rmPhotoQ"))) return;
      return withBusy(() => change({ edit: { id, removePhoto: el.dataset.photo } }));
    }
    if (act === "morephoto") { state.moreFor = id; $("inMore").value = ""; $("inMore").click(); return; }
    if (act === "del") {
      const q = `${t("delQ")}\n\n${x.date ? fmtDate(x.date) + " · " : ""}${x.text}${x.photos.length ? "\n\n" + t("delQPhotos") : ""}`;
      if (!window.confirm(q)) return;
      const ok = await withBusy(() => change({ remove: id }));
      if (ok && state.editing === id) { resetForm(); render(); }
      return;
    }
    if (act === "edit") {
      if (!state.editing && (String($("inText").value).trim() || state.picked.length) && !window.confirm(t("unsaved"))) return;
      if (!state.editing) state.addClient = $("chkClient").checked;
      state.editing = id; state.editFrom = { text: x.text, date: x.date, client: x.client };
      state.picked = []; $("inPhotos").value = "";
      $("inText").value = x.text; $("inDate").value = x.date; $("chkClient").checked = x.client;
      render();
      $("inText").focus();
      if ($("form").scrollIntoView) $("form").scrollIntoView({ block: "nearest" });
    }
  }
  async function addMorePhotos(files) {
    const id = state.moreFor; state.moreFor = null;
    const x = state.items.find((i) => i.id === id);
    if (!x || !files.length) return;
    if (x.photos.length + files.length > AV.PHOTOS_MAX) { setStatus(errMsg("photos"), true); return; }
    await withBusy(async () => change({ edit: { id, addPhotos: await uploadPhotos(files, x.date) } }));
  }
  function openPhoto(fileId) {
    const url = state.urls.get(fileId);
    if (!url) return;
    $("viewerImg").src = url; $("viewer").hidden = false;
  }

  // ---------- events ----------
  $("btnSave").onclick = () => guarded(submit);
  $("btnCancel").onclick = () => { resetForm(); render(); };
  const key = (e) => { if (e.key === "Enter") { e.preventDefault(); guarded(submit); } else if (e.key === "Escape" && state.editing) { resetForm(); render(); } };
  $("inText").onkeydown = key; $("inDate").onkeydown = key;
  $("inPhotos").onchange = (e) => { state.picked = [...((e.target && e.target.files) || [])]; render(); };
  $("inMore").onchange = (e) => guarded(() => addMorePhotos([...((e.target && e.target.files) || [])]));
  $("list").onclick = (e) => { const b = e.target && e.target.closest && e.target.closest("[data-act]"); return b ? guarded(() => action(b.dataset.act, b.dataset.id, b)) : undefined; };
  $("btnOlder").onclick = () => { state.weeks += WEEKS_SHOWN; renderList(); };
  $("btnViewerClose").onclick = () => { $("viewer").hidden = true; $("viewerImg").src = ""; };
  $("viewer").onclick = () => $("btnViewerClose").onclick();   // a tap anywhere closes (the photo fills a phone)
  document.onkeydown = (e) => { if (e.key === "Escape" && !$("viewer").hidden) $("btnViewerClose").onclick(); };
  $("list").addEventListener && $("list").addEventListener("error", (e) => { const im = e.target; if (im && im.tagName === "IMG") imgFailed(im.dataset.photo); }, true);
  $("selLang").onchange = (e) => {
    lang = I18N ? I18N.setLang(e.target.value) : e.target.value === "en" ? "en" : "bg";
    if (!I18N) { try { localStorage.setItem(LANG_KEY, lang); } catch {} }
    render();
  };

  // ---------- start ----------
  async function pickLanguage(api, access) {
    if (storedLang) return;
    let l = "";
    try { const s = await api.user.getSettings(); l = (s && s.language) || ""; } catch {}
    if (!l) l = (access && access.user && access.user.language) || "";
    if (l) lang = /^bg/i.test(l) ? "bg" : "en";
  }
  async function start(api) {
    state.api = api;
    const demo = window.ARSTEN_DEMO;
    tokens = tokens || ArstenAccess.tokenGetter(api);
    if (window.ArstenDiag) ArstenDiag.set({ panel: "Дейности (activities)", lang: () => lang });
    const access = demo ? Object.assign({ allowed: true, user: { language: demo.language || "" } }, demo) : await ArstenAccess.check({ api, getToken, app: "activities" });
    await pickLanguage(api, access);   // before a denied screen too, so it is in the user's language
    if (!access.allowed) { ArstenAccess.renderDenied(document.body, lang, access); return; }
    state.access = access;
    state.writable = demo ? demo.writable !== false : ArstenAccess.canWrite(access);
    state.project = (await api.project.getProject()) || {};
    if (window.ArstenDiag && !demo) ArstenDiag.set({ panel: "Дейности (activities)", projectId: state.project.id, lang: () => lang });
    $("inDate").value = today();
    $("main").hidden = false;
    setStatus(state.project.name || "");
    await refresh();
  }
  window.ActivitiesApp = { start, state, refresh };

  if (window.parent === window) {
    if (/[?&]demo\b/.test(location.search)) { const s = document.createElement("script"); s.src = "demo.js?t=" + Date.now(); document.body.appendChild(s); }
    else setStatus(I18N ? I18N.word("notInside", lang) : "Not inside Trimble Connect.", true);
    return;
  }
  if (I18N) setStatus(I18N.word("connecting", lang));
  TrimbleConnectWorkspace.connect(window.parent, (event, data) => { if (tokens) tokens.onEvent(event, data); }, 30000)
    .then((api) => start(api))
    .catch((e) => setStatus((I18N ? I18N.word("connectFail", lang) : "Could not connect to Trimble Connect") + ": " + errText(e), true));
})();
