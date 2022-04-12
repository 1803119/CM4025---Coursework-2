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
        res.render('pages/login', {firstName: "Not logged in"});
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


app.route('/register')
.get(function(req, res){
    res.render('pages/register', {firstName: "Not logged in"});
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

userAccountRouter.get("/deleteAccount", function(req, res){
    const token = req.cookies.token;

    if(!token){
        //res.render('pages/index', {firstName: "Not logged in"});
        res.redirect("/");
    }

    var payload = renewToken(token, res);

    client.db().collection("users").deleteOne({emailAddress: payload.emailAddress}, function(err, result){
        res.clearCookie("token");
        res.redirect("/");
    });
});


app.use('/myAccount', userAccountRouter)

// .post(function(req, res){

// });

app.route('/comments')
.get(function(req, res){
    
    client.db().collection("comments").find({}).toArray(function(commentErr, commentResults){
        if(commentErr) throw commentErr;
        //console.log(commentResults);

        const token = req.cookies.token;

        if(!token){
            //res.render('pages/index', {firstName: "Not logged in"});
            res.render("pages/comments", {firstName: "Not logged in", comments: commentResults, isAdmin: false});
        }

        var payload = renewToken(token, res);
        var isAdmin = false;

        client.db().collection("adminUsers").findOne({emailAddress: payload.emailAddress}, function(err, result){
            if(result != undefined){
                console.log("isAdmin: " + result.emailAddress);
                isAdmin = true;
            }
            
            client.db().collection("users").findOne({emailAddress: payload.emailAddress}, function(err, result){
                if(result != undefined){
            
                    res.render('pages/comments', {firstName: result.firstName, comments: commentResults, isAdmin: isAdmin});
            
                }
            });
        });

        
    });
})
.post(function(req, res){
    var data = req.body;

    client.db().collection("comments").insertOne(data, function(err, result){
        if (err) throw err;
        console.log("Added comment");
    });
    res.redirect('/comments');
});

app.route('/deleteComments')
.get(function(req, res){
    client.db().collection("comments").drop(function(err, result){
        if (err) throw err;
        console.log("Dropped comments collection");
    });
    res.redirect('/comments');
});


app.route('/shop')
.get(function(req, res){
    client.db().collection("shopItems").find({}).toArray(function(shopErr, shopResults){
        if(shopErr) throw shopErr;
        const token = req.cookies.token;

        if(!token){
            res.render('pages/shop', {firstName: "Not logged in", shopItems: shopResults});
        }

        var payload = renewToken(token, res);



        client.db().collection("users").findOne({emailAddress: payload.emailAddress}, function(err, result){
            if(result != undefined){
                res.render('pages/shop', {firstName: result.firstName, shopItems: shopResults});
            }
        });
    });
})
.post(function(req, res){
    var data = req.body;
    
    const token = req.cookies.token;

    if(!token){
        //res.render('pages/index', {firstName: "Not logged in"});
        res.redirect("/shop");
    }

    var payload = renewToken(token, res);

    //var newItemStock = parseInt(data.itemStock) - parseInt(data.quantity);
    client.db().collection("users").findOne({emailAddress: payload.emailAddress, cart: {$elemMatch: {itemName: data.itemName}}}, function(err, result){
        if(result != null){
            var newCart = result.cart
            console.log(newCart);
            newCart.forEach(item => {
                var itemQuantity = parseInt(item.quantity);
                var dataQuantity = parseInt(data.quantity);
                if(item.itemName == data.itemName){
                    item.quantity = itemQuantity + dataQuantity;
                }
            });
            console.log(newCart);
            client.db().collection("users").updateOne({emailAddress: payload.emailAddress}, {$set: {cart: newCart}}, function(err1, res1){
                //res.redirect("/shop");
            });
        }
        else{
            client.db().collection("users").updateOne({emailAddress: payload.emailAddress}, {$push: {cart: {itemName: data.itemName, itemCost: data.itemCost, quantity: data.quantity}}});
        }
        
        client.db().collection("shopItems").updateOne({itemName: data.itemName},{$set: {itemStock: (data.itemStock - data.quantity)}}, function(shopErr, shopResult){
            if(shopErr) throw shopErr;
            res.redirect("/shop");
        });
        //console.log(result);
    });

    // client.db().collection("users").updateOne({emailAddress: payload.emailAddress}, {$push: {cart: {itemName: data.itemName, itemCost: data.itemCost, quantity: data.quantity}}});//{
    // client.db().collection("shopItems").updateOne({itemName: data.itemName},{$set: {itemStock: (data.itemStock - data.quantity)}}, function(shopErr, shopResult){
    //     if(shopErr) throw shopErr;
    //     res.redirect("/shop");
    // });
    //if(result != undefined){
            //res.render('pages/editAccount', {firstName: result.firstName, lastName: result.lastName, dateOfBirth: result.dateOfBirth, emailAddress: result.emailAddress});
        //}
    
});


app.route('/cart')
.get(function(req, res){
    const token = req.cookies.token;

    if(!token){
        //res.render('pages/index', {firstName: "Not logged in"});
        res.redirect("/");
    }

    var payload = renewToken(token, res);

    client.db().collection("users").findOne({emailAddress: payload.emailAddress}, function(err, result){
        if(result != undefined){
            res.render('pages/cart', {firstName: result.firstName, cartItems: result.cart});
        }
    });
})
.post(function(req, res){
    var data = req.body;

    const token = req.cookies.token;

    if(!token){
        //res.render('pages/index', {firstName: "Not logged in"});
        res.redirect("/");
    }

    var payload = renewToken(token, res);


    client.db().collection("users").findOne({emailAddress: payload.emailAddress, cart: {$elemMatch: {itemName: data.itemName}}}, function(err, result){
        var newCart = result.cart
        console.log("itemStock: " + data.itemStock);
        var removeIndex = 0;
        var itemQuantity = 0;
        // var itemStock = 
        for(var i = 0; i < newCart.length; i++){
            if(newCart[i].itemName == data.itemName){
                itemQuantity = newCart[i].quantity;
                removeIndex = i;
            }
        }
        newCart.splice(removeIndex, 1);
    //     if (item.itemName == data.itemName){

    //     }
    //     var dataQuantity = parseInt(data.quantity);
    //     if(item.itemName == data.itemName){
    //         item.quantity = itemQuantity + dataQuantity;
    //     }
    // });
        console.log(newCart);
        client.db().collection("users").updateOne({emailAddress: payload.emailAddress}, {$set: {cart: newCart}}, function(err1, res1){
            client.db().collection("shopItems").updateOne({itemName: data.itemName},{$set: {itemStock: (data.itemStock + itemQuantity)}}, function(shopErr, shopResult){
                if(shopErr) throw shopErr;
                res.redirect("/cart");
            //res.redirect("/cart");
            });
        });
    });
});




// start server
app.listen(PORT);
console.log('Express Server running');






//--------------------functions----------------------
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