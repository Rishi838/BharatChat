// Importing login controllers
import {  login_listner,  signup_listner} from '../frontend_utils/login_script.js'

// Fetching up buttons for sliders
const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container');



// Adding listner to sliders
signUpButton.addEventListener('click', () => {
	container.classList.add("right-panel-active");
});

signInButton.addEventListener('click', () => {
	container.classList.remove("right-panel-active");
});
// Adding Event Listner to login and signup
document.getElementById('login').addEventListener('click',login_listner);
document.getElementById('signup').addEventListener('click',signup_listner);