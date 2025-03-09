// Initialize Firebase if not already initialized
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Check authentication state
firebase.auth().onAuthStateChanged(function (user) {
  if (user) {
    // User is signed in
    console.log("User authenticated:", user.email);

    // Set user email in the header
    const userEmailElement = document.getElementById("user-email");
    if (userEmailElement) {
      userEmailElement.textContent = user.email;
    }

    // Setup logout functionality
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", function () {
        firebase
          .auth()
          .signOut()
          .then(() => {
            console.log("User signed out");
            window.location.href = "index.html";
          })
          .catch((error) => {
            console.error("Error signing out:", error);
            alert("Error signing out. Please try again.");
          });
      });
    }

    // Initialize dashboard data
    if (typeof initDashboard === "function") {
      initDashboard(user);
    }
  } else {
    // User is not signed in, redirect to login page
    if (window.location.pathname.indexOf("dashboard.html") > -1) {
      window.location.href = "index.html";
    }
  }
});
