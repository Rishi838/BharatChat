const mongoose = require("mongoose");
require("dotenv").config();
// Connecting to database
mongoose
  .connect(process.env.DB)
  .then(() => {
    console.log("Chat Database Connected");
  })
  .catch((e) => {
    console.log(e);
    console.log("Chat Database Falied");
  });
// Creating a message schema
const messageSchema = new mongoose.Schema({
  Sender: { type: String, required: true },
  Content: { type: String, required: true },
  ReadStatus: {
    type: Map,
    of: String,
  },
  Timestamp: { type: Date, default: Date.now },
});
//Creating a new schema
const chatschema = new mongoose.Schema({
  Type: {
    type: String,
    required: true,
    enum: ["Self", "Personal", "Group"],
  },
  Participants: {
    type: Map,
    of: Number,
  },
  Messages: [messageSchema], // Each message in the array follows the messageSchema
  LastChat: { type: Date, default: Date.now },
  ChatDetails: {
    type: Map,
    of: String,
    default: new Map(),
  },
});
const collection = new mongoose.model("Chats", chatschema);
module.exports = collection;
