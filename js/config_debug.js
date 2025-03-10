// This is a debug configuration file that gets loaded if the main config is missing
if (typeof firebaseConfig === "undefined") {
  console.warn("Main firebase configuration not found, using debug config");
  const firebaseConfig = {
    apiKey: "AIzaSyAyWvSqwwiZpaYYN5ilqwS74ZR5jtx07Sk",
    authDomain: "gain-sight-fx.firebaseapp.com",
    projectId: "gain-sight-fx",
    storageBucket: "gain-sight-fx.firebasestorage.app",
    messagingSenderId: "83509982696",
    appId: "1:83509982696:web:80cafcfc6a5c4c686a605d",
    measurementId: "G-B6078135CH",
  };
} else {
  console.log("Using main firebase configuration");
}
