require("dotenv").config();
const express = require("express");
const app = express();
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session")
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");
app.use(bodyParser.urlencoded({
  extended: true
}))
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(session({
  secret: "My little secret.",
  resave: false,
  saveUninitialized: true
}))
app.use(passport.initialize());
app.use(passport.session());


///////////////////////MONGOOSE///////////////////////////////////////////
mongoose.connect("mongodb://localhost:27017/userdb", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    require: true
  },
  password: {
    type: String,
    require: true
  },
  googleId: String,
  secret: String
});


userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const User = mongoose.model("user", userSchema);


passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({
      googleId: profile.id
    }, function(err, user) {
      return cb(err, user);
    });
  }
));



////////////////////////ROUTES////////////////////////////////////////////
app.route("/")
  .get(function(req, res) {
    res.render("home")
  });


app.route("/auth/google")
  .get(
    passport.authenticate("google", {
      scope: ["profile"]
    }));


app.route("/auth/google/secrets")
  .get(passport.authenticate("google", {
      failureRedirect: "/login"
    }),
    function(req, res) {
      // Successful authentication, redirect home.
      res.redirect("/secrets");
    });


app.route("/login")
  .get(function(req, res) {
    res.render("login")
  })
  .post(function(req, res) {
    const user = new User({
      username: req.body.username,
      password: req.body.password
    });
    req.login(user, function(err) {
      if (err) {
        console.log(err);
      } else {
        passport.authenticate("local")(req, res, function() {
          res.redirect("/secrets");
        });
      }
    });
  });


app.route("/submit")
  .get(function(req, res) {
    if (req.isAuthenticated()) {
      res.render("submit");
    } else {
      res.redirect("/login");
    }
  })
  .post(function(req, res) {
    User.findById(req.user.id, function(err, result) {
      if (err) {
        console.log(err);
      } else {
        if (result) {
          result.secret = req.body.secret
          result.save();
        }
      }
    })
    res.redirect("/secrets");
  });

app.route("/secrets")
  .get(function(req, res) {
    if (req.isAuthenticated()) {
      User.find({
        secret: {
          $ne: null
        }
      }, function(err, result) {
        if (err) {
          console.log(err);
        } else {
          res.render("secrets", {
            allUserSecrets: result
          });
        }
      });
    } else {
      res.redirect("/login");
    }
  });

app.route("/logout")
  .get(function(req, res) {
    req.logout();
    res.redirect("/");
  });


app.route("/register")
  .get(function(req, res) {
    res.render("register")
  })
  .post(function(req, res) {
    User.register({
      username: req.body.username
    }, req.body.password, function(err, user) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else if (user) {
        passport.authenticate("local")(req, res, function() {
          res.redirect("/secrets")
        })
      }
    });
  });


app.listen(3000, function() {
  console.log("Listening to raadio KUKU 3000");
})