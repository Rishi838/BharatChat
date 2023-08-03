// Importing Required Modules and packages
const chat = require("../models/chat");
const activeUsers = require("../models/active");
// Function to handle personal Chats(The helper function stores message in database , marks them as unread and then send them to receiver if the user is online
module.exports.SendPersonalMessage = async function (io, userId, data) {
  const chatId = data.ChatId;
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
    // Receive-personal-message event will be transmitted to receiver with the senderId and chatId and the messafe Receievd
    io.to(receiver.socket).emit("receive-personal-message", {
      ChatId : chatId,
      Sender : userId,
      Content: data.Content,
    });
  }
};
// Function to handle status of message(This function is hit when a user read a message in the chat so we need to set unread meessage of that user to 0 and update status of individual message in the chat that were marked as unread earlier)
module.exports.ReadPersonalMessage = async function (io,userId,data){
  //  Handling marking message in the chat as read

  // In the end sending acknowledgement to the sender to mark the message as read
  const socketId =""
  // Find Socket Id with the associated user if he is active
  io.to(socketId).emit('read-message-ack',{
    ChatId : data.ChatId,
    Sender : userId
  })
}

