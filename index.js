var express=require("express");
var passport = require('passport');
var users=require('./routes/userroutes')
var department=require('./orm/mysqlroutes')
var app=express();
const cors=require("cors")
app.use(passport.initialize());
app.use(cors())

app.use(express.urlencoded({extended:true}))
app.use(express.json())

app.use("/users",users)

app.listen("8000",function(){
    console.log("Server running on port 8000")
})