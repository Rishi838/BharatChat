# ExpressChat - Chat Application Backend
<img src="https://github.com/Rishi838/ExpressChat/assets/77577908/4a0e0107-2587-439d-ab45-03dd9c34d999" width="150px" height="150px">



Welcome to the ExpressChat! This project aims to provide a user-friendly and feature-rich chat platform that allows users to communicate seamlessly.Whether you're looking to catch up with friends, collaborate with colleagues, or meet new people, our chat application offers an intuitive and feature-rich environment to make your conversations truly come alive.

## Table of Contents

1. Introduction
2. Features
3. Technologies Used
4. Getting Started
5. Installation
6. Authorisation API's
7. Socket Io Connections
8. Frontend Demonstration
9. Support

## Introduction

In a world where communication bridges distances, our Chat Application goes beyond simple text exchanges. We've crafted a space where real-time interactions, group chats, and expressive conversations come together effortlessly. Our platform isn't just about sending messages; it's about creating meaningful connections, fostering collaboration, and making every conversation memorable. The website is live and can be accessed at [ExpressChat](https://expresschat-v6mg.onrender.com).


## Features

- User Registration and Authentication: Users can create accounts and log in securely(JWT Authentication).
- Self Chat: Enable users to have private conversations with themselves.Useful for saving notes and drafts.
- Personal Chat: Facilitate one-on-one conversations between users. 
- Group Chat:Promote collaboration and interaction among multiple users through group chats.
- Admin Controls: Designate group administrators with additional privileges for managing the group.
- Notifications: Notify users of new messages even when the app is in the background.
- Real-Time Messaging: Instant message delivery for seamless communication.
- Media Sharing: Share images, videos, documents, and other media files.(I'm working on this feature)

## Technologies Used

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express.js, SocketIo(Real Time communication), Firebase(Storage)
- Database: MongoDB
- Deployment: Render

## Getting Started

To run the project locally on your machine, follow these instructions.

## Installation

1. Clone this repository to your local machine.

        git clone https://github.com/Rishi838/ExpressChat.git
2. Install the required dependencies.

       npm install
3. Start the development server.

       npm start

## Authorisation API's

Base URL: https://expresschat-v6mg.onrender.com

       Signup - METHOD/POST  - "Base URL/signup"
       Login  - METHOD/POST  - "Base URL/login"
       Verify - METHOD/GET   - "Base URL/Verify"
       Logout - METHOD/POST  - "BASE URL/logout"
       Resend - METHOD/POST  - "BASE URL/resend"

## SocketIO Connections

Before making the connection with client,server  validates the reuqest using io.use(middleware) in which server verifies whther a valid combination of access and refresh token were provided or not.

After soon as connection is made , Server Emits 3 events to the client:

1. Below Event is fired so that user can know his id which can help him fetch his self chat(self chat always have id same as the userId)

       io.to(socket.id).emit("user-id", { userId, userName });

2. Below event is fired so that user can display the personal chatList to the user

       io.to(socketId).emit("personal-chat-list", { PersonalChatList});

3. Below event is fired so that user can display the group chatList to the user

        io.to(socketId).emit("group-chat-list", { GroupChatList});

After sending this 3 things to client, all events are carried out when a user asks for it.

### Self Chat

1. For Fetching Self chat(when user clicks on self chat), client sends:

         Socket.emit("fetch-self-chat", {});
   To which server responds with

          io.to(socketId).emit("self-chat", { Messages, Name});

2. For Sending Self Message, Client Sends:

         Socket.emit("send-self-message", { Content });
   To which server responds with nothing as there is no need for notification on self messages

### Private Chat

1. For Fetching Personal chat(when user clicks on personal chat),client sends:

       Socket.emit("fetch-personal-chat", { ChatId, Partner });
   To which server responds with

       io.to(socketId).emit("personal-chat", {  Messages, UserId, User, Partner });
2. For Sending Personal msg, client sends:

       Socket.emit("send-personal-message", { ChatId, Content });
   To which user send message to the receiver (if he is online) using:

       io.to(receiver.socket).emit("receive-personal-message", {ChatId,Content,Sender});
   Receiver Reads the message using:

        Socket.on("receive-personal-message")
   When Receiver Reads msg, he notifies the server via:

        Socket.emit("read-personal-message", { ChatId});
   Server receives it and send an acknowlegment through:

        io.to(sender.socket).emit("read-personal-msg-ack", { ChatId});

### Group Chat

All command of sending and reading msgs are similar to personal chat, list about different functionalities of group are given below:

1. When a user wants to create a group:

        Socket.emit("create-group-chat", {Name,Description,Participants});

2. When admin adds a new member to group, admin send:

        Socket.emit("add-member",{GroupId,Member})

3.  When admin wants someone to kickout of the group:

         Socket.emit("kickout", { GroupId, Member });
4.  When admin want to make someone else as admin:

          Socket.emit("change-admin", { GroupId, Member});
5.  When any user wants to leave a group:

           Socket.emit("leave-grp", { GroupId: activeId });

      
## Frontend Demonstration

1. Chat  Interface
<br><br>
![chat-interface](https://github.com/Rishi838/ExpressChat/assets/77577908/73407817-d287-4b8b-8911-d2447751c5ad)


<br><br>
2. Group Creation Interface
<br><br>
![grp-creation](https://github.com/Rishi838/ExpressChat/assets/77577908/b03de4be-3197-4a18-9120-416edb6a27ec)
<br><br>
3. Login Page
<br><br>
![Login](https://github.com/Rishi838/ExpressChat/assets/77577908/481dff97-ba73-4f54-b475-1679ab48ec7d)
<br><br>
4. Signup Page
<br><br>
![Signup](https://github.com/Rishi838/ExpressChat/assets/77577908/367bc1fb-9086-46e5-8514-0710498dbbad)
<br><br>

<br>

## Support

Frontend of the webpage is picked from https://codepen.io/aaronmcg/pen/gOwqBrZ , All rights to the respective Owner.

If you have any questions or need assistance, please feel free to contact me at rishidhingra04@gmail.com.

Thank you for using our Chat Apllication!
