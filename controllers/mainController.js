// Importing required modules

const express = require('express')
const router = express.router()

// Route to update access token

router.post("update-access-token",async (req,res)=>{
    console.log(req.body)
    if(req.body.acesstoken==null)
    return res.status(404).json({message : "No Access Token Specified"})
    res.cookie("access_token", req.body.acesstoken, {
        // secure: true,
        httpOnly: true,
        sameSite: "lax",
      });
      console.log("set")
    return res.status(200).json({message : "Cookie updated successfully"})
})