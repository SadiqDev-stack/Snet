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

        const totalUsers =   await checkCache("stats:totalUsers",async () => {
          return  [await User.find().countDocuments(), 300] // 5minute
        })
     
        const onlineUsers =   await checkCache("stats:onlineUsers",async () => {
          return [totalOnline(), 60] // 1minute
        })
        
        const totalGroups =  await checkCache("stats:totalGroups",async () => {
            return [await  Chat.find({
                   
                }).countDocuments()
                , 300] // 5minute 
        })
        
        const totalChats =  await checkCache("stats:totalChats",async () => {
           return [await  Chat.find().countDocuments(), 300] // 5minute
        })
        
        const totalMessages =  await checkCache("stats:totalMessages",async () => {
            return [await  Message.find().countDocuments(), 60] // 1minure
        })
        
        const editedMessages =  await checkCache("stats:editedMessages",async () => {
            return [await  Message.find({
                action: "edited"
            }).countDocuments(), 60] // 1minite
        })
        
        const deletedMessages =  await checkCache("stats:editedMessages",async () => {
    return [await  Message.find({
        action: "deleted"
    }).countDocuments(), 60] // 1minite
})
        
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
