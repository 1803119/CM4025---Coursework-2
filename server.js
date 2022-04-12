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

});

// home route
app.get('/', function(req, res){

    const token = req.cookies.token;

    if(!token){
        res.render('pages/index', {firstName: "Not logged in"});
    }

    var payload = renewToken(token, res);



    client.db().collection("users").findOne({emailAddress: payload.emailAddress}, function(err, result){
        if(result != undefined){
            res.render('pages/index', {firstName: result.firstName});
        }
        
    });

    
});

// route for login
app.route('/login')
// show the form
.get(function(req, res){
    const token = req.cookies.token;

    if(!token){
        res.render('pages/login', {firstName: "Not logged in"});
    }

    var payload = renewToken(token, res);

    res.redirect("/");
})
// Process the form
.post(function(req, res){
    //console.log(req.body);
    var data = req.body

    if(data == null || data == undefined){
        res.send("Login details do not match our records");
    }

    client.db().collection("users").findOne({emailAddress: data.emailAddress}, function(err, user){
        if(user == undefined || user == null){
            res.send("Login details do not match our records");
        }
        
        if(user != null){
            bcrypt.compare(data.password, user.password, function(err, success){
                if(success == true){


                    const token = jwt.sign({emailAddress: data.emailAddress}, process.env.JWT_KEY, {
                        algorithm: "HS256",
                        expiresIn: sessionTimeout
                    });
                
                    //("token:", token);

                    res.cookie("token", token, { maxAge: sessionTimeout * 1000 });

                    res.redirect("/");
                }
                else{
                    res.send("Login details do not match our records");
                }
            });
        }
        
    });
    
});


// account register route
app.route('/register')
.get(function(req, res){
    res.render('pages/register', {firstName: "Not logged in"});
})
.post(function(req, res){
    //console.log(req.body);
    var data = req.body;
    
    client.db().collection("users").findOne({emailAddress: data.emailAddress}, function(err, result){

        if(result != null){
            res.send("User already exists");
        }
        else{
            const saltRounds = 10;


            bcrypt.genSalt(saltRounds, function(err, salt) {
                bcrypt.hash(data.password, salt, function(err, hash) {
                    // Store hash DB.
                    data.password = hash;

                    client.db().collection("users").insertOne(data, function(err, res){
                        if(err) throw err;
                        console.log("User registered");
                    });
                });
            });

            res.redirect("/");
        }
    });

    
});

var userAccountRouter = express.Router();


// view user account route
userAccountRouter.get("/",function(req, res){
    const token = req.cookies.token;

    if(!token){
        res.redirect("/");
    }

    var payload = renewToken(token, res);

    client.db().collection("users").findOne({emailAddress: payload.emailAddress}, function(err, result){
        if(result != undefined){
            res.render('pages/myAccount', {firstName: result.firstName, lastName: result.lastName, dateOfBirth: result.dateOfBirth, emailAddress: result.emailAddress});
        }
    });
});

// view user account route
userAccountRouter.post("/", function(req, res){
    var data = req.body;

    const token = req.cookies.token;

    if(!token){

        res.redirect("/");
    }

    var payload = renewToken(token, res);

    client.db().collection("users").updateOne({emailAddress: payload.emailAddress}, {$set: {firstName: data.firstName, lastName: data.lastName, dateOfBirth: data.dateOfBirth}});

    res.redirect("/myAccount");
});

// edit account route
userAccountRouter.get("/editAccount", function(req, res){
    const token = req.cookies.token;

    if(!token){

        res.redirect("/");
    }

    var payload = renewToken(token, res);

    client.db().collection("users").findOne({emailAddress: payload.emailAddress}, function(err, result){
        if(result != undefined){
            res.render('pages/editAccount', {firstName: result.firstName, lastName: result.lastName, dateOfBirth: result.dateOfBirth, emailAddress: result.emailAddress});
        }
    });

});

// delete accounte route
userAccountRouter.get("/deleteAccount", function(req, res){
    const token = req.cookies.token;

    if(!token){

        res.redirect("/");
    }

    var payload = renewToken(token, res);

    client.db().collection("users").deleteOne({emailAddress: payload.emailAddress}, function(err, result){
        res.clearCookie("token");
        res.redirect("/");
    });
});


app.use('/myAccount', userAccountRouter)


// view comments route
app.route('/comments')
.get(function(req, res){
    
    client.db().collection("comments").find({}).toArray(function(commentErr, commentResults){
        if(commentErr) throw commentErr;


        const token = req.cookies.token;

        if(!token){

            res.render("pages/comments", {firstName: "Not logged in", comments: commentResults, isAdmin: false});
        }

        var payload = renewToken(token, res);
        var isAdmin = false;

        client.db().collection("adminUsers").findOne({emailAddress: payload.emailAddress}, function(err, result){
            if(result != undefined){
                //console.log("isAdmin: " + result.emailAddress);
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

// Delete comments route
app.route('/deleteComments')
.get(function(req, res){
    client.db().collection("comments").drop(function(err, result){
        if (err) throw err;
        console.log("Dropped comments collection");
    });
    res.redirect('/comments');
});


// shop route
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
        res.redirect("/shop");
    }

    var payload = renewToken(token, res);

    client.db().collection("users").findOne({emailAddress: payload.emailAddress, cart: {$elemMatch: {itemName: data.itemName}}}, function(err, result){
        if(result != null){
            var newCart = result.cart
            //console.log(newCart);
            newCart.forEach(item => {
                var itemQuantity = parseInt(item.quantity);
                var dataQuantity = parseInt(data.quantity);
                if(item.itemName == data.itemName){
                    item.quantity = itemQuantity + dataQuantity;
                }
            });
            //console.log(newCart);
            client.db().collection("users").updateOne({emailAddress: payload.emailAddress}, {$set: {cart: newCart}}, function(err1, res1){

            });
        }
        else{
            client.db().collection("users").updateOne({emailAddress: payload.emailAddress}, {$push: {cart: {itemName: data.itemName, itemCost: data.itemCost, quantity: data.quantity}}});
        }
        
        client.db().collection("shopItems").updateOne({itemName: data.itemName},{$set: {itemStock: (data.itemStock - data.quantity)}}, function(shopErr, shopResult){
            if(shopErr) throw shopErr;
            res.redirect("/shop");
        });
    });

    
});

// Shopping cart route
app.route('/cart')
.get(function(req, res){
    const token = req.cookies.token;

    if(!token){
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
        res.redirect("/");
    }

    var payload = renewToken(token, res);


    client.db().collection("users").findOne({emailAddress: payload.emailAddress, cart: {$elemMatch: {itemName: data.itemName}}}, function(err, result){
        
        var newCart = result.cart;
        
        var removeIndex = 0;
        var itemQuantity = 0;

        
        for(var i = 0; i < newCart.length; i++){
            if(newCart[i].itemName == data.itemName){
                itemQuantity = parseInt(newCart[i].quantity);
                removeIndex = i;
            }
        }
        newCart.splice(removeIndex, 1);

        //console.log(newCart);
        client.db().collection("users").updateOne({emailAddress: payload.emailAddress}, {$set: {cart: newCart}}, function(err1, res1){
            client.db().collection("shopItems").updateOne({itemName: data.itemName},{$inc: {itemStock: itemQuantity}}, function(shopErr, shopResult){
                if(shopErr) throw shopErr;
                res.redirect("/cart");

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
    //console.log(payload.emailAddress);
    const token = jwt.sign({emailAddress: payload.emailAddress}, process.env.JWT_KEY, {
        algorithm: "HS256",
        expiresIn: sessionTimeout
    });

    //console.log("token:", token);

    res.cookie("token", token, { maxAge: sessionTimeout * 1000 });

    return payload;
}