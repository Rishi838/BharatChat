// Importing Required Modules and packages
const chat = require("../models/chat");
const activeUsers = require("../models/active");
// Function to handle personal Chats(The helper function stores message in database , marks them as unread and then send them to receiver if the user is online
module.exports.personalChat = async function (io, userId, data) {
  const chatId = data.chatId;
  //  Checking if the user is active
  const receiver = await activeUsers.findOne({ user: data.Receiver });
  const ReceiverId = receiver._id;
  const privateChat = await chat.findOne({ _id: chatId });
  // Checking if chat already existed or is a new one
  if (privateChat) {
    // If it alredy exists then adding a new message
    privateChat.Messages.push({
      Sender: userId,
      Content: data.Content,
      ReadStatus: {
        ReceiverId: "Unread",
        userId : "Read"
      },
      Timestamp: Date.now(),
    });
    privateChat.Participants[ReceiverId]+=1;
    privateChat.LastChat = Date.now();
    await privateChat.save();
  } else {
    // If chat is not valid , then create a new chat
    const new_chat = await chat.create({
      Type: "Personal",
      Participants: {
        userId: 0,
        ReceiverId: 1,
      },
      Messages: [
        {
          Sender: userId,
          Content: data.Content,
          ReadStatus: {
            ReceiverId : "Unread",
            userId : "Read"
          },
          CreatedAt: Date.now(),
        },
      ],
      LastChat: Date.now(),
    });
  }
  // If the user is active sending it message thorugh socket for real time communication 
  if (receiver) {
    io.to(receiver.socket).emit("personal-chat", {
      message: data.Content,
    });
  }
};
module.exports.selfChat = async function (userId, data) {
  const chatId = data.chatId;
  const selfChat = await chat.findOne({ _id: chatId });
  // Checking if chat already existed or is a new one
  if (selfChat) {
    // If it alredy exists then adding a new message
    selfChat.Messages.push({
      Sender: userId,
      Content: data.Content,
      Unread: [],
      Timestamp: Date.now(),
    });
    selfChat.LastChat = Date.now();
    await selfChat.save();
  } else {
    // If chat is not valid , then create a new chat
    const new_chat = await chat.create({
      Type: "Self",
      Participants: [userId],
      Messages: [
        {
          Sender: userId,
          Content: data.Content,
          Unread: [],
          CreatedAt: Date.now(),
        },
      ],
      LastChat: Date.now(),
    });
  }
};
