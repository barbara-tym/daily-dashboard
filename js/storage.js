/*
 * ========================================
 * STORAGE
 * ========================================
 *
 * Ten moduł odpowiada za przechowywanie
 * danych aplikacji w localStorage.
 *
 * Dane są rozdzielone na:
 *
 * 1. dane bieżącego dnia
 * 2. dane długoterminowe
 *
 * Dane bieżącego dnia są resetowane,
 * kiedy rozpoczyna się nowy dzień.
 *
 * Liczba zdobytych nagród oraz historia
 * myśli pozostają zachowane.
 */


/* ========================================
   STORAGE KEY
======================================== */

const STORAGE_KEY = "daily-dashboard";


/* ========================================
   DOMYŚLNE DANE DNIA
======================================== */

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

            "self-care": {
                elapsed: 0,
                running: false,
                startedAt: null
            },

            cleaning: {
                elapsed: 0,
                running: false,
                startedAt: null
            },

            work: {
                elapsed: 0,
                running: false,
                startedAt: null
            }

        },

        thought: ""

    };

}


/* ========================================
   DOMYŚLNE DANE APLIKACJI
======================================== */

function createDefaultStorage() {

    return {

        currentDay: createEmptyDay(),

        rewards: {
            count: 0,
            workSeconds: 0
        },

        thoughtHistory: []

    };

}


/* ========================================
   DATA
======================================== */

/*
 * Zwraca datę w formacie:
 *
 * YYYY-MM-DD
 *
 * np.
 *
 * 2026-10-04
 *
 * Dzięki temu możemy jednoznacznie
 * rozpoznać, czy dane należą do dzisiejszego
 * dnia.
 */

function getTodayKey() {

    const now = new Date();

    const year = now.getFullYear();

    const month = String(
        now.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        now.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;

}


/* ========================================
   ODCZYT DANYCH
======================================== */

function loadStorage() {

    const savedData =
        localStorage.getItem(STORAGE_KEY);


    /*
     * Jeśli aplikacja jest uruchamiana
     * pierwszy raz, tworzymy dane od zera.
     */

    if (!savedData) {

        const initialData =
            createDefaultStorage();

        saveStorage(initialData);

        return initialData;

    }


    try {

        const parsedData =
            JSON.parse(savedData);


        /*
         * Sprawdzamy, czy dane mają
         * oczekiwaną strukturę.
         */

        if (
            !parsedData.currentDay ||
            !parsedData.rewards ||
            !Array.isArray(parsedData.thoughtHistory)
        ) {

            const repairedData =
                createDefaultStorage();

            saveStorage(repairedData);

            return repairedData;

        }


        /*
         * Sprawdzamy, czy zapisany dzień
         * jest nadal dzisiejszym dniem.
         */

        if (
            parsedData.currentDay.date !==
            getTodayKey()
        ) {

            return createNewDay(parsedData);

        }


        return parsedData;

    } catch (error) {

        /*
         * Jeśli dane w localStorage są
         * uszkodzone, nie pozwalamy,
         * żeby aplikacja przestała działać.
         */

        console.error(
            "Nie udało się odczytać danych:",
            error
        );


        const repairedData =
            createDefaultStorage();

        saveStorage(repairedData);

        return repairedData;

    }

}


/* ========================================
   ZAPIS DANYCH
======================================== */

function saveStorage(data) {

    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(data)
        );

    } catch (error) {

        console.error(
            "Nie udało się zapisać danych:",
            error
        );

    }

}


/* ========================================
   NOWY DZIEŃ
======================================== */

/*
 * Ta funkcja uruchamia się automatycznie,
 * kiedy użytkownik odwiedzi stronę
 * w nowym dniu.
 *
 * Zachowujemy:
 *
 * - zdobyte nagrody
 * - historię myśli
 *
 * Resetujemy:
 *
 * - posiłki
 * - timery
 * - myśl dnia
 */

function createNewDay(previousData) {

    /*
     * Jeżeli poprzedni dzień miał zapisaną
     * myśl, dodajemy ją do historii.
     */

    if (
        previousData.currentDay.thought &&
        previousData.currentDay.thought.trim()
    ) {

        const previousThought = {

            date: previousData.currentDay.date,

            text:
                previousData.currentDay.thought.trim()

        };


        /*
         * Unikamy dodania tego samego wpisu
         * więcej niż raz.
         */

        const alreadyExists =
            previousData.thoughtHistory.some(
                item =>
                    item.date === previousThought.date
            );


        if (!alreadyExists) {

            previousData.thoughtHistory.unshift(
                previousThought
            );

        }

    }


    /*
     * Tworzymy czysty dzień.
     */

    const newData = {

        currentDay: createEmptyDay(),

        rewards: {

            /*
             * Liczba zdobytych nagród
             * zostaje zachowana.
             */

            count:
                previousData.rewards.count,

            /*
             * Zgromadzone godziny pracy
             * również zostają zachowane.
             *
             * Ten licznik jest później obsługiwany
             * przez rewards.js.
             */

            workSeconds:
                previousData.rewards.workSeconds

        },

        /*
         * Historia myśli również zostaje.
         */

        thoughtHistory:
            previousData.thoughtHistory

    };


    saveStorage(newData);

    return newData;

}


/* ========================================
   POBIERANIE AKTUALNYCH DANYCH
======================================== */

let appData = loadStorage();


/*
 * Ta funkcja pozwala pozostałym modułom
 * pobierać aktualny stan aplikacji.
 */

function getAppData() {

    return appData;

}


/* ========================================
   AKTUALIZACJA DANYCH
======================================== */

/*
 * Przyjmuje funkcję, która może zmodyfikować
 * dane, a następnie zapisuje nowy stan.
 *
 * Przykład:
 *
 * updateAppData(data => {
 *     data.currentDay.thought = "Dobry dzień.";
 * });
 */

function updateAppData(updateFunction) {

    updateFunction(appData);

    saveStorage(appData);

}


/* ========================================
   AKTUALIZACJA POSIŁKU
======================================== */

function setMealStatus(mealName, completed) {

    if (
        !appData.currentDay.meals.hasOwnProperty(
            mealName
        )
    ) {

        return;

    }


    appData.currentDay.meals[mealName] =
        Boolean(completed);


    saveStorage(appData);

}


/* ========================================
   MYŚL DNIA
======================================== */

function saveTodayThought(text) {

    appData.currentDay.thought =
        String(text).trim();


    saveStorage(appData);

}


/* ========================================
   HISTORIA MYŚLI
======================================== */

function getThoughtHistory() {

    return appData.thoughtHistory;

}


/* ========================================
   DANE NAGRÓD
======================================== */

function getRewardsData() {

    return appData.rewards;

}


/* ========================================
   AKTUALIZACJA NAGRÓD
======================================== */

function updateRewards(updateFunction) {

    updateFunction(appData.rewards);

    saveStorage(appData);

}


/* ========================================
   DANE TIMERA
======================================== */

function getTimerData(timerName) {

    if (
        !appData.currentDay.timers[timerName]
    ) {

        return null;

    }


    return appData.currentDay.timers[timerName];

}


/* ========================================
   AKTUALIZACJA TIMERA
======================================== */

function updateTimerData(
    timerName,
    updateFunction
) {

    const timer =
        appData.currentDay.timers[timerName];


    if (!timer) {

        return;

    }


    updateFunction(timer);

    saveStorage(appData);

}


/* ========================================
   ZAPIS CAŁEGO STANU
======================================== */

function persistAppData() {

    saveStorage(appData);

}


/* ========================================
   EKSPORT DANYCH
======================================== */

/*
 * Przydatne w przyszłości, gdybyśmy chciały
 * dodać przycisk:
 *
 * "Eksportuj moje dane"
 *
 * Na razie funkcja jest przygotowana,
 * ale nie jest jeszcze używana.
 */

function exportAppData() {

    return JSON.stringify(
        appData,
        null,
        2
    );

}