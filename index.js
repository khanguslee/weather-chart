var socket = io();

function kelvinToCelsius(inputTemperature) {
    celsiusTemperature = inputTemperature - 273.15;
    return celsiusTemperature
}

function convertToCelsiusArray(inputTemperatureArray) {
    return inputTemperatureArray.map((item) => kelvinToCelsius(item));
}

function createTemperatureArray(inputWeatherArray) {
    let outputTemperatureArray = [];
    for(let index = 0; index < inputWeatherArray.length; index++){
        outputTemperatureArray.push(inputWeatherArray[index].main.temp);
    }

    return outputTemperatureArray
}

function storeTimeAndWeatherData(inputTimeArray, inputWeatherData) {
    let outputData = []
    for(let index = 0; index<inputTimeArray.length; index++) {
        let currentItem = {}
        currentItem.time = inputTimeArray[index];
        currentItem.temperature = inputWeatherData[index];
        outputData.push(currentItem);
    }
    return outputData
}

function pointerPosition(xPosition, show) {
    let markerPointer = d3.select('#marker-pointer');
    markerPointer
          .attr("x1", xPosition)
          .attr("x2", xPosition)
    if(show) {
        markerPointer.classed("hidden", false)
    }
}

function mouseOver() {
    pointerPosition(event.clientX, true);
}

function mouseMove() {
    pointerPosition(event.clientX);
}

function mouseOut() {
    d3.select('#marker-pointer').classed("hidden", true)
}

var xScale, yScale;

function submitCity() {
    let inputCity = document.getElementById('inputCityName').value.toLowerCase();

    // Check for no inputted city
    if (inputCity == '') {
        return false
    }
    
    // Get data from server endpoint
    fetch('/weather/' + inputCity)
    .then((response) => {
        return response.json();
    })
    .then((jsonData) => {
        function mouseClick() {
            // Get the  x position of the mouse when user clicks on d3 chart
            // TODO: Create default username if user hasn't supplied?
            let username = document.getElementById('room-username').value;
            
            // Getting the corresponding temperature and time values
            // TODO: Increase accuracy of below values (Off by a few pixels)
            // clickedTemperature does not correspond to the data point value
            let clickedTemperature = yScale.invert(d3.mouse(document.getElementById('y-axis'))[1]);
            let clickedTime = xScale.invert(d3.mouse(document.getElementById('x-axis'))[0]);

            // Emit message to send to server
            let message = {'username': username, temperature: clickedTemperature, time: clickedTime, city: inputCity};
            socket.emit('New Marker', message);
        }

        // Convert data to suitable format
        console.log(jsonData);
        let weatherDataArray = jsonData.list;
        let parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S");
        let timeDataArray = weatherDataArray.map((data) => parseTime(data.dt_txt));
        let temperatureArrayData = []
        temperatureArrayData = createTemperatureArray(weatherDataArray);
        celsiusTemperatureArray = convertToCelsiusArray(temperatureArrayData);

        // Store data into an array of objects
        let data = storeTimeAndWeatherData(timeDataArray, celsiusTemperatureArray);

        // Create overall chart
        var margin = {top: 20, right: 20, bottom: 150, left:50};
        var svgWidth = 1000;
        var svgHeight = 600;
        let chartWidth = svgWidth - margin.left - margin.right;
        let chartHeight = svgHeight - margin.top - margin.bottom;
        d3.select('svg').selectAll('rect').remove();
        d3.select('svg').selectAll('g').remove();

        // Define y axis
        yScale = d3.scaleLinear()
            .range([chartHeight, 0])
            .domain([0, d3.max(celsiusTemperatureArray) + 10]);

        // Define x axis
        xScale = d3.scaleTime()
            .domain(d3.extent(timeDataArray))
            .range([0, chartWidth]);

        var svg = d3.select('svg')
            .attr("width", svgWidth)
            .attr("height", svgHeight)
            .attr("class", "bar-chart")
            .on('click', mouseClick)
            .on("mouseover", mouseOver)
            .on("mousemove", mouseMove)
            .on("mouseout", mouseOut);

        // Create both axes
        var chart = svg.append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);

        chart.append('g')
            .attr('class', 'axis')
            .attr('id', 'y-axis')
            .call(d3.axisLeft(yScale));

        chart.append('g')
            .attr('class', 'axis')
            .attr('id', 'x-axis')
            .attr('transform', `translate(0, ${chartHeight})`)
            .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%Y-%m-%d %H:%M:%S")))
            .selectAll('text')
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-65)");

        // Create line chart
        var valueline = d3.line()
            .x(function(d) { return xScale(d.time); })
            .y(function(d) { return yScale(d.temperature); });

        chart.append("path")
            .data([data])
            .attr("class", "line")
            .attr("d", valueline);

        console.log(data);

        // Create room to join
        socket.emit('Create Room', inputCity);

        // Query server of any markers saved
        socket.emit('Query Markers', inputCity);
    })
    .catch((error) => {
        // TODO: Notify user that there was an error searching for the specified city
        return false
    })
}

socket.on('Generate Marker', (marker) => {
    let strictIsoParse = d3.utcParse("%Y-%m-%dT%H:%M:%S.%LZ");
    let xPosition = xScale(strictIsoParse(marker.time));
    let username = marker.username;
    if (!('markerColour' in marker)) {
        marker.markerColour = 'grey';
    }
    
    if (marker.username == '') {
        username = 'Marker';
    }
    let annotation = [{
        note: {
            title: username
        },
        x: xPosition + 50,
        y: 600 - 150,
        dy: -(600 - 200),
        dx: 0,
        color: marker.markerColour
    }];
    const makeAnnotations = d3.annotation()
        .type(d3.annotationLabel)
        .annotations(annotation);

    d3.select("svg")
        .append("g")
        .attr("class", "annotation-group")
        .call(makeAnnotations)
        .on('click', () => {
            // TODO: Add an onclick event to remove marker
            console.log('Remove marker')
            console.log(d3.mouse(this))
        });
    document.getElementById('clear-markers').style.visibility = 'visible';
})

socket.on('Remove Marker', () => {
    // Remove existing annotations
    d3.select('svg').selectAll('.annotation-group').remove();
    let inputCity = document.getElementById('inputCityName').value.toLowerCase();
    socket.emit('Query Markers', inputCity);
})

function clearMarkers() {
    document.getElementById('clear-markers').style.visibility = 'hidden';
    
    // Tell server to clear all markers in the current room
    let inputCity = document.getElementById('inputCityName').value.toLowerCase();
    if (inputCity == '') return;
    socket.emit('Remove All Markers', inputCity);
    
}