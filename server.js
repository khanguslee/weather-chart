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

// TODO: Replace this with a database instead
var storedMarkers = {};

function isMarkerAdded(inputMarkerArray, inputMarker) {
    for(let index = 0; index< inputMarkerArray.length; index++) {
        let currentMarker = inputMarkerArray[index];
        if (inputMarker.time == currentMarker.time) return true;
    }
    return false
}

function removeMarker(inputMarkerArray, inputMarker) {
    for(let index = 0; index< inputMarkerArray.length; index++) {
        let currentMarker = inputMarkerArray[index];
        if (inputMarker.time == currentMarker.time) {
            inputMarkerArray.pop(index);
        }
    }
}

io.on('connection', (socket) => {
    console.log('User connected');

    socket.on('New Marker', (message) => {
        // Store markers
        // TODO: Markers to store username as well
        if (!(message.city in storedMarkers)) {
            storedMarkers[message.city] = [message];
        } else {
            let cityMarkers = storedMarkers[message.city];
            // Only add marker if it has not been added yet
            if (!isMarkerAdded(cityMarkers, message)) {
                cityMarkers.push(message);
                storedMarkers[message.city] = cityMarkers;
            } else {
                removeMarker(cityMarkers, message);
                socket.emit('Remove Marker');
                console.log('User ' + message.username + ' removed marker at ' + message.time + ' with temperature ' + message.temperature);
                return;
            }
        }
        
        // Send to everyone in the room
        console.log('User ' + message.username + ' placed marker at ' + message.time + ' with temperature ' + message.temperature);
        socket.emit('Generate Marker', message);
        socket.to(message.city).emit('Generate Marker', message);

        console.log(storedMarkers);
    })

    socket.on('Create Room', (inputRoomName) => {
        // Ensure we only connect to one room at a time
        for(room in socket.rooms) {
            // Leave all other rooms apart from your own room (socket.id)
            if (socket.id !== room) {
                socket.leave(room);
            }
        }
        socket.join(inputRoomName);
        console.log('Created room: ' + inputRoomName);
    })

    socket.on('Query Markers', (inputRoomName) => {
        if (!(inputRoomName in storedMarkers)) return;

        let markerArray = storedMarkers[inputRoomName];
        for (let index = 0; index < markerArray.length; index++) {
            socket.emit('Generate Marker', markerArray[index]);
        }
    })
})