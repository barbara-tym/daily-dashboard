let calendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let selectedCalendarDate = getTodayKey();
const categoryColors = ["#7e8e73", "#b89a72", "#8c83a4", "#648c91", "#c57d67", "#b07896", "#6d91a0", "#a9a05e", "#739b8d", "#c08b59", "#8995bd", "#cb7681"];
const colorByCategory = Object.fromEntries(Object.keys(ACTIVITY_BY_ID).map((id, i) => [id, categoryColors[i % categoryColors.length]]));
function formatLongDate(dateKey) {
    const [year, month, day] = dateKey.split("-").map(Number);
    return new Intl.DateTimeFormat("pl-PL", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(year, month - 1, day));
}
function formatDuration(seconds) {
    const safe = Math.max(0, Math.floor(Number(seconds) || 0));
    const hours = Math.floor(safe / 3600), minutes = Math.floor((safe % 3600) / 60), remainder = safe % 60;
    if (hours) return `${hours} godz. ${String(minutes).padStart(2, "0")} min`;
    if (minutes) return `${minutes} min ${String(remainder).padStart(2, "0")} s`;
    return `${remainder} s`;
}
function sessionsFor(dateKey) { return appData.sessions.filter(session => session.date === dateKey).sort((a, b) => a.startedAt - b.startedAt); }
function renderLegend() {
    const legend = document.querySelector("#calendar-legend"); if (!legend) return;
    legend.replaceChildren();
    ACTIVITY_GROUPS.flatMap(group => group.activities).forEach(([id, name]) => {
        const item = document.createElement("span"), icon = document.createElement("i");
        icon.className = "legend-icon"; icon.textContent = ACTIVITY_BY_ID[id].icon; item.append(icon, document.createTextNode(name)); legend.append(item);
    });
}
function renderCalendar() {
    const grid = document.querySelector("#calendar-grid"), label = document.querySelector("#calendar-month-label"); if (!grid || !label) return;
    label.textContent = new Intl.DateTimeFormat("pl-PL", { month: "long", year: "numeric" }).format(calendarMonth);
    grid.replaceChildren();
    const year = calendarMonth.getFullYear(), month = calendarMonth.getMonth();
    const offset = (new Date(year, month, 1).getDay() + 6) % 7, days = new Date(year, month + 1, 0).getDate();
    for (let i = 0; i < offset; i++) { const blank = document.createElement("span"); blank.className = "calendar-day calendar-day--blank"; blank.setAttribute("aria-hidden", "true"); grid.append(blank); }
    for (let day = 1; day <= days; day++) {
        const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const sessions = sessionsFor(dateKey), button = document.createElement("button"); button.type = "button"; button.className = "calendar-day";
        if (dateKey === getTodayKey()) button.classList.add("calendar-day--today");
        if (dateKey === selectedCalendarDate) button.classList.add("calendar-day--selected");
        const eatenIds = Object.keys(appData.mealLog[dateKey] || {}).filter(id => appData.mealLog[dateKey][id]);
        const categoryIds = [...new Set([...sessions.map(s => s.category), ...eatenIds])].filter(id => ACTIVITY_BY_ID[id]);
        const activityDescription = categoryIds.map(id => getActivityLabel(id)).join(", ");
        button.setAttribute("aria-label", `${formatLongDate(dateKey)}${activityDescription ? `: ${activityDescription}` : sessions.length ? `, ${sessions.length} sesji` : ""}`);
        const number = document.createElement("span"); number.className = "calendar-day__number"; number.textContent = day; button.append(number);
        if (categoryIds.length) { const icons = document.createElement("span"); icons.className = "calendar-day__icons"; categoryIds.slice(0, 8).forEach(id => { const icon = document.createElement("i"); icon.className = "calendar-day__icon"; icon.textContent = ACTIVITY_BY_ID[id].icon; icon.title = getActivityLabel(id); icons.append(icon); }); button.append(icons); }
        button.addEventListener("click", () => { selectedCalendarDate = dateKey; renderCalendar(); renderSelectedDay(); }); grid.append(button);
    }
    renderSelectedDay(); renderCharts();
}
function renderSelectedDay() {
    const label = document.querySelector("#selected-day-label"), total = document.querySelector("#selected-day-total"), list = document.querySelector("#selected-day-sessions"); if (!label || !total || !list) return;
    label.textContent = formatLongDate(selectedCalendarDate);
    const sessions = sessionsFor(selectedCalendarDate); total.textContent = `${formatDuration(sessions.reduce((sum, s) => sum + (Number(s.durationSeconds) || 0), 0))} aktywności`;
    list.replaceChildren();
    if (!sessions.length) { const empty = document.createElement("p"); empty.className = "empty-state"; empty.textContent = "Nie zapisano jeszcze aktywności w tym dniu."; list.append(empty); return; }
    sessions.forEach(session => {
        const row = document.createElement("article"), marker = document.createElement("span"), body = document.createElement("div"), title = document.createElement("h4"), time = document.createElement("p"), duration = document.createElement("strong");
        row.className = "session-item"; marker.className = "session-item__marker"; marker.style.backgroundColor = colorByCategory[session.category] || "#648c91"; body.className = "session-item__body"; title.textContent = getActivityLabel(session.category); if (session.comment) title.textContent += ` — ${session.comment}`;
        time.textContent = `${new Date(session.startedAt).toLocaleTimeString("pl-PL", {hour:"2-digit",minute:"2-digit"})}–${new Date(session.endedAt).toLocaleTimeString("pl-PL", {hour:"2-digit",minute:"2-digit"})}`;
        duration.className = "session-item__duration"; duration.textContent = formatDuration(session.durationSeconds); body.append(title, time); row.append(marker, body, duration); list.append(row);
    });
}
function monthlySeconds(categoryIds, dateKey) { return appData.sessions.filter(s => s.date === dateKey && categoryIds.includes(s.category)).reduce((sum, s) => sum + (Number(s.durationSeconds) || 0), 0); }
function renderBarChart(elementId, totalId, categories, divisor, unit) {
    const chart = document.getElementById(elementId), totalElement = document.getElementById(totalId); if (!chart) return;
    chart.replaceChildren(); const year = calendarMonth.getFullYear(), month = calendarMonth.getMonth(), count = new Date(year, month + 1, 0).getDate();
    const keys = categories.map(item => item[0]), values = Array.from({length: count}, (_, i) => monthlySeconds(keys, `${year}-${String(month + 1).padStart(2,"0")}-${String(i + 1).padStart(2,"0")}`));
    const max = Math.max(...values, divisor), total = values.reduce((sum, n) => sum + n, 0);
    if (totalElement) totalElement.textContent = `${(total / divisor).toFixed(unit === "h" ? 1 : 0)} ${unit === "h" ? "godz." : "min"}`;
    values.forEach((value, i) => { const col = document.createElement("div"), bar = document.createElement("span"), day = document.createElement("small"); col.className = "chart-column"; bar.className = "chart-bar"; bar.style.height = `${value ? Math.max(4, (value / max) * 100) : 0}%`; bar.title = `${i + 1}: ${(value / divisor).toFixed(unit === "h" ? 1 : 0)} ${unit === "h" ? "godz." : "min"}`; day.textContent = i + 1; col.append(bar, day); chart.append(col); });
}
function renderMealChart() {
    const chart = document.getElementById("meal-chart"), totalElement = document.getElementById("meal-month-total"); if (!chart) return;
    chart.replaceChildren();
    const year = calendarMonth.getFullYear(), month = calendarMonth.getMonth(), count = new Date(year, month + 1, 0).getDate();
    const mealActivities = ACTIVITY_GROUPS.flatMap(group => group.activities).filter(([id]) => MEAL_IDS.includes(id));
    let total = 0;
    for (let day = 1; day <= count; day++) {
        const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const log = appData.mealLog[date] || {}, eatenCount = mealActivities.filter(([id]) => log[id]).length; total += eatenCount;
        const column = document.createElement("div"), countLabel = document.createElement("span"), icons = document.createElement("span"), dayLabel = document.createElement("small");
        column.className = "meal-chart-day"; column.title = `${day}: ${eatenCount} z ${mealActivities.length} posiłków`;
        countLabel.className = "meal-chart-count"; countLabel.textContent = `${eatenCount}/${mealActivities.length}`;
        icons.className = "meal-chart-icons";
        mealActivities.forEach(([id, name, icon]) => { const item = document.createElement("span"); item.className = `meal-chart-icon${log[id] ? " is-eaten" : ""}`; item.textContent = icon; item.title = `${name}: ${log[id] ? "zjedzony" : "niezaznaczony"}`; icons.append(item); });
        dayLabel.textContent = day; column.append(countLabel, icons, dayLabel); chart.append(column);
    }
    if (totalElement) totalElement.textContent = `${total} posiłków`;
}
function renderCharts() {
    renderMealChart();
    renderBarChart("work-chart", "work-month-total", [["work", "Praca"]], 3600, "h");
}
function initializeCalendar() {
    document.querySelector("#calendar-prev")?.addEventListener("click", () => { calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1); renderCalendar(); });
    document.querySelector("#calendar-next")?.addEventListener("click", () => { calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1); renderCalendar(); });
    renderLegend(); renderCalendar();
}
