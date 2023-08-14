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

    //  awaiting for the middleware to complete its work

    await middleware(socket.request, socket.request.res, (err) => {
      if (err) {
        // Handling cases in which user does not get authenticated
        console.log(err);
        socket.request.middleware_pass = false;
        next();
      } else {
        //  Giving connection to the user and specifying access token in socket.request.newCookies if new access token was mad
        socket.request.middleware_pass = true;
        next();
      }
    });
  });

  // Establishing Connection with the server side socketIo

  await io.on("connection", async (socket) => {
    
    // Checking if user passed middleware or not
    if (socket.request.middleware_pass === false) {
      io.to(socket.id).emit(
        "auth-failure",
        { reason: "Authentication failed" },
      );
      socket.disconnect()
      return;
    }

    // Before Establishing connection, making sure that user has an active access token set in his cookies(web) or shared preference(application)

    const { accessToken } = socket.request.newCookies || {};

    //  Handling cases when access token are available to be refreshed(Emitting only to particular socket Id because if it is brodcasted to all then all users will have same session running in their browser)

    if (accessToken != null)
      io.to(socket.id).emit("access-token", { accessToken });

    // Handle Communication after logic is made
    const userId = socket.request.user._id;
    const userName = socket.request.user.Name;
    const userEmail = socket.request.user.Email;
    // Marking the user active in active user database

    const already_exits = await activeUsers.findOne({ user: userId });
    if (!already_exits)
      await activeUsers.create({ user: userId, socket: socket.id });

    // Handling basic functionality of app(Handling things that need to be given to the user when the connection is made to server)

    // Returning userId so that he can set the self chat as active and display it

    io.to(socket.id).emit("user-id", { userId, userName });

    // Returning Personal Chats

    chatController.FetchPersonalChatList(io, userId, socket.id);

    // Returning Group Chats

    chatController.FetchGroupChatList(io, userId, socket.id);

    // Fetching user details ✅

    socket.on("fetch-user-details", async (data) => {
      await chatController.FetchDetails(
        io,
        userId,
        userEmail,
        userName,
        socket.id
      );
    });

    // Search functionality ✅

    socket.on("search-user", async (data) => {
      await chatController.SearchUser(io, userId, data, socket.id);
    });

    // Check chat between two users

    socket.on("check-chat", async (data) => {
      await chatController.CheckChat(io, userId, data, socket.id);
    });

    // Handling personal chats✅

    // Below function is used to deal when user wants to create a new chat✅

    socket.on("create-personal-chat", async (data) => {
      await chatController.CreatePersonalChat(io, userId, data, socket.id);
    });

    // Below function is used to  deal when user sends a personal message to another user✅

    socket.on("send-personal-message", async (data) => {
      await chatController.SendPersonalMessage(io, userId, userName, data);
    });

    // Below function is used by server to acknowledge read messages by the user✅

    socket.on("read-personal-message", async (data) => {
      await chatController.ReadPersonalMessage(io, userId, data);
    });

    //  Below function is used by server to personal chat of the user ✅

    socket.on("fetch-personal-chat", async (data) => {
      await chatController.FetchPersonalChat(io, userId, data, socket.id);
    });

    // All Connections for personal chat Ends Here

    // Handling Connection for self chat✅

    // Adding new messages in self chat ✅

    socket.on("send-self-message", async (data) => {
      await chatController.SendSelfMessage(io, userId, data);
    });

    // Fetching self chats of a user✅

    socket.on("fetch-self-chat", async (data) => {
      await chatController.FetchSelfChat(io, userId, userName, socket.id);
    });

    // Connections for self chat ends here

    // Handling Connections for group chat

    //  Below function listens for request when user wants to create New Group ✅

    socket.on("create-group-chat", async (data) => {
      await chatController.CreateGroupChat(io, userId, data, socket.id);
    });

    // Below function listens to request when user wants to send a message in the group ✅

    socket.on("send-group-message", async (data) => {
      await chatController.SendGroupMessage(io, userId, userName, data);
    });

    // Below function is used to listen to request when a user in group reads a message ✅

    socket.on("read-group-message", async (data) => {
      await chatController.ReadGroupMessage(io, userId, data);
    });

    //  Below function is used to add a member to grp ✅

    socket.on("add-member", async (data) => {
      await chatController.AddNewMember(io, userId, data, socket.id);
    });

    // Below function is used to change admin

    socket.on("change-admin", async (data) => {
      await chatController.ChangeAdmin(io, userId, data, socket.id);
    });

    // Below function is used to leave a grp ✅

    socket.on("leave-grp", async (data) => {
      await chatController.LeaveGroup(io, userId, data, socket.id);
    });

    // Below function is used when admin kicks out someone

    socket.on("kickout", async (data) => {
      await chatController.Kickout(io, userId, data, socket.id);
    });

    // Below function is used to delete a grp ✅

    socket.on("delete-grp", async (data) => {
      await chatController.DeleteGroupChat(io, userId, data, socket.id);
    });

    // Below function is used to fetch grp chat

    socket.on("fetch-group-chat", async (data) => {
      await chatController.FetchGroupChat(io, userId, data, socket.id);
    });

    // Connetions for group chat Ends here

    // Handling event when user disonnect like deleting it from active database
    socket.on("disconnect", async () => {
      await activeUsers.deleteOne({ user: userId });
    });
  });
};
