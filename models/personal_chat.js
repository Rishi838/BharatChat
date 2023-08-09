const mongoose = require("mongoose");
require("dotenv").config();
// Connecting to database
mongoose
  .connect(process.env.DB)
  .then(() => {
    console.log("Personal Chat Database Connected");
  })
  .catch((e) => {
    console.log(e);
    console.log("Personal Chat Database Falied");
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
  Participants: {
    type: Map,
    of: Number,
  },
  Messages: [messageSchema], // Each message in the array follows the messageSchema
  LastChat: { type: Date, default: Date.now }
});
const collection = new mongoose.model("Personal-Chat", chatschema);
module.exports = collection;
