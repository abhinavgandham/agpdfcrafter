// register.js
document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.querySelector("#registerForm");

  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await register();
    });
  }
});

const register = async () => {
  const username = document.querySelector("#regUsername").value;
  const password = document.querySelector("#regPassword").value;
  const email = document.querySelector("#regEmail").value;
  const fullName = document.querySelector("#regFullName").value;
  const role = "normal user"; // All new users are normal users by default
  const messageDiv = document.querySelector("#regMessage");

  if (!username || !password || !email) {
    messageDiv.innerHTML = "Please enter username, password, and email";
    setTimeout(() => (messageDiv.innerHTML = ""), 5000);
    return;
  }

  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        username, 
        password, 
        email, 
        fullName, 
        role 
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      messageDiv.innerHTML = "✅ Registration successful! Please check your email for verification.";
      setTimeout(() => (messageDiv.innerHTML = ""), 10000);

      // Show verification form
      showVerificationForm(username);
    } else {
      messageDiv.innerHTML = `❌ ${data.message || 'Registration failed'}`;
      setTimeout(() => (messageDiv.innerHTML = ""), 5000);
    }
  } catch (error) {
    messageDiv.innerHTML = `❌ ${error}`;
    setTimeout(() => (messageDiv.innerHTML = ""), 5000);
  }
};

const showVerificationForm = (username) => {
  const messageDiv = document.querySelector("#regMessage");
  const verificationDiv = document.createElement("div");
  verificationDiv.id = "verificationForm";
  verificationDiv.innerHTML = `
    <h3>Email Verification</h3>
    <p>Please enter the verification code sent to your email:</p>
    <input type="text" id="verificationCode" placeholder="Enter verification code">
    <button onclick="confirmRegistration('${username}')">Verify Email</button>
    <div id="verificationMessage"></div>
  `;
  
  messageDiv.parentNode.insertBefore(verificationDiv, messageDiv.nextSibling);
};

const confirmRegistration = async (username) => {
  const verificationCode = document.querySelector("#verificationCode").value;
  const verificationMessage = document.querySelector("#verificationMessage");

  if (!verificationCode) {
    verificationMessage.innerHTML = "Please enter the verification code";
    setTimeout(() => (verificationMessage.innerHTML = ""), 5000);
    return;
  }

  try {
    const response = await fetch("/api/auth/confirm-registration", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        username, 
        confirmationCode: verificationCode 
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      verificationMessage.innerHTML = "✅ Email verified successfully! You can now login.";
      setTimeout(() => {
        verificationMessage.innerHTML = "";
        // Hide verification form and show login form
        const verificationForm = document.querySelector("#verificationForm");
        if (verificationForm) {
          verificationForm.remove();
        }
        // Switch to login view
        showLoginView();
      }, 3000);
    } else {
      verificationMessage.innerHTML = `❌ ${data.message || 'Verification failed'}`;
      setTimeout(() => (verificationMessage.innerHTML = ""), 5000);
    }
  } catch (error) {
    verificationMessage.innerHTML = `❌ ${error}`;
    setTimeout(() => (verificationMessage.innerHTML = ""), 5000);
  }
};

const showLoginView = () => {
  // Hide registration container and show login container
  const registerContainer = document.querySelector(".register-container");
  const loginContainer = document.querySelector(".login-container");
  
  if (registerContainer) registerContainer.style.display = "none";
  if (loginContainer) {
    // Remove any inline display style to let CSS handle it
    loginContainer.style.display = "";
  }
  
  // Update toggle buttons
  const showLoginBtn = document.querySelector("#showLoginBtn");
  const showRegisterBtn = document.querySelector("#showRegisterBtn");
  
  if (showLoginBtn) showLoginBtn.classList.add("active");
  if (showRegisterBtn) showRegisterBtn.classList.remove("active");
  
  // Update page title
  const title = document.querySelector("h1");
  if (title) title.textContent = "Login";
};

const showRegisterView = () => {
  // Hide login container and show registration container
  const loginContainer = document.querySelector(".login-container");
  const registerContainer = document.querySelector(".register-container");
  
  if (loginContainer) loginContainer.style.display = "none";
  if (registerContainer) registerContainer.style.display = "flex";
  
  // Update toggle buttons
  const showLoginBtn = document.querySelector("#showLoginBtn");
  const showRegisterBtn = document.querySelector("#showRegisterBtn");
  
  if (showLoginBtn) showLoginBtn.classList.remove("active");
  if (showRegisterBtn) showRegisterBtn.classList.add("active");
  
  // Update page title
  const title = document.querySelector("h1");
  if (title) title.textContent = "Register";
};

// Make functions globally available
window.confirmRegistration = confirmRegistration;
window.showLoginView = showLoginView;
window.showRegisterView = showRegisterView;
