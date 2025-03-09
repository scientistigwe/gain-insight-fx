# Financial Transaction Dashboard

A frontend-only financial transaction dashboard designed for transparency in partnership financial transactions. This dashboard allows tracking of money sent and received, calculates gains and losses, and provides predictive analysis.

## Features

- **User Authentication**: Secure login system
- **Transaction Management**: Add, edit, and delete financial transactions
- **Real-time Updates**: Changes sync across devices
- **Financial Analysis**: Track sent/received amounts with gain/loss calculations
- **Predictive Features**: Simple trend analysis and future projections
- **Responsive Design**: Works on mobile, tablet, and desktop devices

## Setup Instructions

### 1. Firebase Setup

This dashboard uses Firebase for authentication and data storage. You'll need to:

1. Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Enable Firebase Authentication (Email/Password)
3. Enable Cloud Firestore
4. Get your Firebase configuration details

### 2. Update Firebase Configuration

Open the `js/auth.js` file and replace the Firebase configuration with your own:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};
```

### 3. Set Up Firestore Security Rules

Go to your Firebase Console > Firestore Database > Rules and set up the following security rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User data rules
    match /users/{userId} {
      // Allow read/write access only to the owner
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // Allow access to user's transactions
      match /transactions/{transactionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

### 4. GitHub Pages Setup

1. Create a new GitHub repository
2. Upload all the files to your repository
3. Enable GitHub Pages:
   - Go to your repository's Settings
   - Scroll down to the GitHub Pages section
   - Select the branch you want to deploy (usually `main`)
   - Click Save

GitHub Pages will provide you with a URL where your dashboard is hosted.

### 5. Additional Configuration

For real production use, consider:

1. Setting up proper Firebase security rules
2. Implementing data validation
3. Setting up backups for your Firestore data
4. Adding more detailed user permissions if needed

## Project Structure

```
financial-dashboard/
├── index.html             # Entry point and login screen
├── dashboard.html         # Main dashboard interface
├── css/
│   ├── styles.css         # Global styles
│   ├── login.css          # Login page styles
│   └── dashboard.css      # Dashboard styles
├── js/
│   ├── auth.js            # Client-side authentication
│   ├── data.js            # Data management and storage
│   ├── dashboard.js       # Dashboard functionality
│   ├── charts.js          # Chart generation and updates
│   └── predictions.js     # Predictive analysis
└── assets/
    └── img/               # Images and icons
```

## Usage

1. Navigate to your GitHub Pages URL
2. Create an account or log in
3. Add your financial transactions
4. Use the dashboard to track and analyze your financial partnership

## Customization

You can customize this dashboard by:

- Modifying the CSS files to change the appearance
- Adding new visualizations in the charts.js file
- Extending the data model in data.js
- Adding new pages or features to dashboard.html

## Limitations

Since this is a frontend-only solution:

- All data is stored in Firebase Firestore
- There's no server-side validation (validation happens client-side)
- For more complex requirements, you might need to add a backend

## Support

If you encounter any issues, please check:

1. Your Firebase configuration is correct
2. Your Firestore security rules are properly set up
3. You're using a modern browser (Chrome, Firefox, Safari, Edge)
