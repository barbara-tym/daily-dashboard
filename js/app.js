let timerTick = null;
let lastMilestone = 0;
let audioContext = null;

function formatCurrentDate(date) { return new Intl.DateTimeFormat("pl-PL", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(date); }
function formatClock(date) { return new Intl.DateTimeFormat("pl-PL", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(date); }
function renderClock() { const now = new Date(); document.querySelector("#current-date").textContent = formatCurrentDate(now); document.querySelector("#current-time").textContent = formatClock(now); }
function formatTimer(seconds) { const n = Math.max(0, Math.floor(seconds)); return [Math.floor(n / 3600), Math.floor(n % 3600 / 60), n % 60].map(x => String(x).padStart(2, "0")).join(":"); }
function activeElapsed() { return appData.activeSession ? Math.max(0, Math.floor((Date.now() - appData.activeSession.startedAt) / 1000)) : 0; }
function playMilestoneSound() {
    try {
        const Audio = window.AudioContext || window.webkitAudioContext; if (!Audio) return;
        audioContext ||= new Audio(); if (audioContext.state === "suspended") audioContext.resume();
        const now = audioContext.currentTime;
        [523.25, 659.25].forEach((frequency, i) => { const oscillator = audioContext.createOscillator(), gain = audioContext.createGain(); oscillator.type = "sine"; oscillator.frequency.value = frequency; gain.gain.setValueAtTime(0.0001, now + i * 0.13); gain.gain.exponentialRampToValueAtTime(0.07, now + i * 0.13 + 0.025); gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.13 + 0.18); oscillator.connect(gain); gain.connect(audioContext.destination); oscillator.start(now + i * 0.13); oscillator.stop(now + i * 0.13 + 0.19); });
    } catch (error) { console.warn("Dźwięk przypomnienia jest niedostępny:", error); }
}
function renderActivitySections() {
    const root = document.getElementById("activity-sections");
    ACTIVITY_GROUPS.forEach(group => {
        const section = document.createElement("section"); section.className = "section activity-section"; section.id = `section-${group.id}`;
        const header = document.createElement("div"); header.className = "section-header"; header.innerHTML = `<div><p class="section-label">${group.label}</p><h2 class="section-title">${group.title}</h2></div><p class="section-intro">Komentarz opisze tę konkretną sesję. Możesz zatrzymywać i uruchamiać licznik wiele razy.</p>`; section.append(header);
        const grid = document.createElement("div"); grid.className = "activities-grid";
        group.activities.forEach(([id, name, icon]) => {
            const card = document.createElement("article"); card.className = "activity-card"; card.dataset.activity = id;
            const top = document.createElement("div"); top.className = "activity-card__top"; top.innerHTML = `<span class="activity-icon" aria-hidden="true">${icon}</span><span class="timer-card__status" data-status="${id}">Gotowy</span>`;
            const title = document.createElement("h3"); title.textContent = name;
            const totalLabel = document.createElement("p"); totalLabel.className = "activity-total-label"; totalLabel.textContent = "Dzisiaj";
            const display = document.createElement("p"); display.className = "activity-time"; display.dataset.display = id; display.textContent = "00:00:00";
            if (MEAL_IDS.includes(id)) {
                const eaten = document.createElement("button"); eaten.type = "button"; eaten.className = "meal-eaten-toggle"; eaten.dataset.mealEaten = id; eaten.setAttribute("aria-pressed", "false"); eaten.textContent = "Oznacz jako zjedzony"; card.append(top, title, totalLabel, display, eaten);
            }
            const inputLabel = document.createElement("label"); inputLabel.className = "comment-label"; inputLabel.htmlFor = `comment-${id}`; inputLabel.textContent = "Czym się zajmujesz?";
            const input = document.createElement("input"); input.className = "activity-comment"; input.id = `comment-${id}`; input.dataset.comment = id; input.type = "text"; input.maxLength = 160; input.autocomplete = "off"; input.placeholder = "Dodaj komentarz do sesji";
            const actions = document.createElement("div"); actions.className = "timer-card__actions";
            const start = document.createElement("button"); start.type = "button"; start.className = "button button--primary"; start.dataset.start = id; start.textContent = "Start";
            const stop = document.createElement("button"); stop.type = "button"; stop.className = "button button--secondary"; stop.dataset.stop = id; stop.textContent = "Stop"; stop.disabled = true;
            actions.append(start, stop); if (MEAL_IDS.includes(id)) card.append(inputLabel, input, actions); else card.append(top, title, totalLabel, display, inputLabel, input, actions); grid.append(card);
        });
        section.append(grid); root.append(section);
    });
}
function startActivity(id) {
    if (appData.activeSession || !ACTIVITY_BY_ID[id]) return;
    const input = document.querySelector(`[data-comment="${id}"]`);
    appData.activeSession = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, category: id, comment: input.value.trim(), date: getTodayKey(), startedAt: Date.now(), soundedMilestone: 0 };
    persistAppData(); renderActivities();
}
function stopActivity(reason = "manual") {
    const active = appData.activeSession; if (!active) return;
    const endedAt = Date.now(), durationSeconds = Math.max(0, Math.floor((endedAt - active.startedAt) / 1000));
    appData.sessions.push({ id: active.id, category: active.category, comment: active.comment, date: active.date, startedAt: active.startedAt, endedAt, durationSeconds, reason });
    appData.activeSession = null; persistAppData(); renderActivities(); renderCalendar();
}
function renderActivities() {
    const active = appData.activeSession, now = Date.now();
    ACTIVITY_GROUPS.flatMap(group => group.activities).forEach(([id]) => {
        const sessions = appData.sessions.filter(s => s.category === id && s.date === getTodayKey());
        const total = sessions.reduce((sum, s) => sum + (Number(s.durationSeconds) || 0), 0) + (active?.category === id ? Math.floor((now - active.startedAt) / 1000) : 0);
        const display = document.querySelector(`[data-display="${id}"]`), status = document.querySelector(`[data-status="${id}"]`), card = document.querySelector(`[data-activity="${id}"]`), start = document.querySelector(`[data-start="${id}"]`), stop = document.querySelector(`[data-stop="${id}"]`), input = document.querySelector(`[data-comment="${id}"]`);
        if (display) display.textContent = formatTimer(total);
        if (status) status.textContent = active?.category === id ? "W trakcie" : total ? "Zapisano" : "Gotowy";
        card?.classList.toggle("is-running", active?.category === id);
        if (start) start.disabled = Boolean(active);
        if (stop) stop.disabled = active?.category !== id;
        if (input) { input.disabled = active?.category === id; if (active?.category === id) input.value = active.comment; }
        const eaten = document.querySelector(`[data-meal-eaten="${id}"]`);
        if (eaten) { const checked = appData.mealLog[getTodayKey()]?.[id] === true; eaten.setAttribute("aria-pressed", String(checked)); eaten.classList.toggle("is-eaten", checked); eaten.textContent = checked ? "✓ Zjedzony dzisiaj" : "Oznacz jako zjedzony"; }
    });
}
function tick() {
    if (appData.activeSession && appData.activeSession.date !== getTodayKey()) stopActivity("day-ended");
    if (appData.activeSession) {
        const elapsed = activeElapsed(), milestone = Math.floor(elapsed / 1800);
        if (milestone > (appData.activeSession.soundedMilestone || 0)) { appData.activeSession.soundedMilestone = milestone; persistAppData(); playMilestoneSound(); }
    }
    renderClock(); renderActivities();
}
function initializeApp() {
    renderActivitySections();
    document.getElementById("activity-sections").addEventListener("click", event => {
        const start = event.target.closest("[data-start]"), stop = event.target.closest("[data-stop]");
        const eaten = event.target.closest("[data-meal-eaten]");
        if (eaten) {
            const date = getTodayKey(), id = eaten.dataset.mealEaten;
            appData.mealLog[date] ||= {};
            appData.mealLog[date][id] = appData.mealLog[date][id] !== true;
            persistAppData(); renderActivities(); renderCalendar();
        }
        if (start) startActivity(start.dataset.start); if (stop) stopActivity();
    });
    // A running session survives a refresh and is finalized when the user stops it.
    if (appData.activeSession && !ACTIVITY_BY_ID[appData.activeSession.category]) appData.activeSession = null;
    document.addEventListener("visibilitychange", () => { if (!document.hidden) tick(); });
    renderClock(); window.setInterval(renderClock, 1000); initializeCalendar(); renderActivities(); timerTick = window.setInterval(tick, 1000);
}
document.addEventListener("DOMContentLoaded", initializeApp);
