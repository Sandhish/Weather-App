// Import necessary packages
const express = require('express');
const nodemailer = require('nodemailer');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();
const admin = require('firebase-admin');
const serviceAccount = require('./weather-api.json');
let lastFetchTime = Date.now();

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

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

const sendEmail = async (userEmail, weatherCondition, location) => {
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

            if (tempC > 30 || tempC < 11 || extremeConditions.includes(condition)) {
                await sendEmail(userEmail, condition, favoriteLocation);
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
    if (currentTime - lastFetchTime < 3600000) {
        console.log("Skipping weather check to avoid quota issues.");
        return;
    }

    lastFetchTime = currentTime;
    try {
        const usersSnapshot = await db.collection('WeatherApi').get();
        usersSnapshot.forEach(async (doc) => {
            const userData = doc.data();
            const userEmail = userData.email;  
            const favoriteLocation = userData.favoriteLocation; 

            if (userEmail && favoriteLocation) {
                console.log(`Checking weather for ${userEmail} in ${favoriteLocation}`);
                await checkWeather(userEmail, favoriteLocation);
            }
        });
    } catch (error) {
        console.error('Error fetching users from Firestore:', error);
        if (error.code === 'RESOURCE_EXHAUSTED') {
            console.warn('Quota exceeded. Adjusting fetch frequency may be necessary.');
        }
    }
};

setInterval(() => {
    fetchUsersAndCheckWeather();
}, 600000);

app.post('/send-email', async (req, res) => {
    const { userEmail, weatherCondition, location } = req.body;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: `Weather Alert: Extreme Conditions in ${location}`,
        text: `There are extreme ${weatherCondition} conditions in your favorite location, ${location}. Stay safe!`,
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).send({ message: 'Email sent successfully!' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).send({ message: 'Error sending email' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
