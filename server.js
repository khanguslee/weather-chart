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
var storedUsers = {};
var storedMousePosition = {};

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

function createRandomHEXString() {
    // Create a random RGB value
    return '#' + Math.random().toString().slice(2,8);
}

io.on('connection', (socket) => {
    console.log('User connected');

    socket.on('New Marker', (message) => {
        let outputMessage = message;
        // Store markers
        if (!(message.city in storedMarkers)) {
            storedMarkers[message.city] = [message];
        } else {
            let cityMarkers = storedMarkers[message.city];
            // Only add marker if it has not been added yet
            if (!isMarkerAdded(cityMarkers, message)) {
                cityMarkers.push(message);
                storedMarkers[message.city] = cityMarkers;
            } else {
                // TODO: Hide Clear Markers button if there are no markers left
                removeMarker(cityMarkers, message);
                socket.emit('Remove Marker');
                console.log('User ' + message.username + ' removed marker at ' + message.time + ' with temperature ' + message.temperature);
                return;
            }
        }

        // Store a colour for that user
        if ((message.username != '') && !(message.username in storedUsers)) {
            storedUsers[message.username] = createRandomHEXString();
        }
        outputMessage.markerColour = storedUsers[message.username];

        // Send to everyone in the room
        console.log('User ' + message.username + ' placed marker at ' + message.time + ' with temperature ' + message.temperature);
        socket.emit('Generate Marker', outputMessage);
        socket.to(message.city).emit('Generate Marker', outputMessage);

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

    socket.on('Remove All Markers', (inputRoomName) => {
        // Check if there are markers stored for this city/room name
        if (!(inputRoomName in storedMarkers)) {
            return;
        }

        // Clear list of markers
        storedMarkers[inputRoomName] = []
        socket.emit('Remove Marker');
        // Tell other users in the room to remove their markers too
        // TODO: Option to disable this?
        socket.to(inputRoomName).emit('Remove Marker');
    })
    
    socket.on('Update User Position', (message) => {
        let outputMessage = message;
        if ((message.username != '') && !(message.username in storedUsers)) {
            storedUsers[message.username] = createRandomHEXString();
        }

        outputMessage.colour = storedUsers[message.username];
        socket.to(message.roomName).emit('Render User Position', outputMessage);
    })
})