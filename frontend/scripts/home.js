const  Socket  = io('http://localhost:3000')

//Helper function to send a personal message
async function send_personal_message (receiver,content){
   Socket.emit("personal-chat",{
      Receiver : receiver,
      Content : content
   })
}
// Receing personal messages from server whwn user is active
Socket.on('personal-chat',(data)=>{
   console.log(data)
})
const chatRead = true;
if(chatRead)
{
   // When user reads the unread chat this emit command is used to send acknowledgement to server that the all the messages in the server are now read by this user
   Socket.emit("read-personal-msg",{})
}

