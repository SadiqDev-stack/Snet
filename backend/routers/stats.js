import { Router } from "express";

import Chat from "../models/chat.js";
import User from "../models/user.js";
import Message from "../models/message.js";
import {  checkCache } from "../helper.js"
import {totalOnline} from "../users.js"
const app = Router();


// loading stats, no authorization needed pubic home page use it
app.get("/public", async (req, res) => {
    try {

        const totalUsers = await User.find().countDocuments()
     
        const onlineUsers = totalOnline()

        
        const totalGroups =  await  Chat.find().countDocuments()

        const totalChats = await  Chat.find().countDocuments()

        
        const totalMessages = await  Message.find().countDocuments()

        
        const editedMessages =  await checkCache("stats:editedMessages",async () => {
            return [await  Message.find({
                action: "edited"
            }).countDocuments(), 60] // 1minite
        })
        
        const deletedMessages = await  Message.find({
        action: "deleted"
         }).countDocuments()
        
        res.json([
            {
                onlineUsers,
                totalUsers
            },
            {
                totalGroups,
                totalChats
            }, 
            {
                totalMessages,
                editedMessages,
                deletedMessages
            }
        ])
    } catch (er) {
        console.log(er);
        res.json([]);
    }
});

export default app;
