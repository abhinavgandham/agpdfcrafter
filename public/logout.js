const loginMessage = document.querySelector("#message");
const currentUser = document.querySelector("#currentUser");
const loginFormContainer = document.querySelector("#form-container");
const form = document.querySelector("#loginForm");
const logout = async () => {
  // Gettting the token from local storage
  const token = localStorage.getItem("token");
  // Do nothing if there is no token
  if (!token) return;
  // Remove the token and log the user out.
  localStorage.removeItem("token");
  loginMessage.innerHTML = "Logged out successfully";
  currentUser.innerHTML = "";
  
  // Clear the jobs section content instead of removing it
  const jobsSection = document.querySelector("#jobs");
  if (jobsSection) {
    jobsSection.innerHTML = "";
  }
  
  // Remove logout button if it exists
  const logoutBtn = document.querySelector("#logoutBtn");
  if (logoutBtn) {
    logoutBtn.remove();
  }
  
  // Show login container (which contains the form)
  const loginContainer = document.querySelector(".login-container");
  if (loginContainer) {
    loginContainer.style.display = "";
  }
  
  // Show the login heading and toggle buttons again
  const loginHeading = document.querySelector("h1");
  if (loginHeading) {
    loginHeading.style.display = "block";
  }
  
  const authToggle = document.querySelector(".auth-toggle");
  if (authToggle) {
    authToggle.style.display = "flex";
  }
  
  setTimeout(() => {
    loginMessage.innerHTML = "";
    currentUser.innerHTML = "";
  }, 5000);
};
