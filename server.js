// Load express and create app
var express = require('express');
var app = express();
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const ejs = require('ejs');
const nocache = require('nocache');

app.use(nocache());

//const MongoClient = require('mongodb').MongoClient;
//const { ObjectId } = require('mongodb');

const PORT = process.env.PORT || 8080;

// Set the port based on environment
var port = PORT;
const sessionTimeout = 600;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));

app.set('view engine', 'ejs');

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
client.connect(err => {
    console.log("Connected to MongoDB");
    //const collection = client.db().collection("devices");
    // perform actions on the collection object
    // collection.insertOne({name: "Andrew", age: 21}, function(err, res){
    //     if (err) throw err;
    //     console.log("1 user inserted");
    // });

    //client.close();
});

// send index.html file as home page
app.get('/', function(req, res){
    //console.log(req);

    const token = req.cookies.token;

    if(!token){
        res.render('pages/index', {firstName: "Not logged in"});
    }

    // var payload
    // try{
    //     payload = jwt.verify(token, process.env.JWT_KEY)
    // }
    // catch (e){
    //     if (e instanceof jwt.JsonWebTokenError) {
	// 		// if the error thrown is because the JWT is unauthorized, return a 401 error
	// 		return res.status(401).end()
    //     }
    // }
    var payload = renewToken(token, res);



    client.db().collection("users").findOne({emailAddress: payload.emailAddress}, function(err, result){
        if(result != undefined){
            res.render('pages/index', {firstName: result.firstName});
        }
        
    });

    
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
    const token = req.cookies.token;

    if(!token){
        res.render('pages/login');
    }

    // var payload
    // try{
    //     payload = jwt.verify(token, process.env.JWT_KEY)
    // }
    // catch (e){
    //     if (e instanceof jwt.JsonWebTokenError) {
	// 		// if the error thrown is because the JWT is unauthorized, return a 401 error
	// 		return res.status(401).end()
    //     }
    // }
    var payload = renewToken(token, res);



    // client.db().collection("users").findOne({emailAddress: payload.emailAddress}, function(err, result){
    //     if(result != undefined){
    //         res.render('pages/index', {firstName: result.firstName});
    //     }
        
    //});

    res.redirect("/");
})
// Process the form
.post(function(req, res){
    console.log(req.body);
    var data = req.body

    if(data == null || data == undefined){
        res.send("Login details do not match our records");
    }
    //var inputName = req.body.inputName;
    //var inputAge = req.body.inputAge;
    //console.log("The parmeters are Name: " + inputName + ", Age: " + inputAge);
    client.db().collection("users").findOne({emailAddress: data.emailAddress}, function(err, user){
        if(user == undefined || user == null){
            res.send("Login details do not match our records");
        }
        console.log("Test " + user);
        
        if(user != null){
            bcrypt.compare(data.password, user.password, function(err, success){
                if(success == true){


                    const token = jwt.sign({emailAddress: data.emailAddress}, process.env.JWT_KEY, {
                        algorithm: "HS256",
                        expiresIn: sessionTimeout
                    });
                
                    console.log("token:", token);

                    res.cookie("token", token, { maxAge: sessionTimeout * 1000 });

                    //res.json({test: "Testing"});
                    res.redirect("/");
                    //res.render('pages/index', {email: data.emailAddress});
                    //res.send("Successfully logged in as " + user.firstName + " " + user.lastName);
                }
                else{
                    res.send("Login details do not match our records");
                }
            });
        }
        
    });
    
    

    
    //res.send('Processing the login form');
    
});

// app.get('/register', function(req, res){
//     res.sendFile(__dirname + "/Pages/register copy.html");
// });

// module.exports = (app) => {
//     //const User = require('./user.model')
//     const {
//         generateSalt,
//         hash,
//         compare
//     } = require('/public/encryption');
//     let salt = generateSalt(12);
//     console.log("Hello");
//     app.post('/register', function(req, res){
//         console.log(req.body);
//         var data = req.body;
    
//         var firstName = data.firstName;
//         var lastName = data.lastName;
//         //console.log("The parmeters are Name: " + inputName + ", Age: " + inputAge);
        
//         client.db().collection("users").insertOne(data, function(err, res){//{firstName: firstName, lastName: lastName}, function(err, res){
//             if(err) throw err;
//             console.log("User registered");
//         });
//         console.log("Out of Post");
//         res.redirect("/");
//     });
// }
//console.log(salt);


app.route('/register')
.get(function(req, res){
    res.render('pages/register');
})
.post(function(req, res){
    console.log(req.body);
    var data = req.body;

    const saltRounds = 10;
    // var myPlaintextPassword = "password";
    // var hashedPass;

    bcrypt.genSalt(saltRounds, function(err, salt) {
        bcrypt.hash(data.password, salt, function(err, hash) {
            // Store hash in your password DB.
            data.password = hash;
            //hashedPass = hash;
            client.db().collection("users").insertOne(data, function(err, res){//{firstName: firstName, lastName: lastName}, function(err, res){
                if(err) throw err;
                console.log("User registered");
            });
        });
    });

    //var firstName = data.firstName;
    //var lastName = data.lastName;
    //console.log("The parmeters are Name: " + inputName + ", Age: " + inputAge);
    
    // client.db().collection("users").insertOne({firstName: data.firstName, password: hashedPass}, function(err, res){//{firstName: firstName, lastName: lastName}, function(err, res){
    //     if(err) throw err;
    //     console.log("User registered");
    // });
    //console.log("Out of Post");
    res.redirect("/");
});

var userAccountRouter = express.Router();

userAccountRouter.get("/",function(req, res){
    const token = req.cookies.token;

    if(!token){
        //res.render('pages/index', {firstName: "Not logged in"});
        res.redirect("/");
    }

    var payload = renewToken(token, res);

    client.db().collection("users").findOne({emailAddress: payload.emailAddress}, function(err, result){
        if(result != undefined){
            res.render('pages/myAccount', {firstName: result.firstName, lastName: result.lastName, dateOfBirth: result.dateOfBirth, emailAddress: result.emailAddress});
        }
    });
});

userAccountRouter.post("/", function(req, res){
    var data = req.body;

    const token = req.cookies.token;

    if(!token){
        //res.render('pages/index', {firstName: "Not logged in"});
        res.redirect("/");
    }

    var payload = renewToken(token, res);

    client.db().collection("users").updateOne({emailAddress: payload.emailAddress}, {$set: {firstName: data.firstName, lastName: data.lastName, dateOfBirth: data.dateOfBirth}});//{
        //if(result != undefined){
            //res.render('pages/editAccount', {firstName: result.firstName, lastName: result.lastName, dateOfBirth: result.dateOfBirth, emailAddress: result.emailAddress});
        //}
    res.redirect("/myAccount");
});

userAccountRouter.get("/editAccount", function(req, res){
    const token = req.cookies.token;

    if(!token){
        //res.render('pages/index', {firstName: "Not logged in"});
        res.redirect("/");
    }

    var payload = renewToken(token, res);

    client.db().collection("users").findOne({emailAddress: payload.emailAddress}, function(err, result){
        if(result != undefined){
            res.render('pages/editAccount', {firstName: result.firstName, lastName: result.lastName, dateOfBirth: result.dateOfBirth, emailAddress: result.emailAddress});
        }
    });
    //res.send("Edit account details page");
});


app.use('/myAccount', userAccountRouter)

// .post(function(req, res){

// });








// start server
app.listen(PORT);
console.log('Express Server running');






//--------------------functions
function renewToken(oldToken, res){
    var payload
    try{
        payload = jwt.verify(oldToken, process.env.JWT_KEY)
    }
    catch (e){
        if (e instanceof jwt.JsonWebTokenError) {
			// if the error thrown is because the JWT is unauthorized, return a 401 error
			return res.status(401).end()
        }
    }
    console.log(payload.emailAddress);
    const token = jwt.sign({emailAddress: payload.emailAddress}, process.env.JWT_KEY, {
        algorithm: "HS256",
        expiresIn: sessionTimeout
    });

    console.log("token:", token);

    res.cookie("token", token, { maxAge: sessionTimeout * 1000 });

    return payload;
}