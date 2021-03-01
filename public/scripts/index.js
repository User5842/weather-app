

const content = document.querySelector('.content');

const form = document.querySelector('.form');
const formCityInput = form['city'];

function createWeatherElement(condition, city, dayTime, temperature) {
    const weatherTemplate = document.querySelector('#weather-template').content.querySelector('.weather');
    const weatherElement = weatherTemplate.cloneNode(true);

    const weatherCity = weatherElement.querySelector('.weather__city');
    const weatherDaytime = weatherElement.querySelector('.weather__daytime');
    const weatherTemperature = weatherElement.querySelector('.weather__temperature');
    const weatherText = weatherElement.querySelector('.weather__text');

    toggleWeatherElement(weatherElement);

    weatherCity.textContent = city || formCityInput.value;
    weatherDaytime.textContent = `Is it currently daytime? ${dayTime}`;
    weatherTemperature.textContent = `The temperature currently is: ${temperature} °F`;
    weatherText.textContent = `The condition is: ${condition}`;

    return weatherElement;
}

/**
 * Get city conditions.
 * @param {String} city Name of city. 
 */
function getCityConditions(city) {
    if (!city) return;

    fetch('http://localhost:3000/weather', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json'
        },
        referrerPolicy: 'no-referrer',
        body: JSON.stringify({ city: city })
    })
        .then(response => {
            if (!response.ok) {
                throw Error(response.statusText);
            }

            return response.json();
        })
        .then(data => content.append(createWeatherElement(data.weatherCondition, city, data.dayTime, data.temperature)))
        .catch(error => console.log(error));
}

/**
 * Toggle `weatherElement` on/off.
 */
function toggleWeatherElement(weatherElement) {
    if (weatherElement.classList.contains('.weather_is_displayed')) {
        weatherElement.classList.remove('.weather_is_displayed');
        return;
    }

    weatherElement.classList.add('.weather_is_displayed');
}

/**
 * Submit event handler for the weather form.
 */
form.addEventListener('submit', event => {
    event.preventDefault();
    getCityConditions(formCityInput.value);
});

/**
 * Process `beforeunload` events.
 * @link https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onbeforeunload
 */
window.addEventListener("beforeunload", () => { 
    if (formCityInput.value) {
        localStorage.setItem('city', formCityInput.value);
    }
});

/**
 * Process `load` events.
 * @link https://developer.mozilla.org/en-US/docs/Web/API/Window/load_event
 */
window.addEventListener('load', () => getCityConditions(localStorage.getItem('city')));