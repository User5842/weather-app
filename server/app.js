require('dotenv').config();

const path = require('path');

const express = require('express');
const p = require('phin');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.json());

const createWeatherClient = (() => {
    const options = {
        method: 'GET',
        parse: 'json'
    };

    return {
        getCityConditions: cityKey => ({
            ...options,
            url: `http://dataservice.accuweather.com/currentconditions/v1/${cityKey}?apikey=${process.env.API_KEY}`
        }),

        getLocationKey: city => ({ 
            ...options,
            url: `http://dataservice.accuweather.com/locations/v1/cities/search?apikey=${process.env.API_KEY}&q=${city}`
        })
    }
})();

const isSuccessStatusCode = statusCode => statusCode >= 200 && statusCode <= 299;

app.post('/weather', async (req, res) => {
    if (!req.body.city) {
        res.status(404).json({ message: 'You must include a payload containing your city name.' });
        return;
    }

    const locationInformation = await p(createWeatherClient.getLocationKey(req.body.city));
    if (!isSuccessStatusCode(locationInformation.statusCode)) {
        res
            .status(locationInformation.statusCode)
            .json({ message: locationInformation.statusMessage });
        return;
    }

    const locationKey = locationInformation.body[0].Key;
    
    const citiesInformation = await p(createWeatherClient.getCityConditions(locationKey));
    if (!isSuccessStatusCode(citiesInformation.statusCode)) {
        res
            .status(locationInformation.statusCode)
            .json({ message: locationInformation.statusMessage });
        return;
    }

    const cityInformation = citiesInformation.body[0];
    const { isDayTime, Temperature: { Imperial: { Value } }, WeatherText } = cityInformation;

    res
        .status(200)
        .json({ 
            dayTime: isDayTime ? 'Yes' : 'No',
            temperature: Value,
            weatherCondition: WeatherText
        });
});

app.listen(3000, () => console.log('Listening...'));