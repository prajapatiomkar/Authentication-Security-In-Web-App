require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const encrypt = require("mongoose-encryption");
const ejs = require("ejs");

const app = express();


app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

mongoose.connect("mongodb://localhost:27017/userDB");

// Database Schema
const userSchema = new mongoose.Schema({
    email: String,
    password: String
})

const secret = process.env.SECRET_KEY;
console.log(secret)
userSchema.plugin(encrypt,{secret:secret,encryptedFields:['password']})

const User = mongoose.model("User", userSchema);

// Home Page
app.get("/", function (req, res) {
    res.render("home");
});

// Login Page
app.route("/login")
    .get(function (req, res) {
        res.render("login");
    })
    .post(function (req, res) {
        User.findOne({ email: req.body.username }, function (err, foundUser) {
            if (err) {
                res.send(err)
            } else {
                if (foundUser) {
                    if (foundUser.password === req.body.password) {
                        res.render("secrets");
                    } else {
                        res.render("home")
                    }
                }
            }
        })
    });

// Register Page
app.route("/register")
    .get(function (req, res) {
        res.render("register");
    })
    .post(function (req, res) {
        const newUser = new User({
            email: req.body.username,
            password: req.body.password
        });
        User.findOne({ email: req.body.username }, function (err, userExist) {
            if (err) {
                res.send(err);
            } else {
                if (userExist) {
                    res.send("User Already Exist with the given Email");
                } else {
                    newUser.save(function (err) {
                        if (!err) {
                            res.render("secrets");
                        } else {
                            res.send(err);
                        }
                    });
                }
            }
        })

    });


app.listen(3000, function () {
    console.log("Server Started http://localhost:3000");
})