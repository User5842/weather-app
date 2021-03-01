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

const handleBadResponse = (res, { statusCode, statusMessage }) => {
    res
        .status(statusCode)
        .json({ message: statusMessage });
}

const handleException = (res, e) => {
    res
        .status(404)
        .json({ message: e.message });
};

const isSuccessStatusCode = statusCode => statusCode >= 200 && statusCode <= 299;

app.post('/weather', async (req, res) => {
    if (!req.body.city) {
        res.status(404).json({ message: 'You must include a payload containing your city name.' });
        return;
    }

    const locationInformation = await p(createWeatherClient.getLocationKey(req.body.city));
    if (!isSuccessStatusCode(locationInformation.statusCode)) {
        handleBadResponse(res, locationInformation);
        return;
    }

    let locationKey;
    try {
        locationKey = locationInformation.body[0].Key;
    } catch (e) {
        handleException(res, e);
        return;
    }
    
    const citiesInformation = await p(createWeatherClient.getCityConditions(locationKey));
    if (!isSuccessStatusCode(citiesInformation.statusCode)) {
        handleBadResponse(res, citiesInformation);
        return;
    }

    let cityInformation;
    try {
        cityInformation = citiesInformation.body[0];
    } catch (e) {
        handleException(res, e);
        return;
    }

    const { IsDayTime, Temperature: { Imperial: { Value } }, WeatherText } = cityInformation;

    res
        .status(200)
        .json({ 
            dayTime: IsDayTime ? 'Yes' : 'No',
            temperature: Value,
            weatherCondition: WeatherText
        });
});

app.listen(port, () => console.log('Listening...'));