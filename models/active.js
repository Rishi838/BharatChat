const mongoose = require("mongoose");
require("dotenv").config();
// Connecting to database
mongoose
  .connect(process.env.DB)
  .then(() => {
    console.log("Active User Database Connected");
  })
  .catch((e) => {
    console.log(e);
    console.log("Active user Database Falied");
  });
//Creating a new schema
const activeschema = new mongoose.Schema({
   user : {
    type: String,
    required: true,
    unique:true
   },
   socket : {
    type: String,
    required:true,
    unique:true
   }
});
const collection = new mongoose.model("Active", activeschema);
module.exports = collection;
