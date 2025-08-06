
const profileHeadName = name => {
  return name.split(" ").slice(0, 2).map(n => n.charAt(0)).join(" ")
}

function profileHeadComp(chat){
  const {groupName, groupPic, online, type = "group"} = chat;
  
  const head = createEle("div", {
    "class": `profileHead profileHead-${chat._id}`
  })
  
  head.innerHTML = `<img style="display='none'> loading="lazy" class="display"></img>
   ${online ? `<div class="isOnline"></div>` : ""}
  `
  
  head.updateImage = (url, altText = "🚫") => {
    const img = head.querySelector(".display");
    img.onload = () => {
    open(img)
  }
    
   
    img.onerror = () => {
       img.src = `./images/${type == 'private' ? "person" : "group"}Dp.png`
    }
   
    img.src = url;
    img.altText = altText
  }
 
   head.updateImage(`${API_BASE_URL}/${groupPic?.url}`, type)
       
  return head
}



const maxContent = 25

const shortenText = (content,maxLength = maxContent) => {
  return content.length < maxLength ? content : content.slice(0, maxLength) + "..."
}


/* component start */ 

/* peoples header */
function peoplesHeadComp(chatData){
  const {groupName, _id, peoples, type, groupDescription, createdAt} = chatData
  
  const head = createEle("head",{
    "class": "head"
  })
  
  head.innerHTML = `
        <div class="profileHead"></div>
        <div class="name chatName-${_id}"></div>
        <div class="peoplesCount gray">Group have <span class="chatPeoplesCount-${_id}">${peoples.length}</span> members</div>
        <div class="detail">
          <div class="description chatDescription-${_id}">
          </div>
          <div class="time gray">
            Created On ${formatTime(createdAt)}
          </div>
          <div class="privacy gray">
          this is <span class="chatType-${_id}">${chatData.for}</span> Group
          <br>
          ${chatData.for == "private" ?
            "only peoples with this group id can join the chat and message" : 
            (chatData.for == "public" ? 
              "anyone can search and join this chat to message"
              : "everybody using this application is added to this chat and can see all messages sent anytime, this chat is owned by the ceo"
            )
          }
          </div>
          <div class="chatId">
           Group _Id: ${_id}
           <br><br><br>
           <button class="copy clickable">Copy Id</button>
           <br><br><hr>
          </div>
        </div>
  `
  
  
  const CopyBtn = head.querySelector(".copy");
  CopyBtn.onclick = () => {
    copy(_id,copied => alert(copied ? "group Id Copied" : "Fail To Copy group Id", copied))
  }
  
  
  head.changeProfileHead = chat => {
    head.querySelector(".profileHead").replaceWith(profileHeadComp(chat));
    head.querySelector(".name").textContent = chat.groupName
  }
  
  head.changeDescription = description => {
    setContent(head, `Description: ${description}`, ".detail .description")
  }
  
  head.changeProfileHead(chatData);
  head.changeDescription(groupDescription)


  return head
  
}

/* person componenr */
function personComp(personData, chat){
  let {_id, bio, online, name} = personData
  name = _id == userId ? "you" : name;
  const {createdBy} = chat
  
  const user = createEle("div",{
    "class": "person",
    id: _id
  })
  
  
  user.innerHTML = `
      <div class="profileHead"></div>
         <div class="info">
          <div class="head">
            <div class="name"></div>
            <div class="role gray">${_id == chat.createdBy ? "Admin" : "Member"}</div>
            ${
              createdBy == userId && _id !== userId ?
              (
                chat.blockedPeoples.includes(_id) ?
                "<button class='clickable unblock'>unblock</button>"
                : "<button class='block clickable'>block</button>"
              ) : ""
            }
          </div>
          <div class="body">
            <div class="bio gray"></div>
          </div>
        </div>
  `
  
  if(name !== "you" && createdBy == userId){
    const blockBtn = user.querySelector(".block");
    const unblockBtn = user.querySelector(".unblock");
    
    if(blockBtn) blockBtn.onclick = () => {
      blockPerson(name, _id, chat._id)
    }
    
    if(unblockBtn) unblockBtn.onclick = () => {
      unblockPerson(name, _id, chat._id)
    }
  }
  
    
  user.updateProfileHead = personData => {
  user.querySelector(".profileHead").replaceWith(
    profileHeadComp({
      groupPic: personData.profilePic,
      groupName: personData.name,
      type: 'private'
    }))
  }
  
  user.updateName = (name) => {
    setContent(user, shortenText(name), ".head .name");
  }
  
  user.updateBio = (bio) => {
    setContent(user, shortenText(bio), ".body .bio")
  }
  
  user.update = (info) => {
    user.updateProfileHead(info);
    user.updateName(info.name)
    user.updateBio(info.bio)
  }
  
  
  user.update(personData)
 
  return user
}





const getOnlineStatus = (onlinePeople) => {
  if (onlinePeople.length === 1 && onlinePeople[0].toLowerCase() === "you") {
    return "Chat peoples are offline";
  } else if (onlinePeople.length === 1) {
    return onlinePeople[0] + " is online";
  } else if (onlinePeople.length === 2) {
    return onlinePeople.join(" and ") + " are online";
  } else if (onlinePeople.length === 3) {
    return onlinePeople.slice(0, -1).join(", ") + ", and " + onlinePeople.at(-1) + " are online";
  } else {
    return onlinePeople.slice(0, 3).join(", ") + ` and ${onlinePeople.length - 3} others are online`;
  }
};

/* handlers for copy edit delete block message */ 
const chatHeadActionHandlers = {
  copy: (messages, chatWindow) => {
    const box = chatWindow.messagesBox
     messages = messages.sort((a, b) => a.createdAt - b.createdAt);
      const copiedText = messages.map(m => {
        const { content, type, createdAt, from } = m;
        return type == "message"
          ? `[${formatTime(createdAt)}] ${shortenText(from.name, 15)}\n>> ${content}`
          : `[${formatTime(createdAt)}] ${shortenText(from.name, 15)}\nreplied to: "${shortenText(m.repliedTo.content, 20)}"\n>> ${content}`;
      }).join("\n\n");

      copy(copiedText, copied => {
        alert(copied ? "Message copied" : "Error copying message", copied);
      });

      box.exitSelectionMode();
  },
  edit: (messages, chatWindow) => {
    const {messageInput, messagesBox} = chatWindow;
    const {from, content, _id} = messages[0];
    messageInput.openReplyBox(`Editing • Message`, content, () => {
      messagesBox.scrollTo(_id, true)
    });
    messageInput.changeInput(content, "edit", messages[0])
    messagesBox.exitSelectionMode();
  },
  block: (messages, chatWindow) => {
    
  },
  "delete": (messages, chatWindow) => {
    const {messagesBox} = chatWindow;
    
    messagesBox.exitSelectionMode()
    const selectedMessageIds = messages.map(m => {
     messagesBox.replaceMessage({ ...m, action: "deleting" }, true);
     return m._id
    })
    
    
socket.emit("delete messages", selectedMessageIds, chatWindow.chat._id, (deleted, deletedIds) => {
  if (deleted) {
    const chat = getChat(chatWindow.chat._id)
    chat.messages = chat.messages.map(m => {
      if (deletedIds.includes(m._id)) {
          const deleted = { ...m, action: 'deleted', deleted: userId }
          messagesBox.replaceMessage(deleted, true);
          return deleted
       }else{
         return m
       }
    });
    play(SentSound);
    updateChatData(chat)
  } else {
    alert(deletedIds);
  }
});
},
block: (messages, chatWindow) => {
  const [msg] = messages;
  const {from, to} = msg;
  const {messagesBox} = chatWindow;
  messagesBox.exitSelectionMode()
  messagesBox.replaceMessage({...msg, action: 'blocking'}, true)
  blockPerson(from.name, from._id, to, blocked => {
    messagesBox.replaceMessage({...msg, action: blocked ? "blocked" : false})
  });
}
}

function chatHeadComp(chat){
  let {groupName, createdBy, peoples, type, _id, groupDescription, blockedPeoples} = chat;
  const onlinePeoples = chat.peoples.filter(person => person.online).map(person => person._id !== userId ? person.name : "You")
 
  const head = createEle("div", {
    "class": "head"
  })
  
  let person;
  if(type == "private"){
    person = peoples.find(person => person._id !== userId)
    groupDescription = person.bio
  }
  
  head.innerHTML = `
      <div class="profileHead"></div>
        <div class="body">
          <div class="name chatName-${_id}"></div>
          <marquee scrollamount="3" class="users gray"></marquee>
        </div>
        ${
          type !== "private" ?
          '<button class="leave clickable">leave</button>'
          : (
          !blockedPeoples.includes(userId) ?
            blockedPeoples.includes(person._id) ? 
            "<b class='blocked'>You blocked</b>"
            : '<button class="block clickable">block</button>'
          : "<b style='font-size: .7rem; width: 50px; margin-left: 1rem' class='blocked'>You Are Blocked</b>")
        }
      <div class="actionBar">
        <button id="edit" for="one" class="clickable edit">edit</button>
        <button id="copy" for="more one" class="clickable copy">copy</button>
        <button id="delete" for="more one" class="clickable delete">delete</button>
        <button id="block" for="one" class="clickable block">block</button>
      </div>
  `
  
  head.changeHead = chat => {
    head.querySelector(".profileHead").replaceWith(profileHeadComp(chat))
  }
  
  head.changeName = name => {
    setContent(head, name, ".body .name");
  }
  
  head.changeName(type !== "private" ? groupName : person.name);
  head.changeHead(chat)
  
  setContent(head, 
    type !== "private" ? (
      onlinePeoples.length ? 
      getOnlineStatus(onlinePeoples) 
      : groupDescription
    ) : person.online ? groupDescription : `Last Seen: ${formatTime(person.lastSeen)}`
  , "marquee")
  // later add online status display
  
  if(type !== "private"){
  const leaveBtn = head.querySelector('.leave');
  leaveBtn.onclick = () => leaveGroupWithFetch(_id)
}

head.chat = chat;
head.ActionsBar = head.querySelector(".actionBar");

 head.updateActionsBar = () => {
   const {messagesBox} = chatWindows[_id];
   const ActionsBar = head.ActionsBar
   const {createdAt, blockedPeoples} = head.chat;
   
   const {selectedMessages} = messagesBox
   
   if(selectedMessages.length){
     open(ActionsBar);
     const buttonToShow = {
       block: true,
       edit: true,
       "delete": true,
       copy: true
     }
    
     
     selectedMessages.forEach(msg => {
       const {from, _id, type} = msg;
       const isYours = from._id == userId;
       const isAdmin = createdBy == userId;
       
       if(selectedMessages.length == 1){
         buttonToShow.edit = isYours;
         buttonToShow.block = !isYours && isAdmin || type == "private" && !blockedPeoples.includes(userId)
       }else{
         buttonToShow.block = false;
         buttonToShow.edit = false;
       }
      
       buttonToShow["delete"] = isYours || !isYours && isAdmin
     })
     
     ActionsBar.querySelectorAll("*").forEach(btn => {
       const display = buttonToShow[btn.id] ? "block" : "none"
       btn.style.display = display;
     })
     
     head.addActions(ActionsBar, selectedMessages)
   }else{
     close(ActionsBar)
   }
 }
  
  
  // adding copy edit delete block action
  head.addActions = (ActionsBar, selectedMessages) => {
    const chatWindow = chatWindows[_id];
    ActionsBar.querySelectorAll("*").forEach(btn => {
      const type = btn.id;
      btn.onclick = () => {
        chatHeadActionHandlers[type](selectedMessages, chatWindow)
      }
    })
  }
  
  
  return head
}


function peoplesSearch(peoplesEle){
  const ele = createEle("input", {
     "class": "search"
  });
  
  ele.placeholder = "Search Peoples By Id or Name"
  
  let searchValue = "";
  
  const searchPeoples = () => {
    peoplesEle.querySelectorAll("* .person")
    .forEach(person => {
      person.style.display = 
      person.textContent.trim().includes(searchValue)
      || person.id.includes(searchValue) ? "flex" : "none"
    })
  }
  
  onInput(ele, value => {
    searchValue = value.toLowerCase().trim()
    searchPeoples()
  });
  
  return ele
}


function chatSetting(chat, head){
  let updates = {...chat};
  let {groupName, messageAllowed, groupDescription} = chat;
  let groupPic = updates.groupPic || {}
  
  const settingBtn = createEle("button", {
    "class": "settingBtn clickable"
  }, "Chat Settings")
  
  settingBtn.onclick = () => {
    openBar(GroupSettingsBar);
    clear(GroupSettingsBar)
    GroupSettingsBar.innerHTML = `
      <div class="head">
       ${head.innerHTML}
      </div>
      <h2>Settings</h2>
      <div class="card">
       <div class="picker"></div>
        <label >Group Name</label>
        <input for="groupName" class="chatName-${_id} value="" type="text">
        <label>Group Description</label>
        <textarea for="groupDescription" class="chatDescription-${_id}" value=""></textarea>
        <label>Privacy</label>
        <select for="for" class="chatType-${_id}" name="" id="">
          <option value="private">Private ${chatDetail.private}</option>
          <option selected value="public">Public ${chatDetail.public}</option>
        </select>
        <label>Message Allowed</label>
        <select class="messageAllowed-${_id}" for="messageAllowed">
          <option value="true">Yes ( Everybody Can Send Message )</option>
          <option value="false">No ( Only You, Can Send Message )</option>
        </select>
        <button class="save clickable">Save Settings</button>
      </div>
    `
    
    const picker = ProfilePickerComp(`${API_BASE_URL}/${chat.groupPic?.url}`, "group")
    GroupSettingsBar.querySelector(".card").prepend(picker)
    
    
    const CopyBtn = GroupSettingsBar.querySelector(".copy");
    CopyBtn.onclick = () => {
      copy(_id, copied => alert(copied ? "Group Id Copied" : "Fail To Copy Group Id", copied))
    }
    
  
    
    const inputs = GroupSettingsBar.querySelectorAll("[for]");
    
    const updateInputs = (chat) => {
     inputs.forEach(input => {
      const isFor = input.getAttribute("for");
      input.value = chat[isFor];
      
      input.setAttribute("staticVal", chat[isFor])
      
      if(input.tagName.toLowerCase() !== "select"){
        onInput(input, v => {
          updates[isFor] = v
         });
      }else{
        onChange(input, v => {
          updates[isFor] = v
        })
      }
      
    })
    
    picker.updateImage(`${API_BASE_URL}/${chat.groupPic?.url}`, "group");
    }


picker.onchange = (fl) => {
  updates.groupPic = {
    ...updates.groupPic,
    name: fl.name
  }
  groupPic = fl.file
}
    
    updateInputs(chat);

    const [NameInput, DescriptionInput] = GroupSettingsBar.querySelectorAll(".card input");
    const TypeSelect = GroupSettingsBar.querySelector(".card select");
    const SaveBtn = GroupSettingsBar.querySelector(".save")
    
    const validate = (staticData, updates) => {
      // we check only for groupName groupDescription messageAllowed privacy
      const changes = [];
      inputs.forEach(input => changes.push(inputHasChanged(input)));
      changes.push(updates.groupPic !== chat.groupPic)
      return changes.includes(true)
    }
 
    
    SaveBtn.onclick = async () => {
      if(validate(chat, updates)){
        load(true);
        
        const data = new FormData()
        data.append("updates", JSON.stringify(updates))
        data.append("groupPic", groupPic)
        
        const res = await request.post(`/api/chats/setting/update/?chatId=${chat._id}`, data)
        if(!res) return
          const {message, updated} = res;
          alert(message, updated);
          if(updated){
            const updatedChat = {...chat, ...res.chat};
            updatedChat.peoples = chat.peoples;
            addNewMessage({
              ...res.systemMessage,
              from: {
                _id: userId,
                name: userInfo.name
              }
            });
            updateChatData(updatedChat);
            updatePeoples(updatedChat)
          }
      }else{
        alert('No Any Changes Made', false)
      }
    }
  }
  
  
  return settingBtn
}


function peoplesWrapperComp(chatData){
  const wrapper = createEle("div",{
    "class": "wrapper"
  });
  
  const head = peoplesHeadComp(chatData);
  const peoples = createEle("div",{
    "class": "peoples"
  })
  
  chatData.peoples.forEach(pr => {
  if(typeof pr == 'object') peoples.appendChild(personComp(pr, chatData))
  })
  const searchBar = peoplesSearch(peoples)
 
  
  wrapper.appendChild(head);
  wrapper.appendChild(searchBar);
  wrapper.appendChild(peoples)
  
  if(chatData.createdBy == userId){
    // admins can set chat 
    const settingBtn = chatSetting(chatData, head)
    wrapper.appendChild(settingBtn)
  }
  
  wrapper.updatePerson = info => {
    const p = wrapper.querySelector(`[id="${info._id}"]`);
    if(p) p.update(info)
  }
  
  return wrapper
}

/* chatNavigator */

const getNavContent = (chat) => {
  let {_id, type, content, groupName, messages, newMessages, peoples, updateTime} = chat;
  const lastMessage = messages.at(-1);
  
  const draft = draftMessages[_id]
  
  if(lastMessage){
   let {createdAt, type , flag, from, seenBy} = lastMessage;
   const isYours = from._id == userId;
   const seen = isYours || seenBy.includes(userId) || newMessages;
   
   content = getMessageContent(lastMessage, chat)
   
   content = draft && seen ? `Draft Message: ${draft}` : (
   type == "system" ? content : `${isYours ? "You" : shortenText(from.name, 10)}: ${content}`)
  }
  
  return lastMessage ? content : "No Any Chat Found..."
}

function chatNavComp(chat){
  let {_id, type, groupName, messages, newMessages, peoples, updateTime} = chat;
  // if all peoples are online chat will be online 
  let online = peoples.filter(person => person._id !== userId
  ).map(person => person.online) || [];
  
  online = online.length == 0 ? false : !online.includes(false)
  let person = chat.friend
  
  if(type == "private"){
    chat.groupName = person.name
    groupName = chat.groupName
  }
  
  const nav = createEle("div",{
    "class": `chatNav`,
    id: `chatNavs:${_id}`,
  })
  
  nav.innerHTML = `
        <div class='profileHead-${_id}'></div>
        <div class="body">
        <div class="head">
          <div class="name chatName-${_id}"></div>
          <div class="time gray" time=${updateTime}>${updateTime ? formatTime(updateTime) : ""}</div>
        </div>
        <div class="feet">
          <div class="message gray">
          </div>
         <div class="count"></div>
        </div>
        </div>
      `
  
   const navMessage = getNavContent(chat)
   
  // for displaying chats 
   nav.onclick = e => {
     console.time("nav")
     const {messagesBox, chatHead, messageInput, peoplesWrapper} = chatWindows[_id]
     focusedChat = _id;
     
         if(!e.target.className.includes("display")){
           openBar(MessageBar, "block");
         MessageBar.innerHTML = ""
           // onback remove id 
           onBack = () => {
             focusedChat = ""
             return true
           }

          MessageBar.appendChild(chatHead)
           MessageBar.appendChild(messagesBox)
           MessageBar.appendChild(messageInput)
          /*$('.messageBar .messages').replaceWith(messagesBox);
           $('.messageBar .head').replaceWith(chatHead);
           $('.messageBar .messageInput').replaceWith(messageInput)
    */
           
           scroll(messagesBox)
           seeMessage(chat)
         }else if(type !== 'private'){
           openBar(PeoplesBar);
           $('.peoplesBar .wrapper').replaceWith(peoplesWrapper);
        }
        console.timeEnd("nav")
  }
  
  
  
  // addding editors 
  nav.profileHead = nav.querySelector(".profileHead");
  const [name, time] = nav.querySelectorAll(".head *")
  const [message, count] = nav.querySelectorAll(".feet *");
  
  const eleFromBars = selector => {
    const elements = [];
    const chatWindow = chatWindows[_id];
    
    for(bar in chatWindow){
        const eles = chatWindow[bar].querySelectorAll(selector);
        if(eles.length) eles.forEach(e => elements.push(e))
    }
    
    return elements
  }
  
  nav.update = {
   head: function(chat, self = false){
    const selector = `.profileHead-${chat._id}`;
    let heads = !self ? eleFromBars(`*${selector}`) :  [nav.querySelector(selector)]
    heads.forEach(head => {
      head.replaceWith(profileHeadComp(chat))
    }) 
  },
   name: function(name, self = false){
    const names = self ? [nav.querySelector(`.chatName-${_id}`)] : eleFromBars(`*.chatName-${_id}`)
    names.forEach(nm => {
      setContent(nm, name)
    })
  },
  message: function(chat){
    setContent(nav, shortenText(getNavContent(chat), 33), `.feet .message`);
    if(chat.newMessages){
      nav.querySelector(".time").classList.add("new");
      nav.querySelector(".count").style.display = "block";
      setContent(nav, chat.newMessages, ".count");
    }else{
      nav.querySelector(".count").style.display = "none"
    }
  },
  all: function(chat) {
  this.name(chat.groupName, true);
  this.head(chat, true);
  this.message(chat)
  },
  description: function(description) {
    const eles = eleFromBars(`.chatDescription-${_id}`);
    eles.forEach(ele => {
      ele.textContent = description
    })
  },
  type: function(type){
    const eles = eleFromBars(`.chatType-${_id}`);
eles.forEach(ele => {
  ele.textContent = type
})
  },
  peoples: function(peoples){
    const eles = eleFromBars(`.peoplesCount-${_id}`);
    eles.forEach(ele => {
      ele.textContent = peoples.length
    })
  }
  }
  
  
  
  
  nav.update.all(chat)
  
  return nav
}


/* message messages */
let selected = [];
let selectionOpacity = .3
let selectionMode = false;


const getMessageContent = (message, chat) => {
  let { content, category, type, action, createdAt, _id, deleted, from, to, flag } = message;
  if (deleted) {
    content = deleted == userId ? "🚫 You Deleted This Message" : "🚫 This Message Was Deleted";
  }
  
   category = from._id == userId ? "sent" : "received"

  if (type == "system") {
    if (flag === "joined" || flag === "left") {
      content = `${category == "sent" ? "You" : from.name} ${flag} The Chat`;
    } else if (flag === "blocked" || flag === "unblocked") {
      content = category == "sent" ? `You Are ${flag} From This Chat` : `${from.name} Is ${flag} From This Chat`;
    } else if(flag == "setting"){
      const updates = JSON.parse(content);
      const fieldToTell = ["groupName", "groupDescription", "messageAllowed", "for", "groupPic"];
      const info = [];
      const fieldFound = [];
     
      for(const k in updates){
        fieldFound.push(fieldToTell.includes(k))
        if(!fieldToTell.includes(k)) continue
        if(k == "groupName"){
          info.push(`group name to "${updates[k]}"`)
        }else if(k == "groupDescription"){
          info.push(`group description to "${updates[k]}"`)
        }else if(k == "messageAllowed"){
          info.push(updates[k] == true ? `Allow Everyone to Send Messages` : `Only Admin Can Send Messages`)
        }else if(k == "for"){
          info.push(`group privacy to: ${updates[k]}`)
        }else if(k == "groupPic"){
          info.push("group picture")
        }
      }
      
      content = fieldFound.includes(true) ? `${category == "sent" ? "You" : "Group Admin "} Changed Group Settings: ${info.join(", & ")}` : ""
    }
  }

  return content
}


function messageBoxComp(message, chat, loading = false) {
  let { sawed = false, events, person, seenBy, content, type, action, createdAt, _id, deleted, from, to, flag } = message;
  const { createdBy, messages, messageAllowed, blockedPeoples } = chat;
  let chatWindow;
  
  
  // if someone see 
  if(!loading && type !== "system") sawed = seenBy.find(_id => _id !== userId) && from._id == userId
  content = getMessageContent(message, chat)

  const category = from._id == userId ? "sent" : "received";
  const repliedTo = type == "reply" ? message.repliedTo : "";

  const messageComp = createEle("div", {
    class: type !== 'system' ? `message ${category} clickable ${deleted ? "deleted" : ""} ${loading ? "loading" : ""}` : "system",
    id: _id,
  });

  
  messageComp.innerHTML = type !== 'system' ? `
    ${type == "reply" ? `
      <div class="replyBox" id="${repliedTo._id}">
        <div class="name"></div>
        <div class="content gray"></div>
      </div>` : ""}
    ${category == "received" ? `<div class="name nameSelector"></div>` : ""}
    <div class="content messageCompContent"></div>
    <div class="foot">
      ${action ? `<div class="action">${action}</div>` : ""}
      <div time="${createdAt}" class="time gray">${formatTime(createdAt)}</div>
      ${sawed ? '<div class="seen">🦴</div>' : ""}
    </div>
  ` : `<div class="content messageCompContent">${content}</div>`;

  setContent(messageComp, content, ".messageCompContent");

  if (category == "received" && type !== "system") {
    setContent(messageComp, from.name, ".nameSelector");
  }

  messageComp.style.display = content ? "flex" : "none"
  return  messageComp
}

/* message box */
const MAX_MESSAGE_RENDER = 20
function messagesBoxComp(messagesData, chat){
  const box = createEle("div", {
    "class": "messages"
  })
  
  const chatWindow = chatWindows[chat._id];
  
  box.selectedMessages = [];
  box.selectionMode = false;
  
  const selectedMessageOpacity = .5;
  
  box.exitSelectionMode = () => {
    box.selectedMessages.forEach(msg => {
      box.getMessage(msg._id).style.opacity = 1
    });
    box.selectedMessages = [];
    box.selectionMode = false;
    box.getWindow().chatHead.updateActionsBar();
    setTimeout(() => onBack = false, 50)
  }
  
  box.getWindow = () => chatWindows[chat._id]
  
  box.deselectMessage = (_id) => {
    box.selectedMessages = box.selectedMessages.filter(msg => msg._id !== _id);
    box.getMessage(_id).style.opacity = 1
    if(box.selectedMessages.length == 0){
       box.exitSelectionMode();
    }else{
      box.getWindow().chatHead.updateActionsBar()
    }
  }
  
  box.selectMessage = (msg) => {
    box.selectedMessages.push(msg);
    box.getMessage(msg._id).style.opacity = selectedMessageOpacity
    if(box.selectedMessages.length == 1) box.selectionMode = true;
    box.getWindow().chatHead.updateActionsBar();
    onBack = () => {
      box.exitSelectionMode()
      return false
    }
  }
  
  box.isMessageSelected = (_id) => {
    return box.selectedMessages.find(msg => msg._id == _id)
  }
  
  
  box.addMessageEvent = (message, comp) => {
    const {_id} = message;
    
    let handlers = {
      onclick: () => {
        if(box.selectionMode){
          if(!box.isMessageSelected(_id)){
            box.selectMessage(message)
          }else{
            box.deselectMessage(_id)
          }
        }
      }
    }
    
    comp.onclick = () => {
      handlers.onclick()
    }
    onLongPress(comp, () => {
      if(!selectionMode) box.selectMessage(message);
    }, event => handlers = {...handlers, ...event})
    comp.events = handlers
  }
  
  
  let messageIndex = messagesData.length-1
  const renderMessages = async (s) => {
  if (messageIndex === -1) return;

  // Save the previous scroll height and scrollTop
  const prevScrollHeight = box.scrollHeight;
  const prevScrollTop = box.scrollTop;

  let renderedMessages = 0;
  while (renderedMessages < MAX_MESSAGE_RENDER) {
    if (messageIndex === -1) break;
    const message = messagesData[messageIndex];
    const messageComp = messageBoxComp(message, chat);
    box.addMessageEvent(message, messageComp);
    box.prepend(messageComp);
    messageIndex--;
    renderedMessages++;
  }

  // Restore scroll to keep the user at same visual spot
  const newScrollHeight = box.scrollHeight;
  box.scrollTop = newScrollHeight - (prevScrollHeight - prevScrollTop);

  s?.check?.();
};

if(messagesData.length){
  renderMessages();
 new OnScrollEnd(box, "top", true, self => {
   return renderMessages(self)
 })
}
 


    box.removeMessagesEvent = () => {
      box.querySelectorAll(".message").forEach(msgEle => {
        for(const eName in msgEle.events){
          msgEle.removeEventListener(eName, msgEle.events[eName])
        }
      })
    }
    
    
    box.removeMessage = _id => {
      box.querySelector(`[id="${_id}"]`).remove();
    }
    
    box.replaceMessage = (msg, loading = false, show = false, newId = false) => {
      if(!newId) newId = msg._id
      const msgEle = messageBoxComp({...msg, _id: newId}, chat, loading);
      box.getMessage(msg._id).replaceWith(msgEle)
      box.addMessageEvent({...msg, _id: newId}, msgEle)
      if(show) highlight(msgEle)
    }
    
    box.getMessage = id => {
      return box.querySelector(`[id="${id}"]`)
    }
    
    box.addMessage = (message, loading = false) => {
     const msgEle = messageBoxComp(message, chat, loading)
     box.appendChild(msgEle);
     return msgEle
    }
    
    box.scroll = () => {
      scroll(box)
    }
    
    box.scrollTo = (msgId) => {
      const msgEle = box.getMessage(msgId);
      if(msgEle) scrollTo(msgEle, box)
      if(highlight && msgEle) highlight(msgEle)
    }
    
    box.updateMessagesNames = (name) => {
      box.querySelectorAll(".message").forEach(msg => {
        const nameEle = msg.querySelector(".name")
        if(nameEle) nameEle.textContent = name
      })
    }
  
  return box
}

/* for sorting */ 

function sorter(sortData, index){
  const {name, count, active} = sortData;
  const ele = createEle("div",{
    "class": `${active ? "sorter active" : "sorter"}`
  });
  
  ele.innerHTML = `
        <div class="name">${name}</div>
        <div class="count">${count}</div>
     `
  const counter = ele.querySelector('.count')
     
  ele.onclick = () => {
    sorters.forEach((st,i) => st.active = (i == index))
    filterChats()
  }
  
  
  return ele
}




// action 
const chatActionButtonHandler = (_id, chatData, input) => {
 const {messagesBox, messageInput} = chatWindows[_id];
 const message = messageInput.message;
 console.log(_id, chatData, input)

  
  messageInput.clear()
}
 

 

function messageInputComp(chatData, messagesBox){
  let {_id, groupName, messageAllowed, blockedPeoples, createdBy, type, peoples} = chatData;
  const person = peoples.find(person => person._id !== userId)
  
  const section = createEle("div",{
    "class": "messageInput"
  });
  
  if(!blockedPeoples.includes(userId)){
  section.innerHTML =
  type == "private" && blockedPeoples.includes(person._id) ? 
  `<div class="unblockMessage">
  <span> to send messages please Unblock</span>
  <button class='unblock clickable'>unblock</button>
  </div>`: 
  ( messageAllowed || !messageAllowed && createdBy == userId ?  `
        <div class="typeArea">
        <div class="replyBox">
         <div class="head">
          <div class="name">Umar</div>
          <button class="cancel clickable">❌</button>
          </div>
          <div class="content gray">
            ok thx buddy i will checkout.. and make it very very interested...
          </div>
        </div>
        <div class="attach clickable">📎 attach files</div>
        <textarea class="input" placeholder="Type your message here..." name="" id="" cols="" rows=""></textarea>
        <canvas></canvas>
        </div>
        <div class="action">
          <img src="./images/record.png" alt="">
        </div> 
    ` : ` 
     <div> message is not allowed in this chat</div>
    ` )
  
  if(messageAllowed || createdBy == userId){
  const input = section.querySelector(".input");
  const ActionBtn = section.querySelector(".action img");
  const AttachBtn = section.querySelector(".attach")
  const audioCanvas = section.querySelector("canvas")
  
  const updateSelf = msg => {
    if(msg.trim()){
      ActionBtn.src = "./images/send.png";
      section.sendType = "message";
      close(audioCanvas)
      open(input)
    }else{
      ActionBtn.src = "./images/record.png"
      section.sendType = "voice"
      close(input)
    }
  }
  
  // main function
  AttachBtn.onclick = () => {
    const selection =  new FileSelection({
      maxSize: 50,
      maxCount: 1000
    })
    
    selection.onSelect = files => {
     AttachBtn.textContent = `Attached ${files.length < 100 ? files.length : "100+"} files`
     section.files = files || []
    }
  }
  
  
  let message = draftMessages[_id] || "";
  input.value = message;
  section.message = message;
  
  updateSelf(message)
  
  section.clear = () => {
    message = "";
    section.message = "";
    section.sendType = "message";
    section.editData = {};
    input.value = "";
    close(ReplyBox);
    updateSelf("")
  }
  
  section.changeInput = (content = "", type = "", data = {}) => {
    message = content;
section.message = content;
section.sendType = type;
section[`${type}Data`] = data;
input.value = content;
  }
  
  let isTyping = false;
  onInput(input, value => {
    section.message = value;
    draftMessages[_id] = value.trim();
    if(isTyping){
      socket.emit("is typing", _id)
    }
    isTyping = false;
    updateSelf(value)
  })
    
  setInterval(() => {
    isTyping = true
  }, typingTimeout * 1000);
  
  ActionBtn.addEventListener("touchstart", () => {
    if(section.sendType == "voice"){
      const recorder = new AudioRecorder(audioCanvas)
      section.recorder = recorder
      recorder.onStart(() => {
        open(audioCanvas)
      })
      recorder.onFinish((b) => {
        if(!b){
          updateSelf("h")
          return 
        }
        const url = URL.createObjectURL(b);
        const audioEle = Audio({
          src: url
        });
        messagesBox.appendChild(audioEle)
      })
      recorder.onError(recorder.onFinish)
      recorder.start()
    }
    ActionBtn.addEventListener("touchend", () => {
  section.recorder.stop()
})
  })
  
  }else if(type == "private" && blockedPeoples.includes(person._id)){
    const unblockBtn = section.querySelector(".unblock");
    unblockBtn.onclick = () => {
      unblockPerson(person.name, person._id, _id)
    }
  }
  
  }else{
    section.innerHTML = "<div>You Are Blocked From This Chat</div>"
  }
  
  section.sendType = "message";
  section.replyData = {};
  
  const ReplyBox = section.querySelector(".replyBox");
  
  section.closeReplyBox = () => {
    close(ReplyBox)
  }
  
  section.openReplyBox = (name, content, onClickCb = false, onCancelCb = false) => {
    open(ReplyBox, "flex");
    const ReplyName = ReplyBox.querySelector(".name")
    const ReplyContent = ReplyBox.querySelector(".content");
    const CancelBtn = ReplyBox.querySelector(".cancel")
    
    ReplyName.textContent = shortenText(name, 10);
    ReplyContent.textContent = shortenText(content, 20);
    
    CancelBtn.onclick = () => {
      section.closeReplyBox(ReplyBox)
      if(onCancelCb) onCancelCb()
    }
    
    ReplyBox.onclick = () => {
      if(onClickCb) onClickCb()
    }
  }
 
  
  return section
}


// for searched chat 
function chatDisplay(chatData){
  const {role, type, _id} = chatData;
  const display = createEle("div", {
    id: _id,
    "class": "chatNav"
  });
  
  let chatName, chatPic, chatDescription, chatType, online;
  
  if(role){
    chatName = chatData.name;
    chatPic = chatData.profilePic;
    chatDescription = chatData.bio;
    chatType = "member";
    chatId = chatData._id
    online = chatData.online
  }else{
    chatName = chatData.groupName;
chatPic = chatData.groupPic;
chatDescription = chatData.groupDescription;
chatType = "group";
chatId = chatData._id
online = false
  }
  
  display.innerHTML = `
       <div class="profileHead">
       </div>
       <div class="body">
         <div class="head">
           <div class="name"></div>
           <div class="type"></div>
         </div>
         <div class="feet">
           <div class="description message gray">
           </div>
           <button class="join clickable">
           enter chat
           </button>
        </div>
       </div>
  `
  
  const joinBtn = display.querySelector(".join");
  joinBtn.onclick = () => {
    if(chatType == "group"){
      joinChatWithFetch(chatId)
    }else{
     joinChatWithFetch(chatId, 'private', [userId, chatId])
    }
  }
  
  const head = display.querySelector(".profileHead");
  head.replaceWith(profileHeadComp({
    groupName: chatName,
    groupPic: chatPic,
    online
  }))
  
  setContent(display, chatName, ".head .name")
  setContent(display, chatType, ".head .type")
  setContent(display, chatDescription, ".feet .description")
  
  return display
}

/* for picking up profile images */ 
function ProfilePickerComp(url, type = 'group'){
  const picker = createEle("div", {
    "class": "profilePicker profileHead clickable"
  })
  
  let display = createEle("img",{
    "class": "display",
  })
  
  picker.display = display;
 
  
  
  picker.file = false;
  picker.appendChild(display)
 
  const input = createEle("input", {
    type: "file", 
    /*accept: "img/*"*/
  })
  
  picker.onclick = () => {
    input.click()
  }
  
  picker.updateImage = (url, type = "group") => {
    display.onerror = () => {
      display.src = `./images/${type}Dp.png`
    }
 
    display.src = url
  }
  
  
  input.onchange = () => {
    const file = input.files[0];
    if(!file) return
    load(true)
    const reader = new FileReader();
    reader.onload = fl => {
    load(false)
    const size = (file.size / 1024) / 1024;
    const isAllowedType = allowedImageTypes.includes(file.type)
    if (size >= maxImageSize && !isAllowedType) {
      alert(!isAllowedType ? "only images allowed" : "image size is large", false)
      return
    }
   
    picker.updateImage(fl.target.result, "group");
    picker.file = file
    picker.onchange({
      type: file.type,
      file,
      url: fl.target.result,
      size,
      name: file.name
    })
    }
    
    
    reader.readAsDataURL(file)
  }
  
  
  picker.updateImage(url, type)
  
  return picker
}





/* for video */

function toggleSize(ele) {  
  return new Promise((res) => {  
    const isFull = document.fullscreenElement === ele ||  
                   document.webkitFullscreenElement === ele ||  
                   document.msFullscreenElement === ele;  
  
    function handleChange() {  
      document.removeEventListener('fullscreenchange', handleChange);  
      document.removeEventListener('webkitfullscreenchange', handleChange);  
      document.removeEventListener('msfullscreenchange', handleChange);  
  
      const nowFull = document.fullscreenElement === ele ||  
                      document.webkitFullscreenElement === ele ||  
                      document.msFullscreenElement === ele;  
  
      res(nowFull ? "full" : false);  
    }  
  
    document.addEventListener('fullscreenchange', handleChange);  
    document.addEventListener('webkitfullscreenchange', handleChange);  
    document.addEventListener('msfullscreenchange', handleChange);  
  
    if (!isFull) {  
      if (ele.requestFullscreen) ele.requestFullscreen();  
      else if (ele.webkitRequestFullscreen) ele.webkitRequestFullscreen();  
      else if (ele.msRequestFullscreen) ele.msRequestFullscreen();  
    } else {  
      if (document.exitFullscreen) document.exitFullscreen();  
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();  
      else if (document.msExitFullscreen) document.msExitFullscreen();  
    }  
  });  
}  


const downloadFile = (src = "none", name = "no name") => {
  const a = createEle("a", {
    href: src,
    name
  })
  a.click()
}
      
    function Video(data = {}){  
      const defaultData = {
        caption: "this is caption",
        src: "./video/sample.mp4",
        poster: false,
        muted: false,
        controls: true,
        autoplay: false
      }
      
      data = {...defaultData, ...data}
      
      const video = createEle("video",{  
        poster: data.poster,
        "class": "video-display"
      })  
      
      
      const source = createEle("source", {
        src: data.src,
        "class": "video-source"
      })
      
      video.appendChild(source)
      
      
      let loadedOnced = false  
        
  
      const mediaDisplay = createEle("div", {  
        "class": "mediaDisplay"  
      })  
        
      mediaDisplay.appendChild(video)  
        
      const moveSpeed = 1.5;  
      const moveStep = 5;  
        
      const range = createEle("input", {  
        min: 0,  
        type: "range",  
        "class": "range"  
      })  
        
        
      range.value = video.currentTime;  
      range.addEventListener("input", () => {  
        video.currentTime = range.value;  
        positionDisplay.textContent = formatSeconds(video.currentTime);  
      })  
        
      
      video.addEventListener("error", e => {
        const erCode = video.error.code;
        if(erCode == 2){
          video.load()
        }else{
          console.log("invalid url")
          console.log(video.error)
        }
      })
      
      video.muted = data.muted;
      video.autoplay = data.autoplay;
      video.playsinline = true;
      video.preload = "auto"
      video.addEventListener("loadedmetadata", () => {  
        range.max = video.duration;  
        positionDisplay.textContent = formatSeconds(video.currentTime);  
        durationDisplay.textContent = formatSeconds(video.duration);
      })  
        
      video.addEventListener("timeupdate", () => {  
        range.value = Math.floor(video.currentTime)  
        positionDisplay.textContent = formatSeconds(video.currentTime);  
        if(video.currentTime == video.duration){  
          controllVideo()  
        }  
       })  
        
      video.addEventListener("waiting", async () => {  
        spinner.style.display = "block";  
        playPauseBtn.style.display = "none";  
        video.style.filter = "blur(5px)"; 
       });  
         
       video.addEventListener("canplay", () => {  
         if(!loadedOnced){
           video.currentTime = .1  
           loadedOnced = true;
           if(data.autoplay){
            controllVideo()
           }
         }
         spinner.style.display = "none";  
         playPauseBtn.style.display = "block";  
         video.style.filter = "blur(0)"  
       });  
  
  
  // Update buffer progress  
  video.addEventListener("progress", () => {  
  if (video.buffered.length > 0) {  
    const bufferedEnd = video.buffered.end(video.buffered.length - 1);  
    const percent = (bufferedEnd / video.duration) * 100;  
    const current = (video.currentTime / video.duration) * 100;  
      
    range.style.background = `linear-gradient(to right,   
      white 0%,   
      white ${percent}%,   
      black ${percent}%,   
      #444 ${current}%,  
      red ${current}%)`;  
  }  
});  
        
      const wrapper = createEle("div", {  
        "class": "video"  
      })  
        
      const heads = createEle("div", {  
        "class": "heads"  
      })  
        
      const resizer = createEle("img", {  
        "src": "./images/resize.png",  
        "class": "resizer"  
      })  
        
  
        
        
      heads.appendChild(resizer);  
      resizer.onclick = async () => {  
        const size = await toggleSize(mediaDisplay);  
        controlsWrapper.style.height = size == "full" ? "90%" : "100%"  
        video.style.width = size == "full" ? "100vw" : "100%"  
        resizer.src = `./images/${size == "full" ? "minimise" : "resize"}.png`  
      }  
        
      
      const caption = createEle("div", {  
        "class": "title display"  
      }, data.caption)  
      heads.appendChild(caption)  
     
        
      const download = createEle("img", {  
        "src": "./images/download.png",  
        "class": "download clickable"  
      })  
      heads.appendChild(download)  
      download.onclick = () => {  
        downloadFile(data.src)  
      }  
        
      const controllers = createEle("div", {  
        "class": "controllers"  
      })  
        
        
      const feets = createEle("div", {  
        "class": "feets"  
      })  
        
      const playPauseBtn = createEle("img", {  
        src: "./images/play.png",  
        "class": "playPause"  
      })  
        
      const spinner = createEle("div", {  
        "class": "spinner"  
      })  
        
      mediaDisplay.appendChild(spinner)  
        
      const positionDisplay = createEle('div', {  
        "class": "display position"  
      }, "00:00")  
        
      const durationDisplay = createEle('div', {  
        "class": "display duration"  
      }, "00:00")  
        
      // add volume controller and resizer to head  
      controllers.appendChild(playPauseBtn);  
  
      feets.appendChild(positionDisplay);  
      feets.appendChild(range);  
      feets.appendChild(durationDisplay)  
        
      let isPlaying = false;  
        
      const controlsWrapper = createEle('div', {  
        "class": "controlsWrapper"  
      });  
        
      controlsWrapper.appendChild(heads);  
      controlsWrapper.appendChild(controllers)  
      controlsWrapper.appendChild(feets)  
        
      const displayControllers = (isPlaying) => {  
        if(!data.controls) return
        controlsWrapper.style.opacity = !isPlaying ? "0" : "1";  
        controlsWrapper.style.zIndex = isPlaying ? "5" : "-1";  
      }  
      if(!data.controls){
        controlsWrapper.style.opacity = 0;
        controlsWrapper.style.zIndex = "-1"
      }
        
      const controllVideo = async () => {  
        if(isPlaying){  
         await video.pause()  
        }else{  
         await video.play()  
        }  
          
        displayControllers(isPlaying)  
        playPauseBtn.src = `./images/${isPlaying ? "play" : "pause"}.png`;  
        isPlaying = !isPlaying;  
        }  
        
        
      video.onclick = e => {  
        if(getClickedX(wrapper, e.clientX) == "center") return controllVideo(e)  
        showHideController()  
      }  
      
      playPauseBtn.onclick = (e) => {  
        if(getClickedX(wrapper, e.clientX) == "center") return controllVideo(e)  
        showHideController()  
      }  
        
       
      wrapper.appendChild(mediaDisplay)  
      mediaDisplay.appendChild(controlsWrapper)  

      let hideTimer;  
      const showHideController = () => {  
        if(data.controls){
        clearTimeout(hideTimer)  
        displayControllers(true);  
        hideTimer = setTimeout(() => displayControllers(false),3000)  
        }
      }  
        
      const stepHandler = e => {  
       const position = getClickedX(controlsWrapper, e.clientX);  
       const moveBy = position == "right" ? moveStep : (position == "left" ? -moveStep : 0)  
       video.currentTime += moveBy;  
       showHideController()  
      }  
        
     controlsWrapper.addEventListener("dblclick", e => {  
       stepHandler(e)  
     })  
       
     video.addEventListener("dblclick", e => {  
       stepHandler(e)  
     })  
        
      onLongPress(wrapper, (e) => {  
        const {clientX} = e.touches[0];  
        const speed = getClickedX(wrapper, clientX) == 'right' ? moveSpeed : 1  
        video.playbackRate = speed  
        addEventListener("touchend", () => {  
          video.playbackRate = 1  
        })  
       showHideController()  
      })  
      
      
      wrapper.isPlaying = () => isPlaying
      wrapper.play = () => video.play()
      wrapper.pause = () =>  video.pause()
      wrapper.autoplay = state => video.autoplay = state
      wrapper.controls = state => {
        data.controls = state
      }
      wrapper.muted = state => video.muted = state
      wrapper.volume = state => video.volume = state
      wrapper.src = src => source.src = src;
      
      wrapper.playPauseBtn = playPauseBtn;
      wrapper.heads = heads;
      wrapper.display = mediaDisplay;
      wrapper.feets = feets;
      wrapper.range = range;
      wrapper.video = video;
      wrapper.resize = resizer;
      video.source = source
      wrapper.caption = cp => caption.textContent = cp;
      wrapper.download = download;
      wrapper.duration = durationDisplay;
      wrapper.position = positionDisplay
     
      
      return wrapper  
    }  
      
      
    
    /* for audio */ 
    
    
    function Audio(data){
      const defaultData = {
        src: "./sounds/sample.mp3",
        controls: true,
        muted: false,
        autoplay: false,
        playbackRate: 1,
        caption: false,
        preload: "auto",
        type: "inline" // we have box also
      }
      
      data = {...defaultData, ...data};
      
      const wrapper = createEle("div", {
        ...data,
        "class": "audio"
      })
      
      const controls = data.controls
      delete data.controls 
      
      const audio = createEle("audio", {
        ...data
      })
     
     let playPauseBtn = createEle("img", {
       "class": "playPauseBtn clickable",
       src: "./images/play.png"
     })
    
     
     const range = createEle("input", {
       "class": "range",
       type: "range",
       min: 0,
       value: 0
     })
     
     const playbackController = createEle("div", {
       "class": "playbackController clickable"
     }, data.playbackRate)
     
     
     
     const positionDisplay = createEle("span", {
       "class": "position display"
     }, "00:00")
     
     const durationDisplay = createEle("span", {
       "class": "duration display"
     }, "00:00")

      const updateDisplays = () => {
        positionDisplay.textContent = formatSeconds(audio.currentTime);
        durationDisplay.textContent = formatSeconds(audio.duration);
        range.value = audio.currentTime;
        data.playbackRate = audio.playbackRate;
        playbackController.textContent = `${audio.playbackRate}${audio.playbackRate < maxSpeedRate ? "×" : "m"}`;
      }

const updateType = (type) => {
     data.type = type;
        // for box type 
      if(data.type == "box"){
        wrapper.style.rowGap = "1rem";
        body.style.flexDirection = "column";
        body.style.rowGap = "1rem";
        range.style.width = "100%";
        wrapper.style.height = "90%";
        wrapper.style.width = "80%"
      }else{
        wrapper.style.rowGap = ".3rem";
        wrapper.style.height = "70px";
        wrapper.style.width = "80%"
        body.style.flexDirection = "row";
        body.style.rowGap = "0";
        range.style.width = "auto"
      }
}
      
      audio.addEventListener("loadedmetadata", () => {
  if (audio.duration === Infinity) {
    // Force seek to end to get actual duration
    audio.currentTime = 1e101;
    audio.ontimeupdate = function() {
      audio.ontimeupdate = null;
      audio.currentTime = 0;
      range.max = audio.duration;
      updateDisplays();
      if (data.autoplay && !playedOnce) {
        audio.play();
      }
    };
  } else {
    range.max = audio.duration;
    updateDisplays();
    if (data.autoplay && !playedOnce) {
      audio.play();
    }
  }
});
      
      range.addEventListener("input", () => {
        audio.currentTime = range.value
        updateDisplays()
      })
      
      let isPlaying = !audio.paused;
      let playedOnce = false;
      playPauseBtn.onclick = async () => {
        await !isPlaying ? audio.play() : audio.pause();
        playPauseBtn.src = `./images/${isPlaying ? "play" : "pause"}.png`
        isPlaying = !isPlaying;
        if(!playedOnce) playedOnce = true
      }
      
      audio.addEventListener("timeupdate", () => {
        updateDisplays()
      })
      
      const maxSpeedRate = 2.5
      playbackController.onclick = () => {
        audio.playbackRate =  data.playbackRate < maxSpeedRate ? data.playbackRate+.5 : .5
        updateDisplays()
       }
      
      onLongPress(playbackController, () => {
        audio.playbackRate = 1;
        updateDisplays()
      })
      
      
      // for loading 
      const spinner = createEle("div", {
        "class": "spinner"
      })
      
     audio.addEventListener("waiting", () => {
        playPauseBtn.replaceWith(spinner)
      })
      
      audio.addEventListener("canplay", () => {
        alert()
        spinner.replaceWith(playPauseBtn)
      })
      
      
      
      // heads body and feets needed 
      const heads = createEle("div", {
        "class": "heads display"
      }, data.caption)
      heads.append()
      
      const body = createEle("div", {
        "class": "body"
      })
      
      body.append(playPauseBtn, range, playbackController)
      
      const feets = createEle("div", {
        "class": "feets"
      })
      
      feets.append(positionDisplay, durationDisplay)
      wrapper.append(heads, body, feets);
      
      wrapper.play = () => audio.play()
      wrapper.pause = () => audio.pause()
      wrapper.audio = audio;
      wrapper.heads = heads;
      wrapper.body = body;
      wrapper.feets = feets;
      wrapper.data = data;
      wrapper.updateType = updateType
      wrapper.mute = muted => audio.muted = muted;
      wrapper.caption = cp => heads.textContent = cp
      
      updateType(data.type)
      
      return wrapper
    }
    
    
    /* for files */
    
  
  function Image(data) {
  const defaultData = {
    src: `https://picsum.photos/300/200?random=${Date.now()}`,
    loading: "lazy",
    caption: "this is image caption",
    loaded: false,
    retryTime: 1, // in seconds
    maxTries: true // or number like 3
  };
  
  let loaded = false;
  let tried = 0;
  let failed = false;
  
  data = { ...defaultData, ...data };
  
  const wrapper = createEle("div", {
    class: "image shimmer"
  });
  
  const caption = createEle("span", {
    class: "caption display"
  }, data.caption);
  
  const image = createEle("img", {
    ...data
  });
  
  let timer;
  
  image.onerror = () => {
    if (failed) return; // prevent infinite loop if failure image also fails
    
    clearTimeout(timer);
    if (data.maxTries === true || tried < data.maxTries) {
      tried++;
      timer = setTimeout(() => {
        if (!navigator.onLine) {
          image.src = data.src; // reload original
        } else {
          image.src = data.src + "?retry=" + tried; // force reload
        }
      }, data.retryTime * 1000);
    } else {
      failed = true;
      image.src = "./images/failure.png";
    }
  };
  
  image.onload = () => {
    loaded = true;
    image.style.opacity = 1;
    caption.style.opacity = 1;
  };
  
  onLongPress(wrapper, () => {
    if (loaded) {
      caption.style.opacity = 0;
      wrapper.addEventListener("touchend", () => {
        caption.style.opacity = 1;
      });
    }
  });
  
  
  wrapper.style.backgroundImage = randomGradient()
  wrapper.append(caption, image);
  wrapper.caption = cp => {
    caption.textContent = cp;
    caption.style.opacity = 1
  }
  
  return wrapper;
}
  
  function File(data){
     const defaultData = {
       dataType: "src", 
       caption: 'this is caption',
       fileType: "raw"
     }
     
     data = {...defaultData, ...data};
     const {fileType, dataType} = data;
     
     let file;
      
      
      if(dataType == "src"){
     if(fileType !== "raw"){
       if(fileType == "video"){
         file = Video(data)
       }else if(fileType == "audio"){
         file = Audio(data)
       }else if(fileType == "image"){
         file = Image(data)
       }else{
         file = file({...data, fileType: "raw"})
       }
       
       const wrapper = createEle("div", {
         "class": "file"
       })
       
       wrapper.appendChild(file);
       wrapper.file = file;
       file = wrapper
     }else{
       file = createEle("div", {
       "class": "file"
       })
       
       const filePoster = createEle("img", {
         src: "./images/file.png",
         "class": "filePoster"
       })
       
       const caption = createEle("div", {
         "class": "title display"
       }, data.caption)
       
       const download = createEle("img", {
         "class": "download clickable",
         src: "./images/download.png"
       })
       
    
       download.onclick = () => downloadFile(data.src)
       file.append(filePoster, caption, download)
       file.file = file;
       file.caption = cp => {
         caption.textContent = cp
       }
     }
      }
    
   
    file.changeCaption = cp => {
      data.caption = cp;
      file.file.caption(cp)
    }
  
    return file
  }
  
  
  
  
  function Countries(data = countries, cb){
  const select = createEle("select",{
    "class": "countries",
    "for": "country",
    "name": "country"
  })

select.innerHTML = `
 <option selected value="">select your country</option>
`
  
  data.forEach(country => {
    select.appendChild(createEle("option",{
      "value": country.name.toLowerCase(),
    }, `${country.name} ${country.code}`))
  })
  
  select.addEventListener("change", () => {
    if(cb) cb(select.value.toLowerCase())
  })
  
  return select
}





function AudioRecorder(displayElem) {
  if (!(displayElem instanceof HTMLCanvasElement)) {
    throw new Error("displayElem must be a <canvas> element");
  }

  const ctx = displayElem.getContext("2d");
  let stream, mediaRecorder, audioChunks = [];
  let animationId, analyser, dataArray, source;

  const onStartHandlers = [];
  const onFinishHandlers = [];
  const onErrorHandlers = [];

  async function start() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];

      // Start recording
      mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunks, { type: 'audio/webm' });
        onFinishHandlers.forEach(fn => fn(blob));
      };
      mediaRecorder.start();
      onStartHandlers.forEach(fn => fn());

      // Audio context setup for visualization
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      source = audioContext.createMediaStreamSource(stream);
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256
      const bufferLength = analyser.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);
      source.connect(analyser);

      // Visualization loop
      function draw() {
        animationId = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, displayElem.width, displayElem.height);
        ctx.fillStyle = 'rgb(30, 144, 255)';
        const barWidth = (displayElem.width / bufferLength) * 2.5;
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
          const barHeight = dataArray[i] / 2;
          ctx.fillRect(x, displayElem.height - barHeight, barWidth, barHeight);
          x += barWidth + 1;
        }
      }

      draw();
    } catch (err) {
      onErrorHandlers.forEach(fn => fn(err));
    }
  }

  function stop() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    stream.getTracks().forEach(track => track.stop());
    cancelAnimationFrame(animationId);
  }

  return {
    start,
    stop,
    onStart(callback) {
      onStartHandlers.push(callback);
      return this;
    },
    onFinish(callback) {
      onFinishHandlers.push(callback);
      return this;
    },
    onError(callback) {
      onErrorHandlers.push(callback);
      return this;
    }
  };
}

