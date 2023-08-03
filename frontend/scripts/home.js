const  Socket  = io('http://localhost:3000')

//Helper function to send a personal message
async function send_personal_message (Chat,Receiver,Content){
   Socket.emit("send-personal-message",{
      ChatId : Chat,
      Receiver : Receiver,
      Content : Content
   })
}
// Helper function to send read status for a chat for the given user
async function read_chat(Chat,Sender){
   // Sending the sender Id so that his chat is updated whenever we read the chat
   Socket.emit("read-personal-message",{
      ChatId : Chat,
      Sender : Sender
   })
}
// Receing personal messages from server whwn user is active
Socket.on('receive-personal-message',(data)=>{
   // Accessing all data like who is sending what message and displaying it in real time, it will not work if user is offline
   const {ChatId , Sender, Content} = data
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
   send_personal_message("Chat","Receiver","Message")
}

// This part is invoked when user reads a message,just using the refrence variable to do it for now
const chatRead = true;
if(chatRead)
{
   // When user reads the unread chat this emit command is used to send acknowledgement to server that the all the messages in the server are now read by this user
   read_chat("Chat" ,"Sender" )
}

