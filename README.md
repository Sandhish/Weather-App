# 🌦️Weather App
## Description
The Weather App allows users to view weather details of various locations, including past weather (up to 2 days back) and future weather (up to 2 days ahead). Users can register and log into their accounts, set a favorite location, and receive email alerts for extreme weather conditions (e.g., heavy rain or extreme heat) in their favorite location.
## Features
+ **User Registration and Authentication:** Users can create an account and log in using Firebase Authentication.
+ **Weather Forecast:** Users can search for and view weather details of any location, including past and future weather for up to 2 days.
+ **Favorite Location:** Users can set a favorite location, which will be monitored for extreme weather conditions.
+ **Email Alerts:** If extreme weather (such as heatwaves, thunderstorms, or heavy rain) occurs in the user's favorite location, an email alert will be sent to the user.
+ **Data Storage:** User preferences, such as favorite locations, are stored in Firebase Firestore.

## Technologies Used
+ **Frontend:** React.js (with Vite)
+ **Backend:** Node.js, Express.js
+ **Database:** Firebase Firestore
+ **Authentication:** Firebase Authentication
+ **Weather Data:** [WeatherAPI](https://www.weatherapi.com/) (for retrieving weather details)
+ **Email Alerts:** Nodemailer (for sending email alerts using Gmail)