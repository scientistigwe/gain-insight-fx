#!/bin/bash

# Create project directory
mkdir -p financial-dashboard
cd financial-dashboard

# Create HTML files
touch index.html
touch dashboard.html

# Create CSS directory and files
mkdir -p css
touch css/styles.css
touch css/login.css
touch css/dashboard.css

# Create JS directory and files
mkdir -p js
touch js/auth.js
touch js/data.js
touch js/dashboard.js
touch js/charts.js
touch js/predictions.js
touch js/receipt-parser.js

# Create assets directory
mkdir -p assets/img

# Create README.md
touch README.md

# Print success message
echo "Project structure created successfully!"
echo ""
echo "Files created:"
find . -type f | sort

echo ""
echo "Now you can copy the code into each file."