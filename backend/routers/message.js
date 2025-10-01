import { Router } from "express";

import Chat from "../models/chat.js";
import User from "../models/user.js";
import Message from "../models/message.js";
import {  checkCache , setCache, restoreDoc} from "../helper.js"
import {totalOnline} from "../users.js";
import {emitSocket} from "../socket.js"
import {log} from "../middlewares/logger.js";
import authorize from '../middlewares/authorization.js'
const {MAX_UPLOAD_SIZE} = process.env;
const app = Router();

app.post("/send", authorize, async (req, res, next) => {
  try{
    const {id} = req.user;
    // check group existnace 
    
    const messageData = req.body;
    delete messageData._id;
    
    let chat = await Chat.findById(messageData.to)

    
    
    if(!chat || !messageData){
      return res.json({
        sent: false,
        message: !chat ? 'chat doesnt exist' : 'message data needed'
      })
    }
    
    
    const message = await Message.create(messageData)
    res.json({
      sent: true,
      message
    })
    
    chat.currentTime = Date.now()
    await chat.save();
    
    emitSocket(id, chat, "sent message", message);
  }catch(er){
    log(er, "bad")
  }
})

export default app