// Server modules
const express = require('express');
const app = express ();
const port = 3000;

// Other modules
const path = require('path');
const fs = require('fs');
const request = require('request');

/*
    You will need to create the below config file and store your API key from OpenWeatherMap there
*/
const API_KEY = fs.readFileSync('open_weather_map_api_key.config', 'utf-8');
const openWeatherMapBaseURL = 'http://api.openweathermap.org/data/2.5'

// Start server
app.listen(port, () => console.log(`Example app listening on port ${port}!`));

// Endpoint for main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/index.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.js'));
});

app.get('/index.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.css'));
});


// Endpoint to get weather forecase for a city
app.get('/weather/:cityName', (req, res) => {
    const forecastURL = openWeatherMapBaseURL + '/forecast?q=' + req.params.cityName + '&mode=json&APPID=' + API_KEY;
    console.log(forecastURL);
    request(forecastURL, {json: true}, (error, response, body) => {
        if (error) {
            console.error(error);
            response.render(error);
        }
        console.log(body);
        res.send(body);
    })
});