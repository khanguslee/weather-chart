// Server modules
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = 3000;

// Other modules
const path = require('path');
const fs = require('fs');
const request = require('request');

/*
    You will need to create the below config file ('open_weather_map_api_key.config') and store your API key from OpenWeatherMap there
*/
const API_KEY = fs.readFileSync('open_weather_map_api_key.config', 'utf-8');
const openWeatherMapBaseURL = 'http://api.openweathermap.org/data/2.5'


// Start server
server.listen(port, () => console.log(`Example app listening on port ${port}!`));

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
        res.send(body);
    })
});

io.on('connection', (socket) => {
    console.log('User connected');
    socket.on('New Marker', (message) => {
        console.log('User ' + message.username + ' placed marker at ' + message.time + ' with temperature ' + message.temperature);
    })
})