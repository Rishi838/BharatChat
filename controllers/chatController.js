// Importing Required Modules and packages
const personal_chat = require("../models/personal_chat");
const self_chat = require("../models/self_chat");
const group_chat = require("../models/group_chat");
const activeUsers = require("../models/active");
const Users = require("../models/user");

// Basic controller functions

// Fetch user details ✅

module.exports.FetchDetails = async function (
  io,
  userId,
  userEmail,
  userName,
  socketId
) {
  //  Successfully returning details to user

  io.to(socketId).emit("user-details", {
    Name: userName,
    Email: userEmail,
    Id: userId,
  });
};

// Search functionality ✅

module.exports.SearchUser = async function (io, userId, data, socketId) {
  //  Searching user in the database(which contains that name string)(maximum 8)
  const searchResults = await Users.find({
    Name: { $regex: data.Name, $options: "i" },
  },{
    _id : 1, Name :1 , Email : 1
  });


  // Returning top 8 users

  const search_users = searchResults.splice(0, 8);

  io.to(socketId).emit("searched-user", {
    Users: search_users,
  });
};

// Fetch Personal Chats

module.exports.FetchPersonalChatList = async function (io,userId,socketId) {
 

  //  Searching all the chats user is involved in on the basis of the timestamp

  const chat_list = await personal_chat
    .find(
      {
        $and: [{ [`Participants.${userId}`]: { $exists: true } }],
      },
      { _id: 1, Participants: 1, LastChat: 1 }
    )
    .sort({ LastChat: -1 });

  
  // Modifying the chat list according to the details we need like partner, unread count , chatId and TimeStamp

  // Using Promise.all method to resolve all promises in the array

  const simplifiedChatList = await Promise.all(chat_list.map(async(chat) => {
    var otherParticipantId = userId;
    var undreadCount;
    for (const [key, value] of chat.Participants) {
      if (!userId.equals(key)) {
        otherParticipantId = key;
      }
      else{
        undreadCount = value;
      }
    }

    // Fetching Name of Person associated with that user

    const User_details = await Users.findOne({_id : otherParticipantId})

    return {
      _id: chat._id,
      LastChat: chat.LastChat,
      Partner: User_details.Name,
      Unread : undreadCount
    };
  }));
  io.to(socketId).emit("personal-chat-list",{PersonalChatList: simplifiedChatList})
};

// Fetch grp chat list

module.exports.FetchGroupChatList = async function (io,userId,socketId) {
 

  //  Searching all the chats user is involved in on the basis of the timestamp

  const chat_list = await group_chat
    .find(
      {
        $and: [{ [`Participants.${userId}`]: { $exists: true } }],
      },
      { _id: 1, Name:1, Participants:1, LastChat: 1 }
    )
    .sort({ LastChat: -1 });
    const simplifiedChatList = chat_list.map((chat) => {
      var undreadCount;
      for (const [key, value] of chat.Participants) {
        if (userId.equals(key)) {
          undreadCount = value
          break
        }
      }
      return {
        _id: chat._id,
        Name:chat.Name,
        LastChat: chat.LastChat,
        Unread : undreadCount
      };
    });

    io.to(socketId).emit("group-chat-list",{GroupChatList : simplifiedChatList})
};

// Personal Chat Controllers ✅

// Creating Personal chat between two users ✅

module.exports.CreatePersonalChat = async function (
  io,
  userId,
  data,
  socketId
) {
  //  Checking with which user, current user wants to create chat
  const Receiver = data.Receiver;

  // Searching if a personal chat already exists between the users

  const chat_check = await personal_chat.findOne({
    $and: [
      { [`Participants.${userId}`]: { $exists: true } },
      { [`Participants.${Receiver}`]: { $exists: true } },
    ],
  });

  // Sending create chat status fail if the chat already exists

  if (chat_check) {
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

  const new_chat = await personal_chat.create({
    Participants: participantsMap,
    Message: [],
    LastChat: Date.now(),
  });

  // Notifying it to the person who created the chat

  io.to(socketId).emit("create-personal-chat-success", {
    ChatId: new_chat._id,
    Partner: data.Receiver,
  });

  // Notifying it to the other person in the chat if the user is online
  const is_receiver_active = await activeUsers.findOne({ user: data.Receiver });
  // If user is active then send acknowledgment of the chat to the sender
  if (is_receiver_active) {
    io.to(is_receiver_active.socket).emit("create-personal-chat-success", {
      ChatId: new_chat._id,
      Partner: userId,
    });
  }
};

// Handle case when user sends a mesage to someone✅

module.exports.SendPersonalMessage = async function (io, userId, data) {
  console.log("Message Received ,", data.ChatId, data.Content);
  // Fetching chatId
  const chatId = data.ChatId;

  // Finding the chat details

  const privateChat = await personal_chat.findOne({ _id: chatId });
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

  privateChat.Messages.unshift({
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
      Content: data.Content,
    });
  }
};

// Function to handle status of message(This function is hit when a user read a message in the chat so we need to set unread meessage of that user to 0 and update status of individual message in the chat that were marked as unread earlier)✅

module.exports.ReadPersonalMessage = async function (io, userId, data) {
  //  Finding the chat in which user have read the message

  const chats = await personal_chat.findOne({ _id: data.ChatId });

  const chat_msgs = chats.Messages;

  // Marking all the messages in the chat as Read by the reader

  for (let i = 0; i < chat_msgs.length; i++) {
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
    io.to(sender.socket).emit("read-personal-msg-ack", {
      ChatId: data.ChatId,
    });
  }
};

// Fetching personal chat messages ✅

module.exports.FetchPersonalChat = async function (io, data, socketId) {
  // Fetching personal chat between the users

  const personal_msgs = await personal_chat.findOne({ _id: data.ChatId });

  // Returning it to socket demanding it
  io.to(socketId).emit("personal-chat", {
    Messages: personal_msgs.Messages,
  });
};

// Function to handle self messages (only thing here is to store it in database and fetch it✅

module.exports.SendSelfMessage = async function (io, userId, data) {
  // Finding self chat associated with the user

  const privateChat = await self_chat.findOne({
    UserId: userId,
  });

  //  Pushing message to the message array

  privateChat.Messages.unshift({
    Content: data.Content,
    Timestamp: Date.now(),
  });
  privateChat.LastChat = Date.now();
  await privateChat.save();

  //  No More actions are required as sender is same as receiver
};

// Fetching self chat ✅

module.exports.FetchSelfChat = async function (io, userId, socketId) {
  // Searching for user in self chat database

  const self_msgs = await self_chat.findOne({ UserId: userId });


  // Returning chats to the user

  io.to(socketId).emit("self-chat", {
    Messages: self_msgs.Messages,
  });
};

// Function to create group chat(Constraint on group is that it should have min 2 participant) ✅

module.exports.CreateGroupChat = async function (io, userId, data, socketId) {
  // Checking whether number of participants is greater than 2 or not and other things like name is provided or not

  if (data.Name == null || data.Name == "" || data.Participants.length < 2) {
    //  Emitting false status to the user trying to create a group

    io.to(socketId).emit("create-group-chat-fail", {
      Message:
        "Group Chat fail as Name is not provided or Participants are less than 3",
    });
    return;
  }

  // Creating participants map with unread count as 0

  const ParticipantsMap = new Map();
  ParticipantsMap.set(userId, 0);
  for (let i = 0; i < data.Participants.length; i++)
    ParticipantsMap.set(data.Participants[i], 0);

  // Now creating a new group in the database

  const new_group_chat = await group_chat.create({
    Name: data.Name,
    Description: data.Description,
    Admin: userId,
    Participants: ParticipantsMap,
    Messages: [],
    LastChat: Date.now(),
  });

  // After the group has been created send a success message to all members in the grp

  for (const [key, value] of new_group_chat.Participants) {
    // Sending him real time message if a user is online

    const receiver = await activeUsers.findOne({ user: key });

    if (receiver != null) {
      io.to(receiver.socket).emit("create-group-chat-success", {
        GroupId: new_group_chat._id,
        Name: data.Name,
        Description: data.Description,
        Participants: data.Participants,
      });
    }
  }

  // Looping thorugh active users of the group
};

// Function to delete a grouo a group(only by admin)✅

module.exports.DeleteGroupChat = async function (io, userId, data, socketId) {
  //  Fetching details of chat which has to be deleted

  const grp_chat = await group_chat.findOne({ _id: data.GroupId });

  // Checking wthether the user is admin to delte the grp or not

  if (!userId.equals(grp_chat.Admin)) {
    //  Returning fail status if he is not the admin

    io.to(socketId).emit("delete-grp-fail", {
      Message: "Cannot delete grp as this person is not the admin og grp",
    });
  } else {
    // Else sending the message to all regarding deletion of grp and deleting it from the db

    for (const [key, value] of grp_chat.Participants) {
      // Sending him real time message if a user is online

      const receiver = await activeUsers.findOne({ user: key });

      io.to(receiver.socket).emit("delete-grp-success", {
        GroupId: grp_chat._id,
      });
    }

    // Deleting the group

    await group_chat.deleteOne({ _id: grp_chat._id });
  }
};

// Function to add a new member to group(only by admin) ✅

module.exports.AddNewMember = async function (io, userId, data, socketId) {
  // Fetching the chat details

  const grp_chat = await group_chat.findOne({ _id: data.GroupId });

  // Checking if user is admin or not

  if (!userId.equals(grp_chat.Admin)) {
    io.to(socketId).emit("add-member-fail", {
      Message: "You Should be admin to add a member",
    });
    return;
  }

  if (grp_chat.Participants.has(data.Member)) {
    io.to(socketId).emit("add-member-fail", {
      Message: "Already in Group",
    });
    return;
  }

  // Adding new Participants

  grp_chat.Participants.set(data.Member, 0);
  await grp_chat.save();

  // Notifying other ppl in grp

  for (const [key, value] of grp_chat.Participants) {
    // Sending him real time message if a user is online

    const receiver = await activeUsers.findOne({ user: key });
    if (receiver) {
      // If user is not the member telling him that a new member is added

      if (key != data.Member) {
        io.to(receiver.socket).emit("add-member-success", {
          ChatId: grp_chat._id,
          Member: data.Member,
        });
      } else {
        //  If he is the person added , then telling him that he has been added to a new grp

        io.to(receiver.socket).emit("new-grp-added", {
          ChatId: grp_chat._id,
        });
      }
    }
  }
};

// Function to leave a group(any regular user) ✅

module.exports.LeaveGroup = async function (io, userId, data, socketId) {
  // Handle the case to delete the grp if user is admin;

  const grp_chat = await group_chat.findOne({ _id: data.GroupId });
  console.log(grp_chat);

  if (userId.equals(grp_chat.Admin)) {
    //  If admin is asking to leave the grp, then asking him to first change the admin

    io.to(socketId).emit("group-left-fail");
    {
      Message: "As You were admin, Please make someone else admin before leaving the grp";
    }
  } else {
    console.log("Here");
    console.log(userId);
    console.log(grp_chat.Participants.has(userId.toString()));
    if (grp_chat.Participants.has(userId.toString())) {
      console.log("Here");
      // Leaving the group

      grp_chat.Participants.delete(userId);
      await grp_chat.save();

      // Notifying the user that he has left the grp

      io.to(socketId).emit("group-left-success", {
        Message: "Group Left Successfully",
        GroupId: grp_chat._id,
      });

      // Notifying everyone that a user has left the group

      for (const [key, value] of grp_chat.Participants) {
        // Sending him real time message if a user is online

        const receiver = await activeUsers.findOne({ user: key });

        io.to(receiver.socket).emit("user-left-grp", {
          GroupId: grp_chat._id,
          User: userId,
        });
      }
    }
  }
};

// Function to execute when a user sends a message in the server ✅

module.exports.SendGroupMessage = async function (io, userId, data) {
  //  Store in the database in appropirate manner

  // Finding the grp chat whose message has come

  const grp_chat = await group_chat.findOne({ _id: data.GroupId });

  // Creating a Read Status Map for the Message and also updating the undread Message Count

  const ReadStatusMap = new Map();
  for (const [key, value] of grp_chat.Participants) {
    ReadStatusMap.set(key, "Unread");

    // For sender keep the count same as he will always read the message he sends

    if (key != userId) {
      // Updating the Participant unread count

      grp_chat.Participants.set(key, grp_chat.Participants.get(key) + 1);

      // Sending him real time message if a user is online

      const receiver = await activeUsers.findOne({ user: key });
      if (receiver) {
        io.to(receiver.socket).emit("receive-group-message", {
          Sender: userId,
          Content: data.Content,
        });
      }
    }
  }

  // Pushing message in the front of the Message array and saving it

  grp_chat.Messages.unshift({
    Sender: userId,
    Content: data.Content,
    ReadStatus: ReadStatusMap,
    Timestamp: Date.now(),
  });
  await grp_chat.save();
};

// Function to execute when a user reads a message ✅

module.exports.ReadGroupMessage = async function (io, userId, data) {
  // Fecthing the grp chat whose Messages are read

  const grp_chat = await group_chat.findOne({ _id: data.GroupId });

  grp_chat.Participants.set(userId, 0);

  const grp_msgs = grp_chat.Messages;

  for (let i = 0; i < grp_msgs.length; i++) {
    if (grp_msgs[i].ReadStatus.get(userId) == "Read") break;
    else grp_msgs[i].ReadStatus.set(userId, "Read");
  }

  await grp_chat.save();

  for (const [key, value] of grp_chat.Participants) {
    if (key != userId) {
      // Sending him real time message if a user is online

      const receiver = await activeUsers.findOne({ user: key });
      if (receiver) {
        io.to(receiver.socket).emit("read-grp-msg-ack", {
          Reader: userId,
          ChatId: data.ChatId,
        });
      }
    }
  }
};

// Function to execute when a user wants to change admin  ✅

module.exports.ChangeAdmin = async function (io, userId, data, socketId) {
  // Fetching the chat details

  const grp_chat = await group_chat.findOne({ _id: data.GroupId });

  // Checking if user is admin or not

  if (!userId.equals(grp_chat.Admin)) {
    io.to(socketId).emit("change-admin-fail", {
      Message: "You Should be admin to make someone else as admin",
    });
    return;
  }

  if (!grp_chat.Participants.has(data.Member)) {
    io.to(socketId).emit("change-admin-fail", {
      Message: "member should be in grp to make him/her as admin",
    });
    return;
  }

  // Changing the admin

  grp_chat.Admin = data.Member;

  await grp_chat.save();
  console.log(grp_chat);

  // Notifying other ppl in grp

  for (const [key, value] of grp_chat.Participants) {
    // Sending him real time message if a user is online

    const receiver = await activeUsers.findOne({ user: key });

    if (receiver) {
      // Return success status

      io.to(receiver.socket).emit("change-admin-success", {
        ChatId: grp_chat._id,
        Admin: grp_chat.Admin,
      });
    }
  }
};
