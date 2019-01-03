// Server modules
const express = require('express');
const app = express ();
const port = 3000;

// Other modules
const path = require('path');

// Start server
app.listen(port, () => console.log(`Example app listening on port ${port}!`));

// Endpoint for main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});