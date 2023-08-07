// Importing required modules

const express = require('express')
const router = express.Router()

// Route to update access token

router.post("/update-access-token",async (req,res)=>{

  console.log("Here: " ,req.body.acessToken)
   
    //  Checking whether an access token was attached to the req field or not
 
    if(req.body.acessToken==null)
    return res.status(404).json({message : "No Access Token Specified"})

    // setting access-token cookie

    res.cookie("access_token", req.body.acessToken, {
        // secure: true,
        httpOnly: true,
        sameSite: "lax",
      });
      
    // Returning status code of 200

    return res.status(200).json({message : "Cookie updated successfully"})
})

module.exports = router