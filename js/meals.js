/*
 * ========================================
 * MEALS
 * ========================================
 *
 * Obsługa pięciu posiłków i buźki.
 */


/* ========================================
   KONFIGURACJA
======================================== */

const MEAL_MOODS = [
    "😭", // 0
    "😢", // 1
    "😐", // 2
    "🙂", // 3
    "😊", // 4
    "🥰"  // 5
];


/* ========================================
   ELEMENTY
======================================== */

let mealMoodElement = null;
let mealsProgressElement = null;


/* ========================================
   INICJALIZACJA
======================================== */

function initializeMeals() {

    mealMoodElement =
        document.querySelector("#meal-mood");

    mealsProgressElement =
        document.querySelector("#meals-progress");


    /*
     * Znajdujemy wszystkie checkboxy
     * posiłków.
     */

    const mealInputs =
        document.querySelectorAll(
            "input[data-meal]"
        );


    /*
     * Podpinamy reakcję na zaznaczenie
     * każdego posiłku.
     */

    mealInputs.forEach(input => {

        input.addEventListener(
            "change",
            () => {

                const mealName =
                    input.dataset.meal;


                /*
                 * Zapisujemy stan posiłku.
                 */

                setMealStatus(
                    mealName,
                    input.checked
                );


                /*
                 * Od razu aktualizujemy
                 * buźkę i licznik.
                 */

                renderMeals();

            }
        );

    });


    /*
     * Przy uruchomieniu strony
     * wczytujemy zapisane posiłki.
     */

    renderMeals();

}


/* ========================================
   LICZENIE POSIŁKÓW
======================================== */

function getCompletedMealsCount() {

    const meals =
        getAppData().currentDay.meals;


    return Object.values(meals)
        .filter(Boolean)
        .length;

}


/* ========================================
   RENDEROWANIE
======================================== */

function renderMeals() {

    const meals =
        getAppData().currentDay.meals;


    /*
     * Ustawiamy checkboxy zgodnie
     * z zapisanym stanem.
     */

    document
        .querySelectorAll(
            "input[data-meal]"
        )
        .forEach(input => {

            const mealName =
                input.dataset.meal;


            input.checked =
                meals[mealName] === true;

        });


    /*
     * Liczymy posiłki.
     */

    const completedCount =
        getCompletedMealsCount();


    /*
     * Zmieniamy buźkę.
     */

    if (mealMoodElement) {

        mealMoodElement.textContent =
            MEAL_MOODS[completedCount];

    }


    /*
     * Zmieniamy licznik.
     */

    if (mealsProgressElement) {

        mealsProgressElement.textContent =
            `${completedCount} / 5 posiłków`;

    }

}
