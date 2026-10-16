const TIMER_NAMES = ["self-care", "cleaning", "prayer", "break"];
const soundedBreaks = new Set();
let audioContext = null;

function playBreakMelody() {
    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        audioContext = audioContext || new AudioContextClass();
        if (audioContext.state === "suspended") audioContext.resume();
        const now = audioContext.currentTime;
        [659.25, 783.99, 987.77, 783.99].forEach((frequency, index) => {
            const oscillator = audioContext.createOscillator();
            const gain = audioContext.createGain();
            oscillator.type = "sine";
            oscillator.frequency.value = frequency;
            gain.gain.setValueAtTime(0.0001, now + index * 0.22);
            gain.gain.exponentialRampToValueAtTime(0.12, now + index * 0.22 + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.22 + 0.19);
            oscillator.connect(gain); gain.connect(audioContext.destination);
            oscillator.start(now + index * 0.22); oscillator.stop(now + index * 0.22 + 0.2);
        });
    } catch (error) { console.warn("Dźwięk przerwy nie jest dostępny:", error); }
}
let timerInterval = null;

function formatTime(totalSeconds) {
    const seconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainder = seconds % 60;
    return [hours, minutes, remainder].map(value => String(value).padStart(2, "0")).join(":");
}

function getCurrentElapsed(timerName) {
    const timer = getAppData().currentDay.timers[timerName];
    if (!timer) return 0;
    let elapsed = Math.max(0, Number(timer.elapsed) || 0);
    if (timer.running && timer.startedAt) {
        elapsed += Math.max(0, Math.floor((Date.now() - Number(timer.startedAt)) / 1000));
    }
    return Math.min(elapsed, timer.limitSeconds);
}

function getRemaining(timerName) {
    const timer = getAppData().currentDay.timers[timerName];
    return Math.max(0, timer.limitSeconds - getCurrentElapsed(timerName));
}

function startTimer(timerName) {
    const data = getAppData();
    const timer = data.currentDay.timers[timerName];
    if (!timer || timer.running || getRemaining(timerName) <= 0) return;
    stopAnyActiveTimer();
    if (timerName === "break") { try { const C = window.AudioContext || window.webkitAudioContext; if (C) { audioContext = audioContext || new C(); if (audioContext.state === "suspended") audioContext.resume(); } } catch (_) {} }
    timer.running = true;
    timer.startedAt = Date.now();
    data.activeTimer = { type: "activity", key: timerName };
    persistAppData();
    renderTimers();
    renderProjects();
}

function stopTimer(timerName, reason = "manual") {
    const data = getAppData();
    const timer = data.currentDay.timers[timerName];
    if (!timer || !timer.running) return;
    const now = Date.now();
    const start = Number(timer.startedAt) || now;
    const seconds = Math.min(
        Math.max(0, Math.floor((now - start) / 1000)),
        Math.max(0, timer.limitSeconds - (Number(timer.elapsed) || 0))
    );
    timer.elapsed = Math.min(timer.limitSeconds, (Number(timer.elapsed) || 0) + seconds);
    timer.running = false;
    timer.startedAt = null;
    data.activityHistory.push({
        id: createSessionId(),
        type: "activity",
        category: timerName,
        date: data.currentDay.date,
        startedAt: Math.max(start, now - seconds * 1000),
        endedAt: now,
        durationSeconds: seconds,
        reason
    });
    data.activeTimer = null;
    persistAppData();
    renderTimers();
    renderCalendar();
    renderPomodoroCount();
}

function stopAnyActiveTimer() {
    const active = getAppData().activeTimer;
    if (!active) return;
    if (active.type === "activity") stopTimer(active.key, "switched");
    else if (active.type === "project") stopProject(active.key, "switched");
}

function renderTimers() {
    TIMER_NAMES.forEach(name => {
        const timer = getAppData().currentDay.timers[name];
        const display = document.querySelector(`#${name}-display`);
        const status = document.querySelector(`[data-status="${name}"]`);
        const startButton = document.querySelector(`[data-action="start"][data-timer="${name}"]`);
        const stopButton = document.querySelector(`[data-action="stop"][data-timer="${name}"]`);
        if (!timer) return;
        if (display) display.textContent = formatTime(getRemaining(name));
        if (status) {
            status.textContent = timer.running ? "W trakcie" :
                getRemaining(name) === 0 ? "Cel osiągnięty" :
                timer.elapsed > 0 ? "Wstrzymany" : "Gotowy";
        }
        if (startButton) startButton.disabled = Boolean(getAppData().activeTimer) && !timer.running || getRemaining(name) === 0;
        if (stopButton) stopButton.disabled = !timer.running;
        const card = document.querySelector(`[data-timer-card="${name}"]`);
        if (card) card.classList.toggle("is-running", timer.running);
    });
}

function renderPomodoroCount() {
    const count = getAppData().activityHistory.filter(session => session.type === "activity" && session.category === "break" && session.date === getTodayKey()).length;
    const element = document.querySelector("#pomodoro-count");
    if (element) element.textContent = String(count);
}

function createSessionId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function tickTimers() {
    const data = getAppData();
    if (data.currentDay.date !== getTodayKey()) {
        const active = data.activeTimer;
        if (active?.type === "activity") stopTimer(active.key, "day-ended");
        else if (active?.type === "project") stopProject(active.key, "day-ended");
        data.currentDay = createEmptyDay();
        data.activeTimer = null;
        persistAppData();
        renderMeals();
        renderTimers();
        renderProjects();
        renderCalendar();
        return;
    }

    TIMER_NAMES.forEach(name => {
        const timer = data.currentDay.timers[name];
        const remaining = getRemaining(name);
        if (name === "break" && timer?.running && remaining <= 60 && remaining > 0 && !soundedBreaks.has(data.currentDay.date)) {
            soundedBreaks.add(data.currentDay.date);
            playBreakMelody();
        }
        if (timer?.running && remaining <= 0) {
            stopTimer(name, "goal-reached");
        }
    });
    renderTimers();
    renderProjects();
}

function initializeTimers() {
    document.querySelectorAll('[data-action="start"]').forEach(button => {
        button.addEventListener("click", () => startTimer(button.dataset.timer));
    });
    document.querySelectorAll('[data-action="stop"]').forEach(button => {
        button.addEventListener("click", () => stopTimer(button.dataset.timer));
    });

    // Nie wznawiamy timera po odświeżeniu strony — kończymy poprzednią sesję,
    // żeby nie naliczać czasu, kiedy aplikacja mogła być nieużywana.
    const data = getAppData();
    if (data.activeTimer?.type === "activity") stopTimer(data.activeTimer.key, "page-reload");
    if (data.activeTimer?.type === "project") stopProject(data.activeTimer.key, "page-reload");

    renderTimers();
    renderPomodoroCount();
    timerInterval = window.setInterval(tickTimers, 1000);
}
