// login.js
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.querySelector("#loginForm");

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    await login();
  });
});
const login = async () => {
  // Dynamic import of jobs.js functions
  const { getUserJobs, getAllJobs} = await import('./jobs.js');
  const {displayAllUsers, displayUserById} = await import('./users.js');

  const username = document.querySelector("#username").value;
  const password = document.querySelector("#password").value;
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

    if (response.ok && data.data.token) {
      messageDiv.innerHTML = "✅ Login successful";
      setTimeout(() => (messageDiv.innerHTML = ""), 5000);

      // Store token
      localStorage.setItem("token", data.data.token);

      // Show current user
      currentUserDiv.innerHTML = `Logged in as ${username}: ${data.data.user.role}`;
      

      // Create Logout button
      const logoutBtn = document.createElement("button");
      logoutBtn.id = "logoutBtn";
      logoutBtn.textContent = "Logout";
      logoutBtn.onclick = () => {
        localStorage.removeItem("token");
        currentUserDiv.innerHTML = "";
        jobsSection.innerHTML = "";
        displayArea.innerHTML = "";
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

       // Create user operation buttons dynamically
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
      if (data.data.user.role === "admin") {
        jobsSection.append(getJobsButton, getAllJobsButton, getAllUsersButton, getUserByIdButton, clearDisplayAreaButton);
      } else {
        jobsSection.append(getJobsButton, clearDisplayAreaButton);
      }
    } else {
      messageDiv.innerHTML = "❌ Invalid username or password";
      setTimeout(() => (messageDiv.innerHTML = ""), 5000);
    }
  } catch (error) {
    messageDiv.innerHTML = `❌ ${error}`;
    setTimeout(() => (messageDiv.innerHTML = ""), 5000);
  }
};
