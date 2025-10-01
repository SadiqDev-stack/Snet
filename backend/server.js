import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";
import { Server } from "socket.io";
import {logger, log} from "./middlewares/logger.js";
import userRouter from "./routers/user.js";
import statsRouter from "./routers/stats.js";
import chatRouter from "./routers/chat.js";
import messageRouter from "./routers/message.js"
import Chat from "./models/chat.js";
import Message from "./models/message.js"
import User from "./models/user.js";
import Redis from "redis";
import Pending from "./models/pending.js"
import {goOnline, isOnline, goOffline, getUser, logAll} from "./users.js"

import { __dirname, getTokenData, cacheMem, checkCache, setCache, getCache, compressData, decompressData, restoreDoc } from "./helper.js";

const ObjectId = mongoose.Types.ObjectId;
const { DB_URI, MAX_CHAT_HISTORY, MAX_DELETE, CEO_EMAIL, CACHE_EXPIRE_TIME } = process.env;
const app = express();
const port = 8080;

app.use(express.static("./frontend"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")))
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger)
app.use("/api/user", userRouter);
app.use("/api/stats", statsRouter);
app.use("/api/chats", chatRouter);
app.use('/api/message', messageRouter)
app.get('/', (req, res) => {
    res.redirect('/start.html')
})
// for page not found
app.use((req, res) => res.redirect("/404.html"))


cacheMem.connect()
    .then(() => log("cache memory connected"))
    .catch(err => log(`error connecting cache memory ${err}`, "bad"))
    

function start() {
    
    const server = app.listen(port, () => {
        log(`server running at http://localhost:${port}`);
    });

    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    // doing authentication
    io.use(async (socket, next) => {
        app.set("socket", socket)
        const token = socket.handshake.auth.token;
        const user = await getTokenData(token);

        if (!user) {
            log("socket connect fail, user dont exist", "bad")
            next(new Error("User Doesnt Exist Or Token Expired"));
            return;
        }
        
        user.id = new ObjectId(user.id);
        io.user = user;
        next();
    });

    io.on("connection", async socket => {
        const { email, id, name } = io.user;

        // going online
        socket.on("go online", async (chatIds, cb = () => null) => {
            try {
                io.chatIds = chatIds;
                socket.user = io.user;
                goOnline(id.toString(), socket)
                log(`${name} goes online`);

                socket.join(chatIds)
                socket.to(chatIds).emit("goes online", {
                    chatIds: io.chatIds,
                    personId: id
                });
                
                
                // retrieving and loading pending socket messages that are sent you are offline
                const pendingMessages = await Pending.find({
                    from: {
                        $ne: id.toString()
                    },
                    to: id.toString()
                })
                
                
               const pendingToDelete = []
               pendingMessages.forEach(async msg => {
                   msg = msg.toObject()
                   socket.emit(msg.name, msg.data)
                   msg.to = msg.to.filter(_id => {
                       return _id.toString() !== id.toString()
                   })
                   if(msg.to.length == 0){
                       pendingToDelete.push(msg._id)
                   }
               })
               
               if(pendingToDelete.length){
               await Pending.deleteMany({
                   $or: [
                        {
                         _id: {
                         $in: pendingToDelete
                        }
                        },
                       {
                           to: []
                       }
                   ]
               })
               }
               
               
            } catch (er) {
                log(er, "bad")
                cb(false);
            }
        });

        // going offline
        socket.on("disconnect", async (er) => {
          goOffline(id.toString())
          log(name + " goes offline", "warning");
          socket.to(io.chatIds).emit("goes offline", {
              chatIds: io.chatIds,
              personId: id
          });
          
          const now = Date.now()
          await User.findByIdAndUpdate(id.toString(), {
                $set: {
                    lastSeen: now
                }
            });
        });


        // sending message
        socket.on("send message", async (messageData, cb = () => null) => {
            try {
                delete messageData._id;
                // setting ids
                messageData.from = id;

                messageData.time = Date.now();
                messageData.seenBy = [id];

                
                
let chat = await Chat.findById(messageData.to)


                if(!chat){
                    cb(false, "chat not found", "notFound")
                    return
                }
                
                log(chat)
                if(!chat.messageAllowed && id.toString() !== chat.createdBy.toString()){
                    cb(false, "message not allowed here, \n only admin can send messages", "notPermitted")
                    return
                }
                
                if(chat.blockedPeoples.find(_id => _id.toString() == id.toString()) && id.toString() !== chat.createdBy.toString()){
                   cb(false, "you are blocked from this group", "blocked")
                   return
                }
                
                chat.updateTime = Date.now();
                
                
                const message = await (await Message.create(messageData)).populate([
  { path: "from", select: "_id name" },
  { path: "repliedTo", select: "_id content", 
    populate: { path: "from", select: "_id name" } 
  }
]);
                
                if (!message) throw new Error();
                
                
                log(`${name} sent message: 
                 ${messageData.content}`)
                 
                cb(true, message);
                
                socket.to(messageData.to).emit("sent message", message, async (viewerId) => {
    try {
        viewerId = new ObjectId(viewerId)
        await Message.findByIdAndUpdate(message._id.toString(), {
            $addToSet: {seenBy: viewerId.toString()},
        });
        
         console.log(`Message: ${message._id.toString()} viewed by ${viewerId}`);
    } catch (error) {
        console.error(`Error viewing message: ${error}`);
    }
});     } catch (er) {
                log(er, "bad");
                cb(false, 'unexpected error');
            }
        });

        // deleting message
        socket.on("delete messages", async (messageIds, chatId, cb) => {
            try {
let chat = await Chat.findById(chatId)


                if (!chat){
                    cb(false, "chat doesnt exist")
                    return
                }
                
                const isAdmin = chat.createdBy.toString() == id.toString()
                
                const messages = await Message.find(
                    {
                        _id: {
                            $in: messageIds
                        },
                        to: chatId
                    }
                );

                // to be filtered so that only
                // admin can delete other peoples messages
                const messageToDelete = messages
                    .filter(message => {
                        message = message.toObject();
                        return (
                            isAdmin || message.from._id.toString() == id.toString()
                        );
                    })
                    .map(message => message._id);

                if (!messageToDelete){
                    cb(false, "only admin can delete such messages")
                    return
                }

                const deleted = await Message.updateMany(
                    {
                        _id: { $in: messageToDelete }
                    },
                    {
                        $set: {
                            deleted: id,
                            action: "deleted",
                            content: "this messages was deleted 🚫"
                        }
                    }
                );

                if (!deleted.modifiedCount){
                    throw new Error()
                }
                
                cb(true, messageToDelete);
                socket
                    .to(chatId)
                    .emit("deleted messages", chatId, messageToDelete, id);
                log(name + " deleted " + messageToDelete.length + " messages", "warning");
                
                const toDel = messageToDelete.map(_id => _id.toString())
      
            } catch (er) {
                log(er, "bad")
                cb(false, "unexpected error");
            }
        });

        // editing message
        socket.on("edit message", async (messageData, cb) => {
            try {
                let message =  await Message.findById(messageData._id)

                
                
                if (!message){
                    cb(false, "message doesn't exist")
                    return
                }
                
                // no one can edit a message thats isnt his own
                if (message.from._id.toString() == id.toString()) {
                    message.action = "edited";
                    message.content = messageData.content;
                    await message.save();
                    log(message);
                    cb(true, messageData);
                    socket.to(messageData.to).emit("edited message", message);
                    log(name + ' edited a message', "warning")
                } else {
                    cb(false, "cannot edit someones message")
                }
            } catch (er) {
                cb(false, "unexpected error");
                log(er, "bad");
            }
        });

        // viewing messages

        socket.on("see messages", async (messagesToSee, cb) => {
            try {
                const chatsIds = [];
                const messagesIds = [];
                
                for (const _id in messagesToSee) {
                    chatsIds.push(_id);
                    messagesToSee[_id].forEach(msgId => {
                        if(ObjectId.isValid(msgId)){
                            messagesIds.push(new ObjectId(msgId))
                        }
                    })
                }

                const update = await Message.updateMany(
                    {
                        _id: {
                            $in: messagesIds
                        },
                        to: {
                            $in: chatsIds
                        }
                    },
                    {
                       $push: {
                          seenBy: id
                       }
                    },
                    {
                        new: true
                    }
                );

                if (update) {
                    log(`${name} sawed ${messagesIds.length} messages in ${chatsIds.length} chats`)
                    cb(chatsIds, messagesIds)
                    socket
                        .to(chatsIds)
                        .emit("seen messages", chatsIds, messagesIds, id);
                }
            } catch (er) {
                log(`error viewing messages ${er}`, "bad");
            }
        });
        

        // when someone is typing
        socket.on("is typing", _id => {
            log(`${id} is Typing`)
            socket.to(_id).emit("is typing", _id, id.toString())
        })
        
    });
}

start();
