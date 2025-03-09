// Don't use import syntax in regular script tags
// Replace this:
// import firebaseConfig from "./config";

// Instead, directly access the firebaseConfig from the global scope
// Make sure your config.js file is included before auth.js in your HTML

// Check if firebaseConfig exists
if (typeof firebaseConfig === "undefined") {
  console.error(
    "Firebase configuration not found. Make sure config.js is loaded before auth.js"
  );
} else {
  console.log("Firebase configuration found");

  // Initialize Firebase if not already initialized
  if (typeof firebase !== "undefined") {
    if (!firebase.apps || !firebase.apps.length) {
      try {
        firebase.initializeApp(firebaseConfig);
        console.log("Firebase initialized successfully");
      } catch (error) {
        console.error("Firebase initialization error:", error);
      }
    } else {
      console.log("Firebase already initialized");
    }
  } else {
    console.error(
      "Firebase SDK not loaded. Make sure Firebase scripts are included in your HTML"
    );
  }

  // Check authentication state
  if (typeof firebase !== "undefined") {
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
  }
}
