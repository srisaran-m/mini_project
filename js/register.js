const registerForm = document.getElementById("registerForm");
registerForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const phone = document.getElementById("phone").value;
    const userId = document.getElementById("userId").value;
    const password = document.getElementById("password").value;
    const userData = {
        name: name,
        email: email,
        phone: phone,
        userId: userId,
        password: password
    };
    localStorage.setItem("user", JSON.stringify(userData));
    alert("Registered successfully! Now go to login page");
    registerForm.reset();
    window.location.href = "../pages/login.html";
});