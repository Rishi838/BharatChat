// Importing postdata from fetch api
import { postData } from "./fetch_api.js";

// Function to validate user email
function ValidateEmail(mail) {
  if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(mail)) {
    return true;
  }
  return false;
}

export async function login_listner() {
  let data = {
    email: document.getElementById("login_email_id").value,
    password: document.getElementById("login_password").value,
  };
  if (data.email == "" && data.password == "") {
    document.getElementById("login_email_error").innerText =
      "*Please Enter Email";
    document.getElementById("login_pass_error").innerText =
      "*Please Enter PassWord";
    document.getElementById("login_credentials_error").innerText = "";
    return;
  } else if (data.email == "") {
    document.getElementById("login_email_error").innerText =
      "*Please Enter Email";
    document.getElementById("login_password").value = "";
    document.getElementById("login_pass_error").innerText = "";
    document.getElementById("login_credentials_error").innerText = "";
    return;
  } else if (data.password == "") {
    document.getElementById("login_email_error").innerText = "";
    ocument.getElementById("login_credentials_error").innerText = "";
    document.getElementById("login_pass_error").innerText =
      "*Please Enter Password";
    return;
  } else {
    document.getElementById("login_email_error").innerText = "";
    document.getElementById("login_pass_error").innerText = "";
    if (!ValidateEmail(data.email)) {
      document.getElementById("login_email_error").innerText =
        "*Not a Valid Email";
      return;
    } else {
      console.log(data)
      let resp = await postData("/login", data);
      console.log(resp)
      if (resp.success == -1) {
        document.getElementById("login_credentials_error").innerText =
          "*Server Error";
        return;
      } else if (resp.success == 0) {
        document.getElementById("login_credentials_error").innerText =
          "*Enter Valid Password and Email";
        return;
      } else if (resp.success == 1) {
       location.href = '/'
      } 
    }
  }
}

export async function signup_listner() {
  let data = {
    name: document.getElementById("signup_name").value,
    email: document.getElementById("signup_email").value,
    password: document.getElementById("signup_pass").value,
  };
  if (data.email == "" && data.name == "" && data.password == "") {
    document.getElementById("signup_credentials_error").innerText = "";
    document.getElementById("signup_email_error").innerText =
      "*Please Enter Email";
    document.getElementById("signup_name_error").innerText =
      "*Please Enter Name";
    document.getElementById("signup_pass_error").innerText =
      "*Please Enter Password";
    return;
  } else if (data.email == "" && data.name == "") {
    document.getElementById("signup_email_error").innerText =
      "*Please Enter Email";
    document.getElementById("signup_name_error").innerText =
      "*Please Enter Name";
    document.getElementById("signup_pass_error").innerText = "";
    document.getElementById("signup_credentials_error").innerText = "";
    return;
  } else if (data.email == "" && data.password == "") {
    document.getElementById("signup_email_error").innerText =
      "*Please Enter Email";
    document.getElementById("signup_name_error").innerText = "";
    document.getElementById("signup_pass_error").innerText =
      "*Please Enter Password";
    document.getElementById("signup_credentials_error").innerText = "";
    return;
  } else if (data.password == "" && data.name == "") {
    document.getElementById("signup_email_error").innerText = "";
    document.getElementById("signup_name_error").innerText =
      "*Please Enter Name";
    document.getElementById("signup_pass_error").innerText =
      "*Please Enter Password";
    return;
  } else if (data.password == "") {
    document.getElementById("signup_email_error").innerText = "";
    document.getElementById("signup_name_error").innerText = "";
    document.getElementById("signup_pass_error").innerText =
      "*Please Enter Password";
    document.getElementById("signup_credentials_error").innerText = "";
    return;
  } else if (data.name == "") {
    document.getElementById("signup_email_error").innerText = "";
    document.getElementById("signup_name_error").innerText =
      "*Please Enter Name";
    document.getElementById("signup_pass_error").innerText = "";
    document.getElementById("signup_credentials_error").innerText = "";
    return;
  } else if (data.email == "") {
    document.getElementById("signup_email_error").innerText =
      "*Please Enter Email";
    document.getElementById("signup_name_error").innerText = "";
    document.getElementById("signup_pass_error").innerText = "";
    document.getElementById("signup_credentials_error").innerText = "";
    return;
  } else {
    if (!ValidateEmail(data.email)) {
      document.getElementById("signup_email_error").innerText =
        "*Not a Valid Email";
      document.getElementById("signup_pass_error").innerText = "";
      document.getElementById("signup_name_error").innerText = "";
      document.getElementById("signup_credentials_error").innerText = "";
      return;
    } else {
      let res = await postData("/signup", data);
      document.getElementById("signup_pass_error").innerText = "";
      document.getElementById("signup_name_error").innerText = "";
      document.getElementById("signup_email_error").innerText = "";
      if (res.success == 0) {
        document.getElementById("signup_credentials_error").innerText =
          "*User Already Exists with this email";
        return;
      } else if (res.success == -1) {
        document.getElementById("signup_credentials_error").innerText =
          "*Some Error Occured, Check Your Credentials or Server Error";
        return;
      } else if (res.success == 1) {
        document.getElementById("signup_credentials_error").innerText =
          "An email has been sent to your mail with verification mail, It will be valid for 10 min only";
        document.getElementById("signup_credentials_error").style.color =
          "green";
      }
    }
  }
}
