// Importing required packages

const user_login = require("../models/user");
const self_chat = require("../models/self_chat");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// To access environement variables

require("dotenv").config();

// Setting up transportation system for mails

let mailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "shopnetauthorisation@gmail.com",
    pass: "yuvyxsnyhiyakuse",
  },
});

// Controller for signup api

module.exports.signup = async (req, res) => {
  try {
    // Checking all details required for signing up is given

    if (!req.body.email || !req.body.password || !req.body.name)
      return res
        .status(404)
        .json({ success: -1, message: "Enter All credentials properly" });

    //   Existing user check

    const check = await user_login.findOne({ Email: req.body.email });

    // Creating an email template with the random otp

    let x = Math.floor(100000 + Math.random() * 900000);

    let VerificationLink = `https://expresschat-v6mg.onrender.com/verify?email=${req.body.email}&token=${x}`;
    var emailHTML = `
           <html>
           <body>
           <h1>Account Verification</h1>
           <p>Please click the following link to verify your account:</p>
           <a href="${VerificationLink}">Verify Account</a>
           </body>
           </html>
          `;

    // Changing link to otp is the request was made from the android application

    if (req.body.source === "app") {
      emailHTML = `
      <html>
      <body>
      <h1>Account Verification</h1>
      <p>Please Find Your OTP for BharatChat Verification</p>
      <h3>OTP : ${x}</h3>
      </body>
      </html>
     `;
    }

    // Addrssing all possible case
    if (check && check.IsEmailVerified == false) {
      // User Exist but is unverified

      let mailDetails = {
        from: "shopnetauthorisation@gmail.com",
        to: req.body.email,
        subject: "Authorization for ShopNet",
        html: emailHTML,
      };

      //  Sending Mail

      mailTransporter.sendMail(mailDetails, function (err, data) {
        if (err) {
          return res.status(400).json({
            success: -1,
            message: "Email Don't Exist, Enter a Valid Email",
          });
        } else {
          return res.status(200).json({
            success: 1,
            message: "Authentication mail sent successfully again to the user",
          });
        }
      });

      // Update User Details in database with new otp and expiration time
      check.EmailToken = x;
      const expirationTime = new Date();
      expirationTime.setSeconds(expirationTime.getSeconds() + 600);
      check.ExpiresAt = expirationTime;
      const hash_pass = await bcrypt.hash(req.body.password, process.env.SALT);
      check.Password = hash_pass;
      await check.save();
    } else if (check && check.IsEmailVerified) {
      //  Addrssing case when verified user already exists

      return res
        .status(404)
        .json({ message: "User Already Exists", success: 0 });
    } else {
      //  In this case, user does not exist, crating a new one

      // Hashing password before storing

      const hash_pass = await bcrypt.hash(req.body.password, process.env.SALT);

      // Setting expiration time for OTP

      const expirationTime = new Date();
      expirationTime.setSeconds(expirationTime.getSeconds() + 600);

      // Creating a new user

      let resp = await user_login.create({
        Name: req.body.name,
        Email: req.body.email,
        Password: hash_pass,
        EmailToken: x,
        ExpiresAt: expirationTime,
      });

      // Sending Verificaion Email

      let mailDetails = {
        from: "shopnetauthorisation@gmail.com",
        to: req.body.email,
        subject: "Authorization for ShopNet",
        html: emailHTML,
      };
      mailTransporter.sendMail(mailDetails, function (err, data) {
        if (err) {
          return res.status(400).json({
            success: -1,
            message: "Email Don't Exist, Enter a Valid Email",
          });
        } else {
          return res.status(200).json({
            success: 1,
            message: "Authentication mail sent successfully",
          });
        }
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({ success: -1, message: "Email Dont Exist" });
  }
};

// Controller to hit login api

module.exports.login = async (req, res) => {
  try {
    // Checking if email & password are specified

    if (!req.body.email || !req.body.password)
      return res.status(404).json({ success: -1, msg: "Bad request" });

    //   Existing user check
    const user = await user_login.findOne({ Email: req.body.email });

    if (!user) {
      return res.status(404).json({ success: 0, message: "NO Such User" });
    }

    // checking case when user exist but is not verified

    if (user.IsEmailVerified == false) {
      return res
        .status(404)
        .json({ success: -2, message: "Account Exist but Email not verified" });
    }

    // Cheking Password is correct or not

    const compare_pass = await bcrypt.compare(req.body.password, user.Password);

    // Handling case when passwords dont match
    if (!compare_pass) {
      return res.json({ success: 0, message: "Incorrect PassWord" });
    }

    // Generating Tokens

    const acesstoken = jwt.sign(
      { email: req.body.email },
      process.env.ACCESS_TOKEN_PRIVATE_KEY,
      { expiresIn: "1000" }
    );
    const refreshtoken = jwt.sign(
      { email: req.body.email },
      process.env.REFRESH_TOKEN_PRIVATE_KEY,
      { expiresIn: "2592000000s" }
    );
    await user.save();

    // Setting up  token cookie in response

    res.cookie("refresh_token", refreshtoken, {
      // secure: true,
      httpOnly: true,
      sameSite: "lax",
    });
    res.cookie("access_token", acesstoken, {
      // secure: true,
      httpOnly: true,
      sameSite: "lax",
    });

    return res
      .status(200)
      .json({ success: 1, message: "User Logged in succcessfully" });
  } catch (error) {
    console.log(error);
    return res.json({ success: -1, message: "Some Error Occured" });
  }
};

// Controller to verify mail

module.exports.verify = async (req, res) => {
  try {
    // Finding what was the source of this call

    const source = req.query.source;

    // Finding whether a user combo exists with the combo of email and email token
    const user = await user_login.findOne({
      Email: req.query.email,
      EmailToken: req.query.token,
      IsEmailVerified: false,
    });

    // If its not a valid token,return because we cant verify it

    if (!user || new Date() > user.ExpiresAt)
      return res
        .status(400)
        .json({ success: 0, message: "Token Expired or not a valid token" });

    // Now the token is verified , so check EmailVerified as True and erase the verification token that is generated

    user.EmailToken = null;
    user.IsEmailVerified = true;

    // Creating access and refresh token

    // Validity of access token is 15 min

    const access_token = await jwt.sign(
      { email: req.query.email },
      process.env.ACCESS_TOKEN_PRIVATE_KEY,
      { expiresIn: "1000" }
    );

    // Validity of refresh token is 30days

    const refresh_token = await jwt.sign(
      { email: req.query.email },
      process.env.REFRESH_TOKEN_PRIVATE_KEY,
      { expiresIn: "2592000000" }
    );
    await user.save();

    // Returning cookies as response

    res.cookie("refresh_token", refresh_token, {
      // secure: true,
      httpOnly: true,
      sameSite: "lax",
    });
    res.cookie("access_token", access_token, {
      // secure: true,
      httpOnly: true,
      sameSite: "lax",
    });

    //  Creating self chat for the user at the time of verification

    const result = await self_chat.create({
      UserId : user._id,
      Messages: [],
      LastChat: Date.now(),
    });

    // Self Chat Creation Successfull

    // Returning success as 1 if source was android

    if (source === "app") {
      return res.status(200).json({
        success: 1,
        message: "User Verified and Cookies are returned in response",
      });
    }

    // Else returning the verify webpage

    return res.render("email_verify");
  } catch (error) {
    console.log("Error Verifying Email: ", error);
    return res
      .status(400)
      .json({ success: -1, message: "SERVER ERROR OCCURED" });
  }
};

// Controller to resend verification mail when token is expired

module.exports.resend = async (req, res) => {
  try {
    // Checking if an email was provided or not

    if (!req.body.email)
      return res
        .status(404)
        .json({ message: "Email Not Specified", success: -1 });

    // Checking Account with this email

    const user = await user_login.findOne({ Email: req.body.email });

    if (!user) {
      //Handling case if user dont exist

      return res
        .status(404)
        .json({ message: "No user with this email exists", success: -1 });
    } else if (user.IsEmailVerified) {
      // Handling case if email was already verified

      return res
        .status(404)
        .json({ message: "Email Already Verified", success: 0 });
    } else {
      // Generating a Random OTP
      let x = Math.floor(100000 + Math.random() * 900000);

      // Making verification email for web

      let VerificationLink = `https://expresschat-v6mg.onrender.com/verify?email=${req.body.email}&token=${x}`;
      var emailHTML = `
         <html>
         <body>
         <h1>Account Verification</h1>
         <p>Please click the following link to verify your account:</p>
         <a href="${VerificationLink}">Verify Account</a>
         </body>
         </html>
        `;

      // Changing mail is source was android

      if (req.body.source === "app") {
        emailHTML = `
      <html>
      <body>
      <h1>Account Verification</h1>
      <p>Please click the following link to verify your account:</p>
      <h3>OTP : ${x}</h3>
      </body>
      </html>
     `;
      }
      let mailDetails = {
        from: "learnandearn419@gmail.com",
        to: req.body.email,
        subject: "Authorization for ShopNet",
        html: emailHTML,
      };

      // Saving updted details

      const expirationTime = new Date();
      expirationTime.setSeconds(expirationTime.getSeconds() + 600);
      user.EmailToken = x;
      user.ExpiresAt = expirationTime;
      await user.save();

      //  Sending Mail

      mailTransporter.sendMail(mailDetails, function (err, data) {
        if (err) {
          res.status(400).json({ success: -1, message: "Email Dont Exist" });
        } else {
          res.status(200).json({
            success: 1,
            message: "Verification Link Sent Succesfully",
          });
        }
      });
    }
  } catch (error) {
    res.status(400).json({ success: -1, message: "Server Error" });
  }
};

// Controller to logout user , It should be executed only from web application as only here tokens are stored in cookies

module.exports.logout = async (req, res) => {
  // Fetching Access and Refresh Token

  const refresh_token = req.cookies.refresh_token;
  const access_token = req.cookies.access_token;

  // Deleting Tokens if they exist

  if (access_token) res.clearCookie("access_token");
  if (refresh_token) res.clearCookie("refresh_token");

  return res.status(200).json({ message: "User Logged out successfully" });
};
