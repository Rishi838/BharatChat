// Importing required packages and data models
const cookie = require("cookie");
const middleware = require("../utilities/middleware");
const activeUsers = require("../models/active");
const chatController = require("../controllers/chatController")


require("dotenv").config();

module.exports.SetUpSocketIo = (io) => {

  // Middleware to authenticate only valid requests

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

  // Establishing Connection with the server side socketIo

  io.on("connection", async (socket) => {

    // Handle Communication after logic is made
    const userId = socket.request.user._id;   
    console.log(userId)

    // Marking the user active in active user database


    const already_exits = await activeUsers.findOne({ user: userId });
    if (!already_exits)
    await activeUsers.create({ user: userId, socket: socket.id });
   
   
    // Handling personal chats

   // Below function is used to  deal when user sends a personal message to another user

    socket.on("send-personal-message",async (data)=>{
       await chatController.SendPersonalMessage(io,userId,data)
    });


    // Below function is used by server to acknowledge read messages by the user

    socket.on("read-personal-message",async (data)=>{
      await chatController.ReadPersonalMessage(io,userId,data)
    })


    // All Connections for personal chat Ends Here


    // Handling Connection for self chat
    
    socket.on("send-self-message",async(data)=>{
      await chatController.SendSelfMessage(io,userId,data)
     })

    // Connections for self chat ends here


    // Handling Connections for group chat
  
    //  Below function listens for request when user wants to create New Group

    socket.on("create-group-chat",async(data)=>{
      await chatController.CreateGroupChat(io,userId,data,socket.id)
    })

    // Below function listens to request when user wants to send a message in the group

    socket.on("send-group-message", async(data)=>{
      await chatController.SendGroupMessage(io,userId,data)
    })

    // Below function is used to listen to request when a user in group reads a message 

    socket.on("read-group-message" , async(data)=>{
      await chatController.ReadGroupMessage(io,userId,data)
    })





    // Connetions for group chat Ends here


    // Handling event when user disonnect like deleting it from active database
    socket.on("disconnect", async () => {
      await activeUsers.deleteOne({ user: userId });
    });
  });
};
