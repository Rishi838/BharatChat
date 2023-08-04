// Importing required packages and data models
const cookie = require("cookie");
const middleware = require("../utilities/middleware");
const activeUsers = require("../models/active");
const chatController = require("../controllers/chatController")


require("dotenv").config();

module.exports.SetUpSocketIo = (io) => {
  io.use(async (socket, next) => {
    const cookies = cookie.parse(socket.handshake.headers.cookie || "");
    socket.request.cookies = cookies;
    await middleware(socket.request, socket.request.res, (err) => {
      if (err) {
        console.log(err);
        socket.disconnect(true);
      } else {
        const { accessToken } = socket.request.newCookies || {};
        if (accessToken) {
          socket.request.headers.cookie = cookie.serialize(
            "access_token",
            accessToken,
            {
              httpOnly: true,
              sameSite: "lax",
            }
          );
        }
        next();
      }
    });
  });
  io.on("connection", async (socket) => {
    // Handle Communication after logic is made
    const userId = socket.request.user._id;  
    console.log(userId) 
    // Marking the user active in active user database
    const already_exits = await activeUsers.findOne({ user: userId });
    console.log(already_exits)
    if (!already_exits)
      await activeUsers.create({ user: userId, socket: socket.id });
    // Handling personal chats
    // Below function is used to  deal when user sends a personal message to another user
    socket.on("send-personal-message",async (data)=>{
      // Read the message sent, store it in database , if user is online send it to the user immediately
      console.log("Here")
      await chatController.SendPersonalMessage(io,userId,data)
    });
    // when a user reads a message in the chat, his messages in the chat are mark as read ans is acknowledged on server side by below functions
    socket.on("read-personal-message",async (data)=>{
      await chatController.ReadPersonalMessage(io,userId,data)
    })
    // All Connections for personal chat Ends Here
    // Handling event when user disonnect like deleting it from active database
    socket.on("disconnect", async () => {
      await activeUsers.deleteOne({ user: userId });
    });
  });
};
