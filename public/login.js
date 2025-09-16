// login.js
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.querySelector("#loginForm");

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    await login();
  });
});
const login = async () => {

  const username = document.querySelector("#loginUsername").value;
  const password = document.querySelector("#loginPassword").value;
  const messageDiv = document.querySelector("#message");
  const currentUserDiv = document.querySelector("#currentUser");
  const jobsSection = document.querySelector("#jobs");
  const displayArea = document.querySelector("#InformationDisplayArea");

  if (!username || !password) {
    messageDiv.innerHTML = "Please enter a username and password";
    setTimeout(() => (messageDiv.innerHTML = ""), 5000);
    return;
  }

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    console.log('Login response:', data); // Debug log
    console.log('Response status:', response.status); // Debug log

    if (data.mfaRequired) {
      console.log('MFA required, showing form'); // Debug log
      showMFAForm(data.session, username, data.challengeName, data.message);
      return;
    }

    if (response.ok && data.data && data.data.tokens) {
      messageDiv.innerHTML = "✅ Login successful";
      setTimeout(() => (messageDiv.innerHTML = ""), 5000);

      // Store token (use idToken for authentication)
      localStorage.setItem("token", data.data.tokens.idToken);

      // Show current user
      currentUserDiv.innerHTML = `Logged in as ${username}: ${data.data.user.role}`;
      
      // Create UI elements
      
      await createMainInterface(role, username);
    } else {
      messageDiv.innerHTML = "❌ Invalid username or password";
      setTimeout(() => (messageDiv.innerHTML = ""), 5000);
    }
  } catch (error) {
    messageDiv.innerHTML = `❌ ${error}`;
    setTimeout(() => (messageDiv.innerHTML = ""), 5000);
  }
};


const showMFAForm = (session, username, challengeName, message) => {
  const messageDiv = document.querySelector("#message");
  const loginForm = document.querySelector("#loginForm");
  
  // Hide the login form
  loginForm.style.display = "none";
  
  // Create MFA form
  const mfaForm = document.createElement("div");
  mfaForm.id = "mfaForm";
  mfaForm.innerHTML = `
    <h3>Multi-Factor Authentication</h3>
    <p>${message || 'Please enter the verification code:'}</p>
    <form id="mfaFormElement">
      <div>
        <label for="mfaCode">Verification Code:</label>
        <input type="text" id="mfaCode" name="mfaCode" required maxlength="6" placeholder="000000" pattern="[0-9]{6}">
      </div>
      <button type="submit">Verify</button>
      <button type="button" id="cancelMFA">Cancel</button>
    </form>
  `;
  
  // Insert MFA form after login form
  loginForm.parentNode.insertBefore(mfaForm, loginForm.nextSibling);
  
  // Handle MFA form submission
  document.getElementById("mfaFormElement").addEventListener("submit", async (e) => {
    e.preventDefault();
    await verifyMFA(session, username, challengeName);
  });
  
  // Handle cancel button
  document.getElementById("cancelMFA").addEventListener("click", () => {
    mfaForm.remove();
    loginForm.style.display = "block";
  });
}


const verifyMFA = async (session, username, challengeName) => {
  const mfaCode = document.querySelector("#mfaCode").value;
  const messageDiv = document.querySelector("#message");
  
  if (!mfaCode || mfaCode.length !== 6) {
    messageDiv.innerHTML = "Please enter a valid 6-digit code";
    setTimeout(() => (messageDiv.innerHTML = ""), 5000);
    return;
  }
  
  try {
    const response = await fetch("/api/auth/verify-mfa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session, mfaCode, username, challengeName }),
    });
    
    const data = await response.json();
    
    if (response.ok && data.data && data.data.tokens) {
      // Remove MFA form
      document.getElementById("mfaForm").remove();
      document.querySelector("#loginForm").style.display = "block";
      
      // Continue with successful login
      messageDiv.innerHTML = "✅ MFA verification successful";
      setTimeout(() => (messageDiv.innerHTML = ""), 5000);
      
      // Store token
      localStorage.setItem("token", data.data.tokens.idToken);
      
      // Show current user
      const currentUserDiv = document.querySelector("#currentUser");
      currentUserDiv.innerHTML = `Logged in as ${username}: ${data.data.user.role}`;
      
      // Create UI elements
      await createMainInterface(data.data.user.role, username);
      
    } else {
      messageDiv.innerHTML = "❌ Invalid authenticator code";
      setTimeout(() => (messageDiv.innerHTML = ""), 5000);
    }
  } catch (error) {
    messageDiv.innerHTML = `❌ MFA verification failed: ${error}`;
    setTimeout(() => (messageDiv.innerHTML = ""), 5000);
  }
};


const createMainInterface = async (userRole, username) => {
  // Dynamic import of jobs.js functions
  const { getUserJobs, getAllJobs} = await import('./jobs.js');
  const {displayAllUsers, displayUserById} = await import('./users.js');

  const currentUserDiv = document.querySelector("#currentUser");
  const jobsSection = document.querySelector("#jobs");
  const displayArea = document.querySelector("#InformationDisplayArea");
  const loginForm = document.querySelector("#loginForm");
  

  // Hide the login form
  loginForm.style.display = "none";

  // Create Logout button
  const logoutBtn = document.createElement("button");
  logoutBtn.id = "logoutBtn";
  logoutBtn.textContent = "Logout";
  logoutBtn.onclick = () => {
    localStorage.removeItem("token");
    currentUserDiv.innerHTML = "";
    jobsSection.innerHTML = "";
    displayArea.innerHTML = "";
    loginForm.style.display = "block"; // Show login form again
    logoutBtn.remove();
  };
  document.body.prepend(logoutBtn);

  // Create job buttons dynamically
  const getJobsButton = document.createElement("button");
  getJobsButton.id = "getJobs";
  getJobsButton.textContent = "View my jobs";
  getJobsButton.addEventListener("click", getUserJobs);

  const getAllJobsButton = document.createElement("button");
  getAllJobsButton.id = "getAllJobs";
  getAllJobsButton.textContent = "View all jobs";
  getAllJobsButton.addEventListener("click", getAllJobs);

  // Create user operation buttons dynamically
  const getAllUsersButton = document.createElement("button");
  getAllUsersButton.id = "getAllUsers";
  getAllUsersButton.textContent = "View all users";
  getAllUsersButton.addEventListener("click", displayAllUsers);

  const getUserByIdButton = document.createElement("button");
  getUserByIdButton.id = "getUserById";
  getUserByIdButton.textContent = "Get a user by id";
  getUserByIdButton.addEventListener("click", displayUserById);

  // Adding a clear button to clear jobs
  const clearDisplayAreaButton = document.createElement("button");
  clearDisplayAreaButton.id = "clearDisplayArea";
  clearDisplayAreaButton.textContent = "Clear display area";
  clearDisplayAreaButton.addEventListener("click", () => displayArea.innerHTML = '');

  // Append buttons depending on role
  if (userRole === "admin") {
    jobsSection.append(getJobsButton, getAllJobsButton, getAllUsersButton, getUserByIdButton, clearDisplayAreaButton);
  } else {
    jobsSection.append(getJobsButton, clearDisplayAreaButton);
  }
}