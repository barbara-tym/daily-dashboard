/*
 * Dane aplikacji. Nowy klucz oznacza czysty start wersji 2,
 * bez odczytywania starego formatu i bez kasowania starego wpisu.
 */
const STORAGE_KEY = "daily-dashboard-v2";
const ACTIVITY_LIMITS = {
    "self-care": 60 * 60,
    cleaning: 60 * 60,
    prayer: 30 * 60,
    break: 5 * 60
};
const ACTIVITY_LABELS = {
    "self-care": "Czas dla mnie",
    cleaning: "Sprzątanie",
    prayer: "Modlitwa",
    break: "Przerwa"
};
const PROJECTS = {
    programming: "Programowanie",
    business: "Biznes",
    studies: "Studia / praca",
    writing: "Pisanie",
    technology: "Technologiczne"
};

function getTodayKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function createTimerState(limitSeconds = null) {
    return { elapsed: 0, running: false, startedAt: null, limitSeconds };
}

function createEmptyDay() {
    return {
        date: getTodayKey(),
        meals: {
            breakfast: false,
            "second-breakfast": false,
            lunch: false,
            snack: false,
            dinner: false
        },
        timers: {
            "self-care": createTimerState(ACTIVITY_LIMITS["self-care"]),
            cleaning: createTimerState(ACTIVITY_LIMITS.cleaning),
            prayer: createTimerState(ACTIVITY_LIMITS.prayer),
            break: createTimerState(ACTIVITY_LIMITS.break)
        }
    };
}

function createDefaultStorage() {
    const projects = {};
    Object.keys(PROJECTS).forEach(key => {
        projects[key] = { totalSeconds: 0, running: false, startedAt: null };
    });
    return {
        currentDay: createEmptyDay(),
        activityHistory: [],
        projects,
        activeTimer: null
    };
}

function loadStorage() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) {
            const initial = createDefaultStorage();
            saveStorage(initial);
            return initial;
        }

        const data = JSON.parse(saved);
        if (!data || !data.currentDay || !data.currentDay.meals ||
            !data.currentDay.timers || !Array.isArray(data.activityHistory) ||
            !data.projects) {
            const fresh = createDefaultStorage();
            saveStorage(fresh);
            return fresh;
        }

        // Bezpieczne uzupełnienie pól, jeśli zapis został częściowo uszkodzony.
        const defaults = createDefaultStorage();
        data.currentDay.meals = { ...defaults.currentDay.meals, ...data.currentDay.meals };
        data.currentDay.timers = { ...defaults.currentDay.timers, ...data.currentDay.timers };
        data.projects = { ...defaults.projects, ...data.projects };
        Object.keys(PROJECTS).forEach(key => {
            data.projects[key] = { ...defaults.projects[key], ...data.projects[key] };
        });

        if (data.currentDay.date !== getTodayKey()) {
            // Nie przenosimy dziennych limitów na kolejny dzień.
            data.currentDay = createEmptyDay();
            data.activeTimer = null;
            Object.keys(data.projects).forEach(key => {
                data.projects[key].running = false;
                data.projects[key].startedAt = null;
            });
        }
        saveStorage(data);
        return data;
    } catch (error) {
        console.error("Nie udało się odczytać danych dashboardu:", error);
        const fresh = createDefaultStorage();
        saveStorage(fresh);
        return fresh;
    }
}

function saveStorage(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error("Nie udało się zapisać danych dashboardu:", error);
    }
}

let appData = loadStorage();

function getAppData() {
    return appData;
}

function persistAppData() {
    saveStorage(appData);
}

function updateAppData(callback) {
    callback(appData);
    saveStorage(appData);
}

function setMealStatus(mealName, completed) {
    if (!Object.prototype.hasOwnProperty.call(appData.currentDay.meals, mealName)) return;
    appData.currentDay.meals[mealName] = Boolean(completed);
    persistAppData();
}

function getCompletedMealsCount() {
    return Object.values(appData.currentDay.meals).filter(Boolean).length;
}

function getActivityLabel(key) {
    return ACTIVITY_LABELS[key] || PROJECTS[key] || key;
}
