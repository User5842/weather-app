const path = require('path');

const express = require('express');
const p = require('phin');

const app = express();

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
            url: `http://dataservice.accuweather.com/currentconditions/v1/${cityKey}?apikey=vlawhhixjBTyTI7AnoOFlaAmhSEYjqfa`
        }),

        getLocationKey: city => ({ 
            ...options,
            url: `http://dataservice.accuweather.com/locations/v1/cities/search?apikey=vlawhhixjBTyTI7AnoOFlaAmhSEYjqfa&q=${city}`
        })
    }
})();

app.post('/weather', (req, res) => {
    if (!req.body.city) {
        res.status(404).json({ message: 'You must include a payload containing your city name. '});
        return;
    }

    p(createWeatherClient.getCityConditions(req.body.city))
        .then(locationInformation => {
            if (locationInformation.statusCode === 503) {
                res.status(503).json({ message: 'Request limit exceeded! Please try again later.' });
                return;
            }
    
            p(createWeatherClient.getCityConditions(locationInformation.body[0].Key))
                .then(citiesInfo => {
                    const cityInformation = citiesInfo.body[0];

                    res
                        .status(200)
                        .json({ 
                            dayTime: cityInformation.IsDayTime ? 'Yes' : 'No',
                            temperature: cityInformation.Temperature.Imperial.Value,
                            weatherCondition: cityInformation.WeatherText
                         });
                })
                .catch(error => res.status(404).json({ error: error }));
           
        })
        .catch(error => res.status(404).json({ error: error }));
});

app.listen(3000, () => console.log('Listening...'));