// Exporting the update token functionality to update access token

module.exports.UpdateToken = async (req,res)=>{
   
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
}