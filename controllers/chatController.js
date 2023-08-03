// Importing Required Modules and packages
const chat = require("../models/chat");
const activeUsers = require("../models/active")
// Function to handle personal Chats
module.exports.personalChat = async function(io,userId,data){
    const chatId = data.chatId;
    //  Checking if the user is active
    const receiver = await activeUsers.findOne({ user: data.Receiver });
    if (receiver) {
      // If the user is active sending it message thorugh socket for real time communication and also storing it in the database for future reference
      io.to(receiver.socket).emit("personal-chat", {
        message: data.Content,
      });
      
      const privateChat = await chat.findOne({ _id: chatId });
      // Checking if chat already existed or is a new one
      if (privateChat) {
        // If it alredy exists then adding a new message
        privateChat.Messages.push({
          Sender: userId,
          Content: data.Content,
          Unread: [],
          Timestamp: Date.now(),
        });
        privateChat.LastChat = Date.now();
        await privateChat.save();
      }
      else{
        // If chat is not valid , then create a new chat
        const new_chat = await chat.create({
            Type : "Personal",
            Participants : [userId,data.Receiver],
            Messages : [{
                Sender : userId,
                Content : data.Content,
                Unread : [],
                CreatedAt : Date.now()
            }],
            LastChat : Date.now()
        })
      }
    } else {
      //   If the user is offline then directly storing it in the database so that whenever user comes online he can see the messages again
      const privateChat = await chat.findOne({ _id: chatId });
      console.log(privateChat)
      // Checking if chat already existed or is a new one
      if (privateChat) {
        // If it alredy exists then adding a new message
        privateChat.Messages.push({
          Sender: userId,
          Content: data.Content,
          Unread: [data.Receiver],
          Timestamp: Date.now(),
        });
        privateChat.LastChat = Date.now();
        await privateChat.save();
      }
      else{
        // If chat is not valid , then create a mew chat
        const new_chat = await chat.create({
            Type : "Personal",
            Participants : [userId,data.Receiver],
            Messages : [{
                Sender : userId,
                Content : data.Content,
                Unread : [data.Receiver],
                CreatedAt : Date.now()
            }],
            LastChat : Date.now()
        })
      }
    }
}
module.exports.selfChat = async function (userId,data){
    const chatId = data.chatId
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
      } else{
        // If chat is not valid , then create a new chat
        const new_chat = await chat.create({
            Type : "Self",
            Participants : [userId],
            Messages : [{
                Sender : userId,
                Content : data.Content,
                Unread : [],
                CreatedAt : Date.now()
            }],
            LastChat : Date.now()
        })
      }
}