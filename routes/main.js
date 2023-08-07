// Importing required packages and data models
const cookie = require("cookie");
const middleware = require("../utilities/middleware");
const activeUsers = require("../models/active");
const chatController = require("../controllers/chatController");

require("dotenv").config();

module.exports.SetUpSocketIo = async (io) => {
  // Middleware to authenticate only valid requests

  await io.use(async (socket, next) => {
    // Accessing tokens in cookies for browser

    const cookies = cookie.parse(socket.handshake.headers.cookie || "");

    // Way of accessing data coming from mobile appilcation

    const queryParameters = socket.handshake.query;

    // Modifying cookies if the request was from the application

    if (queryParameters.accessToken && queryParameters.refreshToken) {
      socket.request.cookies = {
        access_token: queryParameters.accessToken,
        refresh_token: queryParameters.refreshToken,
      };
    } else {
      socket.request.cookies = cookies;
    }

    // Checking what was the source of this connection reuqest

    const source = queryParameters.source;

    //  awaiting for the middleware to complete its work

    await middleware(socket.request, socket.request.res, (err) => {
      if (err) {
        // Handling cases in which user does not get authenticated

        console.log(err);
        socket.disconnect(true);
      } else {
       
      //  Giving connection to the user and specifying access token in socket.request.newCookies if new access token was made

        next();
      }
    });
  });

  // Establishing Connection with the server side socketIo

  await io.on("connection", async (socket) => {

    // Before Establishing connection, making sure that user has an active access token set in his cookies(web) or shared preference(application)

    const { accessToken } = socket.request.newCookies || {};
   
     //  Handling cases when access token are available to be refreshed(Emitting only to particular socket Id because if it is brodcasted to all then all users will have same session running in their browser)

    if (accessToken) 
       io.to(socket.id).emit("access-token",{accessToken : accessToken})


    // Handle Communication after logic is made
    const userId = socket.request.user._id;

    // Marking the user active in active user database

    const already_exits = await activeUsers.findOne({ user: userId });
    if (!already_exits)
      await activeUsers.create({ user: userId, socket: socket.id });

    socket.on("test",(data)=>{
      console.log("here")
    })

    // Handling personal chats

    // Below function is used to deal when user wants to create a new chat

    socket.on("create-personal-chat", async (data) => {
      await chatController.CreatePersonalChat(io, userId, data, socket.id);
    });

    // Below function is used to  deal when user sends a personal message to another user

    socket.on("send-personal-message", async (data) => {
      await chatController.SendPersonalMessage(io, userId, data);
    });

    // Below function is used by server to acknowledge read messages by the user

    socket.on("read-personal-message", async (data) => {
      await chatController.ReadPersonalMessage(io, userId, data);
    });

    // All Connections for personal chat Ends Here

    // Handling Connection for self chat

    socket.on("send-self-message", async (data) => {
      await chatController.SendSelfMessage(io, userId, data);
    });

    // Connections for self chat ends here

    // Handling Connections for group chat

    //  Below function listens for request when user wants to create New Group

    socket.on("create-group-chat", async (data) => {
      await chatController.CreateGroupChat(io, userId, data, socket.id);
    });

    // Below function listens to request when user wants to send a message in the group

    socket.on("send-group-message", async (data) => {
      await chatController.SendGroupMessage(io, userId, data);
    });

    // Below function is used to listen to request when a user in group reads a message

    socket.on("read-group-message", async (data) => {
      await chatController.ReadGroupMessage(io, userId, data);
    });

    // Connetions for group chat Ends here

    // Handling event when user disonnect like deleting it from active database
    socket.on("disconnect", async () => {
      await activeUsers.deleteOne({ user: userId });
    });
  });
};
