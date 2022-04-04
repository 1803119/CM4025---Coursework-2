// Load express and create app
var express = require('express');
var app = express();
//const MongoClient = require('mongodb').MongoClient;
//const { ObjectId } = require('mongodb');

const PORT = process.env.PORT || 8080;

// Set the port based on environment
var port = PORT;

app.use(express.urlencoded({
    extended: true
  }));


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
client.connect(err => {
    console.log("Connected to MongoDB");
    const collection = client.db("test").collection("devices");
    // perform actions on the collection object
    collection.insertOne({name: "Andrew", age: 21}, function(err, res){
        if (err) throw err;
        console.log("1 user inserted");
    });

    //client.close();
});

// send index.html file as home page
app.get('/', function(req, res){
    res.sendFile(__dirname + '/Pages/index.html');
});

// Routes for admin section
var adminRouter = express.Router();
adminRouter.get('/', function(req, res){
    res.send('Admin dashboard');
});

app.use('/admin', adminRouter);

// route for login
app.route('/login')
// show the form
.get(function(req, res){
    res.sendFile(__dirname + '/Pages/login.html');
})
// Process the form
.post(function(req, res){
    console.log(req.body);
    //var inputName = req.query.inputName;
    //var inputAge = req.query.inputAge;
    //console.log("The parmeters are Name: " + inputName + ", Age: " + inputAge);
    res.send('Processing the login form');
    
});



// start server
app.listen(PORT);
console.log('Express Server running');