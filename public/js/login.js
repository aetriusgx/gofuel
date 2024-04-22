const usernameField = document.querySelector('#inputUsername');
const passwordField = document.querySelector('#inputPassword');

// document.querySelector('#loginSubmit').addEventListener('click', loginInputValidation);

usernameField.addEventListener('input', loginInputValidation);
passwordField.addEventListener('input', loginInputValidation);

function loginInputValidation() {
	if ((usernameField.value.length >= 5 && usernameField.value.length <= 12) && (passwordField.value.length >= 8 && passwordField.value.length <= 20)) {
		document.querySelector("#loginSubmit").disabled = false;
	} else {
		document.querySelector("#loginSubmit").disabled = true;	
	}
}
