const mongoose = require("mongoose");
require("dotenv").config();
// Connecting to database
mongoose
  .connect(process.env.DB)
  .then(() => {
    console.log("User Database connected");
  })
  .catch((e) => {
    console.log(e);
    console.log("User Database Falied");
  });
//Creating a new schema
const userschema = new mongoose.Schema({
  //Name of user
  Name: {
    type: String,
    required: true,
  },
  // email of user
  Email: {
    type: String,
    required: true,
    unique: true,
  },
  Password: {
    type: String,
    required: true,
  },
  IsEmailVerified: {
    type: Boolean,
    default: false,
  },
  EmailToken: {
    type: String,
    default: null,
  },
  ExpiresAt: {
    type: Date,
    required: true,
  }
});
const collection = new mongoose.model("Users", userschema);
module.exports = collection;
