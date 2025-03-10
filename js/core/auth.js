/**
 * Authentication Module - Handles user authentication and session management
 */

// Authentication state
let currentUser = null;

/**
 * Initialize authentication on page load
 */
function initAuth() {
  // Check if Firebase is initialized
  if (typeof firebase === "undefined") {
    console.error(
      "Firebase SDK not loaded. Make sure Firebase scripts are included in your HTML"
    );
    return;
  }

  // Check if Firebase configuration exists
  if (typeof firebaseConfig === "undefined") {
    console.error(
      "Firebase configuration not found. Make sure config.js is loaded before auth.js"
    );
    return;
  }

  // Initialize Firebase if not already initialized
  if (!firebase.apps.length) {
    try {
      firebase.initializeApp(firebaseConfig);
      console.log("Firebase initialized successfully");
    } catch (error) {
      console.error("Firebase initialization error:", error);
      return;
    }
  } else {
    console.log("Firebase already initialized");
  }

  // Set up authentication state observer
  firebase.auth().onAuthStateChanged(handleAuthStateChanged);

  // Set up login form if on login page
  setupLoginForm();

  // Set up registration form if on login page
  setupRegistrationForm();
}

/**
 * Handle authentication state changes
 * @param {Object} user - Firebase user object
 */
function handleAuthStateChanged(user) {
  if (user) {
    // User is signed in
    console.log("User authenticated:", user.email);
    currentUser = user;

    // Set user email in the header
    const userEmailElement = document.getElementById("user-email");
    if (userEmailElement) {
      userEmailElement.textContent = user.email;
    }

    // Setup logout functionality
    setupLogout();

    // Initialize dashboard if we're on the dashboard page
    if (
      window.location.pathname.indexOf("dashboard.html") > -1 ||
      window.location.pathname.endsWith("/dashboard")
    ) {
      if (typeof window.initDashboard === "function") {
        window.initDashboard(user);
      }
    } else if (
      window.location.pathname.indexOf("index.html") > -1 ||
      window.location.pathname.endsWith("/") ||
      window.location.pathname.endsWith("/index")
    ) {
      // Redirect to dashboard if on login page and already authenticated
      window.location.href = "dashboard.html";
    }
  } else {
    // User is not signed in
    currentUser = null;

    // Redirect to login page if trying to access protected pages
    if (
      window.location.pathname.indexOf("dashboard.html") > -1 ||
      window.location.pathname.endsWith("/dashboard")
    ) {
      window.location.href = "index.html";
    }
  }
}

/**
 * Set up login form event listeners
 */
function setupLoginForm() {
  const loginForm = document.getElementById("login-form");
  const loginBtn = document.getElementById("login-btn");
  const errorMessage = document.getElementById("error-message");

  if (!loginForm || !loginBtn) {
    // Not on login page or elements not found
    return;
  }

  // Handle login button click
  loginBtn.addEventListener("click", function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // Validate inputs
    if (!email || !password) {
      if (errorMessage) {
        errorMessage.textContent = "Please enter both email and password";
      }
      return;
    }

    // Disable login button while processing
    loginBtn.disabled = true;
    loginBtn.textContent = "Logging in...";

    // Attempt to sign in
    firebase
      .auth()
      .signInWithEmailAndPassword(email, password)
      .then(() => {
        // Success - redirect will happen via onAuthStateChanged
        console.log("Login successful");
      })
      .catch((error) => {
        // Error handling
        console.error("Login error:", error);

        if (errorMessage) {
          errorMessage.textContent = formatAuthError(error);
        }

        // Re-enable login button
        loginBtn.disabled = false;
        loginBtn.textContent = "Login";
      });
  });

  // Handle form submission (Enter key)
  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    loginBtn.click();
  });
}

/**
 * Set up registration form event listeners
 */
function setupRegistrationForm() {
  const registerForm = document.getElementById("register-form");
  const registerBtn = document.getElementById("register-btn");
  const errorMessage = document.getElementById("error-message");

  // Toggle between login and register forms
  const registerLink = document.getElementById("register-link");
  const loginLink = document.getElementById("login-link");

  if (registerLink && loginLink) {
    registerLink.addEventListener("click", function (e) {
      e.preventDefault();
      document.getElementById("login-form").style.display = "none";
      document.getElementById("register-form").style.display = "block";
      if (errorMessage) errorMessage.textContent = "";
    });

    loginLink.addEventListener("click", function (e) {
      e.preventDefault();
      document.getElementById("register-form").style.display = "none";
      document.getElementById("login-form").style.display = "block";
      if (errorMessage) errorMessage.textContent = "";
    });
  }

  if (!registerForm || !registerBtn) {
    // Not on login page or elements not found
    return;
  }

  // Handle registration button click
  registerBtn.addEventListener("click", function (e) {
    e.preventDefault();

    const email = document.getElementById("reg-email").value;
    const password = document.getElementById("reg-password").value;
    const confirmPassword = document.getElementById("reg-confirm").value;

    // Validate inputs
    if (!email || !password || !confirmPassword) {
      if (errorMessage) {
        errorMessage.textContent = "Please fill in all fields";
      }
      return;
    }

    if (password !== confirmPassword) {
      if (errorMessage) {
        errorMessage.textContent = "Passwords do not match";
      }
      return;
    }

    // Password strength check
    if (password.length < 6) {
      if (errorMessage) {
        errorMessage.textContent = "Password must be at least 6 characters";
      }
      return;
    }

    // Disable register button while processing
    registerBtn.disabled = true;
    registerBtn.textContent = "Creating account...";

    // Attempt to create user
    firebase
      .auth()
      .createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        // Success - redirect will happen via onAuthStateChanged
        console.log("Registration successful");

        // Create initial user data in Firestore
        initUserData(userCredential.user);
      })
      .catch((error) => {
        // Error handling
        console.error("Registration error:", error);

        if (errorMessage) {
          errorMessage.textContent = formatAuthError(error);
        }

        // Re-enable register button
        registerBtn.disabled = false;
        registerBtn.textContent = "Create Account";
      });
  });

  // Handle form submission (Enter key)
  registerForm.addEventListener("submit", function (e) {
    e.preventDefault();
    registerBtn.click();
  });
}

/**
 * Initialize user data in Firestore after registration
 * @param {Object} user - Firebase user object
 */
function initUserData(user) {
  if (!user || !user.uid) return;

  const db = firebase.firestore();

  // Create default wallets
  db.collection("userWallets")
    .doc(user.uid)
    .set({
      NGN: 0,
      USD: 0,
      GBP: 0,
      EUR: 0,
    })
    .catch((error) => {
      console.error("Error creating user wallets:", error);
    });

  // Create default user preferences
  db.collection("userPreferences")
    .doc(user.uid)
    .set({
      currencies: ["USD", "GBP", "EUR"],
      thresholds: {
        USD: { buy: 0, sell: 0 },
        GBP: { buy: 0, sell: 0 },
        EUR: { buy: 0, sell: 0 },
      },
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      settings: {
        defaultCurrency: "NGN",
        receiveAlerts: true,
        darkMode: false,
      },
    })
    .catch((error) => {
      console.error("Error creating user preferences:", error);
    });
}

/**
 * Set up logout functionality
 */
function setupLogout() {
  const logoutBtn = document.getElementById("logout-btn");

  if (!logoutBtn) {
    return;
  }

  logoutBtn.addEventListener("click", function () {
    // Disable logout button while processing
    logoutBtn.disabled = true;

    firebase
      .auth()
      .signOut()
      .then(() => {
        console.log("Logout successful");
        window.location.href = "index.html";
      })
      .catch((error) => {
        console.error("Logout error:", error);
        alert("Error signing out. Please try again.");
        logoutBtn.disabled = false;
      });
  });
}

/**
 * Format authentication error messages for user display
 * @param {Object} error - Firebase auth error object
 * @returns {String} User-friendly error message
 */
function formatAuthError(error) {
  const errorCode = error.code;
  let errorMessage = "An error occurred. Please try again.";

  switch (errorCode) {
    case "auth/invalid-email":
      errorMessage = "Invalid email address format.";
      break;
    case "auth/user-disabled":
      errorMessage = "This account has been disabled.";
      break;
    case "auth/user-not-found":
      errorMessage = "No account found with this email.";
      break;
    case "auth/wrong-password":
      errorMessage = "Incorrect password.";
      break;
    case "auth/email-already-in-use":
      errorMessage = "This email is already registered.";
      break;
    case "auth/weak-password":
      errorMessage = "Password is too weak. Use at least 6 characters.";
      break;
    case "auth/network-request-failed":
      errorMessage = "Network error. Check your internet connection.";
      break;
    case "auth/too-many-requests":
      errorMessage = "Too many attempts. Please try again later.";
      break;
    default:
      errorMessage = error.message || errorMessage;
  }

  return errorMessage;
}

/**
 * Get current authenticated user
 * @returns {Object|null} Firebase user object or null if not authenticated
 */
function getCurrentUser() {
  return currentUser;
}

/**
 * Check if user is authenticated
 * @returns {Boolean} True if user is authenticated, false otherwise
 */
function isAuthenticated() {
  return currentUser !== null;
}

/**
 * Reset password for an email
 * @param {String} email - User's email address
 * @returns {Promise} Promise that resolves when password reset email is sent
 */
function resetPassword(email) {
  return firebase.auth().sendPasswordResetEmail(email);
}

// Initialize auth when the page loads
document.addEventListener("DOMContentLoaded", initAuth);

// Export auth functions
window.auth = {
  getCurrentUser,
  isAuthenticated,
  resetPassword,
};
