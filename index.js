require('dotenv').config(); //for using the env file
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");



const app = express();
//to use images and css files from public folder without being static from my PC
//To refer to static files through relative 
app.use(express.static("public"));
app.set('view engine', 'ejs'); // sets the app to see views folder in server
app.use(bodyParser.urlencoded({ extended: true }));

//always keep session code betwen app.use and mongoose.connect
app.use(session({
    secret: process.env.CLIENT_SECRET,
    resave: false,
    saveUninitialized: false

}));

// asks app to use passport 
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.CLIENT_SERVER + "/e-commerceDB");

//creating schema for products

const productSchema = {
    img: String,
    cName: String,
    pName: String,
    star: Number,
    price: Number

};
const Product = mongoose.model("Product", productSchema);
const Arrival = mongoose.model("Arrival", productSchema);





// creating schema for user
const userSchema = new mongoose.Schema({

    name: String,
    email: String,
    password: String,
    list: [productSchema]
});

userSchema.plugin(passportLocalMongoose); // to use passportlocal mongoose

// creating model for userSchema using Named ("User") collection
const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());




app.get("/", function (req, res) {

    res.sendFile(__dirname + "/login.html");
});

app.get("/home", function (req, res) {

    if (req.isAuthenticated()) {

        Product.find({}).then(function (oldones) {

            Arrival.find({}).then(function (newones) {


                res.render("home", { site: "home", oldshoes: oldones, newshoes: newones });
            });
        });



    } else {
        res.redirect("/");
    }
});

app.get("/blog", function (req, res) {

    if (req.isAuthenticated()) {
        res.render("blog");
    } else {
        res.redirect("/");
    }
});

app.get("/about", function (req, res) {

    if (req.isAuthenticated()) {
        res.render("about");
    } else {
        res.redirect("/");
    }
});

app.get("/contact", function (req, res) {

    if (req.isAuthenticated()) {
        res.render("contact");
    } else {
        res.redirect("/");
    }
});

app.get("/cart", function (req, res) {

    if (req.isAuthenticated()) {

        const userid = req.user.id;

        User.findById(userid).then(function (found) {
            var sum = 0;
            found.list.forEach(function (money) {
                sum += money.price;
            });


            res.render("cart", { total: sum, cartList: found.list });
        });

    } else {
        res.redirect("/");
    }
});

app.get("/shop", function (req, res) {

    if (req.isAuthenticated()) {
        Product.find({}).then(function (oldones) {

            Arrival.find({}).then(function (newones) {


                res.render("shop", { site: "shop", oldshoes: oldones, newshoes: newones });
            });
        });
    } else {
        res.redirect("/");
    }
});

//----------------------------------------------------------






app.post("/product", function (req, res) {

    if (req.isAuthenticated()) {
        const shoeid = req.body.item;
        const imgid = req.body.img;

        if (imgid[0] == "f") {
            Product.findById(shoeid).then(function (found) {

                Product.find({}).then(function (oldones) {

                    Arrival.find({}).then(function (newones) {


                        res.render("product", { shoe: found, oldshoes: oldones, newshoes: newones });
                    });
                });
            });

        }
        else {
            Arrival.findById(shoeid).then(function (found) {

                Product.find({}).then(function (oldones) {

                    Arrival.find({}).then(function (newones) {


                        res.render("product", { shoe: found, oldshoes: oldones, newshoes: newones });
                    });
                });
            });

        }
    } else {
        res.sendFile(__dirname + "/login.html");
    }
});

app.post("/add", function (req, res) {

    const shoeid = req.body.item;
    const imgid = req.body.img;
    const userid = req.user.id;
    const site = req.body.site;
    if (imgid[0] == "f") {
        Product.findById(shoeid).then(function (found) {

            User.findById(userid).then(function (foundUser) {
                foundUser.list.push(found);
                foundUser.save();
                console.log("successfully added");
                res.redirect("/" + site);
            });
        });
    }

    else {
        Arrival.findById(shoeid).then(function (found) {

            User.findById(userid).then(function (foundUser) {
                foundUser.list.push(found);
                foundUser.save();
                console.log("successfully added");
                res.redirect("/" + site);
            });
        });
    }
});

app.post("/delete", function (req, res) {
    const target = req.body.item;
    const userid = req.user.id;

    User.findById(userid).then(function (found) {

        found.list.forEach((item, index) => {
            if (item.img == target) {
                found.list.splice(index, 1);
                console.log("suceessfully Deleted");
                found.save();
            }
        });


        res.redirect("/cart");


    });

});


app.post("/register", function (req, res) {

    User.register({ name: req.body.namee, username: req.body.username }, req.body.password, function (err, user) {

        if (err) {
            console.log("register err");
        }
        else {
            passport.authenticate("local")(req, res, function () {
                console.log("Sucessfully registered.");
                res.redirect("/home");
            });
        }
    })
});

app.post("/login", function (req, res) {

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function (err) {
        if (err) {
            console.log("id & pass didn't match");
            res.redirect("/");
        }
        else {
            passport.authenticate("local")(req, res, function () {
                console.log("successfully logined");
                res.redirect("/home");
            });
        }
    });

});




app.listen(4040, function () {
    console.log("Server started on port 4040");
});