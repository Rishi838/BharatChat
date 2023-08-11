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

// For conversion of time

const istOptions = {
  timeZone: "Asia/Kolkata",
  hour12: false, // Use 24-hour format
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
};

// These are the variables to find that which chat is active and what is his type

var activeId;
var activeType = "Self";

const Socket = io("http://localhost:3000");

// Helper functions by which we send requests to the server

// Helper function to fetch user details ✅

function fetch_user_details() {
  Socket.emit("fetch-user-details", {});
}

// Helper function to search users in database

function search_user(Name) {
  Socket.emit("search-user", { Name });
}

// Helper function to send a self message ✅

function send_self_message(Content) {
  Socket.emit("send-self-message", { Content });
}

// Helper function to fetch self messages ✅

function fetch_self_chat() {
  // Fetching the self chat
  console.log("Sending the self chat command to server")

  Socket.emit("fetch-self-chat", {});
}

// Helper function to create a personal chat with the user ✅

function create_personal_chat(Receiver) {
  Socket.emit("create-personal-chat", { Receiver });
}

//Helper function to send a personal message ✅

function send_personal_message(ChatId, Content) {
  console.log("Emitting");
  Socket.emit("send-personal-message", { ChatId, Content });
}

// Helper function to send read status for a chat for the given user✅

function read_personal_message(ChatId) {
  // Sending the sender Id so that his chat is updated whenever we read the chat
  Socket.emit("read-personal-message", { ChatId });
}

// Helper function to fetch personal chat ✅

function fetch_personal_chat(ChatId) {
  Socket.emit("fetch-personal-chat", { ChatId });
}

// Helper function to create a new group as admin ✅

function create_group_chat(Name, Description, Participants) {
  Socket.emit("create-group-chat", {
    Name,
    Description,
    Participants,
  });
}

// Helper function to send a message in the group ✅

function send_group_message(GroupId, Content) {
  Socket.emit("send-group-message", { GroupId, Content });
}

// Helper function to send read status of the group chat✅

function read_group_message(GroupId) {
  Socket.emit("read-group-message", {
    GroupId,
  });
}

// Helper function  add  a new member to the grp(only by admin)✅

function add_member(GroupId, Member) {
  Socket.emit("add-member", { GroupId, Member });
}

// Helper function to leave a group(any regular use) ✅

function leave_group(GroupId) {
  Socket.emit("leave-grp", { GroupId });
}

// Helper function to delete a group(only admin)

function delete_group(GroupId) {
  Socket.emit("delete-grp", { GroupId });
}

// Helper function to change the admin for the grp(admin only)

function change_admin(GroupId, Member) {
  Socket.emit("change-admin", { GroupId, Member });
}

// Functions through which we listen to response from the server


// Function to display self chat on web page load and setting active id as the self chatId

Socket.on("user-id", (data) => {
  activeId = data.userId;
  console.log(data);
  document.getElementById("chats").innerHTML = `
  <div class="load-3" >        
  <div class="line"></div>
  <div class="line"></div>
  <div class="line"></div>
  </div>
  `;
  fetch_self_chat();

  //  Set self chat in chat list dynamically
  document.getElementById("self-chat-list").innerHTML = `
  <li class="c-users__person" id="sel${data.userId}">${data.userName}</li>
  `;
});

// Receiving user  details  of the logged user ✅

Socket.on("user-details", (data) => {
  // Fetch Details like user name, email and Id as of now(will add photo aftyerwords)
  console.log(data.Name, data.Email, data.Id);
});

// Searched user functionality ✅

Socket.on("searched-user", (data) => {
  console.log(data);

  // we'll receive the searched user details

  // Updating the search-user-list

  document.getElementById("search-user-list").innerHTML = "";

  const user_list = data.Users;
  console.log(user_list);

  for (let i = 0; i < user_list.length; i++) {
    document.getElementById("search-user-list").innerHTML += `
    <li class="c-users__person" id="searched_${user_list[i]._id}">${user_list[i].Name}</li>
    `;
  }
});

// Receving access token and  then sending it to update cookies api to update the cookies✅

Socket.on("access-token", async (data) => {
  console.log("Here");
  await postData("/update-access-token", { acessToken: data.accessToken });
});

// Personal Messages listening

// Fetching the personal msg list to display in the list column ✅

Socket.on("personal-chat-list", (data) => {
  var PersonalChatList = data.PersonalChatList;
  var x = "";
  for (let i = 0; i < PersonalChatList.length; i++) {
    let unreadSpan =
      PersonalChatList[i].Unread !== 0
        ? `<span class="unread-count">${PersonalChatList[i].Unread}</span>`
        : "";
    x += `<li class="c-users__person" id="per${PersonalChatList[i]._id}">${PersonalChatList[i].Partner}
   ${unreadSpan}</li>`;
  }

  document.getElementById("personal-chat-list").innerHTML = x;
});

// Receving acknowledgment when an new chat is created ✅

Socket.on("create-personal-chat-success", (data) => {
  console.log("Chat Created:", data.ChatId);

  // Perform actions like creating a new chat bubble and other such things in the frontend
});

// Receiving fail status if the chat is not created (if it already exists) ✅

Socket.on("create-personal-chat-fail", (data) => {
  console.log("Chat Already Exists:", data);

  // Either display a false message or redirect on the user chat
});

// Receing personal messages from server whwn user is active ✅

Socket.on("receive-personal-message", (data) => {
  // Accessing all data like who is sending what message and displaying it in real time, it will not work if user is offline
  console.log("Received: ", data);
});

// Receiving acknowledgment when any of my sent messaged becomed read, when user is active ✅

Socket.on("read-personal-msg-ack", (data) => {
  // Accessing things sent like chatId and sender Id(Who read the message)
  console.log("Acknowledgment received", data);
});

// Fetching personal chat ✅

Socket.on("personal-chat", (data) => {
  // Displaying personal chat data
  console.log(data.Messages);
});

// Personal messages listening ends here

// Self Chat Listening ✅

Socket.on("self-chat", (data) => {

  console.log("self chat receievd")
  // Removing the loader if there was any

  const chatWindow = document.getElementById("chats");
  const loaderElements = chatWindow.querySelectorAll(".load-3");

  loaderElements.forEach((loaderElement) => {
    chatWindow.removeChild(loaderElement);
  });

  // Fetch Messages over here
  document.getElementById(
    "chat-name"
  ).innerHTML = `<i class="fas fa-hashtag"></i>You`;
  document.getElementById("chat-details").innerHTML = "Self";

  const messages = data.Messages;
  console.log(messages)
  var x = "";
  for (let i = 0; i < messages.length; i++) {
    const utcDate = new Date(messages[i].Timestamp);
    const TimeString = utcDate.toLocaleString("en-IN", istOptions);
    x += `
    <div class="c-chat__msg">
    <span class="c-chat__icon"></span>
    <div class="c-chat__text">
      <span>You</span><time>${TimeString}</time>
      <p>
        ${messages[i].Content}
      </p>
    </div>
  </div>
    `;
  }
  console.log(x)
  document.getElementById("chats").innerHTML = x;
  console.log(document.getElementById("chats"));
});

// Group Chat Listening

// Fetching Grp Chat List the user is involved in and displaying ✅

Socket.on("group-chat-list", (data) => {
  const GrpChatList = data.GroupChatList;

  var x = "";
  for (let i = 0; i < GrpChatList.length; i++) {
    let unreadSpan =
      GrpChatList[i].Unread !== 0
        ? `<span class="unread-count">${GrpChatList[i].Unread}</span>`
        : "";
    x += `<li class="c-users__person" id="${GrpChatList[i]._id}">${GrpChatList[i].Name}${unreadSpan}</li>`;
  }
  document.getElementById("group-chat-list").innerHTML = x;
});

// Acknowlegment of group chat creation failed ✅

Socket.on("create-group-chat-fail", (data) => {
  console.log(data);
});

// Acknowlegment of new group chat being created ✅

Socket.on("create-group-chat-success", (data) => {
  console.log(
    "Group Chat Created Successfully with",
    data.GroupId,
    data.Name,
    data.Description,
    data.Participants
  );
});

// Receiving new message in the group  ✅

Socket.on("receive-group-message", (data) => {
  // Perform Valid Changes in frontend
  console.log("Message Receivd", data);
});

// Read new msg acknowledgment ✅

Socket.on("read-grp-msg-ack", (data) => {
  console.log("Acknowledgment received for: ", data);
});

// Add New Member fail ✅

Socket.on("add-member-fail", (data) => {
  console.log(data);
});

// Add Message Success ✅

Socket.on("add-member-success", (data) => {
  console.log(data);
});

// Receiving msg when this user is added in a grp ✅

Socket.on("new-grp-added", (data) => {
  console.log(data);
});

// Receiving ack when grp chat deletion fails

Socket.on("delete-grp-fail", (data) => {
  console.log(data);
});

// Receiving ack when grp chat deletion succeed

Socket.on("delete-grp-success", (data) => {
  console.log(data);
});

// Receving acknowledgment if user fails to leave the grp(when he is the admin of the grp)✅

Socket.on("group-left-fail", (data) => {
  console.log(data);
});

// Receving acknowledgment if user fails to leave the grp(when he is the admin of the grp)✅

Socket.on("group-left-success", (data) => {
  console.log(data);
});

// Receving ack when someone in the grp left the chat ✅

Socket.on("user-left-grp", (data) => {
  console.log(data);
});

// Receving ack when admin change fails

Socket.on("change-admin-fail", (data) => {
  console.log(data);
});

// Receving ack when admin change succeeds

Socket.on("change-admin-success", (data) => {
  console.log(data);
});



// Othe function to handle various event listners

// Event Listner when user clicks on user icon

document.getElementById("user-icon").addEventListener("click", () => {
  document.getElementById("chat-list").style.display = "block";
  document.getElementById("search-user").style.display = "none";
});

// Event Listner when user clicks on search icon

document.getElementById("search-icon").addEventListener("click", () => {
  document.getElementById("chat-list").style.display = "none";
  document.getElementById("search-user").style.display = "block";
});

// Event Listner when user types a query

document.getElementById("search-query").addEventListener("change", () => {
  search_user(document.getElementById("search-query").value);
});
