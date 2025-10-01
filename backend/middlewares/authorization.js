
import { getTokenData } from "../helper.js";
import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId;

export default async (req, res, next) => {
    try {
        const { token } = req.headers;
        
        if (!token) {
            throw new Error();
        }
        
        const userData = await getTokenData(token);
        if(!userData){
            throw new Error()
        }
        
        
        userData.id = new ObjectId(userData.id);
        req.user = userData;
        req.user._id = userData.id.toString()
        
        next();
    } catch (er) {
        res.redirect("/login.html");
    }
};
