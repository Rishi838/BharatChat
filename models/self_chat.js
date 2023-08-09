const mongoose = require("mongoose");
require("dotenv").config();
// Connecting to database
mongoose
  .connect(process.env.DB)
  .then(() => {
    console.log("Self Chat Database Connected");
  })
  .catch((e) => {
    console.log(e);
    console.log("Self Chat Database Falied");
  });
// Creating a message schema
const messageSchema = new mongoose.Schema({
  Content: { type: String, required: true },
  Timestamp: { type: Date, default: Date.now },
});
//Creating a new schema
const chatschema = new mongoose.Schema({
  UserId : {
    type:String,
    unique:true,
    required : true
  },
  Messages: [messageSchema], // Each message in the array follows the messageSchema
  LastChat: { type: Date, default: Date.now }
});
const collection = new mongoose.model("Self-Chat", chatschema);
module.exports = collection;
