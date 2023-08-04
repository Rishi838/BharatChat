const  Socket  = io('http://localhost:3000')

//Helper function to send a personal message
function send_personal_message (Chat,Receiver,Content){
   console.log("Emitting")
   Socket.emit("send-personal-message",{
      ChatId : Chat,
      Receiver : Receiver,
      Content : Content
   })
}
// Helper function to send read status for a chat for the given user
function read_chat(Chat,Sender){
   // Sending the sender Id so that his chat is updated whenever we read the chat
   Socket.emit("read-personal-message",{
      ChatId : Chat,
      Sender : Sender
   })
}
// Receing personal messages from server whwn user is active
Socket.on("receive-personal-message",(data)=>{
   // Accessing all data like who is sending what message and displaying it in real time, it will not work if user is offline
   console.log("Here")
   console.log(data)
})
// Receiving acknowledgment when any of my sent messaged becomed read, when user is active
Socket.on("read-message-ack",(data)=>{
   // Accessing things sent like chatId and sender Id(Who read the message)
   const {ChatId, Sender} = data
})
// Sending message to the user, nit adding event listner, using refernce variable for it as of now
const sendMsg = true
if(sendMsg){
   // When User Sends a message attach the corresponding chat Id , receiver Id, and message to be sent
   // console.log("Executing Personal Message")
   // send_personal_message("64ccbfd159b2f0951bd7c65c","64cbf5687bd3a64f90d87839","Yo, Guys I Am sending this message to update unread count")
}

// This part is invoked when user reads a message,just using the refrence variable to do it for now
const chatRead = true;
if(chatRead)
{
   // When user reads the unread chat this emit command is used to send acknowledgement to server that the all the messages in the server are now read by this user
   read_chat("Chat" ,"Sender" )
}

