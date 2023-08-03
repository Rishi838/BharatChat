const  Socket  = io('http://localhost:3000')

// This function will recieve the personal message from the server when the client is active
console.log("Herre")
// Socket.emit("personal-chat", {
//     chatId : ""
//     Receiver: 1,
//     Content: 1,
//   });
// Receing personal messages from server if the user session is currently active
Socket.on('personal-chat',(data)=>{
   console.log(data)
})
// Receing group messages from server if the user session is currently active
Socket.on('group-chat',(data)=>{

})

