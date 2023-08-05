const Socket = io("http://localhost:3000");

// Helper function by which we send requests to the server


// Helper function to send a self message

function send_self_message(Chat, Content) {
  Socket.emit("send-self-message", {
    ChatId: Chat,
    Content: Content,
  });
}

//Helper function to send a personal message

function send_personal_message(Chat, Receiver, Content) {
  console.log("Emitting");
  Socket.emit("send-personal-message", {
    ChatId: Chat,
    Receiver: Receiver,
    Content: Content,
  });
}

// Helper function to send read status for a chat for the given user

function read_personal_message(Chat, Sender) {
  // Sending the sender Id so that his chat is updated whenever we read the chat
  Socket.emit("read-personal-message", {
    ChatId: Chat,
    Sender: Sender,
  });
}

// Helper function to create a new group as admin

function create_new_group(Name, Description, Participants) {
  Socket.emit("create-group-chat", {
    Name,
    Description,
    Participants,
  });
}

// Helper function to send a message in the group

function send_group_message(GroupId, Content)
{
   Socket.emit("send-group-message",{GroupId, Content})
}

// Helper function to send read status of the group chat

function read_group_message(GroupId)
{
   Socket.emit("read-group-message", {
      GroupId
    });
}

// Functions through which we listen to response from the server

// Personal Messages listening

// Receing personal messages from server whwn user is active


Socket.on("receive-personal-message", (data) => {
  // Accessing all data like who is sending what message and displaying it in real time, it will not work if user is offline
  console.log("Here");
  console.log(data);
});


// Receiving acknowledgment when any of my sent messaged becomed read, when user is active


Socket.on("read-message-ack", (data) => {
  // Accessing things sent like chatId and sender Id(Who read the message)
  console.log("Acknowledgment received", data);
});


// Personal messages listening ends here


// Group Chat Listening

// Acknowlegment of new group chat being created

Socket.on("create-group-chat-successful",(data)=>{
   console.log("Group Chat Created Successfully with",data.GroupId,data.Name, data.Description,data.Participants)
})

// Receiving new message in the group

Socket.on("receive-group-message",(data)=>{
   // Perform Valid Changes in frontend
   console.log("Message Receivd")
})


// Sending message to the user, nit adding event listner, using refernce variable for it as of now
const sendMsg = true;
if (sendMsg) {
  // When User Sends a message attach the corresponding chat Id , receiver Id, and message to be sent
  // console.log("Executing Personal Message")
  // send_personal_message("64ccbfd159b2f0951bd7c65c","64cbf5687bd3a64f90d87839","Yo, Guys I Am sending this message to update unread count")
}

// This part is invoked when user reads a message,just using the refrence variable to do it for now
const chatRead = true;
if (chatRead) {
  // When user reads the unread chat this emit command is used to send acknowledgement to server that the all the messages in the server are now read by this user
  // read_chat("Chat" ,"Sender" )
}
Socket.on("test", (data) => {
  console.log("Data Received Successfully");
});
