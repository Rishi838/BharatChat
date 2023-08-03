const  Socket  = io('http://localhost:3000')

// This function will recieve the personal message from the server when the client is active
// Receing personal messages from server if the user session is currently active
Socket.on('personal-chat',(data)=>{
   console.log(data)
})
// Receing group messages from server if the user session is currently active
Socket.on('group-chat',(data)=>{

})

