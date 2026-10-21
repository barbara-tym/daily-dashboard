const STORAGE_KEY = "daily-dashboard-v2";
const ACTIVITY_GROUPS = [
    { id: "meals", title: "Posiłki i przygotowanie", label: "PRZYGOTOWANIE POSIŁKÓW", activities: [
        ["breakfast", "Śniadanie", "🥣"], ["second-breakfast", "Drugie śniadanie", "🍎"], ["snack", "Przekąska", "🍓"], ["dinner", "Kolacja", "🍲"]
    ]},
    { id: "daily", title: "Codzienne sprawy", label: "CODZIENNOŚĆ", activities: [
        ["lunch", "Obiad", "🍽️"], ["shopping", "Zakupy", "🛍️"], ["bath", "Kąpiel", "🛁"], ["workout", "Trening", "🏃"]
    ]},
    { id: "life", title: "Przestrzeń i rozwój", label: "DLA SIEBIE I INNYCH", activities: [
        ["cleaning", "Sprzątanie", "🧹"], ["self-care", "Czas dla mnie", "🌿"], ["good-deed", "Dobry uczynek", "💛"], ["work", "Praca", "💻"]
    ]}
];
const ACTIVITY_BY_ID = Object.fromEntries(ACTIVITY_GROUPS.flatMap(group => group.activities.map(([id, name, icon]) => [id, { id, name, icon, group: group.id }])));
const MEAL_IDS = ["breakfast", "second-breakfast", "snack", "dinner", "lunch"];
const LEGACY_LABELS = { prayer: "Modlitwa", break: "Przerwa", programming: "Programowanie", business: "Biznes", studies: "Studia / praca", writing: "Pisanie", technology: "Technologiczne" };

function getTodayKey(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function createDefaultStorage() { return { currentDay: getTodayKey(), sessions: [], activeSession: null, mealLog: {} }; }
function loadStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) { const fresh = createDefaultStorage(); localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh)); return fresh; }
        const old = JSON.parse(raw);
        if (Array.isArray(old.sessions)) return { ...createDefaultStorage(), ...old, mealLog: old.mealLog || {} };
        // Keep previous calendar history. Legacy timers that were running during upgrade are closed at upgrade time.
        const sessions = Array.isArray(old.activityHistory) ? old.activityHistory.map(session => ({
            id: session.id || `${session.startedAt}-${Math.random().toString(36).slice(2)}`,
            category: session.category, date: session.date, startedAt: session.startedAt, endedAt: session.endedAt,
            durationSeconds: Number(session.durationSeconds) || 0, comment: session.task || ""
        })) : [];
        const legacyMeals = old.currentDay?.date ? old.currentDay.meals : null;
        const mealLog = legacyMeals ? { [old.currentDay.date]: Object.fromEntries(Object.entries(legacyMeals).filter(([, eaten]) => eaten).map(([id]) => [id, true])) } : {};
        const migrated = {
            currentDay: getTodayKey(), sessions, activeSession: null, mealLog,
            legacyData: { projects: old.projects || {}, currentDay: old.currentDay || null }
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        return migrated;
    } catch (error) {
        console.error("Nie udało się odczytać danych dashboardu:", error);
        return createDefaultStorage();
    }
}
let appData = loadStorage();
function persistAppData() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(appData)); }
    catch (error) { console.error("Nie udało się zapisać danych dashboardu:", error); }
}
function getActivityLabel(id) { return ACTIVITY_BY_ID[id]?.name || LEGACY_LABELS[id] || id; }
