import mongoose from "mongoose";
const { Schema } = mongoose;
const { ObjectId } = mongoose.Types;
import model from "./model.js"

const pending = new Schema({
  from: {
    type: ObjectId
  },
  to: {
    type: Object,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  data: {
    type: Object,
    required: true
  }
})

export default await model("Pending", pending)