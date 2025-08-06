import mongoose from "mongoose";
const { Schema } = mongoose;
import model from "./model.js";

const { ObjectId } = mongoose.Types;
const Chat = new Schema({
    type: {
        type: String,
        enums: ["group", "private", "official"],
        default: "group"
    },
    groupDescription: {
        type: String,
        maxLength: 100,
    },
    groupName: {
        type: String,
    },
    groupPic: {
    url: { type: String },
    size: { type: Number },
    name: { type: String },
    default: {}
    },
    peoples: {
        type: [ObjectId],
        ref: "User",
        required: true
    },
    messageAllowed: {
        type: Boolean,
        default: true
    },
    for: {
        type: String,
        enums: ["friends", "private", "public", "official"],
        default: "private"
    },
    createdBy: {
        type: ObjectId,
        ref: "User"
    },
    createdAt: {
        type: String,
        default: () => Date.now(),
        immutable: true
    },
    updateTime: {
        type: String,
        default: Date.now()
    },
    blockedPeoples: {
        type: Array,
        default: []
    },
    suspended: {
        type: String
    }
}, {
    versionKey: false
});


Chat.index({ peoples: 1 });
Chat.index({ createdBy: 1 });
Chat.index({ for: 1, type: 1 }); // compound
Chat.index({ updateTime: -1 }); // latest updated chats

export default await model("Chat", Chat);


