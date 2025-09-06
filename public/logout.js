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
  document.querySelector("body").removeChild(document.querySelector("#jobs"));
  document
    .querySelector("body")
    .removeChild(document.querySelector("#logoutBtn"));
  setTimeout(() => {
    loginMessage.innerHTML = "";
    currentUser.innerHTML = "";
  }, 5000);
};
