const express = require('express');
const path = require('path'); // 'path' module එකත් use කරන්න
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 8000;

let code = require('./pair'); // pair code generator එක


require('events').EventEmitter.defaultMaxListeners = 500;


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.use('/code', code);


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pair.html'));
});


app.listen(PORT, () => {
    console.log(`⏩ Server running on http://localhost:${PORT}`);
});

module.exports = app;
