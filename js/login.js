const loginForm = document.getElementById("loginForm");
loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const savedUser = localStorage.getItem("user");
    if (savedUser === null) {
        alert("No user found. Please register first.");
        return;
    }
    const userData = JSON.parse(savedUser);
    if (
        email === userData.email &&
        password === userData.password
    ) {
        alert("Login successful!");
        window.location.href = "../pages/dashboard.html";
    }
    else {
        alert("Invalid email or password.");
    }
});