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

function submitCity() {
    let inputCity = document.getElementById('inputCityName').value;

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

        var svg = d3.select('svg')
            .attr("width", svgWidth)
            .attr("height", svgHeight)
            .attr("class", "bar-chart")
            .on('click', () => {
                // Get the  x position of the mouse when user clicks on d3 chart
                socket.emit('x position', event.clientX);
                console.log(event.clientX);
            });
        
        // Define y axis
        const yScale = d3.scaleLinear()
            .range([chartHeight, 0])
            .domain([0, d3.max(celsiusTemperatureArray) + 10]);

        // Define x axis
        const xScale = d3.scaleTime()
            .domain(d3.extent(timeDataArray))
            .range([0, chartWidth]);

        // Create both axes
        var chart = svg.append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);

        chart.append('g')
            .call(d3.axisLeft(yScale));

        chart.append('g')
            .attr('class', 'axis')
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
    })
}

