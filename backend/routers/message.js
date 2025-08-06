import { Router } from "express";

import Chat from "../models/chat.js";
import User from "../models/user.js";
import Message from "../models/message.js";
import {  checkCache } from "../helper.js"
import {totalOnline} from "../users.js";
const {MAX_UPLOAD_SIZE} = process.env;
const app = Router();

app.post("/send", upload.multiple("files"), async (req, res, next) => {
  try{
    // check group existnace 
    const chat = await checkCache(`chats:${messageData.to}`, async => {
      return [await Chat.findBydId(messageData._id)]
    });
    
    chat = await restoreDoc(chat, Chat);
    
    const messageData = req.body;
    delete messageData._id;
    
    if(req.files){
      let fileSizes = 0;
      req.files.forEach(file => {
        fileSizes += file.size / (1024);
        if (fileSizes == MAX_UPLOAD_SIZE) {
          break
          return res.json({
            sent: false,
            message: "maximum file size exceeded"
          })
        }
      });
      
      req.files = req.files.map(async fl => await uploadFile(fl))
    }
    
    // create message instance 
    messageData.files = messageData.files.map(async (fl, ind) => {
      fl = {...fl, ...req.files[ind]}
      return fl
    })
    
    const message = await Message.create(messageData)
    res.json({
      sent: true,
      message
    })
    
    chat.currentTime = Date.now();
    await chat.save()
    // emit message 
    emitSocket("sent message", message, chat.peoples);
  }catch(er){
    next()
  }
})

export default app