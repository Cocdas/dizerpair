const express = require('express');
const app = express();
const __path = process.cwd();
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 8000;

// ✅ Router එක import කරන්න
const code = require('./pair');

// Event listener limit increase
require('events').EventEmitter.defaultMaxListeners = 500;

// Middleware setup (මුලින්ම bodyParser use කරන්න)
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ✅ Router එක use කරන්න
app.use('/code', code);

// Root route (app.use වෙනුවට app.get භාවිතා කරන්න)
app.get('/', (req, res) => {
    res.sendFile(__path + '/pair.html');
});

app.listen(PORT, () => {
    console.log(`⏩ Server running on http://localhost:` + PORT);
});

module.exports = app;
