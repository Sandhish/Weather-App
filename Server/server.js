const express = require('express');
const nodemailer = require('nodemailer');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();
const admin = require('firebase-admin');

admin.initializeApp({
    credential: admin.credential.cert({
        "type": process.env.FIREBASE_TYPE,
        "project_id": process.env.FIREBASE_PROJECT_ID,
        "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID,
        "private_key": process.env.FIREBASE_PRIVATE_KEY,
        "client_email": process.env.FIREBASE_CLIENT_EMAIL,
        "client_id": process.env.FIREBASE_CLIENT_ID,
        "auth_uri": process.env.FIREBASE_AUTH_URI,
        "token_uri": process.env.FIREBASE_TOKEN_URI,
        "auth_provider_x509_cert_url": process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
        "client_x509_cert_url": process.env.FIREBASE_CLIENT_X509_CERT_URL
    })
});

let lastFetchTime = 0;

const db = admin.firestore();

const app = express();
app.use(cors());
app.use(express.json());

const apiKey = process.env.WEATHER_API_KEY;

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});
console.log(process.env.FIREBASE_PRIVATE_KEY);
const sendEmail = async (userEmail, weatherCondition, location) => {
    console.log(`Preparing to send email to: ${userEmail}`);
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: `Weather Alert: Extreme Conditions in ${location}`,
        text: `There are extreme ${weatherCondition} conditions in your favorite location, ${location}. Stay safe!`,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully to:', userEmail);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

const checkWeather = async (userEmail, favoriteLocation) => {
    try {
        const response = await axios.get(`https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${favoriteLocation}`);
        const weatherData = response.data;

        if (weatherData && weatherData.current) {
            const condition = weatherData.current.condition.text;
            const tempC = weatherData.current.temp_c;

            const extremeConditions = ['Thunderstorm', 'Heavy Rain', 'Heatwave', 'Snowstorm', 'Tornado'];

            console.log(`Current condition: ${condition}, Temperature: ${tempC}°C`);

            if (tempC > 35 || tempC < 11 || extremeConditions.includes(condition)) {
                await sendEmail(userEmail, condition, favoriteLocation);
            } else {
                console.log(`No extreme conditions for ${favoriteLocation}.`);
            }
        } else {
            console.error("Weather data is not valid:", weatherData);
        }
    } catch (error) {
        console.error('Error fetching weather:', error.response ? error.response.data : error.message);
    }
};

const fetchUsersAndCheckWeather = async () => {
    const currentTime = Date.now();

    if (currentTime - lastFetchTime < (5 * 60 * 60 * 1000)) {
        console.log("Skipping weather check to avoid quota issues.");
        return;
    }

    try {
        const usersSnapshot = await admin.auth().listUsers();

        if (usersSnapshot.users.length > 0) {
            lastFetchTime = currentTime;
            console.log(`Current time: ${currentTime}, Last fetch time: ${lastFetchTime}`);

            const checkPromises = [];

            for (const user of usersSnapshot.users) {
                const uid = user.uid;
                const userDoc = await db.collection('WeatherApi').doc(uid).get();

                if (userDoc.exists) {
                    const userData = userDoc.data();
                    const favoriteLocation = userData.favoriteLocation;
                    console.log(userData);

                    if (favoriteLocation) {
                        console.log(`Checking weather for UID ${uid} in ${favoriteLocation}`);
                        checkPromises.push(checkWeather(user.email, favoriteLocation));
                    } else {
                        console.log(`Skipping weather check for UID ${uid} due to empty favorite location.`);
                    }
                } else {
                    console.log(`No favorite location found for UID ${uid}.`);
                }
            }

            await Promise.all(checkPromises);
        } else {
            console.log("No users found in the database.");
        }
    } catch (error) {
        if (error.code === 'RESOURCE_EXHAUSTED') {
            console.warn('Quota exceeded. Pausing weather checks for now.');
            setTimeout(fetchUsersAndCheckWeather, 3600000);
        } else {
            console.error('Error fetching users from Firebase Authentication:', error);
        }
    }
};

setInterval(() => {
    fetchUsersAndCheckWeather();
}, 5 * 60 * 60 * 1000);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
