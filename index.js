const express = require('express');
const generateTimezones = require('./timezone.generator');
const app = express();

app.get('/', async (req, res) => {
    return await generateTimezones();
});


app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});