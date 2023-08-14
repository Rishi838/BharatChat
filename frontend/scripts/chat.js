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

// To create a notification
function createNotification(message, type, time) {
  const notification = document.createElement("div");
  notification.classList.add(type);
  notification.textContent = message;

  document.getElementById("notificationContainer").appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, time);
}

// These are the variables to find that which chat is active and what is his type

var activeId;
var activeType = "Self";
var UserName;
var UserId;
var searchId;
var Members = []; // This is to know which members to add in grp
var sound = document.getElementById("new-msg-sound");
var chat = document.getElementById("chat-sound");
var send = document.getElementById("send-sound");
const attachButton = document.getElementById('attachButton');
const fileInput = document.getElementById('fileInput');
const preview = document.getElementById('preview');
const previewImage = document.getElementById('previewImage');
const cancelPreview = document.getElementById('cancelPreview');
const sendBtn = document.getElementById("send-file")


// Event Listner when a user profile is clicked after searching

function search_user(id) {
  return () => {
    searchId = id;
    Socket.emit("check-chat", { Receiver: id });
  };
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
  send.play()
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

// Event listner when user tries to add user to group by searching it

function add_user(id, name) {
  return () => {
    const index = Members.indexOf(id);
    if (index !== -1) {
      return;
    }

    Members.push(id);

    // Creating a new user element
    const userElement = document.createElement("span");
    userElement.className = "user";
    userElement.id = `added${id}`;
    userElement.textContent = name;

    // Creating a cross icon for removal
    const crossIcon = document.createElement("i");
    crossIcon.className = "fa-regular fa-circle-xmark cross";
    crossIcon.id = `remove${id}`;

    // Adding the cross icon to the user element
    userElement.appendChild(crossIcon);

    // Adding the user element to the display list
    document.getElementById("added-user-list").appendChild(userElement);

    // Adding an event listener to the cross icon for removal
    crossIcon.addEventListener("click", remove_user(id, index));
  };
}

// Event listener to handle removing of user from added  list

function remove_user(id, index) {
  return () => {
    Members.splice(index, 1);
    const userElement = document.getElementById(`added${id}`);
    userElement.parentNode.removeChild(userElement);
  };
}

// Event Listener to make someone admin

function make_admin(id) {
  return () => {
    Socket.emit("change-admin", { GroupId: activeId, Member: id });
  };
}

// Event Listener to kickout someone of group

function remove_member(id) {
  return () => {
    Socket.emit("kickout", {
      GroupId: activeId,
      Member: id,
    });
  };
}

const Socket = io("https://expresschat-v6mg.onrender.com")

// Suppose that connection was not made due to non authentication

Socket.on("auth-failure", (data) => {
  console.log("Authentication failed:", data.reason);
  // Redirect the user to the authentication page
  window.location.href = "/auth";
});

// Helper functions by which we send requests to the server

// Helper function  add  a new member to the grp(only by admin)✅

function add_member(GroupId, Member) {
  Socket.emit("add-member", { GroupId, Member });
}

// Functions through which we listen to response from the server

// Function to display self chat on web page load and setting active id as the self chatId✅

Socket.on("user-id", (data) => {
  //  Setting self chat as the active chat and setting username

  activeId = data.userId;
  UserId = activeId;
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

// Searched user functionality ✅

Socket.on("searched-user", (data) => {
  // we'll receive the searched user details

  // Updating the search-user-list

  document.getElementById("search-user-list").innerHTML = "";

  const user_list = data.Users;

  for (let i = 0; i < user_list.length; i++) {
    if (user_list[i]._id != UserId) {
      document.getElementById("search-user-list").innerHTML += `
    <li class="c-users__person" id="search${user_list[i]._id}">${user_list[i].Name}</li>
    `;
    }
  }
  // Add Event listener for each user

  for (let i = 0; i < user_list.length; i++) {
    if (user_list[i]._id != UserId && user_list.includes(user_list[i])) {
      let element = document.getElementById(`search${user_list[i]._id}`);
      element.addEventListener("click", search_user(user_list[i]._id));
    }
  }
});

// Receving access token and  then sending it to update cookies api to update the cookies✅

Socket.on("access-token", async (data) => {
  await postData("/update-access-token", { acessToken: data.accessToken });
});

// Personal Messages listening

// Listening to create chat button

Socket.on("create-chat-result", (data) => {
  // Handling two cases Like when chat exists or when it does not exists

  if (data.Exists == 1) {
    // case when chat exits

    activeId = data.ChatId;
    activeType = "Personal";

    // Telling Backend To open the chat

    Socket.emit("fetch-personal-chat", {
      ChatId: data.ChatId,
      Partner: data.Partner,
    });

    // Displaying msgs part and hiding create part
    document.getElementById("start-chat-text").style.display = "none";
    document.getElementById("start-chat-btn").style.display = "none";
    document.getElementById("chats").style.display = "flex";
    document.getElementById("msg-area").style.display = "flex";
  } else {
    // Displaying new part for creating a chat
    document.getElementById("chats").style.display = "none";
    document.getElementById("msg-area").style.display = "none";
    document.getElementById("start-chat-text").style.display = "block";
    document.getElementById("start-chat-btn").style.display = "block";

    // Displaying name of Partner on top of chat info

    document.getElementById(
      "chat-name"
    ).innerHTML = `<i class="fas fa-hashtag"></i>${data.Partner}`;

    // Adding an event Listner is user clicks on this button

    document.getElementById("start-chat-btn").addEventListener("click", () => {
      // Creating the chat by sending it to the server'

      Socket.emit("create-personal-chat", {
        Receiver: searchId,
        Partner: data.Partner,
        UserName,
      });

      // Displaying the chat section and send msg button( other works like setting that chat as active) and moving it to the top of personal chat and making chat list as visible will be done by socket Listening on create-personal-chat-success-creater)
    });
  }
});

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

  Socket.emit("fetch-personal-chat", {
    ChatId: data.ChatId,
    Partner: data.Partner,
  });
  sound.play();

  document.getElementById("start-chat-text").style.display = "none";
  document.getElementById("start-chat-btn").style.display = "none";
  document.getElementById("chats").style.display = "flex";
  document.getElementById("msg-area").style.display = "flex";

  // Creating a new list in personal list and displaying it to the top

  const new_chat = `<li class="c-users__person" id="${data.ChatId}">${data.Partner}
  <span class="unread-count" id="${data.ChatId}Count"></span></li>`;

  document
    .getElementById("personal-chat-list")
    .insertAdjacentHTML("afterbegin", new_chat);

  // Setting this chat as active

  activeId = data.ChatId;
  activeType = "Personal";

  // Adding event listner on it to open it again

  document
    .getElementById(data.ChatId)
    .addEventListener("click", chat_opener(activeType, activeId, data.Partner));

  // Displaying chat list again and hiding the search list

  document.getElementById("chat-list").style.display = "block";
  document.getElementById("search-user").style.display = "none";
});

// Recieving acknowledgment when a new chat is created by any other user

Socket.on("create-personal-chat-partner", (data) => {
  // Creating a new list in personal list and displaying it to the top(as this chat is the latest)

  const new_chat = `<li class="c-users__person" id="${data.ChatId}">${data.Partner}
   <span class="unread-count" id="${data.ChatId}Count"></span></li>`;
  sound.play();
  document
    .getElementById("personal-chat-list")
    .insertAdjacentHTML("afterbegin", new_chat);

  //  Adding event listner for it to open the chat

  document
    .getElementById(data.ChatId)
    .addEventListener(
      "click",
      chat_opener("Personal", data.ChatId, data.Partner)
    );

  //  Not marking chat as active or doing any other stuff because this chat is not created by the user, just upadting the chat list
});

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
    // chat.play()
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
    sound.play();
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

  document.getElementById("info").innerHTML =
    "Yeh baatein hi to baad me yaad aayengi";

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
  document.getElementById("info").innerHTML = "You are better than Everyone";

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

// Acknowlegment of new group chat being created by the user himself✅

Socket.on("create-group-chat-creator", (data) => {
  //  Clearing out the Messages array (we can also disable the button)
  Messages = [];
  sound.play();
  // Setting activeId and Type
  activeId = data.GroupId;
  activeType = "Group";

  // Fetching the group chat associated with that chatId(fetchinf to avoid disperancy)
  Socket.emit("fetch-group-chat", { GroupId: data.GroupId });

  // Displaying list on the top of group list

  const new_chat = `<li class="c-users__person" id="${data.GroupId}">${data.Name}<span class="unread-count" id="${data.GroupId}Count"></span></li>`;

  document
    .getElementById("group-chat-list")
    .insertAdjacentHTML("afterbegin", new_chat);

  // Hiding the create screen and displaying chat list
  document.getElementById("first").style.display = "block";
  document.getElementById("create-grp").style.display = "none";

  // Adding event listner on the newly created group to open it after that in real time
  document
    .getElementById(data.GroupId)
    .addEventListener("click", chat_opener(activeType, activeId));
});

// Acknowlegment of new group chat being created by another user

Socket.on("create-group-chat-receiver", (data) => {
  //  Displaying new chat in the top of grp chat list
  sound.play();
  const new_chat = `<li class="c-users__person" id="${data.GroupId}">${data.Name}<span class="unread-count" id="${data.GroupId}Count"></span></li>`;

  document
    .getElementById("group-chat-list")
    .insertAdjacentHTML("afterbegin", new_chat);

  // Adding EVent Listner on it (to open it)

  document
    .getElementById(data.GroupId)
    .addEventListener("click", chat_opener("Group", data.GroupId));
});

// Receiving new message in the group  ✅

Socket.on("receive-group-message", (data) => {
  // Perform Valid Changes in frontend

  // When a Group Msg is Received
  const ChatId = data.ChatId;

  // Taking the chat in the top of the list

  const ChatToMove = document.getElementById(ChatId);
  const ChatList = document.getElementById("group-chat-list");
  console.log(ChatToMove, ChatList);
  ChatList.removeChild(ChatToMove);
  ChatList.insertBefore(ChatToMove, ChatList.firstChild);

  // Two cases are possible , if that chat is open or any other chat is opend

  if (ChatId == activeId) {
    //  Displaying chat in real time and also sending server about user reading it
   chat.play()
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
    sound.play();
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

// Receiving ack when grp chat deletion succeed(is deleted by user)

Socket.on("delete-group-chat-creator", (data) => {
  //  Removing group chat from that chat list and opening the self chat and marking this chat as active

  document
    .getElementById("group-chat-list")
    .removeChild(document.getElementById(data.GroupId));

  // Opening self chat

  activeId = UserId;
  activeType = "Self";

  Socket.emit("fetch-self-chat", {});

  //Display Popup Notification that group has been left successfully

  createNotification(
    "Group Deleted Successfully",
    "success_notification",
    1000
  );
});

// Receving acknowledgment if user fails to leave the grp(when he is the admin of the grp)✅

Socket.on("group-left-fail", (data) => {
  // Telling user that he need to make a new admin before leaving the group
  createNotification(
    "Make New Admin before Leaving",
    "alert_notification",
    1000
  );
});

// Receving acknowledgment if user fails to leave the grp(when he is the admin of the grp)✅

Socket.on("group-left-success", (data) => {
  //  Removing group chat from that chat list and opening the self chat and marking this chat as active

  document
    .getElementById("group-chat-list")
    .removeChild(document.getElementById(data.GroupId));

  // Opening self chat

  activeId = UserId;
  activeType = "Self";

  Socket.emit("fetch-self-chat", {});

  //Display Popup Notification that group has been left successfully

  createNotification("Group Left Successfully", "success_notification", 1000);
});

// Receving ack when someone in the grp left the chat ✅

Socket.on("user-left-grp", (data) => {
  // Do things only if the user is in that chat,else dont do anything
  if (activeId == data.GroupId) {
    createNotification(
      "Somebody Just Left The Group",
      "success_notification",
      2000
    );
    Socket.emit("fetch-group-chat", { GroupId: data.GroupId });
  }
});

// Receving ack when admin change succeeds(user himself)

Socket.on("change-admin-success-creator", (data) => {
  //  Displaying a notification indicating that user change is succesfull
  createNotification(
    "Admin Changed Successfully",
    "success_notification",
    2000
  );

  // Again Fetching the group chat

  Socket.emit("fetch-group-chat", { GroupId: data.GroupId });
});

// Recing ack when admin change(other person)

Socket.on("change-admin-success-receiver", (data) => {
  // Performing operations only if that chat was active
  if (activeId == data.GroupId) {
    createNotification(
      "Admin of this group was changed",
      "success_notification",
      2000
    );
    Socket.emit("fetch-group-chat", { GroupId: data.GroupId });
  }
});

// Function to handle when admin kickouts a user
Socket.on("kickout-successful", (data) => {
  // Displaying notification regarding a member being KicedOut

  createNotification(
    "User Kicked out Successfully",
    "success_notification",
    1000
  );
  Socket.emit("fetch-group-chat", { GroupId: data.GroupId });
});

// Function to handle when this user was kicked from a group

Socket.on("kicked-out", (data) => {
  createNotification(
    `You were kicked out of ${data.GroupName}`,
    "success_notification",
    1000
  );

  // Removing from the group chat list
  document
    .getElementById("group-chat-list")
    .removeChild(document.getElementById(data.GroupId));

  // Handling the thing like if that chat was active at that moment
  if (activeId == data.GroupId) {
    activeId = UserId;
    activeType = "Self";

    Socket.emit("fetch-self-chat", {});
  }
});

// Function to handle when someone else was kicked out of the group

Socket.on("someone-kicked-out", (data) => {
  if (activeId == data.GroupId) {
    createNotification(
      `Someone was kicked out of ${data.GroupName}`,
      "success_notification",
      1000
    );
    Socket.emit("fetch-group-chat", { GroupId: data.GroupId });
  }
});

// Function to fetch group chat(most difficult part)

Socket.on("group-chat", (data) => {
  // Changing Things on right side (in chat info)

  document.getElementById(
    "chat-title-info"
  ).innerHTML = `<i class="fas fa-hashtag" ></i> Group Info`;
  document.getElementById("info").innerHTML = data.Description;
  document.getElementById("member-list").innerHTML = "";

  // Handling 2 cases , like when user is admin or when he is the normal user

  if (UserId == data.Admin) {
    // Displaying Member list with a admin in front of admin and and +,-, in front of everyone else

    for (const key in data.Participants) {
      document.getElementById("member-list").innerHTML += `
    <li class='c-users__person'>${data.Participants[key]}${
        key == data.Admin
          ? '<span class="admin">Admin</span>'
          : `<i id="make_admin${key}"class="fa-solid fa-circle-plus plus" style="color: #EA4C89" title="admin"></i><i id = "remove${key}" class="fa-solid fa-circle-minus minus" style="color: rgb(219, 54, 54);"></i>
    `
      }</li>`;
    }

    // Adding Delete Group and Leave grp button

    document.getElementById(
      "member-list"
    ).innerHTML += ` <div style="text-align:right"><button class="fill" id="leave" >Leave </button><button class="fill" id="delete" style="margin-left:15px" >Delete</button></div>`;

    // Adding event listener to leave btn

    document.getElementById("leave").addEventListener("click", () => {
      // Tell the server that user wants to leave the group
      Socket.emit("leave-grp", { GroupId: activeId });
      // Handle its acknowledgmen on the other side of using socket.on
    });

    // Adding event listner to delete the group
    document.getElementById("delete").addEventListener("click", () => {
      Socket.emit("delete-grp", { GroupId: activeId });
    });

    // Adding event listener to the add + & - button

    for (const key in data.Participants) {
      if (key in data.Participants && key != data.Admin) {
        let element1 = document.getElementById(`make_admin${key}`);
        element1.addEventListener("click", make_admin(key));
        let element2 = document.getElementById(`remove${key}`);
        element2.addEventListener("click", remove_member(key));
      }
    }
  } else {
    // Displaying List with admin people only

    for (const key in data.Participants) {
      document.getElementById("member-list").innerHTML += `
      <li class='c-users__person'>${data.Participants[key]}${
        key == data.Admin ? '<span class="admin">Admin</span>' : ``
      }</li>`;
    }

    // Adding only leave button as normal user cannot delete the grp

    document.getElementById(
      "member-list"
    ).innerHTML += ` <div style="text-align:right"><button class="fill" id="leave" >Leave </button></div>`;

    // Adding event listener to leave btn

    document.getElementById("leave").addEventListener("click", () => {
      // Tell the server that user wants to leave the group
      Socket.emit("leave-grp", { GroupId: activeId });
      // Handle its acknowledgmen on the other side of using socket.on
    });
  }

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

// Function to invoke when user search for participant to add in grp(while creating group)

Socket.on("added-user-match", (data) => {
  // Making a new user list to add

  document.getElementById("add-user-list").innerHTML = "";
  for (let i = 0; i < data.Users.length; i++) {
    if (data.Users[i]._id != UserId) {
      document.getElementById("add-user-list").innerHTML += `
    <li class="c-users__person" id="add${data.Users[i]._id}">${data.Users[i].Name}</li>
    `;
    }
  }

  // Adding event listner to each user Id to add it to the members section

  for (let i = 0; i < data.Users.length; i++) {
    if (data.Users.includes(data.Users[i]) && data.Users[i]._id != UserId) {
      let element = document.getElementById(`add${data.Users[i]._id}`);
      element.addEventListener(
        "click",
        add_user(data.Users[i]._id, data.Users[i].Name)
      );
    }
  }
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
  Socket.emit("search-user", {
    Name: document.getElementById("search-query").value,
    Type: "Search",
  });
});

// Event Listener for when users sends a message

document.getElementById("send").addEventListener("click", () => {
  const x = document.getElementById("xx").value;
  send_msg(activeType, activeId, x);
});

// Event listner when user clicks on the + icon to create new grp chat

document.getElementById("new-group-icon").addEventListener("click", () => {
  //  Clearing out previous field to start a new group creation
  Members = [];
  document.getElementById("grp-name").value = "";
  document.getElementById("grp-desc").value = "";
  document.getElementById("grp-participant-search").value = "";
  document.getElementById("add-user-list").innerHTML = "";
  document.getElementById("added-user-list").innerHTML = "";

  // Hiding the chat info section
  document.getElementById("first").style.display = "none";

  // Displaying the create chat screen
  document.getElementById("create-grp").style.display = "block";
});

// Event Listner when user clicks on grp create

document.getElementById("cancel").addEventListener("click", () => {
  // Displaying the chat info section
  document.getElementById("first").style.display = "block";

  //Hiding the create chat screen
  document.getElementById("create-grp").style.display = "none";
});

// Event Listner when user cancels the creation of group

document.getElementById("create").addEventListener("click", () => {
  // Checking whether all fields are provided or not

  const Name = document.getElementById("grp-name").value;
  const Description = document.getElementById("grp-desc").value;

  if (Name == "") {
    document.getElementById("grp-error").innerHTML = "Provide a Valid Name";
    return;
  }
  if (Description == "") {
    document.getElementById("grp-error").innerHTML =
      "Provide a Valid Description";
    return;
  }
  if (Members.length < 2) {
    document.getElementById("grp-error").innerHTML = "Select Atleast 2 Members";
    return;
  }
  document.getElementById("grp-error").innerHTML = "";

  // Asking the server to creata new group chat

  Socket.emit("create-group-chat", {
    Name,
    Description,
    Participants: Members,
  });
});

// Event listener when user search for participants to add

document
  .getElementById("grp-participant-search")
  .addEventListener("input", () => {
    //  Asking the server to search for user (autocomplete)and rest things will be handeled by the socket.on function of this emit

    Socket.emit("search-user", {
      Name: document.getElementById("grp-participant-search").value,
      Type: "Add",
    });
  });

// Allow user to select file when he clicks on the attachement btn
attachButton.addEventListener("click",()=>{
  fileInput.click();
})

// Display files when a new file is selected

fileInput.addEventListener('change',()=>{
  const selectedFile = fileInput.files[0];

  // Preview the file
  preview.style.display = 'block';
  previewImage.src = URL.createObjectURL(selectedFile);

//  Display the preview screen and hide the chat section

  document.getElementById("preview").style.display = "flex"
  document.getElementById("chat-section").style.display ="none"
})

// Event listener to handle thing when user clicks on cancel
cancelPreview.addEventListener('click', () => {
  // Hide the preview and reset the input
  preview.style.display = 'none';
// Change the screens
document.getElementById("preview").style.display = "none"
document.getElementById("chat-section").style.display ="block"
  previewImage.src = '';
  fileInput.value = null;
});

// Event Listener to handle sending thing to server side
sendBtn.addEventListener('click',()=>{
  const selectedFile = fileInput.files[0];

  // Create form data object to send it to the server

  const formData = new FormData();
  formData.append('image', selectedFile);

  // Emit Image to the server

  Socket.emit('send-image', formData);

  // Stop displaying the image

  document.getElementById("preview").style.display = "none"
  document.getElementById("chat-section").style.display ="block"

  // Remove the file

  fileInput.value = null;
})


// Displaying emoji button