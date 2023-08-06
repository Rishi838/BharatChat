// Importing Required Modules and packages
const chat = require("../models/chat");
const activeUsers = require("../models/active");

// Personal Chat Controllers

// Creating Personal chat between two users

module.exports.CreatePersonalChat = async function (
  io,
  userId,
  data,
  socketId
) {
  //  Checking with which user, current user wants to create chat
  const Receiver = data.Receiver;

  // Searching if a personal chat already exists between the users

  const chat_check = await chat.findOne({
    $and: [
      { [`Participants.${userId}`]: { $exists: true } },
      { [`Participants.${Receiver}`]: { $exists: true } },
    ],
  });

  // Sending create chat status fail if the chat already exists

  if (chat_check) {
    console.log(chat_check)
    io.to(socketId).emit("create-personal-chat-fail", {
      Message: "Chat Already Exists between the user",
      ChatId: chat_check._id,
    });
    return;
  }

  //Creating particpants object with unread messages set ad zero
  const participantsMap = new Map();
  participantsMap.set(userId, 0);
  participantsMap.set(Receiver, 0);

  // Creating a new chat

  const new_chat = await chat.create({
    Type: "Personal",
    Participants: participantsMap,
    Message: [],
    LastChat: Date.now(),
  });


  // Notifying it to the person who created the chat

  io.to(socketId).emit("create-personal-chat-success", {
    ChatId: new_chat._id,
  });

  // Notifying it to the other person in the chat if the user is online
  const is_receiver_active = await activeUsers.findOne({ user: Receiver });

  // If user is active then send acknowledgment of the chat to the sender

  io.to(is_receiver_active.socket).emit("create-personal-chat-success", {
    ChatId: new_chat._id,
  });
};

// Handle case when user sends a mesage to someone

module.exports.SendPersonalMessage = async function (io, userId, data) {
  console.log("Message Received ,", data.ChatId, data.Content);
  // Fetching chatId
  const chatId = data.ChatId;

  // Finding the chat details

  const privateChat = await chat.findOne({ _id: chatId });
  // Finding out receiver

  let receiverId = userId;

  for (const [key, value] of privateChat.Participants) {
    if (!userId.equals(key)) {
      receiverId = key;
      break;
    }
  }

  //  Checking if the receiver is active

  const receiver = await activeUsers.findOne({ user: receiverId });

  // Making new Map for the read status of Map
  const ReadStatusMap = new Map();
  ReadStatusMap.set(userId, "Read");
  ReadStatusMap.set(receiverId, "Unread");

  // pushing messages in the database

  privateChat.Messages.push({
    Sender: userId,
    Content: data.Content,
    ReadStatus: ReadStatusMap,
    Timestamp: Date.now(),
  });

  // Updating the undread count

  privateChat.Participants.set(
    receiverId,
    privateChat.Participants.get(receiverId) + 1
  );
  privateChat.LastChat = Date.now();
  await privateChat.save();

  // If the user is active sending it message thorugh socket for real time communication
  if (receiver) {
    io.to(receiver.socket).emit("receive-personal-message", {
      ChatId: chatId,
      Sender: userId,
      Content: data.Content,
    });
  }
};

// Function to handle status of message(This function is hit when a user read a message in the chat so we need to set unread meessage of that user to 0 and update status of individual message in the chat that were marked as unread earlier)

module.exports.ReadPersonalMessage = async function (io, userId, data) {
  //  Finding the chat in which user have read the message

  const chats = await chat.findOne({ _id: data.ChatId });
  const chat_msgs = chats.Messages;

  // Marking all the messages in the chat as Read by the reader

  for (let i = chat_msgs.length - 1; i >= 0; i--) {
    if (chat_msgs[i].ReadStatus.get(userId) == "Read") break;
    chat_msgs[i].ReadStatus.set(userId, "Read");
  }
  chats.Participants.set(userId, 0);
  await chats.save();

  // In the end sending acknowledgement to the sender to mark the message as read(only if he is active)

  // Finding sender in the chat

  let senderId = userId;

  for (const [key, value] of chats.Participants) {
    if (!userId.equals(key)) {
      senderId = key;
      break;
    }
  }

  const sender = await activeUsers.findOne({ user: senderId });

  // Sending acknowldgment if the sender is active
  if (sender) {
    io.to(sender.socket).emit("read-message-ack", {
      ChatId: data.ChatId,
    });
  }
};

// Function to handle self messages (only thing here is to store it in database)

module.exports.SendSelfMessage = async function (io, userId, data) {

  // Finding self chat associated with the user

  const privateChat = await chat.findOne({
    Type: "Self",
    $and: [
      { [`Participants.${userId}`]: { $exists: true } },
    ],
  });

  // Creating ReadStatus Map

  const ReadStatusMap = new Map();
  ReadStatusMap.set(userId, "Read");
  
  //  Pushing message to the message array



  privateChat.Messages.push({
    Sender: userId,
    Content: data.Content,
    ReadStatus: ReadStatusMap,
    Timestamp: Date.now(),
  });
  privateChat.LastChat = Date.now();
  await privateChat.save();

  //  No More actions are required as sender is same as receiver
};

// Function to create group chat(Constraint on group is that it should have min 2 participant)

module.exports.CreateGroupChat = async function (io, userId, data, socketId) {
  console.log(
    "Request To create Group Chat Received, set Admin as the current user",
    data.Name,
    data.Description,
    data.Participants
  );

  // After the group has been created send a success message to creator or the group
  // Looping thorugh active users of the group
  io.emit("create-group-chat-successful", {
    GroupId: "Id of the Group",
    Name: "Name of the group",
    Description: "Group Description",
    Participants: "Array of Group Particpants",
  });
};

// Function to delete a grouo a group(only by admin)

module.exports.DeleteGroupChat = async function (io, userId, data) {};

// Function to add a new member to group(only by admin)

module.exports.AddNewMember = async function (io, userId, data) {};

// Function to leave a group(any regular user)

module.exports.leaveGroup = async function (io, userId, data) {};

// Function to execute when a user sends a message in the server

module.exports.SendGroupMessage = async function (io, userId, data) {
  console.log("MEssage Received Successfully");

  //  Store in the database in appropirate manner

  // Send the message to active users in the group using loops

  io.emit("receive-group-message", { GroupId, Content, Sender });
};

// Function to execute when a user reads a message

module.exports.ReadGroupMessage = async function (io, userId, data) {};
