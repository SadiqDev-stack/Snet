import { Router } from "express";
import {
    hash,
    createToken,
    sendMailConfirmation,
    getTokenData,
    checkCache,
    setCache,
    getCache,
    sendMessage,
    restoreDoc,
    writeFile,
    upload,
    uploadFile,
    rewriteFile,
    __dirname
} from "../helper.js";
import fs from "fs/promises"
import path from "path"
import { log } from "../middlewares/logger.js";
import User from "../models/user.js";
import Chat from "../models/chat.js";
import Message from "../models/message.js";
import authenticate from "../middlewares/authentication.js";
import authorize from "../middlewares/authorization.js";
import { isOnline, getSocket } from "../users.js";
import { ObjectId } from "mongodb"; // make sure this is imported

const { ADMIN_EMAIL, TOKEN_EXPIRE_TIME } = process.env;

const app = Router();

// registering user
app.post("/register", upload.single("profilePic"), async (req, res) => {
    try {
        const regData = JSON.parse(req.body.regData);
        const { email, password, name, phone } = regData;
        
        regData.role = email === ADMIN_EMAIL ? "admin" : "user";
        
        // check if user already exists
        const exist = await User.findOne({
            $or: [{ email }, { phone }]
        });
        
        
        
        if (exist) {
            return res.json({
                registered: false,
                message: "User with this email or phone already exists"
            });
        }
        
        // handle profilePic
        const profilePic = req.file;
        if (profilePic) {
            const fileData = await uploadFile(profilePic, "images")
            regData.profilePic = fileData
        }
        
        console.log(regData)
        // hash password
        regData.password = await hash(password);
        
        // save user
        const user = await User.create(regData);
        
        const token = await createToken({
            email,
            id: user._id,
            role: user.role,
            name
        });
        
        log(`${name} registered an account`);
        
        res.json({
            registered: true,
            role: user.role,
            data: {
                id: user._id,
                name,
                token
            }
        });
    } catch (er) {
        log(er, "bad");
        return res.json({
            registered: false,
            message: "Unexpected error. Failed to register user."
        });
    }
});

// login in user
app.post("/login", authenticate, async (req, res) => {
    try {
        const { email, role, name, _id, verified } = req.user;
        const token = await createToken({
            id: _id,
            email,
            role,
            name
        });
        
        console.log(verified)

        log(`${name} is authenticated`);

        res.json({
            found: true,
            role,
            verified,
            data: {
                id: _id,
                name,
                token
            }
        });
    } catch (er) {
        log(er, "bad");
        res.json({
            found: false,
            message: "Unexpected Error Occurred Generating Access Token"
        });
    }
});

// sending email verification link
app.get("/request/verify", authorize, async (req, res) => {
    
    if (!req.user) {
        log("redirecting", "warning")
        sendMessage(res, "Account Verification Failed, Token Expired", `/login.html`, "/images/failure.png")
        return;
    }

    const { email } = req.user;
    

    sendMailConfirmation(email, req, sent => {
         log("email status: " + sent)
        res.json({
            sent,
            email
        });
    });
});

// verifying user
app.get("/verify", async (req, res) => {
    try{
    const user = await getTokenData(req.query.token);
    if (!user) {
        res.redirect("/login.html");
    } else {
        const update = await User.findOneAndUpdate(
  { email: user.email },
  { $set: { verified: true } },
  { new: true }
);

//await update.toObject();
console.log(update)
if (update && update.verified) {
  log("account verified");
  sendMessage(res, "Account Verification Succefull", `/${update.role}_dashboard.html`)
  } else {
  throw new Error()
}
}
}catch(er){
    console.log(er)
   sendMessage(res, "Account Verification Failed", `/login.html`, "/images/failure.png")
}
});

app.get("/dashboard", authorize, async (req, res) => {
    try {
        const { id, email } = req.user;
        let user = await User.findById(id.toString())

        
        
      
        if (!user || !user.verified) {
            res.json({
                found: false,
                redirect: !user ? "login.html" : "verify.html"
            });
           
            log("redirecting", "warning")
            return
        }

        let chats = await Chat.find({
            $or: [
                {
                    peoples: {
                        $in: [id.toString()]
                    }
                },
                {
                    type: "universal"
                }
            ]
        }).populate("peoples", "_id name bio lastSeen profilePic")
        
        console.log(chats)
      
        
        chats = chats.map(chat => chat.toObject());
        const chatIds = chats.map(chat => chat._id);
      
        let messages = await Message.find({
            to: { $in: chatIds }
        }).populate("from", "_id name")

        messages = messages.map(message => message.toObject());

        // adding new messages, messages , and other properties json
        chats = chats
            .map(chat => {
                chat = chat.toObject()
                chat.messages =
                    messages.filter(
                        message => message.to.toString() == chat._id.toString()
                    ) || [];

                chat.peoples = chat.peoples.map(person => {
                    if (person._id == id.toString()) isOnline(person._id)
                    return person;
                });
               
                return chat;
            })
            .sort((a, b) => +b.updateTime - +a.updateTime);
            
           
        log("dashboard loaded");
        // we dont send password 
       // user = user.toObject()
        delete user.password;
        res.json({ 
            chats,
            userInfo: user,
            found: true
        });
        
    } catch (er) {
        log(er, "bad")
        res.json({
            found: false,
            redirect: "login.html"
        })
    }
});


// basic  account setting
app.post("/setting/basic/update", authorize, upload.single("profilePic"), async (req, res) => {
    try{
        const {id, email} = req.user;
        const updates = JSON.parse(req.body.updates)
        const profilePic = req.file;
        
        
        
        
        let user = await User.findById(id.toString())

        
        
        
        if(!user) return res.json({
            updated: false,
            message: "user doesn't exist"
        })
        
        
       if(updates.email !== user.email || updates.phone !== user.phone){
           // they have there own routes, /update/verify
            return res.json({
                updated: false,
                message: "such update requires email verification"
            })
        }
        
        const lastState = user.toObject();
        
        // user can update his name, city, bio, gender here others require email verification
        user.name = updates.name;
        user.country = updates.country;
        user.bio = updates.bio;
        user.gender = updates.gender;
        
        if(profilePic){
            let fileData
            if(user.profilePic){
                fileData = await rewriteFile(profilePic, user.profilePic.url)
            }else{
                fileData = await uploadFile(profilePic, "images")
            }
            user.profilePic = fileData
        }
        
        await user.save();
        const updatedField = [];
        
        Object.keys(lastState).forEach(k => {
            if(lastState[k] !== user[k]) updatedField.push(user[k])
        })
        
        res.json({
            updated: true,
            user,
            message: "Account Settings Updated"
        })
        
        
        
        /*
        // create and emit the messages to all his groups 
        const socket = getSocket(id.toString());
        if(socket){
        const systemMessage = await Message.create({
            from: id,
            to: socket.io.groupIds,
            flag: "account setting",
            type: "system",
            content: JSON.stringify(updatedField)
        })
        
          
            socket.to(socket.io.groupIds).emit("account setting updated", systemMessage)
        }*/
    }catch(er){
        log(er, "bad")
        res.json({
            updated: false,
            message: "unexpected error"
        })
    }
})


// updating sensitive settings 
app.post("/setting/sensitive/update", authorize, async (req, res) => {
    try{
        
    }catch{
        
    }
})


// resetting your password in case of forgetting
// this requires email or phone and link confirmation
app.post("/password/reset", async (req, res) => {
    try{
       const {cresidential, password} = req.body;
       const user = await User.findOne({ 
           $or: [
               {
                  email: cresidential
               },
               {
                 phone: cresidential
               }
           ]
       });
       
       if(!user) return res.json({
           reseted: false,
           message: "this user doesnt exist"
       })
       
       // create token for it 
       const confirmToken = await createToken({
           password,
           email: user.email
       }, TOKEN_EXPIRE_TIME)
       
       sendMailConfirmation(user.email, req, status => {
           res.json({
               reseted: status,
               message: status ? "to reset your password click the link sent to your email" : "fail to send reset link, unexpected"
           })
       }, "Snet Password Reset Link", 
       "Reset Password", 
       "Please Click On The Link Below To Reset Your Account Password", 
       `${req.protocol}://${req.domain}/api/user/password/reset?token=${confirmToken}`)
        
    }catch(er){
        log(er, "bad")
        res.json({
            reseted: false,
            message: "unexpected error"
        })
    }
})


// resetting password when email link is clicked
app.get("/password/reset", async (req, res) => {
    try{
        const {token} = req.query;
        const user = await getTokenData(token);
        
        if(!user){
            return res.redirect("/login.html")
        }
        
        const hashedPassword = await hash(user.password);
        const update = await User.updateOne({
            email: user.email
        },{
            $set: {
                password: hashedPassword
            }
        }, {
            new: true
        })
        
 if (update) {
    log("password resetted", "warning");
    sendMessage(res, "Password Resetted Succefully", update.verified ? `/${update.role}_dashboard.html` : "/verify.html")
   } else {
    throw new Error()
}
    }catch{
        sendMessage(res, "Password Reset Failed", "/login.html", "/images/failure.png")
    }
})


// in setting need to retrive user info 
app.get("/info", async (req, res) => {
    try {
        log("yes")
        const {token} = req.query;
        const data = await getTokenData(token);
        const user = await User.findById(data.id.toString())

        
        if(!user) return res.redirect("/login.html")
        res.json({
            info: user
        })
    }catch(er){
        log(er, "bad")
        res.redirect("/login.html")
    }
})


export default app;
