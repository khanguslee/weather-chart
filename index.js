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
        console.log(JSON.stringify(jsonData));
    })
}