
/*
 * ========================================
 * DAILY DASHBOARD - APP
 * ========================================
 *
 * Ten plik spina wszystkie moduły aplikacji.
 *
 * Odpowiada za:
 *
 * - aktualną datę,
 * - aktualną godzinę,
 * - zmianę dnia o północy,
 * - myśl dnia,
 * - historię myśli,
 * - uruchomienie wszystkich modułów.
 */


/* ========================================
   ELEMENTY DOM
======================================== */

let currentDateElement = null;
let currentTimeElement = null;

let thoughtInputElement = null;
let thoughtFormElement = null;
let thoughtStatusElement = null;

let thoughtHistoryListElement = null;
let thoughtHistoryEmptyElement = null;


/* ========================================
   INICJALIZACJA ELEMENTÓW
======================================== */

function initializeAppElements() {

    currentDateElement =
        document.querySelector("#current-date");

    currentTimeElement =
        document.querySelector("#current-time");

    thoughtInputElement =
        document.querySelector("#thought-input");

    thoughtFormElement =
        document.querySelector("#thought-form");

    thoughtStatusElement =
        document.querySelector("#thought-status");

    thoughtHistoryListElement =
        document.querySelector("#thought-history-list");

    thoughtHistoryEmptyElement =
        document.querySelector("#thought-history-empty");

}


/* ========================================
   DATA
======================================== */

function formatCurrentDate(date) {

    return new Intl.DateTimeFormat(
        "pl-PL",
        {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    ).format(date);

}


/* ========================================
   GODZINA
======================================== */

function formatCurrentTime(date) {

    return new Intl.DateTimeFormat(
        "pl-PL",
        {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        }
    ).format(date);

}


/* ========================================
   DATA + GODZINA
======================================== */

function renderCurrentDateTime() {

    const now = new Date();


    if (currentDateElement) {

        currentDateElement.textContent =
            formatCurrentDate(now);

    }


    if (currentTimeElement) {

        currentTimeElement.textContent =
            formatCurrentTime(now);

    }

}


/* ========================================
   ZEGAR
======================================== */

function startClock() {

    renderCurrentDateTime();


    setInterval(() => {

        renderCurrentDateTime();

    }, 1000);

}


/* ========================================
   SPRAWDZANIE NOWEGO DNIA
======================================== */

function checkForNewDay() {

    const savedData =
        getAppData();


    const today =
        getTodayKey();


    if (
        savedData.currentDay.date !== today
    ) {

        /*
         * Bardzo ważne:
         *
         * createNewDay() zwraca nowy
         * obiekt appData, dlatego zapisujemy
         * go z powrotem do globalnego appData.
         */

        appData =
            createNewDay(savedData);


        /*
         * Odświeżamy wszystkie elementy
         * po rozpoczęciu nowego dnia.
         */

        renderMeals();

        renderTimers();

        renderRewards();

        loadTodayThought();

        renderThoughtHistory();

    }

}


/* ========================================
   OBSERWOWANIE ZMIANY DNIA
======================================== */

function startDayWatcher() {

    setInterval(() => {

        checkForNewDay();

    }, 1000);

}


/* ========================================
   MYŚL DNIA
======================================== */

function loadTodayThought() {

    if (!thoughtInputElement) {

        return;

    }


    const thought =
        getAppData().currentDay.thought;


    thoughtInputElement.value =
        thought || "";

}


/* ========================================
   ZAPIS MYŚLI
======================================== */

function handleThoughtSubmit(event) {

    event.preventDefault();


    if (!thoughtInputElement) {

        return;

    }


    const text =
        thoughtInputElement.value.trim();


    saveTodayThought(text);


    if (thoughtStatusElement) {

        thoughtStatusElement.textContent =
            "Zapisano.";

    }


    renderThoughtHistory();


    setTimeout(() => {

        if (thoughtStatusElement) {

            thoughtStatusElement.textContent =
                "";

        }

    }, 2000);

}


/* ========================================
   HISTORIA MYŚLI
======================================== */

function renderThoughtHistory() {

    if (
        !thoughtHistoryListElement
    ) {

        return;

    }


    const history =
        getThoughtHistory();


    /*
     * Czyścimy aktualną listę.
     */

    thoughtHistoryListElement.innerHTML =
        "";


    /*
     * Brak historii.
     */

    if (!history.length) {

        if (thoughtHistoryEmptyElement) {

            thoughtHistoryEmptyElement.hidden =
                false;

        }

        return;

    }


    if (thoughtHistoryEmptyElement) {

        thoughtHistoryEmptyElement.hidden =
            true;

    }


    /*
     * Najnowsza myśl jest pierwsza.
     */

    [...history]
        .forEach(entry => {

            const item =
                document.createElement("li");


            item.className =
                "thought-history__item";


            const date =
                document.createElement("div");


            date.className =
                "thought-history__date";


            date.textContent =
                entry.date;


            const text =
                document.createElement("p");


            text.className =
                "thought-history__text";


            /*
             * storage.js zapisuje tekst
             * pod właściwością "text".
             */

            text.textContent =
                entry.text;


            item.appendChild(date);

            item.appendChild(text);

            thoughtHistoryListElement.appendChild(
                item
            );

        });

}


/* ========================================
   INICJALIZACJA MYŚLI
======================================== */

function initializeThoughts() {

    if (thoughtFormElement) {

        thoughtFormElement.addEventListener(
            "submit",
            handleThoughtSubmit
        );

    }


    loadTodayThought();

    renderThoughtHistory();

}


/* ========================================
   INICJALIZACJA CAŁEJ APLIKACJI
======================================== */

function initializeApp() {

    initializeAppElements();


    /*
     * Sprawdzamy dzień.
     */

    checkForNewDay();


    /*
     * Zegar.
     */

    startClock();


    /*
     * Automatyczna zmiana dnia.
     */

    startDayWatcher();


    /*
     * Posiłki.
     */

    initializeMeals();


    /*
     * Timery.
     */

    initializeTimers();


    /*
     * Nagrody.
     */

    initializeRewards();


    /*
     * Myśl dnia i historia.
     */

    initializeThoughts();

}


/* ========================================
   START
======================================== */

document.addEventListener(
    "DOMContentLoaded",
    initializeApp
);
