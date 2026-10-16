const MEAL_MOODS = ["😭", "😢", "😐", "🙂", "😊", "🥰"];

function initializeMeals() {
    document.querySelectorAll("input[data-meal]").forEach(input => {
        input.addEventListener("change", () => {
            setMealStatus(input.dataset.meal, input.checked);
            renderMeals();
        });
    });
    renderMeals();
}

function renderMeals() {
    const meals = getAppData().currentDay.meals;
    document.querySelectorAll("input[data-meal]").forEach(input => {
        input.checked = meals[input.dataset.meal] === true;
    });
    const count = getCompletedMealsCount();
    const mood = document.querySelector("#meal-mood");
    const progress = document.querySelector("#meals-progress");
    if (mood) mood.textContent = MEAL_MOODS[count];
    if (progress) progress.textContent = `${count} / 5 posiłków`;
}
