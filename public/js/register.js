const fullNameField = document.querySelector("#inputFullName");
const emailField = document.querySelector("#inputEmail");
const usernameField = document.querySelector("#inputUsername");
const passwordField = document.querySelector("#inputPassword");
const retypeField = document.querySelector("#inputRetypePassword");

const toastTrigger = document.getElementById('liveToastBtn');
const toastLiveExample = document.getElementById('liveToast');


[fullNameField, emailField, usernameField, passwordField, retypeField].forEach((selector) => {
	selector.addEventListener('input', inputRegisterValidation);
});

function inputRegisterValidation() {

	if ((fullNameField.value.length > 0) && (emailField.value.length > 0) && 
	   (usernameField.value.length >= 5 && usernameField.value.length <= 12) &&
	   (passwordField.value.length >= 8 && passwordField.value.length <= 20) &&
	   (retypeField.value == passwordField.value)) {
		document.querySelector("#registerSubmit").disabled = false;
	}
	else document.querySelector("#registerSubmit").disabled = true;
}

if (status !== undefined && !status) {
  	const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastLiveExample)
	toastBootstrap.show()
}
