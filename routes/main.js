const User = require("../models/user");
const cookie = require("cookie");
const middleware = require('../utilities/middleware')

require("dotenv").config();

module.exports.SetUpSocketIo = (io) => {
  io.use((socket,next)=>{
    const cookies = cookie.parse(socket.handshake.headers.cookie || "");
    socket.request.cookies = cookies
    middleware(socket.request,socket.request.res,(err)=>{
      if(err){
        console.log(err)
        socket.disconnect(true);
      }
      else{
        const { accessToken } = socket.request.newCookies || {};
        if (accessToken) {
          socket.request.headers.cookie = cookie.serialize("access_token", accessToken, {
            httpOnly: true,
            sameSite: "lax"
          });
        }
        next();
      }
    })
  })
  io.on("connection", (socket) => {
    console.log(socket.request.user)
    socket.on("message", (message) => {
      console.log(message);
    });
  });
};
