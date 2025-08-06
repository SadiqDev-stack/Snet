import User from "../models/user.js";
import { decompressData, checkCache, compareHashes } from "../helper.js";
import {log} from "../middlewares/logger.js"

export default async (req, res, next) => {
    try {
        const { email, password } = req.body;
       
        // check if email match
        const user = await checkCache(`users:${email}`) || await User.findOne({
            email
        })
       
    
   console.log(user)
    if(!user || user == null || user == undefined){
            res.json({
                message: "User With This Email Doesnt Exist",
                found: false
            });
            
            log("user with email doesnt exist", "bad")
            return
}


        const isCorrectPassword = await compareHashes(password, user.password);
        if (!isCorrectPassword)
            return res.json({
                message: "Incorrect Password",
                found: false
            });
            
        user.bio = decompressData(user.bio)
        req.user = user;
        next();
    } catch (er) {
        log(er, "bad");
        res.status(400).json({
            message: "unexpected errror occured"
        });
    }
};
