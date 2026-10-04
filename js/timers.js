/*
 * ========================================
 * TIMERS
 * ========================================
 *
 * self-care  = odliczanie od 1 godziny
 * cleaning   = odliczanie od 1 godziny
 * work       = liczenie od 0 w górę
 *
 * Tylko jeden timer może działać naraz.
 */


/* ========================================
   KONFIGURACJA
======================================== */

const TIMER_NAMES = [
    "self-care",
    "cleaning",
    "work"
];

const DAILY_TIMER_GOAL = 60 * 60;


/* ========================================
   ELEMENTY DOM
======================================== */

const timerElements = {};


function initializeTimerElements() {

    TIMER_NAMES.forEach(function(timerName) {

        timerElements[timerName] = {

            display: document.querySelector(
                "#" + timerName + "-display"
            ),

            status: document.querySelector(
                '[data-status="' + timerName + '"]'
            ),

            startButton: document.querySelector(
                '[data-action="start"][data-timer="' + timerName + '"]'
            ),

            stopButton: document.querySelector(
                '[data-action="stop"][data-timer="' + timerName + '"]'
            )

        };

    });

}


/* ========================================
   FORMATOWANIE CZASU
======================================== */

function formatTime(totalSeconds) {

    totalSeconds = Math.max(
        0,
        Math.floor(Number(totalSeconds) || 0)
    );


    const hours =
        Math.floor(totalSeconds / 3600);


    const minutes =
        Math.floor((totalSeconds % 3600) / 60);


    const seconds =
        totalSeconds % 60;


    return [
        hours,
        minutes,
        seconds
    ]
        .map(function(value) {
            return String(value).padStart(2, "0");
        })
        .join(":");

}


/* ========================================
   AKTUALNY CZAS TIMERA
======================================== */

function getCurrentElapsed(timerName) {

    const timer =
        getTimerData(timerName);


    if (!timer) {
        return 0;
    }


    let elapsed =
        Number(timer.elapsed) || 0;


    if (
        timer.running &&
        timer.startedAt
    ) {

        const startedAt =
            Number(timer.startedAt);


        const currentSession =
            Math.max(
                0,
                Math.floor(
                    (Date.now() - startedAt) / 1000
                )
            );


        elapsed += currentSession;

    }


    return elapsed;

}


/* ========================================
   CZAS WYŚWIETLANY
======================================== */

function getDisplayTime(timerName) {

    const elapsed =
        getCurrentElapsed(timerName);


    /*
     * Dbanie o siebie i sprzątanie:
     *
     * 01:00:00
     * 00:59:59
     * 00:59:58
     * ...
     * 00:00:00
     */

    if (
        timerName === "self-care" ||
        timerName === "cleaning"
    ) {

        return Math.max(
            0,
            DAILY_TIMER_GOAL - elapsed
        );

    }


    /*
     * Praca:
     *
     * 00:00:00
     * 00:00:01
     * 00:00:02
     * ...
     */

    return elapsed;

}


/* ========================================
   START TIMERA
======================================== */

function startTimer(timerName) {

    const timer =
        getTimerData(timerName);


    if (!timer) {
        return;
    }


    /*
     * Jeśli już działa, nic nie robimy.
     */

    if (timer.running) {
        return;
    }


    /*
     * Dbanie o siebie i sprzątanie
     * nie mogą zostać uruchomione
     * po wykorzystaniu całej godziny.
     */

    if (
        timerName !== "work" &&
        getCurrentElapsed(timerName) >= DAILY_TIMER_GOAL
    ) {

        return;

    }


    /*
     * Zatrzymujemy każdy inny timer.
     */

    TIMER_NAMES.forEach(function(name) {

        if (name !== timerName) {

            const otherTimer =
                getTimerData(name);


            if (
                otherTimer &&
                otherTimer.running
            ) {

                stopTimer(name);

            }

        }

    });


    /*
     * Uruchamiamy wybrany timer.
     */

    updateTimerData(
        timerName,
        function(timerData) {

            timerData.running = true;
            timerData.startedAt = Date.now();

        }
    );


    renderTimers();

}


/* ========================================
   STOP TIMERA
======================================== */

function stopTimer(timerName) {

    const timer =
        getTimerData(timerName);


    if (
        !timer ||
        !timer.running
    ) {

        return;

    }


    const startedAt =
        Number(timer.startedAt);


    let sessionSeconds =
        Math.max(
            0,
            Math.floor(
                (Date.now() - startedAt) / 1000
            )
        );


    /*
     * Dla timerów godzinnych nie możemy
     * wykorzystać więcej niż 3600 sekund.
     */

    if (timerName !== "work") {

        const alreadyElapsed =
            Number(timer.elapsed) || 0;


        const remaining =
            Math.max(
                0,
                DAILY_TIMER_GOAL - alreadyElapsed
            );


        sessionSeconds =
            Math.min(
                sessionSeconds,
                remaining
            );

    }


    /*
     * Zapisujemy timer.
     */

    updateTimerData(
        timerName,
        function(timerData) {

            timerData.elapsed =
                (Number(timerData.elapsed) || 0)
                + sessionSeconds;

            timerData.running = false;
            timerData.startedAt = null;

        }
    );


    /*
     * Czas pracy trafia również
     * do puli nagrody.
     */

    if (
        timerName === "work" &&
        sessionSeconds > 0
    ) {

        addWorkToRewards(sessionSeconds);

    }


    renderTimers();


    if (
        typeof renderRewards === "function"
    ) {

        renderRewards();

    }

}


/* ========================================
   CZAS PRACY DO NAGRODY
======================================== */

function addWorkToRewards(seconds) {

    updateRewards(function(rewards) {

        rewards.workSeconds =
            (Number(rewards.workSeconds) || 0)
            + seconds;

    });

}


/* ========================================
   STATUS
======================================== */

function getTimerStatus(
    timerName,
    elapsed,
    running
) {

    if (running) {
        return "W trakcie";
    }


    if (
        timerName !== "work" &&
        elapsed >= DAILY_TIMER_GOAL
    ) {

        return "Cel osiągnięty";

    }


    if (elapsed === 0) {
        return "Gotowy";
    }


    return "Wstrzymany";

}


/* ========================================
   RENDEROWANIE POJEDYNCZEGO TIMERA
======================================== */

function renderTimer(timerName) {

    const timer =
        getTimerData(timerName);


    const elements =
        timerElements[timerName];


    if (
        !timer ||
        !elements
    ) {

        return;

    }


    const elapsed =
        getCurrentElapsed(timerName);


    const displayTime =
        getDisplayTime(timerName);


    /*
     * Wyświetlanie czasu.
     */

    if (elements.display) {

        elements.display.textContent =
            formatTime(displayTime);

    }


    /*
     * Status.
     */

    if (elements.status) {

        elements.status.textContent =
            getTimerStatus(
                timerName,
                elapsed,
                timer.running
            );

    }


    /*
     * Przycisk START.
     */

    if (elements.startButton) {

        const goalReached =
            timerName !== "work" &&
            elapsed >= DAILY_TIMER_GOAL;


        elements.startButton.disabled =
            timer.running ||
            goalReached;

    }


    /*
     * Przycisk STOP.
     */

    if (elements.stopButton) {

        elements.stopButton.disabled =
            !timer.running;

    }

}


/* ========================================
   RENDEROWANIE WSZYSTKICH TIMERÓW
======================================== */

function renderTimers() {

    TIMER_NAMES.forEach(function(timerName) {

        renderTimer(timerName);

    });

}


/* ========================================
   AKTYWNY TIMER
======================================== */

function getActiveTimer() {

    for (
        let i = 0;
        i < TIMER_NAMES.length;
        i++
    ) {

        const timer =
            getTimerData(TIMER_NAMES[i]);


        if (
            timer &&
            timer.running
        ) {

            return TIMER_NAMES[i];

        }

    }


    return null;

}


/* ========================================
   TYLKO JEDEN AKTYWNY TIMER
======================================== */

function ensureSingleActiveTimer() {

    const activeTimers =
        TIMER_NAMES.filter(function(timerName) {

            const timer =
                getTimerData(timerName);


            return (
                timer &&
                timer.running
            );

        });


    if (activeTimers.length <= 1) {
        return;
    }


    /*
     * Zostawiamy timer uruchomiony
     * najpóźniej.
     */

    let latestTimer =
        activeTimers[0];


    let latestStartedAt =
        Number(
            getTimerData(latestTimer).startedAt
        ) || 0;


    activeTimers.forEach(function(timerName) {

        const timer =
            getTimerData(timerName);


        const startedAt =
            Number(timer.startedAt) || 0;


        if (startedAt > latestStartedAt) {

            latestStartedAt =
                startedAt;

            latestTimer =
                timerName;

        }

    });


    activeTimers.forEach(function(timerName) {

        if (timerName !== latestTimer) {

            stopTimer(timerName);

        }

    });

}


/* ========================================
   PRZYCISKI
======================================== */

function initializeTimerButtons() {

    document
        .querySelectorAll(
            '[data-action="start"]'
        )
        .forEach(function(button) {

            button.addEventListener(
                "click",
                function() {

                    startTimer(
                        button.dataset.timer
                    );

                }
            );

        });


    document
        .querySelectorAll(
            '[data-action="stop"]'
        )
        .forEach(function(button) {

            button.addEventListener(
                "click",
                function() {

                    stopTimer(
                        button.dataset.timer
                    );

                }
            );

        });

}


/* ========================================
   ODŚWIEŻANIE CO SEKUNDĘ
======================================== */

function startTimerRendering() {

    setInterval(function() {

        renderTimers();

    }, 1000);

}


/* ========================================
   INICJALIZACJA
======================================== */

function initializeTimers() {

    initializeTimerElements();

    ensureSingleActiveTimer();

    initializeTimerButtons();

    renderTimers();

    startTimerRendering();

}
