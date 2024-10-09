const express = require('express');
const path = require('path'); // Import path module
const bodyParser = require("body-parser");
const app = express();
const PORT = process.env.PORT || 8000;
const code = require('./pair');

// Increase maximum listeners for events
require('events').EventEmitter.defaultMaxListeners = 500;

// Middleware to parse JSON and URL-encoded data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve the 'pair.html' file when accessing the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pair.html')); // Use path.join for safety
});

// Use '/code' route for your custom module
app.use('/code', code);

// Start the server
app.listen(PORT, () => {
    console.log(`⏩ Server running on http://localhost:${PORT}`);
});

// Export the app for Vercel
module.exports = app;
