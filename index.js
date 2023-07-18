//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption"); 
// const md5 = require("md5");
const bcrypt = require("bcrypt");
const saltRounds = 10;

const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static("public"));
main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/userDB');

  // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
}
const userSchema = new mongoose.Schema({
   email: String,
   password: String 
});

// userSchema.plugin(encrypt, {secret: process.env.SECRET , encryptedFields: ["password"]});

const User = mongoose.model("users" , userSchema);

app.get("/" , function(req,res){
    res.render("home");
});
app.get("/login" , function(req,res){
    res.render("login");
});
app.get("/register" , function(req,res){
    res.render("register");
});
app.get("/submit" , function(req,res){
    res.render("submit");
});

app.post("/register", function(req, res){
  bcrypt.hash(req.body.password, saltRounds, function(err, hash){
    const userName = req.body.username;
    const password = hash;
    const user = new User({
        email: userName,
        password: password
    });
    user.save()
      .then(function(){
        res.render("secrets")
      })
      .catch(function(err){
        console.log(err)
      });
  })  
  
    
});
app.post("/login" , function(req, res){
    const userName = req.body.username;
    const password = req.body.password;
    User.findOne({email: userName})
      .then(function(user){
        bcrypt.compare(password, user.password, function(err, result){
          if(result === true){
            res.render("secrets")
          } 
        });
      })   
      .catch(function(err){
        console.log(err)
      });
});

  app.listen(3000, function(){
      console.log("Server started at port 3000");
  });
