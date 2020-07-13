//jshint esversion:6
require("dotenv").config();
const express = require("express");
const app = express();
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

app.use(bodyParser.urlencoded({
  extended: true
}))
app.set("view engine", "ejs");
app.use(express.static("public"));



///////////////////////MONGOOSE///////////////////////////////////////////
mongoose.connect("mongodb://localhost:27017/userdb", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    require: true
  },
  password: {
    type: String,
    require: true
  }
});


userSchema.plugin(encrypt, {
  secret: process.env.SALADUS,
  encryptedFields: ["password"]
});

const User = mongoose.model("user", userSchema);

////////////////////////ROUTES////////////////////////////////////////////
app.route("/")
  .get(function(req, res) {
    res.render("home")
  });


app.route("/login")
  .get(function(req, res) {
    res.render("login")
  })
  .post(function(req, res) {

    User.findOne({
      name: req.body.username
    }, function(err, result) {
      if (err) {
        console.log(err);
      } else {
        if (result) {
          if (result.password === req.body.password) {
            res.render("secrets");
          } else {
            res.send("Wrong Password!");
          }
        }
      }
    })
  });


app.route("/register")
  .get(function(req, res) {
    res.render("register")
  })
  .post(function(req, res) {
    const newUser = new User({
      name: req.body.username,
      password: req.body.password
    });
    newUser.save(function(err) {
      if (err) {
        console.log(err);
      } else {
        res.render("secrets");
      }
    })
  })









app.listen(3000, function() {
  console.log("Listening to raadio KUKU 3000");
})