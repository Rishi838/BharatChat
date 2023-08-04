// Importing required packages
const user_login = require("../models/user");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// To access environement variables
require("dotenv").config();

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
    console.log(check)
    // If user already exists,return status 400
    // Creating an email template with the random otp
    let x = Math.floor(100000 + Math.random() * 900000);
    let VerificationLink = `https://bharatchat.onrender.com/verify?email=${req.body.email}&token=${x}`;
    var emailHTML = `
           <html>
           <body>
           <h1>Account Verification</h1>
           <p>Please click the following link to verify your account:</p>
           <a href="${VerificationLink}">Verify Account</a>
           </body>
           </html>
          `;
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
    if (check && check.IsEmailVerified == false) {
      console.log("UserExist but is not verified")
      let mailDetails = {
        from: "shopnetauthorisation@gmail.com",
        to: req.body.email,
        subject: "Authorization for ShopNet",
        html: emailHTML,
      };
      mailTransporter.sendMail(mailDetails, function (err, data) {
        if (err) {
          console.log("Some error occured", err);
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
      console.log("Mail Sent")
      // Update User Details
      check.EmailToken = x;
      const expirationTime = new Date();
      expirationTime.setSeconds(expirationTime.getSeconds() + 600);
      check.ExpiresAt = expirationTime
      const hash_pass = await bcrypt.hash(req.body.password, process.env.SALT);
      check.Password = hash_pass
      console.log("Details Saved")
      await check.save()
    }
    else if (check && check.IsEmailVerified) {
      console.log("user already exists")
      return res
        .status(404)
        .json({ message: "User Already Exists", success: 0 });
    }
    else{
      console.log("Creating new user")
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
    console.log("User Created")
    // Sending Verificaion Email
    let mailDetails = {
      from: "shopnetauthorisation@gmail.com",
      to: req.body.email,
      subject: "Authorization for ShopNet",
      html: emailHTML,
    };
    mailTransporter.sendMail(mailDetails, function (err, data) {
      if (err) {
        console.log("Some error occured", err);
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
    console.log("Mail Sent")
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
    console.log(user)
    if (!user) {
      return res.status(404).json({ success: 0, message: "NO Such User" });
    }
    if(user.IsEmailVerified == false)
    {
      return res.status(404).json({ success: -2, message: "Account Exist but Email not verified" });
    }
    // Cheking Password is correct or not
    const compare_pass = await bcrypt.compare(req.body.password, user.Password);
    if (!compare_pass) {
      return res.json({ success: 0, message: "Incorrect PassWord" });
    }
    // Generating Token

    const acesstoken = jwt.sign(
      { email: req.body.email },
      process.env.ACCESS_TOKEN_PRIVATE_KEY,
      { expiresIn: "900000s" }
    );
    const refreshtoken = jwt.sign(
      { email: req.body.email },
      process.env.REFRESH_TOKEN_PRIVATE_KEY,
      { expiresIn: "2592000000s" }
    );
    user.RefreshToken = refreshtoken;
    await user.save();
    // Setting up  token cookie
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
    // Returning token
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
    const source = req.query.source;
    const user = await user_login.findOne({
      Email: req.query.email,
      EmailToken: req.query.token,
    });
    // If its not a valid token,return because we cant verify it
    if (!user || new Date() > user.ExpiresAt)
      return res
        .status(400)
        .json({ success: 0, message: "Token Expired or not a valid token" });

    // Here the token is verified , so check EmailVerified as True and erase the verification token that is generated
    user.EmailToken = null;
    user.IsEmailVerified = true;
    // Creating access and refresh token
    // Vaalidity of access token is 15 min
    const access_token = await jwt.sign(
      { email: req.query.email },
      process.env.ACCESS_TOKEN_PRIVATE_KEY,
      { expiresIn: "900000s" }
    );
    // Validity of refresh token is 30days
    const refresh_token = await jwt.sign(
      { email: req.query.email },
      process.env.REFRESH_TOKEN_PRIVATE_KEY,
      { expiresIn: "2592000000" }
    );
    await user.save();
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
    if (source === "app") {
      return res.status(200).json({
        success: 1,
        message: "User Verified and Cookies are returned in response",
      });
    }
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
    if (!req.body.email)
      return res
        .status(404)
        .json({ message: "Email Not Specified", success: -1 });
    // Checking Account with this email
    const user = await user_login.findOne({ Email: req.body.email });
    if (!user)
      return res
        .status(404)
        .json({ message: "No user with this email exists", success: -1 });
    if (user.IsEmailVerified)
      return res
        .status(404)
        .json({ message: "Email Already Verified", success: 0 });

    // Generating a Random OTP
    let x = Math.floor(100000 + Math.random() * 900000);
    let VerificationLink = `http://localhost:3000/verify?email=${req.body.email}&token=${x}`;
    var emailHTML = `
         <html>
         <body>
         <h1>Account Verification</h1>
         <p>Please click the following link to verify your account:</p>
         <a href="${VerificationLink}">Verify Account</a>
         </body>
         </html>
        `;
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
    const expirationTime = new Date();
    expirationTime.setSeconds(expirationTime.getSeconds() + 600);
    user.EmailToken = x;
    user.ExpiresAt = expirationTime;
    await user.save()
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
  } catch (error) {
    res.status(400).json({ success: -1, message: "Server Error" });
  }
};
// Controller to validate user from android app(do not use it from the browser for security reasons)
module.exports.validate = async (req, res) => {
  try {
    if (req.body.source !== "app")
      return res
        .status(404)
        .json({ validate: 0, message: "Request was not from valid source" });
    // Extract the access token from the cookies of request
    const AccessToken = req.body.access_token;
    // Check if the token is provided or not
    if (!AccessToken) {
      return res
        .status(404)
        .json({ status: 401, message: "Access token not found.", validate: 0 });
    }
    // Verify the access token
    jwt.verify(
      AccessToken,
      process.env.ACCESS_TOKEN_PRIVATE_KEY,
      async (err, decoded) => {
        if (err) {
          console.log("Here", err);
          // Token is expired or invalid
          if (err.name === "TokenExpiredError") {
            try {
              // Retrieve the refresh token from the request body or headers

              const refreshToken = req.body.refresh_token;
              if (!refreshToken) {
                return res.status(404).json({
                  status: 401,
                  message:
                    "Acces token expired and no refresh token is specified",
                  validate: 0,
                });
              }

              // Verify the refresh token
              const refreshDecoded = jwt.verify(
                refreshToken,
                process.env.REFRESH_TOKEN_PRIVATE_KEY
              );
              // Retrieve the user associated with the refresh token
              const user = await user_login.findOne({
                Email: refreshDecoded.email,
              });
              if (!user) {
                return res.status(404).json({
                  status: 401,
                  message:
                    "No user is associated with this combination of tokens",
                  validate: 0,
                });
              }
              // Generate a new access token
              const newAccessToken = jwt.sign(
                { email: user.Email },
                process.env.ACCESS_TOKEN_PRIVATE_KEY,
                { expiresIn: "900000s" }
              );
              // Attach the new access token to the cookies
              res.cookie("access_token", newAccessToken, {
                // secure: true,
                httpOnly: true,
                sameSite: "lax",
              });
              return res.status(200).json({
                validate: 2,
                message:
                  "Access token was expired but a valid refresh token was provided , so a new access token is returned as cookie along with user Id",
                userId: user._id,
              });
            } catch (error) {
              console.log(error);
              return res
                .status(404)
                .json({ message: "SERVER ERROR", validate: 0 });
            }
          } else {
            // Token is invalid
            return res
              .status(404)
              .json({ message: "Invalid Tokens", validate: 0 });
          }
        } else {
          // Token is valid
          // Retrieve the user associated with the token
          const user = await user_login.findOne({ Email: decoded.email });
          if (!user) {
            return res
              .status(404)
              .json({ message: "Invalid Access token", validate: 0 });
          }
          // Attach the user object to the request for further use
          return res.status(200).json({
            validate: 1,
            message:
              "Acces token was valid , So no token was returned but userId was returned",
            userId: user._id,
          });
        }
      }
    );
  } catch (error) {
    console.log("Error verifying token:", error);
    return res
      .status(404)
      .json({ message: "SERVER ERROR OCCURED", validate: 0 });
  }
};

// Controller to logout user , It should be executed only from web application as only here tokens are stored in cookies
module.exports.logout = async (req, res) => {
  const refresh_token = req.cookies.refresh_token;
  const access_token = req.cookies.access_token;
  if (access_token) res.clearCookie("access_token");
  if (refresh_token) res.clearCookie("refresh_token");
  return res.status(200).json({ message: "User Logged out successfully" });
};
