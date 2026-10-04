/*
 * ========================================
 * REWARDS
 * ========================================
 *
 * System nagród za czas pracy.
 *
 * Zasada:
 *
 * 20 godzin pracy = 1 nagroda.
 *
 * Po zdobyciu nagrody:
 *
 * - liczba nagród zwiększa się o 1,
 * - postęp wraca do 0,
 * - zaczynamy zbierać kolejne 20 godzin.
 */


/* ========================================
   KONFIGURACJA
======================================== */

/*
 * 20 godzin w sekundach.
 */

const REWARD_GOAL_SECONDS =
    20 * 60 * 60;


/* ========================================
   ELEMENTY DOM
======================================== */

let rewardElements = {};


/* ========================================
   INICJALIZACJA ELEMENTÓW
======================================== */

function initializeRewardElements() {

    rewardElements = {

        count:
            document.querySelector(
                "#rewards-count"
            ),

        total:
            document.querySelector(
                "#work-total"
            ),

        progressFill:
            document.querySelector(
                "#reward-progress-fill"
            ),

        progressMessage:
            document.querySelector(
                "#reward-progress-message"
            ),

        complete:
            document.querySelector(
                "#reward-complete"
            )

    };

}


/* ========================================
   FORMATOWANIE CZASU
======================================== */

function formatRewardTime(totalSeconds) {

    totalSeconds =
        Math.max(
            0,
            Math.floor(totalSeconds)
        );


    const hours =
        Math.floor(
            totalSeconds / 3600
        );


    const minutes =
        Math.floor(
            (totalSeconds % 3600) / 60
        );


    return `${hours} h ${String(minutes).padStart(2, "0")} min`;

}


/* ========================================
   SPRAWDZANIE NAGRODY
======================================== */

function checkForReward() {

    let rewardEarned = false;


    updateRewards(rewards => {

        /*
         * Na wypadek, gdyby z jakiegoś
         * powodu wartość była niepoprawna.
         */

        rewards.workSeconds =
            Math.max(
                0,
                Number(rewards.workSeconds) || 0
            );


        /*
         * Możemy zdobyć więcej niż jedną
         * nagrodę, jeśli kiedyś większa
         * ilość czasu zostanie dodana
         * jednorazowo.
         */

        while (
            rewards.workSeconds >=
            REWARD_GOAL_SECONDS
        ) {

            rewards.workSeconds -=
                REWARD_GOAL_SECONDS;


            rewards.count =
                (Number(rewards.count) || 0)
                + 1;


            rewardEarned = true;

        }

    });


    return rewardEarned;

}


/* ========================================
   RENDEROWANIE
======================================== */

function renderRewards() {

    /*
     * Najpierw sprawdzamy,
     * czy została zdobyta nagroda.
     */

    const rewardEarned =
        checkForReward();


    const rewards =
        getRewardsData();


    const workSeconds =
        Math.max(
            0,
            Number(rewards.workSeconds) || 0
        );


    const rewardCount =
        Math.max(
            0,
            Number(rewards.count) || 0
        );


    /*
     * Liczba zdobytych nagród.
     */

    if (rewardElements.count) {

        rewardElements.count.textContent =
            rewardCount;

    }


    /*
     * Całkowity czas pracy
     * zgromadzony do następnej nagrody.
     */

    if (rewardElements.total) {

        rewardElements.total.textContent =
            `${formatRewardTime(workSeconds)} / 20 h`;

    }


    /*
     * Procent postępu.
     */

    const progress =
        Math.min(
            100,
            (
                workSeconds /
                REWARD_GOAL_SECONDS
            ) * 100
        );


    if (rewardElements.progressFill) {

        rewardElements.progressFill.style.width =
            `${progress}%`;

    }


    /*
     * Komunikat pod paskiem.
     */

    if (rewardElements.progressMessage) {

        const remainingSeconds =
            Math.max(
                0,
                REWARD_GOAL_SECONDS -
                workSeconds
            );


        if (workSeconds === 0) {

            rewardElements.progressMessage.textContent =
                "Zacznij pracę, aby rozpocząć postęp.";

        } else {

            rewardElements.progressMessage.textContent =
                `Pozostało ${formatRewardTime(remainingSeconds)} do nagrody.`;

        }

    }


    /*
     * Komunikat o zdobytej nagrodzie.
     */

    if (rewardElements.complete) {

        if (rewardEarned) {

            rewardElements.complete.hidden =
                false;

        } else {

            rewardElements.complete.hidden =
                true;

        }

    }

}


/* ========================================
   INICJALIZACJA
======================================== */

function initializeRewards() {

    initializeRewardElements();

    renderRewards();

}
