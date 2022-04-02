// Load express and create app
var express = require('express');
var app = express();

const PORT = process.env.PORT || 8080;

// Set the port based on environment
var port = PORT;

// send index.html file as home page
app.get('/', function(req, res){
    res.sendFile(__dirname + '/Pages/index.html');
});

// route for login
app.route('/login')
// show the form
.get(function(req, res){
    res.sendFile(__dirname + '/Pages/login.html');
})
// Process the form
.post(function(req, res){
    console.log('Processing');
    res.send('Processing the login form');
});

// start server
app.listen(PORT);
console.log('Express Server running');