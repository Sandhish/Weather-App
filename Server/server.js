const express = require('express');
const nodemailer = require('nodemailer');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();
const admin = require('firebase-admin');
const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC3P2zehzxaUKcO
h3lm52Yg3U1pX6zjyNGlKHe+x8+usUtK1W//O4/roj2gBtm39Qejn6UM2nFOdjRs
AACoMmeVREuOG345dlHmv4FuJ1MapbAp/b0FVw1eAYjOeBjy01As/F2OGCybgvXn
WbPDSmAho9RGZkjnK52f6ggg+gRRupXmjYIZjHkLwcVQD6ZKyOHeB2H3DFtrokr5
tNKQ3jxKpKM2ivEnsOddgLvL5W/hwRKyAHdjvnuZE+Y2ttpoMz0yWHb1ZUiDl4CA
Hr6x4bIw4lzUHzxCtUZk7FcXNJxewqt4p6VNY43Cfwe5oa/qE0XO6sGjy/j84WZU
Kvr1bouFAgMBAAECggEAJ0IFCKJ31VB4jbYL1fYmjM1kd3n6D922vjeOedaUQXR1
sS1LPmasBVr/cVBuZcjuj0kVIs0Mn7bWsbmJan9L7jBQsHvm3Zgh4TmvWKI/nVKY
TFKyI1n8QOK6xKL5k1Iel9ikEVxP+CwFEwCGcMT3FdXjlQZ2QWI4dWk9vxTZBooC
HdWSn2gmAUWjBzqqwZawsZ//RHCRgjKAoKcSXAjmwDMJEmfhPkgC4kEavufq9A1p
Oq3h4v7d+3u5vzNfi79UpraXLi5C4y0V+vI6ihuNwvBgpLd54rsdFlnjTm6jR07j
Fea7bC675zi56NsV+YXM8l5GCOdJ58yNisJK4Q5vgQKBgQDdmy2Z3Y9h9NSE2C0b
LskiRulY4pXv0jQ1S9/k8bkmsX9ZxeYb2ykzQfsNGGeGCquBfi5gJYtHKDFKGajg
63aNV2KPAt+V5fxe0yVYdC2lS7Ys35DHe5l+BuWsiXk5waGISK2QH7Q72a+pFMdA
ZT4R6X9JwOXg84NLVJ69ryMuBQKBgQDTsDJdoTgwwkkE4mQjBRusDoO6pDZZdiOn
rxFnPFx5+aiLHOPfQYWLYOxCJPyPVdALBsqgq2YuVLqsubHS1JnapLwiw1S8S0rR
9Yn2WdE+h+p37fQusb+MXwwso0aPhyaXVTHBueoMPtBqbPyNnrzAn0k1r+dL1Mrr
i4J0ZYbfgQKBgQDafQ/VvyuJ8eDCZXz7awJlqDKTLzuTKtXMolVKHcVlz+T2tvZs
CoWxguEqBSC0eLqlvqmso/eRHaCTJX9q2tyU+E41ICkfWpSbTWRptIn4ihBAZ+AP
vd4U8mnp1dTOzAkeHEH7cja6N6NIejMFW4x6DpQwPF6pjo2pbPHhpNZznQKBgEgV
zwDdPpI0BsN4CFt4iNTNWIQ9GRjbxwZ58jYyctdCced1Xg+Pc1dkGO/pQmvY7/Bh
Tqzp0PDj/3GEBo7hwMaYpEw+MeOwy/i1YVaXfU6K4AgY6rbf5nd5gl7M9uE3R6fu
5fOvSIkE9tnW5SWgsWvyke6LSPskqjkNl83lKMmBAoGALk0u4diYXjQ44uvfVrc3
gUCM7sB1ddEM7qxF1HIwgDB4tjzsoSPNLVkFonJL+9s8lx3y8EBnEhJuuFPXNOog
OufiUQx058BEsBYbWQxJP9zg6WBbJH9YS9RCrSD7uRLflW6I+2Iwe5trgj7eXSGi
MFWBs2gsFXFHomjhbT3POco=
-----END PRIVATE KEY-----`;
admin.initializeApp({
    credential: admin.credential.cert({
        "type": process.env.FIREBASE_TYPE,
        "project_id": process.env.FIREBASE_PROJECT_ID,
        "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID,
        "private_key": privateKey,
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
