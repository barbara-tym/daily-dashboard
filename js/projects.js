const PROJECT_KEYS = ["programming", "business", "studies", "writing", "technology"];

function getProjectElapsed(key) {
    const project = getAppData().projects[key];
    if (!project) return 0;
    let total = Math.max(0, Number(project.totalSeconds) || 0);
    if (project.running && project.startedAt) {
        total += Math.max(0, Math.floor((Date.now() - Number(project.startedAt)) / 1000));
    }
    return total;
}

function startProject(key) {
    const data = getAppData();
    const project = data.projects[key];
    if (!project || project.running) return;
    stopAnyActiveTimer();
    const taskInput = document.querySelector(`[data-project-task="${key}"]`);
    const task = taskInput ? taskInput.value.trim() : "";
    project.running = true;
    project.startedAt = Date.now();
    project.currentTask = task;
    data.activeTimer = { type: "project", key };
    persistAppData();
    renderProjects();
    renderTimers();
}

function stopProject(key, reason = "manual") {
    const data = getAppData();
    const project = data.projects[key];
    if (!project || !project.running) return;
    const now = Date.now();
    const start = Number(project.startedAt) || now;
    const seconds = Math.max(0, Math.floor((now - start) / 1000));
    project.totalSeconds = Math.max(0, Number(project.totalSeconds) || 0) + seconds;
    project.running = false;
    project.startedAt = null;
    data.activityHistory.push({
        id: createSessionId(),
        type: "project",
        category: key,
        date: getTodayKey(),
        startedAt: start,
        endedAt: now,
        durationSeconds: seconds,
        task: project.currentTask || "",
        reason
    });
    project.currentTask = "";
    data.activeTimer = null;
    persistAppData();
    renderProjects();
    renderTimers();
    renderCalendar();
}

function renderProjects() {
    const data = getAppData();
    PROJECT_KEYS.forEach(key => {
        const project = data.projects[key];
        if (!project) return;
        const time = document.querySelector(`#project-${key}-time`);
        const meta = document.querySelector(`#project-${key}-meta`);
        const status = document.querySelector(`[data-project-status="${key}"]`);
        const start = document.querySelector(`[data-project-start="${key}"]`);
        const stop = document.querySelector(`[data-project-stop="${key}"]`);
        const card = document.querySelector(`[data-project-card="${key}"]`);
        if (time) time.textContent = formatTime(getProjectElapsed(key));
        if (meta) meta.textContent = project.running ? "Czas nalicza się teraz" : "Łączny czas projektu";
        if (status) status.textContent = project.running ? "W trakcie" : project.totalSeconds > 0 ? "Wstrzymany" : "Gotowy";
        if (start) start.disabled = Boolean(data.activeTimer) && !project.running;
        if (stop) stop.disabled = !project.running;
        if (card) card.classList.toggle("is-running", project.running);
        const taskInput = document.querySelector(`[data-project-task="${key}"]`);
        if (taskInput) {
            if (project.running) {
                taskInput.value = project.currentTask || "";
                taskInput.disabled = true;
            } else {
                taskInput.disabled = false;
            }
        }
    });
}

function initializeProjects() {
    document.querySelectorAll("[data-project-start]").forEach(button => {
        button.addEventListener("click", () => startProject(button.dataset.projectStart));
    });
    document.querySelectorAll("[data-project-stop]").forEach(button => {
        button.addEventListener("click", () => stopProject(button.dataset.projectStop));
    });
    renderProjects();
}
