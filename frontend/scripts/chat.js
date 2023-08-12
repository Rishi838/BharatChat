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

function get_time() {
  const currentDate = new Date();

  const day = String(currentDate.getDate()).padStart(2, "0");
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const year = currentDate.getFullYear();

  const hours = String(currentDate.getHours()).padStart(2, "0");
  const minutes = String(currentDate.getMinutes()).padStart(2, "0");
  const seconds = String(currentDate.getSeconds()).padStart(2, "0");

  const formattedDate = `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
  return formattedDate;
}

// These are the variables to find that which chat is active and what is his type

var activeId;
var activeType = "Self";
var UserName;
var UserId;
var searchId;

// Event Listner when a user profile is clicked after searching

function search_user (id){
  return ()=>{
    searchId = id
     Socket.emit("check-chat",{Receiver:id})
  }
}

// Event Listner when a chat is Clicked in the chat list

function chat_opener(type, id, Partner) {
  // Clearing out the textarea whenever a new chat is being opened to avoid disparity and better user experience
  if (type === "Self") {
    return () => {
      //  Setting value of placeholder as empty

      document.getElementById("xx").value = "";

      // Setting active Id and type

      activeId = id;
      activeType = type;

      // Fetching the self chat and  displaying it

      Socket.emit("fetch-self-chat", {});
    };
  } else if (type === "Personal") {
    return () => {
      //  Setting value of placeholder as empty

      document.getElementById("xx").value = "";

      // As chat is opened so we have read the msg, so inform it to the server

      Socket.emit("read-personal-message", { ChatId: id });
      document.getElementById(`${id}Count`).innerHTML = "";

      // Updating user interface in real time

      // Setting active chatId and type

      activeId = id;
      activeType = type;

      // Fetching personal chat and displaying it

      Socket.emit("fetch-personal-chat", { ChatId: id, Partner });
    };
  } else if (type === "Group") {
    return () => {
      //  Setting value of placeholder as empty

      document.getElementById("xx").value = "";

      // As chat is opened so we have read the  msg, so telling server as well as updating the count
      document.getElementById(`${id}Count`).innerHTML = "";
      Socket.emit("read-group-message", { GroupId: id });

      // Setting active chatId and type

      activeId = id;
      activeType = type;

      // Fetching Group chat and displaying it

      Socket.emit("fetch-group-chat", { GroupId: id });
    };
  }
}

// Event Listner when user clicks on the send button

function send_msg(type, id, Content) {
  //  Making out the new msg

  const new_msg = `
     <div class="c-chat__msg">
    <span class="c-chat__icon"></span>
    <div class="c-chat__text">
      <span>${UserName}</span><time>${get_time()}</time>
      <p>
        ${Content}
      </p>
    </div>
  </div>
     `;

  // Checking the type of message

  if (type == "Self") {
    // If chat is self, Update the chat in frontend and send request to server only

    document.getElementById("chats").insertAdjacentHTML("afterbegin", new_msg);
    Socket.emit("send-self-message", { Content });
  } else if (type == "Personal") {
    // Select the chat item and list that we want to target in personal chat list

    const ChatToMove = document.getElementById(id);
    const ChatList = document.getElementById("personal-chat-list");

    // Insert new msg in chat and make request to the server

    document.getElementById("chats").insertAdjacentHTML("afterbegin", new_msg);
    Socket.emit("send-personal-message", { ChatId: id, Content });

    // Updating personal chat list

    ChatList.removeChild(ChatToMove);
    ChatList.insertBefore(ChatToMove, ChatList.firstChild);
  } else if (type == "Group") {
    // Select the chat item and list that we want to target in Group chat list

    const ChatToMove = document.getElementById(id);
    const ChatList = document.getElementById("group-chat-list");

    // Insert new msg in chat and make request to the server

    document.getElementById("chats").insertAdjacentHTML("afterbegin", new_msg);
    Socket.emit("send-group-message", { GroupId: id, Content });

    //  Updating Group chat list

    ChatList.removeChild(ChatToMove);
    ChatList.insertBefore(ChatToMove, ChatList.firstChild);
  }

  // Clearing out the msg typing field

  document.getElementById("xx").value = "";
}

const Socket = io("http://localhost:5000");

// Helper functions by which we send requests to the server

// Helper function to fetch user details ✅

function fetch_user_details() {
  Socket.emit("fetch-user-details", {});
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

// Helper function to fetch group chat

function fetch_group_chat(GroupId) {
  Socket.emit("fetch-group-chat", { GroupId });
}

// Functions through which we listen to response from the server

// Function to display self chat on web page load and setting active id as the self chatId

Socket.on("user-id", (data) => {
  //  Setting self chat as the active chat and setting username

  activeId = data.userId;
  UserId = activeId
  UserName = data.userName;

  // document.getElementById("chats").innerHTML = `
  // <div class="load-3" >
  // <div class="line"></div>
  // <div class="line"></div>
  // <div class="line"></div>
  // </div>
  // `;

  // Fetching Self Chat

  Socket.emit("fetch-self-chat", {});

  //  Set self chat in chat list dynamically

  document.getElementById("self-chat-list").innerHTML = `
  <li class="c-users__person" id="${data.userId}">${data.userName}</li>
  `;

  //  Adding an event listner to self chat button

  let element = document.getElementById(`${data.userId}`);
  element.addEventListener("click", chat_opener("Self", `${data.userId}`));
});

// Receiving user  details  of the logged user ✅

Socket.on("user-details", (data) => {
  // Fetch Details like user name, email and Id as of now(will add photo aftyerwords)
  console.log(data.Name, data.Email, data.Id);
});

// Searched user functionality ✅

Socket.on("searched-user", (data) => {
  
  // we'll receive the searched user details

  // Updating the search-user-list

  document.getElementById("search-user-list").innerHTML = "";

  const user_list = data.Users;
  
  for (let i = 0; i < user_list.length; i++) {
    if(user_list[i]._id!=UserId){
    document.getElementById("search-user-list").innerHTML += `
    <li class="c-users__person" id="${user_list[i]._id}">${user_list[i].Name}</li>
    `;
    }
  }

  // Add Event listener for each user

  for (let i = 0; i < user_list.length; i++) {
    if(user_list[i]._id!=UserId && user_list.includes(user_list[i])){
      let element = document.getElementById(`${user_list[i]._id}`)
      element.addEventListener('click',search_user(user_list[i]._id))
    }
  }

});

// Receving access token and  then sending it to update cookies api to update the cookies✅

Socket.on("access-token", async (data) => {
  await postData("/update-access-token", { acessToken: data.accessToken });
});

// Personal Messages listening

// Listening to create chat button

Socket.on("create-chat-result",(data)=>{
  // Handling two cases Like when chat exists or when it does not exists 

  if(data.Exists==1){

    // case when chat exits 

    activeId = data.ChatId
    activeType ="Personal"

    // Telling Backend To open the chat

    Socket.emit("fetch-personal-chat", { ChatId: data.ChatId, Partner : data.Partner});

    // Displaying msgs part and hiding create part
    document.getElementById("start-chat-text").style.display = "none"
    document.getElementById("start-chat-btn").style.display = "none"
    document.getElementById("chats").style.display = "flex"
    document.getElementById("msg-area").style.display = "flex"

  }else{
    // Displaying new part for creating a chat
    document.getElementById("chats").style.display = "none"
    document.getElementById("msg-area").style.display = "none"
    document.getElementById("start-chat-text").style.display = "block"
    document.getElementById("start-chat-btn").style.display = "block"

    // Displaying name of Partner on top of chat info

    document.getElementById("chat-name").innerHTML = `<i class="fas fa-hashtag"></i>${data.Partner}`

    // Adding an event Listner is user clicks on this button

    document.getElementById("start-chat-btn").addEventListener('click',()=>{
     
    // Creating the chat by sending it to the server'

    Socket.emit("create-personal-chat", { Receiver:searchId, Partner: data.Partner , UserName });

    // Displaying the chat section and send msg button( other works like setting that chat as active) and moving it to the top of personal chat and making chat list as visible will be done by socket Listening on create-personal-chat-success-creater)

    })
    
  }

})

// Fetching the personal msg list to display in the list column ✅

Socket.on("personal-chat-list", (data) => {
  //  Fetching the list with which user has the one-to-one chat

  var PersonalChatList = data.PersonalChatList;

  // Setting Up inner html for the personal-chat-list dic

  var x = "";
  for (let i = 0; i < PersonalChatList.length; i++) {
    let unreadSpan =
      PersonalChatList[i].Unread !== 0
        ? `<span class="unread-count" id="${PersonalChatList[i]._id}Count">${PersonalChatList[i].Unread}</span>`
        : `<span class="unread-count" id="${PersonalChatList[i]._id}Count"></span>`;
    x += `<li class="c-users__person" id="${PersonalChatList[i]._id}">${PersonalChatList[i].Partner}
   ${unreadSpan}</li>`;
  }
  document.getElementById("personal-chat-list").innerHTML = x;

  // Setting up event listner on each chat to open it on the main chat section

  for (let i = 0; i < PersonalChatList.length; i++) {
    if (PersonalChatList.includes(PersonalChatList[i])) {
      let element = document.getElementById(`${PersonalChatList[i]._id}`);
      element.addEventListener(
        "click",
        chat_opener(
          "Personal",
          `${PersonalChatList[i]._id}`,
          `${PersonalChatList[i].Partner}`
        )
      );
    }
  }
});

// Receving acknowledgment when an new chat is created by this user itself ✅

Socket.on("create-personal-chat-creator", (data) => {

  // displaying chat msgs and msg send area

  // Fetching Personal chat so that consistency is maintained, just not making it visible

  Socket.emit("fetch-personal-chat", { ChatId: data.ChatId, Partner : data.Partner});

  document.getElementById("start-chat-text").style.display = "none"
  document.getElementById("start-chat-btn").style.display = "none"
  document.getElementById("chats").style.display = "flex"
  document.getElementById("msg-area").style.display = "flex"

  
  // Creating a new list in personal list and displaying it to the top

  const new_chat = `<li class="c-users__person" id="${data.ChatId}">${data.Partner}
  <span class="unread-count" id="${data.ChatId}Count"></span></li>`

  document.getElementById("personal-chat-list").insertAdjacentHTML("afterbegin", new_chat);

  // Setting this chat as active

  activeId = data.ChatId
  activeType = "Personal"

  // Adding event listner on it to open it again

  document.getElementById(data.ChatId).addEventListener('click',chat_opener(activeType,activeId,data.Partner))

  // Displaying chat list again and hiding the search list

  document.getElementById("chat-list").style.display = "block";
  document.getElementById("search-user").style.display = "none";
});

// Recieving acknowledgment when a new chat is created by any other user

Socket.on("create-personal-chat-partner",(data)=>{

   // Creating a new list in personal list and displaying it to the top(as this chat is the latest)

   const new_chat = `<li class="c-users__person" id="${data.ChatId}">${data.Partner}
   <span class="unread-count" id="${data.ChatId}Count"></span></li>`
 
   document.getElementById("personal-chat-list").insertAdjacentHTML("afterbegin", new_chat);

  //  Adding event listner for it to open the chat

   document.getElementById(data.ChatId).addEventListener('click',chat_opener("Personal",data.ChatId,data.Partner))

  //  Not marking chat as active or doing any other stuff because this chat is not created by the user, just upadting the chat list

})

  
// Receing personal messages from server whwn user is active ✅

Socket.on("receive-personal-message", (data) => {
  // When a personal Msg is Received
  const ChatId = data.ChatId;

  // Taking the chat in the top of the list

  const ChatToMove = document.getElementById(ChatId);
  const ChatList = document.getElementById("personal-chat-list");

  ChatList.removeChild(ChatToMove);
  ChatList.insertBefore(ChatToMove, ChatList.firstChild);

  // Two cases are possible , if that chat is open or any other chat is opend

  if (ChatId == activeId) {
    //  Displaying chat in real time and also sending server about user reading it

    const new_msg = `
     <div class="c-chat__msg">
    <span class="c-chat__icon"></span>
    <div class="c-chat__text">
      <span>${data.Sender}</span><time>${get_time()}</time>
      <p>
        ${data.Content}
       </p>
      </div>
     </div>
     `;

    document.getElementById("chats").insertAdjacentHTML("afterbegin", new_msg);

    //  Also notifying server that chat been read by the user

    Socket.emit("read-personal-message", { ChatId });
  } else {
    // Increasing the unread count for that chat in real time
    const UnreadCount = document.getElementById(`${ChatId}Count`).innerHTML;
    if (UnreadCount == "") {
      // If there was no unread count , initialise it with 1
      document.getElementById(`${ChatId}Count`).innerHTML = 1;
    } else {
      //  Updating the unread column by 1

      let NewUnreadCount = Number(UnreadCount);
      NewUnreadCount += 1;
      const NewString = String(NewUnreadCount);
      document.getElementById(`${ChatId}Count`).innerHTML = NewString;
    }
  }
});

// Receiving acknowledgment when any of my sent messaged becomed read, when user is active ✅

Socket.on("read-personal-msg-ack", (data) => {
  // Accessing things sent like chatId and sender Id(Who read the message)
  console.log("Acknowledgment received", data);
});

// Fetching personal chat ✅

Socket.on("personal-chat", (data) => {
  // Displaying personal chat data

  const chatWindow = document.getElementById("chats");
  // const loaderElements = chatWindow.querySelectorAll(".load-3");

  // loaderElements.forEach((loaderElement) => {
  //   chatWindow.removeChild(loaderElement);
  // });

  // Displaying data on the right side(chat info and members section)

  document.getElementById(
    "chat-title-info"
  ).innerHTML = `<i class="fas fa-hashtag" ></i>Chat Info`;

  document.getElementById(
    "member-list"
  ).innerHTML = `<li class='c-users__person'>${data.User}</li><li class='c-users__person'>${data.Partner}</li>`;

  // Updating top section details

  document.getElementById(
    "chat-name"
  ).innerHTML = `<i class="fas fa-hashtag"></i>${data.Partner}`;
  document.getElementById("chat-details").innerHTML = "Private Chat";

  // Fetching messages and updating messages section

  const messages = data.Messages;

  var x = "";
  for (let i = 0; i < messages.length; i++) {
    const utcDate = new Date(messages[i].Timestamp);
    const TimeString = utcDate.toLocaleString("en-IN", istOptions);
    x += `
    <div class="c-chat__msg">
    <span class="c-chat__icon"></span>
    <div class="c-chat__text">
      <span>${
        messages[i].Sender == data.UserId ? data.User : data.Partner
      }</span><time>${TimeString}</time>
      <p>
        ${messages[i].Content}
      </p>
    </div>
  </div>
    `;
  }

  document.getElementById("chats").innerHTML = x;
});

// Personal messages listening ends here

// Self Chat Listening ✅

Socket.on("self-chat", (data) => {
  // Removing the loader if there was any

  const chatWindow = document.getElementById("chats");
  // const loaderElements = chatWindow.querySelectorAll(".load-3");

  // loaderElements.forEach((loaderElement) => {
  //   chatWindow.removeChild(loaderElement);
  // });

  document.getElementById(
    "chat-title-info"
  ).innerHTML = `<i class="fas fa-hashtag" ></i>Self Chat`;

  document.getElementById(
    "member-list"
  ).innerHTML = `<li class='c-users__person'>${data.Name}</li>`;

  // Fetch Messages over here
  document.getElementById(
    "chat-name"
  ).innerHTML = `<i class="fas fa-hashtag"></i>You`;
  document.getElementById("chat-details").innerHTML = "Self";

  const messages = data.Messages;

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

  document.getElementById("chats").innerHTML = x;
});

// Group Chat Listening

// Fetching Grp Chat List the user is involved in and displaying ✅

Socket.on("group-chat-list", (data) => {
  const GrpChatList = data.GroupChatList;

  var x = "";
  for (let i = 0; i < GrpChatList.length; i++) {
    let unreadSpan =
      GrpChatList[i].Unread !== 0
        ? `<span class="unread-count"  id="${GrpChatList[i]._id}Count">${GrpChatList[i].Unread}</span>`
        : `<span class="unread-count" id="${GrpChatList[i]._id}Count"></span>`;
    x += `<li class="c-users__person" id="${GrpChatList[i]._id}">${GrpChatList[i].Name}${unreadSpan}</li>`;
  }
  document.getElementById("group-chat-list").innerHTML = x;
  for (let i = 0; i < GrpChatList.length; i++) {
    if (GrpChatList.includes(GrpChatList[i])) {
      let element = document.getElementById(`${GrpChatList[i]._id}`);
      element.addEventListener(
        "click",
        chat_opener("Group", `${GrpChatList[i]._id}`)
      );
    }
  }
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

  // When a Group Msg is Received
  const ChatId = data.ChatId;

  // Taking the chat in the top of the list

  const ChatToMove = document.getElementById(ChatId);
  const ChatList = document.getElementById("group-chat-list");
  console.log(ChatToMove,ChatList)
  ChatList.removeChild(ChatToMove);
  ChatList.insertBefore(ChatToMove, ChatList.firstChild);

  // Two cases are possible , if that chat is open or any other chat is opend

  if (ChatId == activeId) {
    //  Displaying chat in real time and also sending server about user reading it

    const new_msg = `
      <div class="c-chat__msg">
     <span class="c-chat__icon"></span>
     <div class="c-chat__text">
       <span>${data.Sender}</span><time>${get_time()}</time>
       <p>
         ${data.Content}
        </p>
       </div>
      </div>
      `;

    document.getElementById("chats").insertAdjacentHTML("afterbegin", new_msg);

    //  Also notifying server that chat been read by the user

    Socket.emit("read-group-message", { GroupId: ChatId });
  } else {
    // Increasing the unread count for that chat in real time
    const UnreadCount = document.getElementById(`${ChatId}Count`).innerHTML;
    if (UnreadCount == "") {
      // If there was no unread count , initialise it with 1
      document.getElementById(`${ChatId}Count`).innerHTML = 1;
    } else {
      //  Updating the unread column by 1

      let NewUnreadCount = Number(UnreadCount);
      NewUnreadCount += 1;
      const NewString = String(NewUnreadCount);
      document.getElementById(`${ChatId}Count`).innerHTML = NewString;
    }
  }
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

// Function to fetch group chat

Socket.on("group-chat", (data) => {
  // Displaying Group chat data

  // Changing Things on right side (in chat info)

  document.getElementById(
    "chat-title-info"
  ).innerHTML = `<i class="fas fa-hashtag" ></i> Group Info`;

  document.getElementById("member-list").innerHTML = "";

  for (let i = 0; i < data.Participants.length; i++) {
    document.getElementById(
      "member-list"
    ).innerHTML += `<li class='c-users__person'>${data.Participants[i]}</li>`;
  }

  const chatWindow = document.getElementById("chats");
  // const loaderElements = chatWindow.querySelectorAll(".load-3");

  // loaderElements.forEach((loaderElement) => {
  //   chatWindow.removeChild(loaderElement);
  // });

  // Fetch Messages over here
  document.getElementById(
    "chat-name"
  ).innerHTML = `<i class="fas fa-hashtag"></i>${data.Name}`;
  document.getElementById("chat-details").innerHTML = "Group Chat";

  const messages = data.Messages;

  var x = "";
  for (let i = 0; i < messages.length; i++) {
    const utcDate = new Date(messages[i].Timestamp);
    const TimeString = utcDate.toLocaleString("en-IN", istOptions);
    x += `
    <div class="c-chat__msg">
    <span class="c-chat__icon"></span>
    <div class="c-chat__text">
      <span>${messages[i].Sender}</span><time>${TimeString}</time>
      <p>
        ${messages[i].Content}
      </p>
    </div>
  </div>
    `;
  }

  document.getElementById("chats").innerHTML = x;
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

document.getElementById("search-query").addEventListener("input", () => {
  Socket.emit("search-user", { Name : document.getElementById("search-query").value});
});

// Event Listener for when users sends a message

document.getElementById("send").addEventListener("click", () => {
  const x = document.getElementById("xx").value;
  send_msg(activeType, activeId, x);
});
