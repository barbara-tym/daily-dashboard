function formatCurrentDate(date) {
    return new Intl.DateTimeFormat("pl-PL", {
        weekday: "long", day: "numeric", month: "long", year: "numeric"
    }).format(date);
}

function formatCurrentTime(date) {
    return new Intl.DateTimeFormat("pl-PL", {
        hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
    }).format(date);
}

function renderClock() {
    const now = new Date();
    const date = document.querySelector("#current-date");
    const time = document.querySelector("#current-time");
    if (date) date.textContent = formatCurrentDate(now);
    if (time) time.textContent = formatCurrentTime(now);
}

function initializeApp() {
    renderClock();
    window.setInterval(renderClock, 1000);
    initializeMeals();
    initializeCalendar();
    initializeProjects();
    initializeTimers();
}

document.addEventListener("DOMContentLoaded", initializeApp);
