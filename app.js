require('dotenv').config({ path: "vars/.env"});
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const { initialize, use } = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");
const app = express();


app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(session({
    secret: "sample secret",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB");

// Database Schema
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String
})

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const secret = process.env.SECRET_KEY;
console.log(secret)

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id, username: user.username, name: user.name });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile)
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

// Home Page
app.get("/", function (req, res) {
    res.render("home");
});

app.get("/auth/google", passport.authenticate("google",{scope:["profile"]}));

app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
  });

// Login Page
app.route("/login")
    .get(function (req, res) {
        res.render("login");
    })
    .post(function (req, res) {
        const user = new User({
            username:req.body.username,
            password:req.body.password
        });

        req.login(user,function(err){
            if(err){
                console.log(err);
            }else{
                passport.authenticate("local")(req, res, function () {
                    res.redirect("/secrets")
                })
            }
        })
    });

// Register Page
app.route("/register")
    .get(function (req, res) {
        res.render("register");
    })
    .post(function (req, res) {
        User.register({ username: req.body.username }, req.body.password, function (err, user) {
            if (err) {
                console.log(err)
                res.redirect("/register")
            } else {
                passport.authenticate("local")(req, res, function () {
                    res.redirect("/secrets")
                })
            }
        })

    });

app.get("/secrets", function (req, res) {
    if(req.isAuthenticated()){
        res.render("secrets")
    }else{
        res.render("login")
    }
});
app.get("/logout",function(req,res){
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
      });
})
app.listen(3000, function () {
    console.log("Server Started http://localhost:3000");
})