// Required packages and dependencies
const express = require('express')
const socketIO = require("socket.io");
const {SetUpSocketIo} = require('./routes/chat')
const path=require('path')
const authRoutes = require('./routes/auth')
const mainRoutes = require('./routes/main')

require("dotenv").config();

// Inititated instance of express
const app = express()

// settng up properties of server
app.set("view engine", "ejs")
app.set("views", path.join("./frontend/views"))
app.use(express.static(path.join(__dirname)));
app.use(express.json())

// Listening  on dynamic port
const server=app.listen(process.env.PORT,()=>{
    console.log("Listening on Port: ",process.env.PORT)
})
app.use(authRoutes)
app.use(mainRoutes)

app.get('/auth',(req,res)=>{
  res.render("auth")
})
app.get('/',(req,res)=>{
  res.render('home')
})

// Setting up io connection
const io = socketIO(server, {
  pingTimeout: 900000, // Set a higher ping timeout (in milliseconds)
})
// Importing socket propeties from the main file
SetUpSocketIo(io)

