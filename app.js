// Arsten / MULTIPLAN – Дейности (site activities, user 17.11.2026): things done on site that are not in the model, with
// photos, reported weekly ("Additional site toilets delivered", "Existing concrete has been cut and removed from site").
// Data: shared/arsten-activities.js (the list _AM_Docs/Activities/activities.json, photos _AM_Docs/Activities/Photos/<day>/).
// Who: admin and the GC side (00_ADMIN, 02.GENERAL CONTRACTOR, 02.1 PM), app "activities" in shared/arsten-access.js.
// Writing needs ArstenAccess.canWrite (a Connect project ADMIN outside those groups only reads).
// The client never opens this panel: Статус publishes the dated entries ticked "за клиента" (text, date and up to 6 photos, copied to _AM_Docs/Client/Photos).
// Every save reads the list again first and applies just that one change (arsten-activities.js change).
// Additional works (ДР, user 18.11.2026; PLAN-ACTIVITIES-ON-DRAWINGS.md phase 1): the form's "Допълнителна работа"
// switch adds an entry with a register number ДР-NNN (given at save), status, quantity + unit, drawing, page, place and
// the Connect share link of the drawing marked in Connect's own 2D viewer. "Допълнителни работи" shows the register:
// counts by status, done totals per unit, CSV for Excel and a printable list. Connect draws; this panel keeps the register.
(() => {
  "use strict";
  const AV = window.ArstenActivities, PH = window.ArstenPhotos, B = window.ArstenBackup, I18N = window.ArstenI18n;
  const $ = (id) => document.getElementById(id);
  const LANG_KEY = "arsten.activities.lang";
  const WEEKS_SHOWN = 4;

  const T = {
    title: ["Дейности", "Site activities"],
    // sweep 18.11.2026: one line (it showed ~7 lines above the form on a phone); the publishing rule sits under the checkbox
    hint: ["Работи извън модела – доставки, разбиване, временни съоръжения – със снимки.", "Work outside the model – deliveries, demolition, temporary works – with photos."],
    clientHint: ["За клиента: отива при следващото публикуване в Статус.", "For the client: goes out with the next publish in Status."],
    textLbl: ["Какво е направено", "What was done"], ph: ["напр. Доставени допълнителни тоалетни на обекта", "e.g. Additional site toilets delivered"],
    dateLbl: ["Дата", "Date"], plannedChk: ["Предстои (без дата)", "Planned (no date)"],
    forClient: ["за клиента", "for the client"], photos: ["Снимки", "Photos"], photosN: ["снимки избрани", "photos chosen"], photos1: ["снимка избрана", "photo chosen"],
    add: ["Добави", "Add"], save: ["Запази", "Save"], cancel: ["Откажи", "Cancel"],
    planned: ["Предстои", "Planned"], open: ["предстои", "planned"], week: ["Седмица", "Week"], thisWeek: ["тази седмица", "this week"],
    later: ["за клиента, щом има дата", "for the client once dated"],
    // the row shows the state as text and the button says what a tap does (it flipped a state-looking label before)
    isClient: ["За клиента ✓", "For the client ✓"], isInternal: ["Само вътрешно", "Internal only"],
    showClient: ["Покажи на клиента", "Show to client"], hideClient: ["Скрий от клиента", "Hide from client"],
    doneShort: ["Извършено днес", "Done today"], doneToday: ["Отбележи като извършено днес", "Mark as done today"],
    edit: ["Промени", "Edit"], del: ["Изтрий", "Delete"], addPhoto: ["+ снимка", "+ photo"], addPhotoT: ["Добави снимки към този запис", "Add photos to this entry"],
    rmPhoto: ["Махни снимката от записа", "Remove the photo from the entry"],
    rmPhotoQ: ["Махни снимката? (файлът се пази)", "Remove the photo? (the file is kept)"], rmGo: ["Махни", "Remove"],
    delQ: ["Да изтрия ли този запис?", "Delete this entry?"], delGo: ["Потвърди: изтрий", "Confirm: delete"], delQPhotos: ["Файловете на снимките се пазят.", "The photo files are kept."],
    none: ["Още няма записани дейности.", "No activities yet."], older: ["Покажи по-старите седмици", "Show older weeks"],
    loading: ["Зареждане…", "Loading…"], del2: ["Изтрий", "Delete"], err: ["Дейностите не се четат", "The activities cannot be read"], retry: ["Опитай пак", "Try again"],
    badText: ["Напишете какво е направено.", "Write what was done."], badDate: ["Датата не е вярна или е в бъдещето.", "The date is not valid or is in the future."],
    gone: ["Записът е изтрит междувременно от друг потребител.", "The entry was deleted meanwhile by another user."],
    full: ["Списъкът е пълен.", "The list is full."], tooMany: ["Най-много {n} снимки на запис.", "At most {n} photos per entry."],
    // sweep 18.11.2026: no paths / group codes on screen (the path goes to the diagnostics log)
    saved: ["Записано ✓", "Saved ✓"], uploading: ["Качване", "Uploading"], photoFail: ["Снимката не се качи", "Photo not uploaded"], tryAgain: ["опитайте пак", "try again"],
    readOnly: ["Само преглед. Записи добавят администраторът и ръководителите на обекта.", "View only. The admin and site managers add entries."],
    conflict: ["Някой друг записва в същия момент – опитайте пак.", "Someone else is saving at the same moment – try again."],
    unsaved: ["Във формата има незаписан нов запис. Да го изоставя ли?", "The form holds a new entry that is not saved. Discard it?"],
    discard: ["Изостави", "Discard"], goBack: ["Върни се", "Go back"],
    close: ["Затвори", "Close"], noPhoto: ["снимката не се зарежда", "photo not loading"],
    // sweep 18.11.2026: one primary button per row, the rest behind "Още…" (five 40 px buttons wrapped onto 2-3 lines
    // per entry on a phone and buried the text and photos the PM scans before publishing)
    more: ["Още…", "More…"], moreT: ["Още действия за този запис", "More actions for this entry"],
    // sweep 18.11.2026: the picked photos are shown before Добави and one can be dropped (a wrong / private pick from the gallery)
    addMore: ["Добави още", "Add more"], unpick: ["Махни", "Remove"],
    // sweep 18.11.2026 (3): load errors in plain words (a raw "no access to the folder _AM_Docs/Activities" or "Core GET
    // …: 503" said nothing about what to do), and an Обнови button
    noAccess: ["Нямате достъп до папката с дейности – помолете администратора.", "No access to the activities folder – ask the admin."],
    damaged: ["Файлът със списъка е повреден – възстановете предишна версия в Connect.", "The list file is damaged – restore an earlier version in Connect."],
    refresh: ["Обнови", "Refresh"], refreshT: ["Прочети списъка отново", "Read the list again"],
    // sweep 18.11.2026 (3): an entry the client already got (its photos copied to the client's folder by a publish in
    // Статус): hiding it, removing a photo or deleting it also deletes those copies. The text of reports published so
    // far stays (Статус keeps every published day); the sentence says so instead of promising more.
    published: ["Вече е публикувано{d}: снимките се махат и от папката на клиента. Текстът остава в отчетите, публикувани досега.",
      "Already published{d}: the photos are removed from the client's folder too. The text stays in the reports published so far."],
    hideQ: ["Да скрия ли записа от клиента?", "Hide the entry from the client?"], hideGo: ["Скрий", "Hide"],
    pubGone: ["Махнато и от папката на клиента ✓", "Removed from the client's folder too ✓"],
    // sweep 18.11.2026 (4): the inline question shows at once while the client's folder is looked up (it took 1-3 s with
    // no reaction on a phone, and a second tap started a second lookup)
    // sweep 18.11.2026 (4): a client entry publishes its text word for word (summary and printed report): no internal
    // Connect links (a view / ToDo link names its title and assignee) in it
    noLink: ["Махнете линка от текста – клиентът вижда текста. Пазете линка в ToDo или изгледа.", "Remove the link from the text – the client sees the text. Keep the link in the ToDo or the view."],
    checking: ["Проверявам какво е публикувано…", "Checking what was published…"],
    pubFail: ["Записано, но снимките в папката на клиента не се махнаха – помолете администратора.", "Saved, but the photos in the client's folder were not removed – ask the admin."],
    // additional works (ДР, user 18.11.2026)
    kindAct: ["Дейност", "Activity"], kindExtra: ["Допълнителна работа", "Additional work"],
    kindT: ["Вид на записа", "Kind of entry"],
    textLblX: ["Каква допълнителна работа", "What additional work"], phX: ["напр. Изкоп за кабел извън проекта", "e.g. Cable trench outside the design"],
    qtyLbl: ["Количество", "Quantity"], unitLbl: ["Мярка", "Unit"], sheetLbl: ["Чертеж", "Drawing"], sheetPh: ["напр. ST-DR-0101 R02", "e.g. ST-DR-0101 R02"],
    pageLbl: ["Стр.", "Page"], whereLbl: ["Място", "Place"], wherePh: ["напр. ос А-3, кота +3.20", "e.g. grid A-3, level +3.20"],
    todoLbl: ["Задача в Connect с отбелязания чертеж", "Connect ToDo with the marked drawing"], todoNone: ["– без задача –", "– no ToDo –"],
    todoLoading: ["зареждане на задачите…", "loading the ToDos…"], todoFail: ["задачите не се четат", "the ToDos cannot be read"], todoReload: ["Обнови задачите", "Reload the ToDos"],
    todoMeta: ["задача", "ToDo"], openTodoT: ["Отваря задачата с отбелязания чертеж в Connect (нов раздел)", "Opens the ToDo with the marked drawing in Connect (new tab)"],
    orphans: ["Задачи „ДР“ в Connect без запис тук:", "\"ДР\" ToDos in Connect not in the register:"], adopt: ["Добави", "Add"], adoptT: ["Добави тази задача като допълнителна работа", "Add this ToDo as an additional work"],
    linkLbl: ["Или връзка към изглед в Connect (по желание)", "Or a link to a Connect view (optional)"], linkPh: ["https://web.connect.trimble.com/…", "https://web.connect.trimble.com/…"],
    linkHint: ["Отворете PDF чертежа от Data (не от 3D), оградете мястото (облак + текст) и го запазете като задача (ToDo) „ДР – …“. После я изберете тук.",
      "Open the PDF drawing from Data (not the 3D viewer), mark the place (cloud + text) and save it as a ToDo \"ДР – …\". Then pick it here."],
    clientHintX: ["Допълнителна работа отива при клиента само ако е отметната и изпълнена – само номер и текст.",
      "An additional work goes to the client only when ticked and done – number and text only."],
    badQty: ["Количеството трябва да е число ≥ 0.", "The quantity must be a number ≥ 0."],
    badLink: ["Връзката трябва да е от Connect (https://…connect.trimble.com/…).", "The link must be a Connect link (https://…connect.trimble.com/…)."],
    numbered: ["Допълнителна работа с номер не се изтрива – откажете я.", "A numbered additional work is not deleted – reject it."],
    savedNo: ["записана ✓", "saved ✓"],
    st_pending: ["Чака одобрение", "Awaiting approval"], st_approved: ["Одобрена", "Approved"], st_doing: ["В изпълнение", "In progress"],
    st_done: ["Изпълнена", "Done"], st_rejected: ["Отказана", "Rejected"],
    stp_pending: ["Чакат одобрение", "Awaiting approval"], stp_approved: ["Одобрени", "Approved"], stp_doing: ["В изпълнение", "In progress"],
    stp_done: ["Изпълнени", "Done"], stp_rejected: ["Отказани", "Rejected"],
    go_approved: ["Одобри", "Approve"], go_doing: ["Започната", "Started"], go_done: ["Изпълнена", "Done"], go_pending: ["Върни за одобрение", "Back to approval"],
    go_rejected: ["Откажи работата", "Reject the work"],
    keepIt: ["Не, остави я", "No, keep it"],
    rejQ: ["Да откажа ли {no}? Номерът остава в регистъра.", "Reject {no}? The number stays in the register."], rejGo: ["Потвърди: откажи", "Confirm: reject"],
    openConnect: ["Отвори в Connect", "Open in Connect"], openConnectT: ["Отваря отбелязания чертеж в Connect (нов раздел)", "Opens the marked drawing in Connect (new tab)"],
    viewAll: ["Всички", "All"], viewExtra: ["Допълнителни работи", "Additional works"], allStatus: ["всички", "all"],
    regNone: ["Още няма допълнителни работи. Превключете формата на „Допълнителна работа“.", "No additional works yet. Switch the form to \"Additional work\"."],
    doneSum: ["Изпълнени общо", "Done in total"], csv: ["CSV (Excel)", "CSV (Excel)"], print: ["Печат", "Print"],
    regTitle: ["Регистър на допълнителните работи", "Register of additional works"], page: ["стр.", "p."],
    hNo: ["№", "No"], hDate: ["Дата", "Date"], hWork: ["Работа", "Work"], hStatus: ["Състояние", "Status"], hSince: ["От", "Since"],
    hQty: ["Количество", "Quantity"], hUnit: ["Мярка", "Unit"], hSheet: ["Чертеж", "Drawing"], hPage: ["Стр.", "Page"], hWhere: ["Място", "Place"],
    hLink: ["Връзка", "Link"], hTodo: ["Задача", "ToDo"], hClient: ["За клиента", "For the client"], yes: ["да", "yes"], no: ["не", "no"],
    badUnit: ["Изберете мярка от списъка.", "Pick a unit from the list."],
    stale: ["Някой друг го промени междувременно – списъкът е обновен, вижте и опитайте пак.", "Someone else changed it meanwhile – the list is refreshed; check it and try again."], badPage: ["Страницата е число от 1 до 9999.", "The page is a number from 1 to 9999."],
    dateLblX: ["Дата на изпълнение", "Date done"], plannedChkX: ["Още не е изпълнена", "Not done yet"],
    unit_pcs: ["бр.", "pcs"], unit_set: ["к-т", "set"], unit_t: ["т", "t"], unit_kg: ["кг", "kg"], unit_h: ["ч", "h"],
  };
  const storedLang = I18N ? I18N.stored([LANG_KEY]) : "";
  let lang = storedLang || "bg";
  const t = (k) => (T[k] ? T[k][lang === "bg" ? 0 : 1] : k);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pad = (n) => String(n).padStart(2, "0");
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  const fmtDate = (d) => { if (!d) return ""; if (I18N) return I18N.fmtDate(d, lang); const [y, m, dd] = d.split("-"); return `${dd}.${m}.${y}`; };
  const errText = (e) => (e && (e.message || e.toString())) || String(e);
  /** A unit as shown: м² / m³ … in the language (AV.UNITS has the stored keys). */
  const unitText = (u) => (T["unit_" + u] ? t("unit_" + u) : (AV.UNITS && AV.UNITS[u]) || u || "");
  const qtyText = (q, u) => (q == null ? "" : `${lang === "bg" ? String(q).replace(".", ",") : q} ${unitText(u)}`.trim());
  // sweep 18.11.2026: a status may be a function of the language, so a language switch re-renders it (as pour-status
  // relabelStatus); a plain string (the project name) stays as it is.
  let statusAgain = null;
  function setStatus(text, bad) {
    statusAgain = typeof text === "function" ? { text, bad } : null;
    $("status").textContent = typeof text === "function" ? text() : text; $("status").className = "status" + (bad ? " bad" : "");
  }
  const relabelStatus = () => { if (statusAgain) setStatus(statusAgain.text, statusAgain.bad); if (window.ArstenDiag && ArstenDiag.relabel) ArstenDiag.relabel(); };
  // Result of a write, also shown at the bottom near the finger (as pour-status / Стомана): the status line sits at the
  // top, out of sight when the user scrolled down to a week. Stays in the DOM (screen readers); errors use role="alert".
  let toastTimer = null;
  function toast(text, bad) {
    const el = $("toast");
    if (!el || !text) return;
    if (el.setAttribute) el.setAttribute("role", bad ? "alert" : "status");
    el.textContent = text;
    el.className = "toast show " + (bad ? "bad" : "ok");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.className = "toast"; el.textContent = ""; }, bad ? 8000 : 4000);
    if (toastTimer && toastTimer.unref) toastTimer.unref();   // node tests: a pending toast must not hold the process
  }
  /** Status line + toast; text is a string or a function of the language. */
  function report(text, bad) { setStatus(text, bad); toast($("status").textContent, bad); }
  async function guarded(fn) {
    try { return await fn(); }
    catch (e) { report(e && e.shown ? e.shown : () => (I18N ? I18N.err(errText(e), lang) : "Грешка: " + errText(e)), true); console.error(e); }
  }

  const state = {
    api: null, project: null, access: null, writable: false,
    items: [], loaded: false, err: null, busy: false, weeks: WEEKS_SHOWN,
    // sweep 18.11.2026: "for the client" is opt-in (an internal remark typed on site went to the client by default);
    // the last choice is kept for this panel session only, never stored.
    editing: null, editFrom: null, addClient: false, picked: [],  // picked: File objects for the entry in the form
    uploaded: new Map(),                                          // picked File -> {id, name} already uploaded (a retried Save skips it)
    addId: null,                                                  // id of the new entry, fixed at the first Save until the form resets (a retry is recognised)
    moreFor: null,                                                // the entry "+ снимка" is adding photos to
    moreUploaded: new Map(),                                      // entry id -> Map(photo key -> {id, name}) uploaded by a failed "+ снимка"
    ask: null,                                                    // the inline question under a row: {id, q: () => text, go, no, goCls, resolve}
    urls: new Map(),                                              // photo file id -> download URL (or "" while loading / failed)
    actsOpen: null,                                               // the entry whose "Още…" bar is open (one at a time)
    pickUrls: new Map(),                                          // picked File -> object URL of its preview (revoked when dropped)
    // sweep 18.11.2026 (4): the list as last read or saved, with its folder, file and version ({items, folderId, fileId,
    // version, versionId}). AV.change checks that version with ONE call and starts from this list instead of listing
    // the folder and downloading activities.json again before every tap (~3 serial round trips, ~1 s on site 4G).
    base: null,
    checking: null,                                               // the entry whose client copies are being looked up (Скрий от клиента)
    kind: "act",                                                  // the form adds an activity ("act") or an additional work ("extra")
    view: "all", stFilter: "",                                    // the list: all entries by week, or the register of additional works (one status or all)
    todos: null, todosErr: null, todosBusy: false,                // the project's Connect ToDos [{id, no, title, status}] for the ДР form (read on demand)
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
    const ex = state.kind === "extra";
    $("lblText").textContent = t(ex ? "textLblX" : "textLbl");
    $("inText").placeholder = t(ex ? "phX" : "ph");
    renderKind();
    $("lblDate").textContent = t(ex ? "dateLblX" : "dateLbl"); $("inDate").title = t(ex ? "dateLblX" : "dateLbl");
    $("inDate").max = today();
    $("lblPlanned").textContent = t(ex ? "plannedChkX" : "plannedChk");
    $("lblClient").textContent = t("forClient");
    $("clientHint").textContent = t(ex ? "clientHintX" : "clientHint");
    const n = state.picked.length;
    $("txtPhotos").textContent = "📷 " + t(n ? "addMore" : "photos");
    $("pickInfo").textContent = n ? `${n} ${t(n === 1 ? "photos1" : "photosN")}` : "";
    renderPicked();
    $("btnSave").textContent = t(state.editing ? "save" : "add");
    $("btnCancel").textContent = t("cancel"); $("btnCancel").hidden = !state.editing;
    const busy = state.busy || !state.loaded;
    for (const id of ["btnSave", "inText", "inDate", "chkPlanned", "chkClient", "inPhotos", "btnCancel", "inQty", "selUnit", "inSheet", "inPage", "inWhere", "inLink", "selTodo"]) $(id).disabled = id === "btnSave" ? busy : state.busy;
    if ($("chkPlanned").checked) $("inDate").disabled = true;   // planned = no date (clearing a native date field is fiddly on a phone)
    $("btnViewerClose").textContent = t("close");
    const rb = $("btnRefresh");
    if (rb) { rb.textContent = t("refresh"); rb.title = t("refreshT"); rb.disabled = state.busy || !state.project; }
    renderList();
  }
  /** The form's kind switch and the additional-work fields (the switch is fixed while an entry is edited). */
  function renderKind() {
    const ex = state.kind === "extra", fixed = !!state.editing || state.busy;
    const kb = (id, k, label) => { const b = $(id); b.textContent = t(label); b.className = "small" + (state.kind === k ? "" : " secondary"); if (b.setAttribute) b.setAttribute("aria-pressed", String(state.kind === k)); b.disabled = fixed; };
    kb("btnKindAct", "act", "kindAct"); kb("btnKindExtra", "extra", "kindExtra");
    if ($("kindBar").setAttribute) $("kindBar").setAttribute("aria-label", t("kindT"));
    $("extraBox").hidden = !ex;
    $("lblQty").textContent = t("qtyLbl"); $("lblUnit").textContent = t("unitLbl"); $("lblSheet").textContent = t("sheetLbl");
    $("lblPage").textContent = t("pageLbl"); $("lblWhere").textContent = t("whereLbl"); $("lblLink").textContent = t("linkLbl");
    $("inSheet").placeholder = t("sheetPh"); $("inWhere").placeholder = t("wherePh"); $("inLink").placeholder = t("linkPh");
    $("linkHint").textContent = t("linkHint");
    renderTodoSelect();
    const u = $("selUnit").value || "";
    $("selUnit").innerHTML = `<option value="">–</option>` + Object.keys(AV.UNITS || {}).map((k) => `<option value="${esc(k)}">${esc(unitText(k))}</option>`).join("");
    $("selUnit").value = u;
  }
  /** "Всички | Допълнителни работи (N)" over the list, and in the register: status chips, done totals, CSV, Печат. */
  function renderViewBar() {
    const reg = AV.register(state.items), n = reg.items.length;
    const vb = (id, v, label) => { const b = $(id); b.textContent = label; b.className = "small" + (state.view === v ? "" : " secondary"); if (b.setAttribute) b.setAttribute("aria-pressed", String(state.view === v)); };
    $("viewBar").hidden = !state.loaded;
    vb("btnViewAll", "all", t("viewAll")); vb("btnViewExtra", "extra", `${t("viewExtra")} (${n})`);
    const on = state.loaded && state.view === "extra";
    $("regBar").hidden = !on;
    if (!on) return;
    const chip = (k, label, c) => `<button type="button" class="small${state.stFilter === k ? "" : " secondary"} st${k ? " st-" + k : ""}" data-st="${esc(k)}" aria-pressed="${state.stFilter === k}">${esc(label)}${c == null ? "" : ` ${c}`}</button>`;
    $("regChips").innerHTML = chip("", t("allStatus"), n) + AV.STATUSES.filter((k) => reg.counts[k]).map((k) => chip(k, t("stp_" + k), reg.counts[k])).join("");
    const sums = Object.keys(reg.done).map((u) => qtyText(reg.done[u], u));
    $("regSum").textContent = sums.length ? `${t("doneSum")}: ${sums.join(", ")}` : "";
    $("btnCsv").textContent = t("csv"); $("btnPrint").textContent = t("print");
    $("btnCsv").disabled = $("btnPrint").disabled = !n;
    renderOrphans();
  }
  // ---------- Connect ToDos (live test 18.11.2026: a ToDo has no share link; the panel lists them instead) ----------
  /** The address Connect opens a ToDo at (checked live: web.connect.trimble.com/projects/<project>/todo/<id>). */
  const todoUrl = (id) => `https://web.connect.trimble.com/projects/${encodeURIComponent((state.project && state.project.id) || "")}/todo/${encodeURIComponent(id)}`;
  const DR_TITLE = /^\s*ДР(?![\p{L}\p{N}])/iu;   // not \b: it is ASCII-only and never matches after Cyrillic
  /** Read the project's ToDos once (and on "Обнови задачите"): [{id, no, title, status}], "ДР…" first, open before closed. */
  async function loadTodos(force) {
    if (state.todosBusy || (state.todos && !force) || !state.project) return;
    state.todosBusy = true; state.todosErr = null; renderTodoSelect();
    try {
      // Range: the legacy Core lists page (206) without it; 1000 ToDos in one answer, as arsten-access.js asks for members
      const r = await coreFor().req(`todos?projectId=${encodeURIComponent(state.project.id)}`, "GET", undefined, { headers: { Range: "items=0-999" } });
      const list = (Array.isArray(r) ? r : (r && (r.items || r.data)) || []).filter((x) => x && /^[A-Za-z0-9_-]{1,80}$/.test(String(x.id || "")));
      const st = (x) => String((x.objectStatusDto && x.objectStatusDto.label) || x.status || "").toUpperCase();
      state.todos = list.map((x) => ({ id: String(x.id), no: String(x.label || "").slice(0, 30), title: String(x.title || "").slice(0, 200), status: st(x) }))
        .sort((a, b) => (DR_TITLE.test(b.title) - DR_TITLE.test(a.title)) || ((a.status === "CLOSED") - (b.status === "CLOSED")) || b.no.localeCompare(a.no, undefined, { numeric: true }));
    } catch (e) { console.warn("todos not read", e); state.todosErr = e; }
    finally { state.todosBusy = false; render(); }
  }
  /** The ToDo list of the ДР form (the entry's own ToDo stays listed while it is edited, even when closed / not read). */
  function renderTodoSelect() {
    const sel = $("selTodo");
    if (!sel) return;
    // the chosen ToDo is kept in state.todoCur, not read back from the <select>: a browser drops a value that has no
    // <option> yet (a closed ToDo, ToDos still loading or not readable), and the next save then unlinked it (review)
    const cur = state.todoCur || "", list = (state.todos || []).filter((x) => x.status !== "CLOSED" || x.id === cur);
    if (cur && !list.some((x) => x.id === cur)) list.unshift({ id: cur, no: state.todoNoKeep || "", title: "" });
    const first = state.todosBusy ? t("todoLoading") : state.todosErr ? t("todoFail") : t("todoNone");
    sel.innerHTML = `<option value="">${esc(first)}</option>` + list.map((x) => `<option value="${esc(x.id)}">${esc([x.no, x.title].filter(Boolean).join(" · "))}</option>`).join("");
    sel.value = cur;
    $("lblTodo").textContent = t("todoLbl");
    $("btnTodoReload").textContent = "↻"; $("btnTodoReload").title = t("todoReload"); if ($("btnTodoReload").setAttribute) $("btnTodoReload").setAttribute("aria-label", t("todoReload"));
  }
  /** "ДР…" ToDos in Connect (open) that no entry here points to: listed over the register with Добави. */
  function renderOrphans() {
    const el = $("regOrphans");
    if (!el) return;
    const used = new Set(state.items.filter(AV.isExtra).map((x) => x.extra.todo).filter(Boolean));
    const list = state.writable ? (state.todos || []).filter((x) => DR_TITLE.test(x.title) && x.status !== "CLOSED" && !used.has(x.id)) : [];
    el.hidden = !list.length;
    el.innerHTML = list.length ? `<span class="sub">${esc(t("orphans"))}</span> ` + list.map((x) => `<button type="button" class="small secondary" data-todo="${esc(x.id)}" title="${esc(t("adoptT"))}">${esc(`${t("adopt")}: ${x.no} ${x.title}`.trim())}</button>`).join(" ") : "";
  }
  /** A ToDo picked (in the form or with Добави): the text is filled from its title when the text is still empty. */
  function pickTodo(id) {
    const x = (state.todos || []).find((y) => y.id === id);
    state.todoCur = id || ""; state.todoNoKeep = x ? x.no : "";
    $("selTodo").value = state.todoCur;
    // the text from the title; "ДР – " in front is dropped only when it is the word ДР ("Дренаж" stays whole, review)
    if (x && !String($("inText").value || "").trim()) $("inText").value = (DR_TITLE.test(x.title) ? x.title.replace(/^\s*ДР(?![\p{L}\p{N}])\s*[-–—:.]*\s*/iu, "").trim() : "") || x.title;
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
      $("list").innerHTML = state.err ? `<p class="sub">${esc(`${t("err")}: ${loadErrText(state.err)}`)} <button class="small secondary" data-act="retry" data-id="">${esc(t("retry"))}</button></p>`
        : `<p class="sub">${esc(t("loading"))}</p>`;
      $("btnOlder").hidden = true;
      return;
    }
    renderViewBar();
    const regView = state.view === "extra";
    const groups = regView ? [{ week: "reg", items: AV.register(state.items).items.filter((x) => !state.stFilter || x.extra.status === state.stFilter) }].filter((g) => g.items.length)
      : AV.byWeek(state.items);
    const dated = regView ? [] : groups.filter((g) => g.week);
    const shown = regView ? groups : groups.filter((g) => !g.week).concat(dated.slice(0, state.weeks));
    const busy = state.busy || !state.writable;
    const btn = (act, id, label, title, cls) => `<button class="secondary${cls ? " " + cls : ""}" data-act="${act}" data-id="${esc(id)}" title="${esc(title)}" aria-label="${esc(title)}"${busy ? " disabled" : ""}>${esc(label)}</button>`;
    const photoBtn = (x) => (x.photos.length < AV.PHOTOS_MAX ? btn("morephoto", x.id, t("addPhoto"), t("addPhotoT")) : "");
    // one row = the state chip, ONE primary button (Извършено днес for a planned entry, else + снимка) and "Още…"; the
    // other actions open under the row tapped, one row at a time, Изтрий last (sweep 18.11.2026)
    // an additional work: its next step is the one button (Одобри → Започната → Изпълнена; Върни for a rejected one);
    // Откажи, Отвори в Connect and the rest under "Още…"; never Изтрий (a register number is never freed)
    const NEXT = { pending: "approved", approved: "doing", doing: "done", rejected: "pending" };
    const stBtn = (x, st) => `<button class="secondary${st === "rejected" ? " del" : ""}" data-act="status" data-id="${esc(x.id)}" data-st="${esc(st)}"${busy ? " disabled" : ""}>${esc(t("go_" + st))}</button>`;
    const linkBtn = (x) => {
      const url = x.extra.todo ? todoUrl(x.extra.todo) : x.extra.link;
      return url ? `<a class="btnlink" href="${esc(url)}" target="_blank" rel="noopener noreferrer" title="${esc(t(x.extra.todo ? "openTodoT" : "openConnectT"))}">${esc(t("openConnect"))}</a>` : "";
    };
    const actsX = (x) => {
      const open = state.actsOpen === x.id, st = x.extra.status;
      const more = `<button class="secondary more" data-act="more" data-id="${esc(x.id)}" title="${esc(t("moreT"))}" aria-label="${esc(t("moreT"))}" aria-expanded="${open}">${esc(t("more"))}</button>`;
      const main = `<div class="acts"><span class="sub cl${x.client ? " on" : ""}">${esc(x.client ? t("isClient") : t("isInternal"))}</span>${NEXT[st] ? stBtn(x, NEXT[st]) : photoBtn(x)}${more}</div>`;
      if (!open) return main;
      return main + `<div class="acts extra">${btn("edit", x.id, t("edit"), t("edit"))}${btn("client", x.id, x.client ? t("hideClient") : t("showClient"), x.client ? t("hideClient") : t("showClient"))}${linkBtn(x)}${NEXT[st] ? photoBtn(x) : ""}${st !== "rejected" && st !== "done" ? stBtn(x, "rejected") : ""}</div>`;
    };
    const acts = (x) => {
      if (AV.isExtra(x)) return actsX(x);
      const open = state.actsOpen === x.id;
      const more = `<button class="secondary more" data-act="more" data-id="${esc(x.id)}" title="${esc(t("moreT"))}" aria-label="${esc(t("moreT"))}" aria-expanded="${open}">${esc(t("more"))}</button>`;
      const main = `<div class="acts"><span class="sub cl${x.client ? " on" : ""}">${esc(x.client ? t("isClient") : t("isInternal"))}</span>${x.date ? photoBtn(x) : btn("done", x.id, t("doneShort"), t("doneToday"))}${more}</div>`;
      if (!open) return main;
      return main + `<div class="acts extra">${btn("edit", x.id, t("edit"), t("edit"))}${btn("client", x.id, x.client ? t("hideClient") : t("showClient"), x.client ? t("hideClient") : t("showClient"))}${x.date ? "" : photoBtn(x)}${btn("del", x.id, t("del2"), t("del"), "del")}</div>`;
    };
    const tag = (x) => (x.client && !x.date ? t("later") : "");   // "само вътрешно" is on the toggle itself
    // sweep 18.11.2026: the tile shows the ~25 KB thumbnail (p.thumbId) and a tap opens the photo (data-id = p.id);
    // older photos without a thumbnail, or a thumbnail that does not load, show the photo itself
    const thumb = (x, p) => {
      const sid = shownId(p), url = state.urls.get(sid);
      const img = url ? `<img src="${esc(url)}" alt="${esc(p.name)}" loading="lazy" data-act="view" data-id="${esc(p.id)}" data-photo="${esc(sid)}" data-full="${esc(p.id)}">` : `<span class="sub" style="display:block;padding:4px"${url === "" ? "" : ` data-want="${esc(sid)}"`}>${url === "" ? esc(t("noPhoto")) : "…"}</span>`;
      return `<span class="thumb">${img}${state.writable ? `<button class="secondary" data-act="rmphoto" data-id="${esc(x.id)}" data-photo="${esc(p.id)}" title="${esc(t("rmPhoto"))}" aria-label="${esc(t("rmPhoto"))}"${busy ? " disabled" : ""}>×</button>` : ""}</span>`;
    };
    const head = (x) => (AV.isExtra(x) ? `<span class="no">${esc(AV.extraNo(x.extra.no))}</span> <span class="st st-${esc(x.extra.status)}">${esc(t("st_" + x.extra.status))}</span> ` : "");
    const meta = (x) => {
      if (!AV.isExtra(x)) return "";
      const e = x.extra, bits = [];
      if (e.sheet || e.page) bits.push(`📄 ${[e.sheet, e.page ? `${t("page")} ${e.page}` : ""].filter(Boolean).join(" · ")}`);
      if (e.where) bits.push(e.where);
      if (e.todoNo) bits.push(`${t("todoMeta")} ${e.todoNo}`);
      if (e.qty != null) bits.push(qtyText(e.qty, e.unit));
      if (e.since) bits.push(`${t("st_" + e.status)} ${fmtDate(e.since)}`);
      return bits.length ? `<div class="meta sub">${esc(bits.join(" · "))}</div>` : "";
    };
    const row = (x) => `<li class="${x.date ? "" : "open"}${state.editing === x.id ? " editing" : ""}${AV.isExtra(x) ? " xw" : ""}">
      <div class="hd"><span class="d">${esc(x.date ? fmtDate(x.date) : t("open"))}</span>
      <span class="txt">${head(x)}${esc(x.text)}${tag(x) ? ` <span class="sub">(${esc(tag(x))})</span>` : ""}</span></div>${meta(x)}
      ${x.photos.length ? `<div class="thumbs">${x.photos.map((p) => thumb(x, p)).join("")}</div>` : ""}
      ${state.writable ? acts(x) : ""}${askBox(x)}
    </li>`;
    $("list").innerHTML = shown.length ? shown.map((g) => `<div class="wk"><h2>${esc(g.week === "reg" ? t("viewExtra") : weekTitle(g.week))}</h2><ul class="act">${g.items.map(row).join("")}</ul></div>`).join("")
      : `<p class="sub" style="margin-top:12px">${esc(t(regView ? "regNone" : "none"))}</p>`;
    $("btnOlder").textContent = t("older");
    $("btnOlder").hidden = dated.length <= state.weeks;
    loadThumbs(shown.flatMap((g) => g.items));
  }
  /** The open question under its row: the question and two buttons (the red one does it). */
  function askBox(x) {
    const a = state.ask;
    if (state.checking === x.id && (!a || a.id !== x.id)) return `<div class="ask sub" role="status">${esc(t("checking"))}</div>`;
    if (!a || a.id !== x.id) return "";
    return `<div class="ask" role="alert">${esc(a.q())}<div class="acts"><button class="${a.goCls ? "go" : "secondary"}" data-act="askgo" data-id="${esc(x.id)}">${esc(t(a.go))}</button><button class="secondary" data-act="askno" data-id="${esc(x.id)}">${esc(t(a.no))}</button></div></div>`;
  }
  /**
   * Sweep 18.11.2026: an inline question under the row instead of window.confirm. Connect's frame or the phone webview
   * can block confirm(), which then returns false at once: Изтрий, the photo × and Промени with a draft did nothing and
   * said nothing (as Статус askPub). Resolves true (the red button) or false (the other one, a new question, a reload).
   * q is a function of the language, so a language switch re-renders it.
   */
  function ask(id, q, go, no, goCls) {
    if (state.ask) answer(false);
    return new Promise((resolve) => { state.ask = { id, q, go, no, goCls, resolve }; renderList(); });
  }
  function answer(ok) {
    const a = state.ask;
    state.ask = null;
    if (a) a.resolve(ok);
    renderList();
  }
  /**
   * An image that did not load (a signed URL expired in a panel left open - the combined panel keeps this frame alive
   * while hidden): ask for a fresh URL first; only when the fresh URL fails too does a thumbnail fall back to the photo
   * and a photo show "снимката не се зарежда". Sweep 18.11.2026 (3): a failed thumbnail switched to the ~1 MB photo
   * at once and for good (every tile after a lunch break), and `retried` was a Set for the whole session, so a second
   * expiry on a panel open all day showed "no photo" for good. Now the time of the last fresh URL is kept: one older
   * than RETRY_MS is asked again (arsten-photos.js gallery: the same rule).
   */
  const RETRY_MS = 10 * 60 * 1000;
  const retriedAt = new Map();  // file id -> Date.now() of the last fresh URL asked after a failure
  const thumbBad = new Set();   // thumbnail ids whose fresh URL failed too: the tile falls back to the photo (as arsten-photos data-full)
  /** The file a tile loads: the thumbnail when there is one that works, else the photo. */
  const shownId = (p) => (p.thumbId && !thumbBad.has(p.thumbId) && state.urls.get(p.thumbId) !== "" ? p.thumbId : p.id);
  function imgFailed(fileId, fullId) {
    if (!fileId) return;
    const last = retriedAt.get(fileId);
    if (last == null || Date.now() - last > RETRY_MS) { retriedAt.set(fileId, Date.now()); state.urls.delete(fileId); renderList(); return; }
    if (fullId && fullId !== fileId) { thumbBad.add(fileId); renderList(); return; }   // a thumbnail failing again: show the photo
    state.urls.set(fileId, ""); renderList();
  }
  /**
   * Download URLs of the shown photos, URL_POOL at a time; each is asked once per panel open.
   * Sweep 18.11.2026 (4): every URL of every shown week was asked before ANY tile showed (one render at the end; 60
   * photos = ~15 rounds, 4-5 s of "…" even on the tiles in view), tiles far below the fold included. Now a tile is
   * asked for when it comes within 300 px of the view (IntersectionObserver, as Авторски надзор / arsten-photos), and
   * the list is re-drawn once per frame as URLs arrive. Without IntersectionObserver (an old webview) all are asked.
   */
  const URL_POOL = 4;
  const urlQueue = [];
  let urlActive = 0, paintAsked = false, seen = null;
  function paintSoon() {
    if (paintAsked) return;
    paintAsked = true;
    const raf = typeof window.requestAnimationFrame === "function" ? window.requestAnimationFrame.bind(window) : (f) => setTimeout(f, 16);
    raf(() => { paintAsked = false; renderList(); });
  }
  function pumpUrls() {
    while (urlActive < URL_POOL && urlQueue.length) {
      const id = urlQueue.shift();
      urlActive++;
      Promise.resolve().then(() => AV.photoUrl(coreFor(), id))
        .then((u) => { state.urls.set(id, u || ""); }, (e) => { console.warn("photo url", e); state.urls.set(id, ""); })
        .finally(() => { urlActive--; paintSoon(); pumpUrls(); });
    }
  }
  function wantUrl(id) {
    if (!id || state.urls.has(id)) return;
    state.urls.set(id, undefined);   // asked: the tile shows "…" until it is in
    urlQueue.push(id);
    pumpUrls();
  }
  function loadThumbs(items) {
    const want = new Set(items.flatMap((x) => x.photos.map(shownId)).filter((id) => !state.urls.has(id)));
    if (!want.size) return;
    const list = $("list"), IO = window.IntersectionObserver;
    if (typeof IO !== "function" || !list || typeof list.querySelectorAll !== "function") { for (const id of want) wantUrl(id); return; }
    if (seen) seen.disconnect();   // the tiles of the last render are gone
    seen = new IO((entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        seen.unobserve(en.target);
        wantUrl(en.target.dataset && en.target.dataset.want);
      }
    }, { rootMargin: "300px" });
    for (const el of list.querySelectorAll("[data-want]")) if (want.has(el.dataset.want)) seen.observe(el);
  }

  // ---------- data ----------
  /**
   * A load error in plain words (sweep 18.11.2026 (3)). No access to _AM_Docs/Activities gets its own sentence (it read
   * like a network problem); the rest goes through ArstenI18n.friendly by status / timeout. The shared load gives some
   * failures as bare texts (the 30 s read abort, "activities download 403", a listing that may be cut off), so they are
   * sorted here first; the raw text goes to the console (and "Копирай диагностика").
   */
  function loadErr(e) {
    if (!e || typeof e !== "object" || e.noAccess || e.timeout || e.code || Number(e.status)) return e;
    const msg = errText(e);
    if (e.name === "AbortError" || /\baborted\b/i.test(msg)) return Object.assign(new Error(msg), { status: 0, timeout: true });
    const m = /download (\d{3})\b/.exec(msg);
    if (m) return Object.assign(new Error(msg), { status: Number(m[1]) });
    if (/not found in a (?:long )?listing/i.test(msg)) return Object.assign(new Error(msg), { code: "FOLDER_LISTING_CUT" });
    return e;
  }
  function loadErrText(e) {
    const n = loadErr(e), msg = errText(e);
    if (n && n.noAccess) { console.warn("[error]", msg); return t("noAccess"); }
    if (AV && msg.indexOf(AV.FILE + " is not valid") === 0) { console.warn("[error]", msg); return t("damaged"); }
    return I18N && I18N.friendly ? I18N.friendly(n, lang, { refresh: "button" }) : msg;
  }
  async function refresh() {
    if (state.ask) answer(false);   // the row may be gone after the reload
    state.err = null; render();
    try {
      const r = await AV.load(coreFor(), state.project.id, fetchFor(), state.base && state.base.folderId);
      state.items = r.items; state.loaded = true; state.loadedAt = Date.now();
      keepBase(r);
    }
    catch (e) {
      console.warn("activities not read", e);
      // a list already on screen stays (Обнови / a re-read on show failed): the reason goes to the status and toast
      if (state.loaded) report(() => `${t("err")}: ${loadErrText(e)}`, true); else state.err = e;
    }
    render();
  }
  /** Обнови (and a re-read on show): not while a save runs. Read-only users may refresh too. */
  async function reload() {
    if (state.busy) return;
    state.busy = true; render();
    try { await refresh(); } finally { state.busy = false; render(); }
  }
  /**
   * Sweep 18.11.2026 (3): the list was read only at start, so a PM who opened Дейности in the morning still saw the
   * morning list in the afternoon (the combined panel keeps this frame alive while hidden). It is read again when the
   * panel is shown again - the page becomes visible, or the combined panel replays the viewer events it held while
   * this tool was hidden - if the last read is older than STALE_MS and nobody is editing, asking or saving.
   */
  const STALE_MS = 60 * 1000;
  function maybeReload() {
    if (!state.project || !state.loaded || state.busy || state.ask || state.editing || state.moreFor) return false;
    if (state.loadedAt && Date.now() - state.loadedAt < STALE_MS) return false;
    guarded(reload);
    return true;
  }
  /** A web link in the text (http(s)://… or www.…): never in the text of an entry "за клиента". */
  const hasLink = (s) => /\bhttps?:\/\/|\bwww\.[^\s]/i.test(String(s || ""));
  const ERR = { text: "badText", date: "badDate", gone: "gone", full: "full", photos: "tooMany", conflict: "conflict",
    stale: "stale", qty: "badQty", unit: "badUnit", link: "badLink", page: "badPage", numbered: "numbered", status: "conflict", op: "conflict" };
  const errMsg = (k) => t(ERR[k] || "conflict").replace("{n}", AV.PHOTOS_MAX);
  /** What the next save can start from (state.base): a read list with its file and version; else only the folder id
   *  (still saves the walk to _AM_Docs/Activities); else nothing. */
  function keepBase(r) {
    if (r && r.fileId && r.version && Array.isArray(r.items)) state.base = { items: r.items, folderId: r.folderId || null, fileId: r.fileId, version: r.version, versionId: r.versionId || "" };
    else state.base = r && r.folderId ? { folderId: r.folderId } : null;
  }
  /** One change: apply it to the newest list and upload. Returns true when it went through (also when nothing changed).
   *  The shared change() decides whether state.base is still the newest (its version) or the list is read afresh. */
  async function change(op) {
    const b = state.base, full = b && b.fileId ? b : undefined;
    let r;
    try { r = await AV.change({ core: coreFor(), projectId: state.project.id, op, today: today(), fetch: fetchFor(), base: full, folderId: (b && b.folderId) || undefined }); }
    catch (e) { state.base = b && b.folderId ? { folderId: b.folderId } : null; throw e; }   // the state after a failed save is not known
    state.items = r.items; state.loaded = true; state.loadedAt = Date.now();   // a save reads the list afresh
    // r.base: the list just saved (or read) with its version; none (a conflict, an unchecked save) -> the next tap reads afresh
    state.base = r.base ? Object.assign({ folderId: r.folderId || null }, r.base) : (r.folderId ? { folderId: r.folderId } : null);
    if (r.error) { report(() => errMsg(r.error), true); return false; }
    if (r.changed) { report(() => t("saved")); console.info("activities saved:", `${AV.FOLDER.join("/")}/${AV.FILE}`); }   // the path for the diagnostics only
    return true;
  }
  // ---------- what the client already has (sweep 18.11.2026 (3)) ----------
  // A publish in Статус copies the photos of entries "за клиента" to _AM_Docs/Client/Photos/<YYYY-MM>/act-<source id>.jpg
  // (arsten-activities.js copyForClient; 01.CLIENT reads that folder). "Скрий от клиента", × on a photo and Изтрий only
  // changed activities.json, so the client kept the photos. Now the copies of the photos concerned are found the way
  // copyForClient finds them (the same names, only files whose current version a trusted publisher or this user
  // uploaded - a planted file of that name is not ours to delete) and deleted after the change is saved.
  const itemsOf = (r) => (Array.isArray(r) ? r : (r && (r.items || r.data)) || []);
  const normS = (s) => String(s == null ? "" : s).trim().toLowerCase();
  const groupKeyOf = (n) => (window.ArstenAccess && ArstenAccess.groupKey ? normS(ArstenAccess.groupKey(n)) : normS(n).replace(/^\d+(?:[.,]\d+)*\s*[.)\-_:]?\s*/, ""));
  let trustedP = null;
  /** The users allowed to publish for the client: AV.trustedPublishers when the shared module exports it, else the same
   *  rule read here (Connect project ADMINs + the groups ADMIN and EXECUTION PROJECT MANAGER, as arsten-activities.js
   *  trustedPublishers and client-summary.js trustedUploaders - change together). Read once per panel open. */
  function trustedPublishers() {
    if (trustedP) return trustedP;
    const core = coreFor(), pid = encodeURIComponent(state.project.id);
    trustedP = (AV.trustedPublishers ? AV.trustedPublishers(core, state.project.id) : (async () => {
      const [users, groups] = await Promise.all([core.req(`projects/${pid}/users`), core.req(`groups?projectId=${pid}`)]);
      const mine = itemsOf(groups).filter((g) => g && g.id && ["admin", "execution project manager"].includes(groupKeyOf(g.name)));
      const members = await Promise.all(mine.map((g) => core.req(`groups/${encodeURIComponent(g.id)}/users`)));
      return [...itemsOf(users).filter((u) => u && normS(u.role) === "admin"), ...members.flatMap(itemsOf)].filter(Boolean)
        .map((u) => ({ id: u.id || "", email: u.email || "", tiduuid: u.tiduuid || "" }));
    })()).catch((e) => { trustedP = null; throw e; });
    return trustedP;
  }
  const sameUser = (a, b) => !!a && !!b && ((a.id && b.id && a.id === b.id) || (a.email && b.email && normS(a.email) === normS(b.email))
    || (a.tiduuid && b.tiduuid && a.tiduuid === b.tiduuid));
  const uploaderOf = (it) => { const u = it && (it.modifiedBy || it.createdBy); return u && typeof u === "object" ? { id: u.id || u.userId || "", email: u.email || "", tiduuid: u.tiduuid || u.tidUuid || "" } : null; };
  /**
   * The client copies of some photos of entry x: [{id, name, on: "YYYY-MM-DD" or ""}]. Only for a dated entry "за
   * клиента" (nothing else is ever published). photos: the entry's photos concerned ({id, thumbId?}). Best effort: a
   * lookup that fails (no read on _AM_Docs/Client, offline) gives [] - the change itself goes on as before.
   */
  async function clientCopies(x, photos) {
    if (!x || !x.client || !x.date || !photos.length || !AV.CLIENT_FOLDER || !AV.clientName) return [];
    try {
      const core = coreFor();
      const fid = await B.findFolder(core, state.project.id, AV.CLIENT_FOLDER.concat([x.date.slice(0, 7)]));
      if (!fid) return [];
      const l = await B.listFolder(core, fid);
      const bases = photos.flatMap((p) => [p.id, p.thumbId]).filter(Boolean).map((id) => AV.clientName(id));
      // act-<id>.jpg or a fresh copy act-<id>.<random>.jpg (as copyForClient isCopyOf)
      const isCopy = (name) => bases.some((b) => name === b || (name.startsWith(b.slice(0, -4) + ".") && /^\.[a-z0-9]+\.jpg$/.test(name.slice(b.length - 4))));
      const same = itemsOf(l.items).filter((y) => y && y.id && isCopy(String(y.name || "")) && String(y.type || "FILE").toUpperCase() !== "FOLDER");
      if (!same.length) return [];
      const trusted = (await trustedPublishers()).concat(state.me ? [state.me] : []);
      return same.filter((y) => { const by = uploaderOf(y); return !!by && trusted.some((u) => sameUser(u, by)); })
        .map((y) => ({ id: y.id, name: y.name, on: String(y.createdOn || y.createdTime || y.modifiedOn || "").slice(0, 10) }));
    } catch (e) { console.warn("client copies not looked up", e); return []; }
  }
  /** "Вече е публикувано на 12.11.2026: …" for the copies found (the earliest copy = the first publish). */
  function publishedNote(copies) {
    const days = copies.map((c) => c.on).filter((d) => AV.realDay(d)).sort();
    return t("published").replace("{d}", days.length ? (lang === "bg" ? " на " : " on ") + fmtDate(days[0]) : "");
  }
  /** The client copies looked up in the background while the inline question already shows: note() is "" (nothing
   *  published), the checking line while it runs, or the published note; the open question is re-drawn when it is back. */
  function lookCopies(id, x, photos) {
    if (!x || !x.client || !x.date || !photos.length) return { done: Promise.resolve([]), note: () => "" };
    let found = null;
    const done = clientCopies(x, photos).then((c) => { found = c; if (state.ask && state.ask.id === id) renderList(); return c; });
    return { done, note: () => (found == null ? "\n" + t("checking") : found.length ? "\n" + publishedNote(found) : "") };
  }
  /** Delete the copies; true when all went (a copy already gone counts as gone). */
  async function withdrawCopies(copies) {
    let ok = true;
    for (const c of copies) {
      try { await coreFor().req(`files/${encodeURIComponent(c.id)}`, "DELETE"); }
      catch (e) { if (!(e && e.status === 404)) { ok = false; console.warn("client copy not deleted", c.name, e); } }
    }
    if (copies.length) report(() => t(ok ? "pubGone" : "pubFail"), !ok);
    return ok;
  }
  async function withBusy(fn) {
    if (state.busy || !state.writable) return false;
    state.busy = true; render();
    try { return await fn(); } finally { state.busy = false; render(); }
  }
  /**
   * Resize and upload photos to _AM_Docs/Activities/Photos/<day>/ (the entry's day, or today for a planned entry).
   * done (Map File -> {id, name}, optional): photos uploaded by an earlier try. Sweep 18.11.2026: one failed photo
   * threw away the ones already uploaded (orphan files) and a second Save uploaded them all again (mobile data on
   * site); now each success is kept and skipped on the next try. Keyed by name + size + date of the file, not the File
   * object: a phone's picker hands new File objects when the same photos are picked again ("+ снимка" retry).
   */
  const photoKey = (f) => (f && typeof f === "object" ? [f.name, f.size, f.lastModified].join("|") : String(f));
  /*
   * Sweep 18.11.2026 (4): the photos went up strictly one after another (resize, initiate, PUT ~1 MB, commit, thumbnail,
   * then the next), 5 photos = 5 times the wait on site mobile data. Now up to PH.UPLOAD_POOL photos upload at once,
   * sharing one day-folder lookup (folderCache), and the next photo is resized while the ones before are on the
   * network. Only ONE image is prepared at a time (PH.oneAtATime): iOS has a total canvas memory limit. The output keeps
   * the picked order; after the first failure no new upload starts and the failure is reported as before.
   */
  async function uploadPhotos(files, day, done) {
    const out = new Array(files.length), cache = new Map();
    const prepare = PH.oneAtATime ? PH.oneAtATime((f) => PH.prepareImage(f)) : (f) => PH.prepareImage(f);
    const todo = [];
    files.forEach((f, i) => { const had = done && done.get(photoKey(f)); if (had) out[i] = had; else todo.push(i); });
    let fails = null, sent = 0;
    const say = () => { const n = Math.min(files.length, files.length - todo.length + sent + 1); report(() => `${t("uploading")} ${n} / ${files.length}…`); };
    const one = async (i) => {
      if (fails) return;   // a photo failed: no new upload starts
      const f = files[i];
      try {
        const img = await prepare(f);
        if (fails) return;
        say();
        const up = await AV.uploadPhoto({ core: coreFor(), projectId: state.project.id, blob: img.blob, thumb: img.thumb || null, day: day || today(), fetch: fetchFor(), folderCache: cache });
        sent++;
        if (done) done.set(photoKey(f), up);   // kept even when another photo fails: a retry skips it
        out[i] = up;
      } catch (e) {
        console.warn("photo upload", f && f.name, e);   // the reason goes to the diagnostics; the screen says what to do
        if (!fails) fails = f;
      }
    };
    const pool = Math.max(1, Math.min(3, (PH && PH.UPLOAD_POOL) || 2));
    if (PH && PH.mapLimit) await PH.mapLimit(todo, pool, one); else for (const i of todo) await one(i);
    if (fails) {
      const f = fails, shown = () => `${t("photoFail")} (${f.name}) – ${t("tryAgain")}`;
      const err = new Error(shown()); err.shown = shown; throw err;
    }
    return out;
  }
  // ---------- picked photos: previews with × (sweep 18.11.2026) ----------
  /** Object URL of a picked photo's preview; "" where the browser makes none (node tests, an odd File). */
  function pickUrl(f) {
    if (state.pickUrls.has(f)) return state.pickUrls.get(f);
    let u = "";
    try { const U = window.URL; if (U && U.createObjectURL && f && typeof f === "object") u = U.createObjectURL(f); } catch { u = ""; }
    state.pickUrls.set(f, u);
    return u;
  }
  /** Replace the picked list; previews of photos no longer picked are freed (a phone photo is a few MB in memory). */
  function setPicked(files) {
    state.picked = files;
    for (const [f, u] of state.pickUrls) {
      if (files.includes(f)) continue;
      state.pickUrls.delete(f);
      try { if (u && window.URL && window.URL.revokeObjectURL) window.URL.revokeObjectURL(u); } catch {}
    }
  }
  /** Photos picked again are added to the list (the same photo once): "📷 Добави още" picks more. */
  function addPicked(files) {
    const have = new Set(state.picked.map(photoKey));
    setPicked(state.picked.concat(files.filter((f) => { const k = photoKey(f); if (have.has(k)) return false; have.add(k); return true; })));
  }
  function renderPicked() {
    const el = $("pickList");
    if (!el) return;
    el.hidden = !state.picked.length;
    el.innerHTML = state.picked.map((f, i) => {
      const u = pickUrl(f), name = (f && f.name) || "";
      const img = u ? `<img src="${esc(u)}" alt="${esc(name)}">` : `<span class="sub" style="display:block;padding:4px;overflow:hidden">${esc(name)}</span>`;
      return `<span class="thumb pk">${img}<button type="button" class="secondary" data-act="unpick" data-i="${i}" title="${esc(t("unpick"))}" aria-label="${esc(`${t("unpick")}: ${name}`)}"${state.busy ? " disabled" : ""}>×</button></span>`;
    }).join("");
  }
  function resetForm() {
    state.editing = null; state.editFrom = null; setPicked([]); state.uploaded = new Map(); state.addId = null;
    if (state.kindBefore) { state.kind = state.kindBefore; state.kindBefore = null; }   // back to the kind chosen before Промени
    // review 18.11.2026: a new additional work starts "not done yet" (no date): its date is the day it was DONE, set by Изпълнена
    $("inText").value = ""; $("inDate").value = today(); $("chkPlanned").checked = state.kind === "extra";
    $("chkClient").checked = state.kind === "extra" ? false : state.addClient === true;   // an additional work: never for the client by default
    $("inPhotos").value = "";
    for (const id of ["inQty", "selUnit", "inSheet", "inPage", "inWhere", "inLink", "selTodo"]) $(id).value = "";
    state.todoCur = "";
    state.todoNoKeep = "";
  }
  /** The additional-work fields of the form: {qty, unit, sheet, page, where, link} (as typed; checked by AV.apply). */
  const extraForm = () => ({ qty: String($("inQty").value || "").trim(), unit: $("selUnit").value || "", sheet: $("inSheet").value || "",
    page: String($("inPage").value || "").trim(), where: $("inWhere").value || "", link: String($("inLink").value || "").trim(),
    todo: state.todoCur || "", todoNo: (((state.todos || []).find((x) => x.id === state.todoCur) || {}).no) || (state.todoCur ? state.todoNoKeep || "" : "") });
  /** Switch the form between an activity and an additional work (not while editing). */
  function setKind(k) {
    if (state.editing || state.busy || state.kind === k) return;
    if (state.kind === "act") state.addClient = $("chkClient").checked;
    state.kind = k;
    state.addId = null;   // review 18.11.2026: a retry id of the other kind would make apply() take this save for "already added"
    $("chkClient").checked = k === "extra" ? false : state.addClient === true;
    $("chkPlanned").checked = k === "extra";
    render();
    if (k === "extra") loadTodos();
  }
  async function submit() {
    const text = $("inText").value, date = $("chkPlanned").checked ? "" : $("inDate").value || "";
    if (!String(text).trim()) { report(() => t("badText"), true); $("inText").focus(); return; }
    if (date && (!AV.realDay(date) || date > today())) { report(() => t("badDate"), true); return; }
    if ($("chkClient").checked && hasLink(text)) { report(() => t("noLink"), true); $("inText").focus(); return; }
    const ex = state.kind === "extra" ? extraForm() : null;
    if (ex && ex.qty && isNaN(AV.cleanQty(ex.qty))) { report(() => t("badQty"), true); $("inQty").focus(); return; }
    if (ex && ex.link && !AV.cleanLink(ex.link)) { report(() => t("badLink"), true); $("inLink").focus(); return; }
    if (ex && ex.page && !/^[1-9]\d{0,3}$/.test(ex.page)) { report(() => t("badPage"), true); $("inPage").focus(); return; }
    const editing = state.editing && state.items.find((x) => x.id === state.editing);
    if (state.editing && !editing) { report(() => t("gone"), true); resetForm(); render(); return; }
    const base = editing ? editing.photos.length : 0;
    if (base + state.picked.length > AV.PHOTOS_MAX) { report(() => errMsg("photos"), true); return; }
    // a stable id for a new entry: a retry after an unclear failure (the upload landed but its answer was lost) is
    // then recognised by apply() as "already added" instead of making a second entry
    if (!editing && !state.addId) state.addId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);   // as arsten-activities.js newId
    const ok = await withBusy(async () => {
      const photos = state.picked.length ? await uploadPhotos(state.picked, date, state.uploaded) : [];
      if (editing) {
        const e = { id: editing.id }, from = state.editFrom || editing;
        if (AV.parse([{ id: "x", text }])[0].text !== from.text) e.text = text;
        if (date !== from.date) e.date = date;
        if ($("chkClient").checked !== from.client) e.client = $("chkClient").checked;
        if (photos.length) e.addPhotos = photos;
        if (ex && AV.isExtra(editing)) {
          // only the extra fields that changed (another person's status change meanwhile is kept)
          const was = (state.editFrom && state.editFrom.extra) || editing.extra, cmp = AV.parse([{ id: "x", text: "x", extra: Object.assign({ no: 1 }, ex) }])[0].extra, patch = {};
          for (const k of ["qty", "unit", "sheet", "page", "where", "link", "todo", "todoNo"]) if (cmp[k] !== was[k]) patch[k] = ex[k];
          if (Object.keys(patch).length) e.extra = patch;
        }
        if (Object.keys(e).length === 1) return true;   // nothing changed
        // "за клиента" unticked in the edit row: the same as "Скрий от клиента" (sweep 18.11.2026 (3)); the copies sit
        // in the month of the date the entry had when it was published.
        // Sweep 18.11.2026 (4): the same when the date of a published entry moves to another month or back to planned:
        // the copies stayed in the old month's folder for good (readable by 01.CLIENT), the next publish copied the photos
        // again into the new month, and a later Скрий / Изтрий looked only there. They are looked up in the OLD month
        // (editing still has the old date) and withdrawn after the save.
        const moved = e.date !== undefined && !!editing.date && (!e.date || e.date.slice(0, 7) !== editing.date.slice(0, 7));
        const copies = e.client === false || moved ? await clientCopies(editing, editing.photos) : [];
        const done = await change({ edit: e });
        if (done && copies.length) await withdrawCopies(copies);
        return done;
      }
      if (ex) {
        const id = state.addId, done = await change({ add: { id, text, date, client: $("chkClient").checked === true, photos, extra: ex } });
        const it = done && state.items.find((x) => x.id === id);
        if (it && AV.isExtra(it)) report(() => `${AV.extraNo(it.extra.no)} ${t("savedNo")}`);
        return done;
      }
      state.addClient = $("chkClient").checked === true;
      return change({ add: { id: state.addId, text, date, client: state.addClient, photos } });
    });
    if (ok) { resetForm(); render(); $("inText").focus(); }
  }
  async function action(act, id, el) {
    if (act === "retry") return refresh();
    if (act === "view") return openPhoto(id);
    if (act === "askgo" || act === "askno") return answer(act === "askgo");
    const x = state.items.find((i) => i.id === id);
    if (!x) return;
    if (act === "more") { state.actsOpen = state.actsOpen === id ? null : id; return renderList(); }
    if (act === "done") return withBusy(() => change({ edit: { id, date: today() } }));
    if (act === "status" && AV.isExtra(x)) {
      const st = el && el.dataset && el.dataset.st;
      if (!AV.STATUSES.includes(st)) return;
      const e = { id, extra: { status: st }, expect: { status: x.extra.status } };   // only from the status on screen
      if (st === "done" && !x.date) e.date = today();   // done: dated today unless it has a day already
      let copies = [];
      if (st === "rejected") {
        // the client stops getting it at the next publish; photo copies it already got are taken back (as Скрий)
        const look = lookCopies(id, x, x.photos);
        if (!(await ask(id, () => t("rejQ").replace("{no}", AV.extraNo(x.extra.no)) + look.note(), "rejGo", "keepIt", true))) return;
        copies = await look.done;
      }
      state.actsOpen = null;
      const ok = await withBusy(() => change({ edit: e }));
      if (ok && copies.length) await withdrawCopies(copies);
      return;
    }
    if (state.checking) return;   // a lookup is running: a second tap does not start another
    if (act === "client") {
      if (!x.client && hasLink(x.text)) { report(() => t("noLink"), true); return; }
      // hiding an entry the client already got asks first and takes the photo copies back (sweep 18.11.2026 (3)); the
      // row says it is checking meanwhile (sweep 18.11.2026 (4))
      let copies = [];
      if (x.client && x.date && x.photos.length) {
        state.checking = id; renderList();
        try { copies = await clientCopies(x, x.photos); } finally { state.checking = null; renderList(); }
      }
      if (copies.length && !(await ask(id, () => `${t("hideQ")}\n${publishedNote(copies)}`, "hideGo", "cancel", true))) return;
      const ok = await withBusy(() => change({ edit: { id, client: !x.client, expect: { client: x.client } } }));
      if (ok && copies.length) await withdrawCopies(copies);
      return;
    }
    if (act === "rmphoto") {
      // sweep 18.11.2026 (4): the question shows at once; the published note fills in when the lookup is back
      const pid = el.dataset.photo, look = lookCopies(id, x, x.photos.filter((p) => p.id === pid));
      if (!(await ask(id, () => t("rmPhotoQ") + look.note(), "rmGo", "cancel", true))) return;
      const copies = await look.done;
      const ok = await withBusy(() => change({ edit: { id, removePhoto: pid } }));
      if (ok && copies.length) await withdrawCopies(copies);
      return;
    }
    if (act === "morephoto") { state.moreFor = id; $("inMore").value = ""; $("inMore").click(); return; }
    if (act === "del") {
      const look = lookCopies(id, x, x.photos);
      const q = () => `${t("delQ")}\n${x.date ? fmtDate(x.date) + " · " : ""}${x.text}${x.photos.length ? "\n" + t("delQPhotos") : ""}${look.note()}`;
      if (!(await ask(id, q, "delGo", "cancel", true))) return;
      const copies = await look.done;
      const ok = await withBusy(() => change({ remove: id }));
      if (ok && copies.length) await withdrawCopies(copies);
      if (ok && state.editing === id) { resetForm(); render(); }
      return;
    }
    if (act === "edit") {
      const typed = String($("inText").value).trim() || state.picked.length || (state.kind === "extra" && ["inQty", "inSheet", "inPage", "inWhere", "inLink"].some((k) => String($(k).value || "").trim()) || !!state.todoCur);
      if (!state.editing && typed && !(await ask(id, () => t("unsaved"), "discard", "goBack", true))) {
        $("inText").focus();   // "Върни се": back to the typed entry
        if ($("form").scrollIntoView) $("form").scrollIntoView({ block: "nearest" });
        return;
      }
      if (!state.editing && state.kind === "act") state.addClient = $("chkClient").checked;
      state.editing = id; state.editFrom = { text: x.text, date: x.date, client: x.client, extra: x.extra ? Object.assign({}, x.extra) : null };
      if (!state.kindBefore) state.kindBefore = state.kind;
      state.kind = AV.isExtra(x) ? "extra" : "act";
      const xe = x.extra || {};
      $("inQty").value = xe.qty == null ? "" : String(xe.qty); $("selUnit").value = xe.unit || ""; $("inSheet").value = xe.sheet || "";
      $("inPage").value = xe.page ? String(xe.page) : ""; $("inWhere").value = xe.where || ""; $("inLink").value = xe.link || "";
      state.todoNoKeep = xe.todoNo || ""; state.todoCur = xe.todo || ""; $("selTodo").value = state.todoCur;
      if (AV.isExtra(x)) loadTodos();
      setPicked([]); state.uploaded = new Map(); $("inPhotos").value = ""; state.actsOpen = null;
      $("inText").value = x.text; $("inDate").value = x.date || today(); $("chkPlanned").checked = !x.date; $("chkClient").checked = x.client === true;
      render();
      $("inText").focus();
      if ($("form").scrollIntoView) $("form").scrollIntoView({ block: "nearest" });
    }
  }
  async function addMorePhotos(files) {
    const id = state.moreFor; state.moreFor = null;
    const x = state.items.find((i) => i.id === id);
    if (!x || !files.length) return;
    if (x.photos.length + files.length > AV.PHOTOS_MAX) { report(() => errMsg("photos"), true); return; }
    // sweep 18.11.2026: the photos uploaded before a failure are kept per entry and skipped when the same photos are
    // picked again (they were uploaded again on every retry, the old ones left in Photos/<day>/ attached to nothing)
    if (!state.moreUploaded.has(id)) state.moreUploaded.set(id, new Map());
    const ok = await withBusy(async () => change({ edit: { id, addPhotos: await uploadPhotos(files, x.date, state.moreUploaded.get(id)) } }));
    if (ok) state.moreUploaded.delete(id);
  }
  /** Full view: the tile showed the thumbnail, so the photo's own URL is asked here when not known yet. */
  async function openPhoto(fileId) {
    let url = state.urls.get(fileId);
    if (!url) {
      try { url = (await AV.photoUrl(coreFor(), fileId)) || ""; } catch (e) { console.warn("photo url", e); url = ""; }
      if (url) state.urls.set(fileId, url);
    }
    if (!url) { report(() => t("noPhoto"), true); return; }
    $("viewerImg").src = url; $("viewer").hidden = false;
  }

  // ---------- the register: CSV and print (staff) ----------
  const regLabels = () => ({ lang, todoUrl, head: ["hNo", "hDate", "hWork", "hStatus", "hSince", "hQty", "hUnit", "hSheet", "hPage", "hWhere", "hLink", "hClient", "hTodo"].map(t),
    status: Object.fromEntries(AV.STATUSES.map((k) => [k, t("st_" + k)])), unit: Object.fromEntries(Object.keys(AV.UNITS).map((k) => [k, unitText(k)])), yes: t("yes"), no: t("no") });
  const fileSafe = (s) => String(s || "").replace(/[^\p{L}\p{N}._-]+/gu, "_").replace(/^_+|_+$/g, "").slice(0, 60) || "project";
  /** The register as a CSV file (Excel opens it with Cyrillic intact: BOM + ";"). */
  function downloadCsv() {
    const csv = AV.registerCsv(state.items, regLabels()), name = `DR-${fileSafe(state.project && state.project.name)}-${today()}.csv`;
    window.lastCsv = { name, csv };   // the node tests read it (no download there)
    const U = window.URL;
    if (typeof Blob !== "function" || !U || !U.createObjectURL || !document.createElement) return;
    const url = U.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })), a = document.createElement("a");
    if (!a || typeof a.click !== "function") return;
    a.href = url; a.download = name; a.rel = "noopener";
    document.body.appendChild(a); a.click();
    setTimeout(() => { try { a.remove(); U.revokeObjectURL(url); } catch {} }, 1000);
  }
  /** A printable list of the register (the shown status, or all): the browser's print dialog, "Save as PDF" for a file. */
  function printRegister() {
    const reg = AV.register(state.items), rows = reg.items.filter((x) => !state.stFilter || x.extra.status === state.stFilter).slice().reverse();
    const sums = Object.keys(reg.done).map((u) => qtyText(reg.done[u], u));
    const th = ["hNo", "hDate", "hWork", "hStatus", "hQty", "hSheet", "hWhere"].map((k) => `<th>${esc(t(k))}</th>`).join("");
    const tr = (x) => `<tr><td>${esc(AV.extraNo(x.extra.no))}</td><td>${esc(x.date ? fmtDate(x.date) : t("open"))}</td><td>${esc(x.text)}</td>
      <td>${esc(t("st_" + x.extra.status))}${x.extra.since ? `<br><span class="sub">${esc(fmtDate(x.extra.since))}</span>` : ""}</td><td>${esc(qtyText(x.extra.qty, x.extra.unit))}</td>
      <td>${esc([x.extra.sheet, x.extra.page ? `${t("page")} ${x.extra.page}` : ""].filter(Boolean).join(" · "))}</td><td>${esc(x.extra.where)}</td></tr>`;
    $("printReg").innerHTML = `<h1>${esc(t("regTitle"))}</h1><p class="sub">${esc([state.project && state.project.name, fmtDate(today()), state.stFilter ? t("stp_" + state.stFilter) : ""].filter(Boolean).join(" · "))}</p>
      <table><thead><tr>${th}</tr></thead><tbody>${rows.map(tr).join("")}</tbody></table>${sums.length ? `<p>${esc(`${t("doneSum")}: ${sums.join(", ")}`)}</p>` : ""}`;
    if (typeof window.print === "function") setTimeout(() => { try { window.print(); } catch (e) { console.warn("print", e); } }, 100);
  }

  // ---------- events ----------
  $("btnSave").onclick = () => guarded(submit);
  $("btnCancel").onclick = () => { resetForm(); render(); };
  const key = (e) => { if (e.key === "Enter") { e.preventDefault(); guarded(submit); } else if (e.key === "Escape" && state.editing) { resetForm(); render(); } };
  $("inText").onkeydown = key; $("inDate").onkeydown = key;
  $("inPhotos").onchange = (e) => {
    addPicked([...((e.target && e.target.files) || [])]);
    try { if (e.target) e.target.value = ""; } catch {}   // the same photo can be picked again after its ×
    render();
  };
  $("pickList").onclick = (e) => {
    const b = e.target && e.target.closest && e.target.closest("[data-act=unpick]");
    if (!b || state.busy) return;
    const i = Number(b.dataset.i);
    if (i >= 0 && i < state.picked.length) { setPicked(state.picked.filter((_, k) => k !== i)); render(); }
  };
  $("inMore").onchange = (e) => guarded(() => addMorePhotos([...((e.target && e.target.files) || [])]));
  $("list").onclick = (e) => { const b = e.target && e.target.closest && e.target.closest("[data-act]"); return b ? guarded(() => action(b.dataset.act, b.dataset.id, b)) : undefined; };
  $("btnOlder").onclick = () => { state.weeks += WEEKS_SHOWN; renderList(); };
  $("btnKindAct").onclick = () => setKind("act");
  $("btnKindExtra").onclick = () => setKind("extra");
  $("btnViewAll").onclick = () => { state.view = "all"; state.stFilter = ""; renderList(); };
  $("btnViewExtra").onclick = () => { state.view = "extra"; renderList(); if (state.writable) loadTodos(); };
  $("selTodo").onchange = () => pickTodo($("selTodo").value);
  $("btnTodoReload").onclick = () => loadTodos(true);
  $("regOrphans").onclick = (e) => {
    const b = e.target && e.target.closest && e.target.closest("[data-todo]");
    if (!b || state.busy || state.editing) return;
    if (state.kind !== "extra") setKind("extra");
    pickTodo(b.dataset.todo);
    $("inText").focus();
    if ($("form").scrollIntoView) $("form").scrollIntoView({ block: "nearest" });
  };
  $("regChips").onclick = (e) => { const b = e.target && e.target.closest && e.target.closest("[data-st]"); if (b) { state.stFilter = b.dataset.st || ""; renderList(); } };
  $("btnCsv").onclick = () => guarded(downloadCsv);
  $("btnPrint").onclick = () => guarded(printRegister);
  for (const id of ["inQty", "inSheet", "inPage", "inWhere", "inLink"]) $(id).onkeydown = key;
  $("btnViewerClose").onclick = () => { $("viewer").hidden = true; $("viewerImg").src = ""; };
  $("viewer").onclick = () => $("btnViewerClose").onclick();   // a tap anywhere closes (the photo fills a phone)
  document.onkeydown = (e) => { if (e.key === "Escape" && !$("viewer").hidden) $("btnViewerClose").onclick(); };
  $("list").addEventListener && $("list").addEventListener("error", (e) => { const im = e.target; if (im && im.tagName === "IMG") imgFailed(im.dataset.photo, im.dataset.full); }, true);
  $("selLang").onchange = (e) => {
    lang = I18N ? I18N.setLang(e.target.value) : e.target.value === "en" ? "en" : "bg";
    if (!I18N) { try { localStorage.setItem(LANG_KEY, lang); } catch {} }
    render();
    relabelStatus();   // "Записано ✓", "Качване 2 / 3…", errors: in the new language too (sweep 18.11.2026)
  };
  $("chkPlanned").onchange = () => render();   // disables / enables the date field
  // sweep 18.11.2026 (3): Обнови, and a re-read when the panel is shown again (maybeReload)
  if ($("btnRefresh")) $("btnRefresh").onclick = () => guarded(reload);
  if (document.addEventListener) document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") maybeReload(); });

  /** Connect events: tokens as before. Any other event means this tool is on screen - in the combined panel a hidden
   *  tool gets no viewer events, and the ones it missed are replayed when it is shown again - so a stale list is read
   *  again (maybeReload: at most once a minute, never during an edit). */
  function onEvent(event, data) {
    if (tokens) tokens.onEvent(event, data);
    if (!/^extension\./.test(String(event || ""))) maybeReload();
  }

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
    // sweep 18.11.2026: the user's name is hidden in "Копирай диагностика" (Connect error bodies carry it), as every other panel (A23)
    let user = "";
    try {
      const u = await api.user.getUser(); user = [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email || "";
      state.me = { id: u.id || "", email: u.email || "", tiduuid: u.tiduuid || "" };   // copies this user published count as trusted
    } catch {}
    if (window.ArstenDiag) ArstenDiag.set(Object.assign({ panel: "Дейности (activities)", redact: [user], lang: () => lang }, demo ? {} : { projectId: state.project.id }));
    $("inDate").value = today(); $("chkPlanned").checked = false; $("chkClient").checked = state.addClient === true;
    $("main").hidden = false;
    setStatus(state.project.name || "");
    await refresh();
    // sweep 18.11.2026 (4): who may publish for the client is read in the background now (users, groups, members), so
    // the first Скрий / Изтрий / × on a published entry costs only the client folder's listing
    if (state.writable && state.loaded && state.items.some((x) => x.client && x.date && x.photos.length)) trustedPublishers().catch((e) => console.warn("publishers not read", e));
  }
  window.ActivitiesApp = { start, state, refresh, maybeReload, onEvent };

  if (window.parent === window) {
    if (/[?&]demo\b/.test(location.search)) { const s = document.createElement("script"); s.src = "demo.js?t=" + Date.now(); document.body.appendChild(s); }
    else setStatus(I18N ? I18N.word("notInside", lang) : "Not inside Trimble Connect.", true);
    return;
  }
  if (I18N) setStatus(I18N.word("connecting", lang));
  TrimbleConnectWorkspace.connect(window.parent, onEvent, 30000)
    .then((api) => start(api))
    .catch((e) => setStatus((I18N ? I18N.word("connectFail", lang) : "Could not connect to Trimble Connect") + ": " + errText(e), true));
})();
