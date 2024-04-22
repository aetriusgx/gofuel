const fullNameField = document.querySelector('#inputName');
const usernameField = document.querySelector('#inputUsername');
const passwordField = document.querySelector('#inputPassword');
const retypeField = document.querySelector('#inputRetype');

// document.querySelector('#loginSubmit').addEventListener('click', loginInputValidation);

fullNameField.addEventListener('input', loginInputValidation);
passwordField.addEventListener('input', loginInputValidation);
retypeField.addEventListener('input', loginInputValidation);

function loginInputValidation() {
	if ((fullNameField.value.length > 0) && (usernameField.value.length >= 5 && usernameField.value.length <= 12) &&
		(passwordField.value.length >= 8 && passwordField.value.length <= 20) && 
	   (retypeField.value == passwordField.value)) {
		document.querySelector("#saveButton").disabled = false;
	} else {
		document.querySelector("#saveButton").disabled = true;	
	}
}
