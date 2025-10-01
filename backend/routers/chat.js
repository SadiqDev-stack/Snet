import Chat from "../models/chat.js";
import Message from "../models/message.js";
import User from "../models/user.js"
import { Router } from "express";
import mongoose from "mongoose";
import authorise from "../middlewares/authorization.js";
import {restoreDoc, upload, uploadFile, rewriteFile, checkCache, setCache, getCache, cacheMem} from "../helper.js";
const ObjectId = mongoose.Types.ObjectId;
const {CEO_EMAIL, CHAT_SETTINGS_ALLOWED} = process.env;
import {log} from "../middlewares/logger.js"
import {isOnline, getSocket} from "../users.js"
import authorize from "../middlewares/authorization.js";
import fs from "fs/promises";
import {emitSocket, listenSocket} from "../socket.js"

const app = Router();
app.use(authorize);


app.get("/search", async (req, res) => {
  try {
    const { id, name } = req.user;
    const searchValue = req.query.search;

    if (!searchValue) {
      return res.status(400).json({ error: "Cannot search empty value" });
    }

    const isId = ObjectId.isValid(searchValue);
    console.log(`${name} searched: ${searchValue}`);

    // Build regex for case-insensitive partial match
    const regex = new RegExp(searchValue, "i");
 /*
    // Search Users (excluding self)
    const userQueryFilter = {
      $or: [
        { name: regex },
        { phone: regex },
      ],
    };

    if (isId) {
      userQueryFilter.$or.push({ _id: searchValue});
    }

    const users = await User.find({
      ...userQueryFilter,
      _id: { $ne: id.toString()},
    }).select("role _id name bio profilePic");

    // Add type to each result
    const userResults = users.map(user => ({
      ...user.toObject(),
      type: "user",
    }));
*/

const userResults = []

    // Search Groups
    const groupQueryFilter = {
      $or: [
        { groupName: regex },
        { groupDescription: regex },
      ],
      peoples: {
          $nin: [id]
      },
      // neq
      type: {
          $ne: 'private'
      },
      for: {
          $ne: "private"
      }
    };

    if (isId) {
      groupQueryFilter.$or.push({ _id: searchValue });
    }
    
    

    const groups = await Chat.find(groupQueryFilter).select("_id groupName groupDescription groupPic peoples")
 // mongodb will later handle remove this later
  const groupResults = groups.filter(g => {
        return !g.peoples.includes(id.toString())
    })
    

    // Combine and return results
    const results = [...userResults, ...groupResults];
    res.json(results);
  } catch (er) {
    console.log(er);
    res.json([]);
  }
});


// blocking person in chat 
app.post("/block",async (req, res) => {
    try{
        const {personId, chatId} = req.body;
        const {id} = req.user;
        
        let chat =  await Chat.findById(chatId)

        
        
        const otherLogic = chat.type == "private" ? (
            !chat.blockedPeoples.find(_id => _id.toString() == id.toString()) ? "You Cant, You Are Blocked" : false
        ) : chat.createdBy.toString() !== id.toString() ? "You Are Not The Admin" :
        ( chat.blockedPeoples.find(_id => _id.toString() == personId) ? "Person Is Already Blocked" : false )
        
        if(!chat || otherLogic){
            return res.json({
                blocked: false,
                message: otherLogic
            })
        }
        
        chat.blockedPeoples.push(personId);
        await chat.save();
        
        res.json({
            blocked: true,
        })
        
        
        
        // to notify that blocked peeson and also the chat
    const systemMessage = await Message.create({
       to: chatId,
       from: personId,
       flag: 'blocked',
       type: "system",
       content: "system message"
   })
   
        await systemMessage.populate("from", "_id name")
   
         log(`${name} blocked  ${systemMessage.from.name}`)
         emitSocket(id, chat).emit("blocked person", systemMessage)
    }catch(er){
        log(er, "bad")
        res.json({
            blocked: false,
            message: "unexpected error"
        })
    }
    
})

// unblocking person in chat 
app.post("/unblock",async (req, res) => {
    try{
        const {personId, chatId} = req.body;
        const {id} = req.user;
        
        let chat = await Chat.findById(chatId)

        
        
        const otherLogic = chat.type == "private" ? (
            chat.blockedPeoples.find(_id => _id.toString() == id.toString()) ? "You Cant, You Are Blocked" : false
        ) : chat.createdBy.toString() !== id.toString() ? "Only Admin Can Unblock" : (
            !chat.blockedPeoples.find(_id => _id.toString() == personId) ? "Person Is Not Blocked" : false
         )
        
        if(!chat || otherLogic){
            return res.json({
                unblocked: false,
                message: otherLogic
            })
        }
        
        chat.blockedPeoples = chat.blockedPeoples.filter(_id => _id.toString() !== personId);
        await chat.save();
        
        
        res.json({
            unblocked: true
        })
        
        
        // to notify that blocked peeson and also the chat
    const systemMessage = await Message.create({
       to: chatId,
       from: personId,
       flag: 'unblocked',
       type: "system",
       content: "system message"
   })
   
        await systemMessage.populate("from", "_id name")
        
            
            log(`${name} unblocked ${systemMessage.from.name}`)
           emitSocket(id, chat).emit("unblocked person", systemMessage)
    }catch{
        res.json({
            unblocked: false,
            message: "unexpected error"
        })
    }
    
})

// chat setting / chat 
app.post("/setting/update", upload.single("groupPic"), async (req, res) => {
    try{
        const {id} = req.user;
        const updates = JSON.parse(req.body.updates);
        const groupPic = req.file
        const {chatId} = req.query;
        
        
        let chat = await Chat.findById(chatId)

        
        
        // we cant set private chat chats for friends 
        if(!chat || chat.type == "private"){
            return res.json({
                updated: false,
                message: !chat ? "group doesnt exist" :"cannot update private chat"
            })
        }
        
        const settingsAllowed = JSON.parse(CHAT_SETTINGS_ALLOWED);
        const updatesFound = [];
        const updatedField = {}
        
        settingsAllowed.forEach(async setKey => {
            if(setKey == 'groupPic' && groupPic){
                updatesFound.push(true)
                 const oldPic = chat.groupPic;
                 let fileData;
                 if(oldPic && oldPic.url){
                     fileData = await rewriteFile(groupPic, oldPic.url)
                 }else{
                     fileData = await uploadFile(groupPic, "images")
                 }
                 updates.groupPic = fileData
              }
          
         
          if(chat[setKey] !== updates[setKey]){
              updatesFound.push(true);
              chat[setKey] = updates[setKey];
              updatedField[setKey] = chat[setKey];
          }else{
              updatesFound.push(false)
          }
         })
         
         
         
        if(!updatesFound.includes(true)){
            return res.json({
                updated: false,
                message: "No Changes Made"
            })
        }
        
        chat = await chat.save();
        
        
        
        // delet heavy data
        delete chat.peoples;
        delete chat.blockedPeoples;
        
        
        
        
        const systemMessage = await Message.create({
    to: chatId,
    from: id,
    flag: 'setting',
    type: "system",
    content: JSON.stringify(updatedField)
})
        res.json({
            updated: true,
            chat,
            systemMessage,
            message: "group settings updated successfully"
        })
        
        
        
        
        const socket = getSocket(id.toString());
        if(socket){
            const {name} = socket.io.user;
            
          
            socket.to(chatId).emit("group setting updated", chatId, {
                ...systemMessage.toObject(),
                from: {
                    _id: id,
                    name
                }
            })
        }
    }catch(er){
        log(er, "bad")
        res.json({
            updated: false,
            message: "unexpected token"
        })
    }
})


// creating a chat ( for friends or chat ) 
app.post("/create", upload.single("groupPic"), async (req, res) => {
    try{
        const {id, email} = req.user;
        const chatData = JSON.parse(req.body.chatData);
        const groupPic = req.file
        
        chatData.createdBy = id.toString()
        chatData.peoples = [id.toString()];
        
        
  
                // only ceo can create official chats
                chatData.for =
                    email !== CEO_EMAIL
                        ? chatData.for !== "official"
                            ? chatData.for
                            : "public"
                        : chatData.for;
                        
      // uploading group pic 
      if(groupPic){
          const fileData = await uploadFile(groupPic, "images");
          chatData.groupPic = fileData
      }
                
    
    const chat = await Chat.create(chatData);
             
     const socket = getSocket(id.toString());
     if(socket) socket.join(chat._id.toString())
  
     
       res.json({
           created: true, 
           chat
       })
        
        
        
           }catch(er){
        log(er)
        res.json({
            created: false,
            message: "unexpected error"
        })
    }
})


// joining group / chat
app.post("/join", async (req, res) => {
    try{
       const {type = "public", peoples = "", chatId} = req.body;
       const {id, _id, email} = req.user;
       
       let chat =  await Chat.findById(chatId)
       if(!chat){
           return res.json({
               joined: false,
               message: "group doesnt exist"
           })
       }
       
      chat.peoples.push(_id)
      await chat.save()
      chat = await chat.populate("peoples", "_id name bio lastSeen profilePic")
      
     chat.peoples = chat.peoples.map(p => {
          p.online = isOnline(p._id)
          return p
      })
      
      const messages = await Message.find({to: chatId}).populate("from", "_id name");
       chat.messages = messages 
     
     
     res.json({
         joined: true,
         chat
     })
     
     
     let systemMessage = await Message.create({
         from: _id,
         to: chatId,
         content: "system generated",
         type: "message",
         seenBy: [_id]
     })
     
     const person = await User.findById(_id)
     systemMessage.person = person
     chat.peoples = chat.peoples.map(p => p._id)
     
     log(systemMessage.from.name + " joined " + chat.groupName)
     emitSocket(_id, chat, "joined group", systemMessage)
    }catch(er){
        log(er, "bad")
        res.json({
            joined: false,
            message: 'unexpected error'
        })
    }
})


// leaving chat group
app.post("/leave", async (req, res) => {
    try{
        
        let {chatId} = req.body
        chatId = chatId.toString()
        const {id} = req.user;
        
        const socket = getSocket(id.toString())
        
        let chat =  await Chat.findById(chatId)
        
        if(!chat) return res.json({
            left: false,
            message: 'group doesnt exist'
        })
        
        if(chat.type == "private" || chat.type == "universal"){
            return res.json({
                left: false,
                message: `Cannot Leave ${chat.type} Group`
            })
        }
         
        if(!chat.peoples.some(_id => _id.toString() == id.toString())){
            return res.json({
                left: false,
                message: "You Are Not In The Group"
            })
        }
        
        chat.peoples = chat.peoples.filter(_id => _id.toString() !== id.toString());
        
        if(chat.peoples.length){
        await chat.save();
        
        res.json({
    left: true,
    message: `you left ${chat.groupName}`
})
        
        // notify others 
        const socket = getSocket(id.toString());
        let systemMessage = await Message.create({
            type: "system",
            from: id,
            to: chat._id,
            content: "system created",
            flag: "left"
        })
       
        if(socket){
            const {name, id} = socket.io.user;
            systemMessage = systemMessage.toObject()
            systemMessage.from = {
                _id: id.toString(),
                name
            }
            
            log(`${name} left ${chat.groupName}`)
            socket.to(chat._id.toString()).emit("left group", systemMessage)
        }
        }else{
         res.json({
    left: true,
    message: `you left ${chat.groupName}`
})
            // last member left delete everything
           await Chat.findByIdAndDelete(chat._id.toString());
           await Message.deleteMany({
                to: chat._id.toString()
            });
            log(`last member left group ${chat.groupName}, group data is deleted`, "warning")
        }
    }catch(er){
        log(er, 'bad')
        res.json({
            left: false,
            message: "unexpected error"
        })
    }
})

export default app;
