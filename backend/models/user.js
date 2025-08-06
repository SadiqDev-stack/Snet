import mongoose from "mongoose";
const { Schema } = mongoose;
import model from "./model.js"
const { ObjectId } = mongoose.Types;

const User = new Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    role: { type: String, enum: ["user", "ceo"], default: "user" },
    password: { type: String, required: true },
    bio: { type: String, required: true },
    country: { type: String, required: true },
    createdAt: { type: String, default: () => Date.now(), immutable: true },
    verified: { type: Boolean, default: false },
    suspended: { type: String },
    phone: { type: String, maxLength: 11, required: true, unique: true },
    lastSeen: { type: String, default: () => Date.now() },
    gender: {type: String, enums: ["male", "female"], default: "male"},
    profilePic: {
    url: { type: String },
    size: { type: Number },
    name: { type: String },
    default: {}
    }
},{
    versionKey: false
});


User.index({ name: 1 });
User.index({ verified: 1 });
User.index({ role: 1, country: 1 }); // compound
export default await model("User", User);
