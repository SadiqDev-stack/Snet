import mongoose from "mongoose";
const { Schema } = mongoose;
const { ObjectId } = mongoose.Types;
import model from "./model.js"

const Message = new Schema({
    from: { type: ObjectId, ref: "User", required: true },
    to: { type: ObjectId, ref: "Chat", required: true },
    content: { type: String, required: true },
    seenBy: [{ type: ObjectId, ref: "User" }],
    type: { type: String, enum: ["message", "reply", "system", "audio", "video", "image"], required: true, default: "message" },
    createdAt: { type: String, default: () => Date.now(), immutable: true },
    repliedTo: { type: ObjectId, ref: "Message" },
    deleted: { type: ObjectId },
    flag: { type: String, enum: ["message", "left", "joined", "blocked", "unblocked", "setting", "account setting"], default: "message" },
    action: { type: String, enum: ['edited', 'deleted', 'delivered'] }
},
 {
   versionKey: false
 }
);

Message.post('save', function(doc) {
  return 
  doc.populate('from', '_id name')
    .then(() => doc.populate({
      path: 'repliedTo',
      select: '_id content',
      populate: {
        path: 'from',
        select: '_id name'
      }
    }));
});

// Populate fields
Message.pre('find', function(next) {
    this.populate('from', '_id name');
    this.populate({
        path: 'repliedTo',
        select: '_id content',
        populate: {
            path: 'from',
            select: '_id name'
        }
    })
    this.sort({
        createdAt: 1
    })
    next();
});

Message.pre('findOne', function(next) {
    this.populate('from', '_id name');
    this.populate({
        path: 'repliedTo',
        select: '_id content',
        populate: {
            path: 'from',
            select: '_id name'
        }
    });
    next();
});


Message.index({ to: 1, createdAt: -1 }); // chat messages by newest first
Message.index({ from: 1 });
Message.index({ repliedTo: 1 });
Message.index({ type: 1 });
Message.index({ flag: 1 });
export default await model("Message", Message);