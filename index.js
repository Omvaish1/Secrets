//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption"); 
// const md5 = require("md5");
// const bcrypt = require("bcrypt");
// const saltRounds = 10;
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");

const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static("public"));

app.use(session({
  secret: "Our little secret",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/userDB');

  // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
}
const userSchema = new mongoose.Schema({
   email: String,
   password: String,
   googleId: String 
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("users" , userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user);
});
 
passport.deserializeUser(function(user, done) {
  done(null, user);
});

passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets"
},
function(accessToken, refreshToken, profile, cb) {
  User.findOrCreate({ googleId: profile.id }, function (err, user) {
    return cb(err, user);
  });
  }
));

app.get("/" , function(req,res){
    res.render("home");
});
app.get("/auth/google", 
    passport.authenticate("google", {scope: ["profile"]})
);
app.get("/auth/google/secrets", 
    passport.authenticate("google", {failureRedirect: "/login"}),
    function(req,res){
      res.redirect("/secrets")
    }       
);
app.get("/login" , function(req,res){
    res.render("login");
});
app.get("/register" , function(req,res){
    res.render("register");
});
app.get("/submit" , function(req,res){
    res.render("submit");
});
app.get("/secrets" , function(req, res){
  res.set(
    'Cache-Control', 
    'no-cache, private, no-store, must-revalidate, max-stal e=0, post-check=0, pre-check=0'
  );
  if(req.isAuthenticated()){
    res.render("secrets")
  }else{
    res.redirect("/login")
  }
});
app.get("/logout", (req, res, next) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

app.post("/register", function(req, res){
  // bcrypt.hash(req.body.password, saltRounds, function(err, hash){
  //   const userName = req.body.username;
  //   const password = hash;
  //   const user = new User({
  //       email: userName,
  //       password: password
  //   });
  //   user.save()
  //     .then(function(){
  //       res.render("secrets")
  //     })
  //     .catch(function(err){
  //       console.log(err)
  //     });
  // }) 
  User.register({username: req.body.username}, req.body.password, function(err, user){
    if(err){
      console.log(err)
      res.redirect("/register")
    }else{
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets")
      })
    }
  })
});

app.post("/login" ,passport.authenticate("local", {failureRedirect: "/login"}), function(req, res){
    // const userName = req.body.username;
    // const password = req.body.password;
    // User.findOne({email: userName})
    //   .then(function(user){
    //     bcrypt.compare(password, user.password, function(err, result){
    //       if(result === true){
    //         res.render("secrets")
    //       } 
    //     });
    //   })   
    //   .catch(function(err){
    //     console.log(err)
    //   });
    res.redirect("/secrets")
});

app.listen(3000, function(){
    console.log("Server started at port 3000");
});
