// Importing required libraries

const jwt = require("jsonwebtoken");
const User = require("../models/user");
const cookie = require('cookie')

// Impoorting environement variables

require("dotenv").config();

const verifyTokenAndRefresh = async (req, res, next) => {
  try {
 
    // Extracting cookies

    const AccessToken = req.cookies.access_token;

    // Check if the access token is provided or not

    // If not provided , return an error

    if (!AccessToken) {
      return next({ status: 401, message: "Access token not found." , validate:0 });
    }
    
    // Verify the access token
    jwt.verify(
      AccessToken,
      process.env.ACCESS_TOKEN_PRIVATE_KEY,
      async (err, decoded) => {
        if (err) {

          // Handling cases when token is not validated


          // Refreshing it in the case if token is expired

          if (err.name === "TokenExpiredError") {
            try {

              // Retrieve the refresh token from the request body or headers

              const refreshToken = req.cookies.refresh_token;

              // Returning error if refresh token is not specified 

              if (!refreshToken) {
                return next({ status: 401, message: "Access token expired and no refresh token is specified", validate:0 });
              }

              // Verify the refresh token

              const refreshDecoded = jwt.verify(
                refreshToken,
                process.env.REFRESH_TOKEN_PRIVATE_KEY
              );

              // Retrieve the user associated with the refresh token

              const user = await User.findOne({ Email: refreshDecoded.email });

              // If no user is found to be associated, return an error

              if (!user) {
                return next({ status: 401, message: "Access token expired and invalid refresh token",validate:0 });
              }

              // Generate a new access token

              const newAccessToken = jwt.sign(
                { email: user.Email },
                process.env.ACCESS_TOKEN_PRIVATE_KEY,
                { expiresIn: "1000" }
              );

              // Attach the new access token to the cookies

              req.newCookies = {
                accessToken: newAccessToken,
              };

              req.user = user;

              // Moving to the next part of the middleware
              next();
            } catch (error) {
              console.log(error)
              return next({ status: 401, message: "Error Occured While Refreshing token",validate:0 });
            }
          } else {
            
            //  In all other cases, return an error because a faulty token is provided

            return next({ status: 401, message: "Invalid Access token", validate:0  });
          }
        } else {

          // Handling cases when access token is valid

          // Retrieve the user associated with the token

          const user = await User.findOne({ Email: decoded.email });

          // If no user if found, return error

          if (!user) {
            return next({ status: 401, message: "Invalid Access token",validate:0 });
          }

          // Attach the user object to the request for further use

          req.user = user;
          
          //  Moving to next part of the middleware

          next();
        }
      }
    );
  } catch (error) {

    //  Handling error cases

    console.log("Error verifying token:", error);
    return next({ status: 401, message: "Server Error Occured",validate:0 });
  }
};

module.exports = verifyTokenAndRefresh;