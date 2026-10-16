let calendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let selectedCalendarDate = getTodayKey();

const CALENDAR_ACTIVITY_CLASS = {
    "self-care": "self",
    cleaning: "cleaning",
    prayer: "prayer",
    programming: "project",
    business: "project",
    studies: "project",
    writing: "project",
    technology: "project"
};

function formatLongDate(dateKey) {
    const [year, month, day] = dateKey.split("-").map(Number);
    return new Intl.DateTimeFormat("pl-PL", {
        weekday: "long", day: "numeric", month: "long", year: "numeric"
    }).format(new Date(year, month - 1, day));
}

function formatDuration(seconds) {
    const safe = Math.max(0, Math.floor(Number(seconds) || 0));
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    if (hours && minutes) return `${hours} godz. ${minutes} min`;
    if (hours) return `${hours} godz.`;
    return `${minutes} min`;
}

function getSessionsForDate(dateKey) {
    return getAppData().activityHistory.filter(session => session.date === dateKey && session.category !== "break")
        .sort((a, b) => a.startedAt - b.startedAt);
}

function renderCalendar() {
    const grid = document.querySelector("#calendar-grid");
    const label = document.querySelector("#calendar-month-label");
    if (!grid || !label) return;

    label.textContent = new Intl.DateTimeFormat("pl-PL", {
        month: "long", year: "numeric"
    }).format(calendarMonth);

    grid.innerHTML = "";
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = getTodayKey();

    for (let i = 0; i < firstWeekday; i++) {
        const blank = document.createElement("span");
        blank.className = "calendar-day calendar-day--blank";
        blank.setAttribute("aria-hidden", "true");
        grid.appendChild(blank);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const sessions = getSessionsForDate(dateKey);
        const types = new Set(sessions.map(session => CALENDAR_ACTIVITY_CLASS[session.category]).filter(Boolean));
        const button = document.createElement("button");
        button.type = "button";
        button.className = "calendar-day";
        if (dateKey === today) button.classList.add("calendar-day--today");
        if (dateKey === selectedCalendarDate) button.classList.add("calendar-day--selected");
        button.setAttribute("aria-label", `${formatLongDate(dateKey)}${sessions.length ? `, ${sessions.length} sesji` : ""}`);
        const number = document.createElement("span");
        number.className = "calendar-day__number";
        number.textContent = day;
        button.appendChild(number);

        if (types.size) {
            const dots = document.createElement("span");
            dots.className = "calendar-day__dots";
            ["self", "cleaning", "prayer", "project"].forEach(type => {
                if (types.has(type)) {
                    const dot = document.createElement("i");
                    dot.className = `calendar-dot calendar-dot--${type}`;
                    dots.appendChild(dot);
                }
            });
            button.appendChild(dots);
        }
        button.addEventListener("click", () => {
            selectedCalendarDate = dateKey;
            renderCalendar();
            renderSelectedDay();
        });
        grid.appendChild(button);
    }
    renderSelectedDay();
}

function renderSelectedDay() {
    const label = document.querySelector("#selected-day-label");
    const total = document.querySelector("#selected-day-total");
    const list = document.querySelector("#selected-day-sessions");
    if (!label || !total || !list) return;

    label.textContent = formatLongDate(selectedCalendarDate);
    const sessions = getSessionsForDate(selectedCalendarDate);
    const totalSeconds = sessions.reduce((sum, session) => sum + (Number(session.durationSeconds) || 0), 0);
    total.textContent = `${formatDuration(totalSeconds)} aktywności`;
    list.innerHTML = "";

    if (!sessions.length) {
        const empty = document.createElement("p");
        empty.className = "empty-state";
        empty.textContent = "Nie zapisano jeszcze aktywności w tym dniu.";
        list.appendChild(empty);
        return;
    }

    sessions.forEach(session => {
        const row = document.createElement("article");
        row.className = "session-item";
        const marker = document.createElement("span");
        marker.className = `session-item__marker session-item__marker--${CALENDAR_ACTIVITY_CLASS[session.category] || "project"}`;
        const body = document.createElement("div");
        body.className = "session-item__body";
        const title = document.createElement("h4");
        title.textContent = getActivityLabel(session.category);
        if (session.task) title.textContent += ` — ${session.task}`;
        const time = document.createElement("p");
        const startDate = new Date(session.startedAt);
        const endDate = new Date(session.endedAt);
        time.textContent = `${startDate.toLocaleTimeString("pl-PL", {hour:"2-digit", minute:"2-digit"})}–${endDate.toLocaleTimeString("pl-PL", {hour:"2-digit", minute:"2-digit"})}`;
        const duration = document.createElement("strong");
        duration.className = "session-item__duration";
        duration.textContent = formatDuration(session.durationSeconds);
        body.append(title, time);
        row.append(marker, body, duration);
        list.appendChild(row);
    });
}

function initializeCalendar() {
    document.querySelector("#calendar-prev")?.addEventListener("click", () => {
        calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
        renderCalendar();
    });
    document.querySelector("#calendar-next")?.addEventListener("click", () => {
        calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
        renderCalendar();
    });
    renderCalendar();
}
