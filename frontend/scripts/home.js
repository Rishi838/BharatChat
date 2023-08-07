async function postData(url = "", data = {}) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: JSON.stringify(data), // body data type must match "Content-Type" header
  });
  let rdata = await response.json(); // parses JSON response into native JavaScript objects
  return rdata;
}

const Socket = io("https://bharatchat.onrender.com");


// Helper function by which we send requests to the server


// Helper function to send a self message

function send_self_message(Content) {
  Socket.emit("send-self-message", {Content});
}

// Helper function to create a personal chat with the user

function create_personal_chat(Receiver){
  Socket.emit("create-personal-chat",{Receiver})
}

//Helper function to send a personal message

function send_personal_message(ChatId, Content) {
  console.log("Emitting");
  Socket.emit("send-personal-message", {ChatId,Content});
}

// Helper function to send read status for a chat for the given user

function read_personal_message(ChatId) {
  // Sending the sender Id so that his chat is updated whenever we read the chat
  Socket.emit("read-personal-message", {ChatId});
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

// Receving access token and  then sending it to update cookies api to update the cookies

Socket.on("access-token",async (data)=>{
  console.log("Here")
   await postData('/update-access-token',{acessToken : data.accessToken})
})

// Personal Messages listening

// Receving acknowledgment when an new chat is created

Socket.on("create-personal-chat-success",(data)=>{
  console.log("Chat Created:",data.ChatId)

  // Perform actions like creating a new chat bubble and other such things in the frontend
})

// Receiving fail status if the chat is not created (if it already exists)

Socket.on("create-personal-chat-fail",(data)=>{
  console.log("Chat Already Exists:",data)

  // Either display a false message or redirect on the user chat

})

// Receing personal messages from server whwn user is active


Socket.on("receive-personal-message", (data) => {
  // Accessing all data like who is sending what message and displaying it in real time, it will not work if user is offline
  console.log("Received: ",data);
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