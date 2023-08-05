// Importing Required Modules and packages
const chat = require("../models/chat");
const activeUsers = require("../models/active");


// Function to handle personal Chats(The helper function stores message in database , marks them as unread and then send them to receiver if the user is online


module.exports.SendPersonalMessage = async function (io, userId, data) {
  console.log("Message Received ,", data.ChatId, data.Receiver, data.Content);
  const chatId = data.ChatId;
  //  Checking if the user is active
  const receiver = await activeUsers.findOne({ user: data.Receiver });
  console.log(receiver);
  const ReceiverId = data.Receiver;
  console.log(ReceiverId);

  // Making new Map for the read status of Map
  const ReadStatusMap = new Map();
  ReadStatusMap.set(userId, "Read");
  ReadStatusMap.set(ReceiverId, "Unread");

  // // Checking if chat already existed or is a new one
  if (chatId !== "New") {
    // If it alredy exists then adding a new message
    const privateChat = await chat.findOne({ _id: chatId });
    console.log(privateChat);
    privateChat.Messages.push({
      Sender: userId,
      Content: data.Content,
      ReadStatus: ReadStatusMap,
      Timestamp: Date.now(),
    });
    const undread_msg = privateChat.Participants.get(ReceiverId);
    privateChat.Participants.set(ReceiverId, undread_msg + 1);
    privateChat.LastChat = Date.now();
    await privateChat.save();
    // console.log(privateChat)
  } else {
    // Making new Map so that It give me freedom to store userId actually
    const participantsMap = new Map();
    participantsMap.set(userId, 0);
    participantsMap.set(ReceiverId, 1);
    // If chat is not valid , then create a new chat
    const new_chat = await chat.create({
      Type: "Personal",
      Participants: participantsMap,
      Messages: [
        {
          Sender: userId,
          Content: data.Content,
          ReadStatus: ReadStatusMap,
          CreatedAt: Date.now(),
        },
      ],
      LastChat: Date.now(),
    });
  }
  // If the user is active sending it message thorugh socket for real time communication
  if (receiver) {
    // Receive-personal-message event will be transmitted to receiver with the senderId and chatId and the messafe Receievd
    console.log("Sendign message to receiver", receiver.socket);
    io.to(receiver.socket).emit(
      "receive-personal-message",
      {
        ChatId: chatId,
        Sender: userId,
        Content: data.Content,
      },
      (data) => {
        console.log("Data Sent Successfully", data);
      }
    );
  }
};


// Function to handle status of message(This function is hit when a user read a message in the chat so we need to set unread meessage of that user to 0 and update status of individual message in the chat that were marked as unread earlier)


module.exports.ReadPersonalMessage = async function (io, userId, data) {
  //  Handling marking message in the chat as read
  console.log(data.ChatId, data.Sender);
  const chats = await chat.findOne({ _id: data.ChatId });
  const chat_msgs = chats.Messages;
  console.log(chat_msgs, userId);
  // Marking all the messages in the chat as Read
  for (let i = chat_msgs.length - 1; i >= 0; i--) {
    console.log(chat_msgs[i].ReadStatus.get(userId));
    if (chat_msgs[i].ReadStatus.get(userId) == "Read") break;
    chat_msgs[i].ReadStatus.set(userId, "Read");
    console.log(chat_msgs[i].ReadStatus.get(userId));
  }
  await chats.save();
  // In the end sending acknowledgement to the sender to mark the message as read
  // Checking if sender is active
  const sender = await activeUsers.findOne({ user: data.Sender });

  // Find Socket Id with the associated user if he is active
  if (sender) {
    io.to(sender.socket).emit("read-message-ack", {
      ChatId: data.ChatId,
      Reader: userId,
    });
  }
};


// Function to handle self messages (only thing here is to store it in database)


module.exports.SendSelfMessage = async function(io,userId,data){
  console.log("Message Received ,", data.ChatId, data.Content);
  const chatId = data.ChatId;
  // Making new Map for the read status of Map
  const ReadStatusMap = new Map();
  ReadStatusMap.set(userId, "Read");
  // // Checking if chat already existed or is a new one
  if (chatId !== "New") {
    // If it alredy exists then adding a new message
    const privateChat = await chat.findOne({ _id: chatId });
    console.log(privateChat);
    privateChat.Messages.push({
      Sender: userId,
      Content: data.Content,
      ReadStatus: ReadStatusMap,
      Timestamp: Date.now(),
    });
    privateChat.LastChat = Date.now();
    await privateChat.save();
    // console.log(privateChat)
  } else {
    // Making new Map so that It give me freedom to store userId actually
    const participantsMap = new Map();
    participantsMap.set(userId, 0);
    // If chat is not valid , then create a new chat
    const new_chat = await chat.create({
      Type: "Self",
      Participants: participantsMap,
      Messages: [
        {
          Sender: userId,
          Content: data.Content,
          ReadStatus: ReadStatusMap,
          CreatedAt: Date.now(),
        },
      ],
      LastChat: Date.now(),
    });
  }
//  No More actions are required as sender is same as receiver
}

// Function to create group chat(Constraint on group is that it should have min 2 participant)

module.exports.CreateGroupChat = async function(io,userId,data, socketId){
console.log("Request To create Group Chat Received, set Admin as the current user",data.Name,data.Description,data.Participants)

// After the group has been created send a success message to creator or the group
// Looping thorugh active users of the group
io.emit("create-group-chat-successful",{
  GroupId : "Id of the Group",
  Name : "Name of the group",
  Description : "Group Description",
  Participants : "Array of Group Particpants"
})
}

// Function to delete a grouo a group(only by admin)

module.exports.DeleteGroupChat = async function(io,userId,data){

}

// Function to add a new member to group(only by admin)

module.exports.AddNewMember = async function(io,userId,data){

}

// Function to leave a group(any regular user)

module.exports.leaveGroup = async function(io,userId,data){

}

// Function to execute when a user sends a message in the server

module.exports.SendGroupMessage =async function(io,userId,data){
    console.log("MEssage Received Successfully")

    //  Store in the database in appropirate manner

    // Send the message to active users in the group using loops

    io.emit("receive-group-message",{GroupId, Content, Sender})
}

// Function to execute when a user reads a message

module.exports.ReadGroupMessage =async function(io,userId,data){
  
}
