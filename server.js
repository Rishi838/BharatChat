// Required packages and dependencies
const express = require('express')
const socketIO = require("socket.io");
const {SetUpSocketIo} = require('./routes/main')
const path=require('path')
const authRoutes = require('./routes/auth')

// Inititated instance of express
const app = express()

// settng up properties of server
app.set("view engine", "ejs")
app.set("views", path.join("./Frontend/views"))
app.use(express.static(path.join(__dirname)));
app.use(express.json())

// Listening  on dynamic port
const server=app.listen(3000,()=>{
    console.log("Listening on Port:3000")
})
app.use(authRoutes)

app.get('/auth',(req,res)=>{
  res.render("auth")
})
app.get('/',(req,res)=>{
  res.render('home')
})

// Setting up io connection
const io = socketIO(server)
// Importing socket propeties from the main file
SetUpSocketIo(io)

