const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
require("dotenv").config();
// Create a transporter object (gmail account)
const transporter = nodemailer.createTransport({
	service: "gmail",
	host: "smtp.gmail.com",
	port: 465,
	secure: true,
	auth: {
		user: process.env.EMAIL_ADDRESS,
		pass: process.env.EMAIL_PASSWORD,
	},
});

// Function to send email
const sendEmail = async (to, subject, text, html) => {
	try {
		// Define email options
		const mailOptions = {
			from: process.env.EMAIL_ADDRESS,
			to: to,
			subject: subject,
			text: text,
			html: html || null,
		};

		// Send email
		const info = await transporter.sendMail(mailOptions);
		console.log("Email sent:", mailOptions.to);
	} catch (error) {
		console.error("Error sending email:", error);
	}
};

const sendComfirmationEmail = async (email, city) => {
	const subject = "Subscription Confirmation";
	const text = `You have successfully subscribed to weather updates for ${city}. You will receive daily weather updates at 8:00 AM.`;
	await sendEmail(email, subject, text);
};

const sendWeatherUpdate = async (email, data) => {
	try {
		const token = jwt.sign({ email }, process.env.JWT_SECRET);
		const subject = "Weather Update";
		const text = `The current temperature in ${data.city} is ${data.temperature}°C with ${data.condition}.`;
		const html = `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Weather Update</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    color: #333;
                    padding: 20px;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #fff;
                    padding: 20px;
                    border-radius: 5px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }
                .header {
                    background-color: #007bff;
                    color: #fff;
                    padding: 20px;
                    text-align: center;
                    border-top-left-radius: 5px;
                    border-top-right-radius: 5px;
                }
                .weather-info {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }
                .weather-info img {
                    width: 80px;
                    height: 80px;
                }
                .forecast {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 20px;
                    }
                .forecast-day {
                    margin-left: 40px;
                    text-align: center;
                }
                .forecast-day img {
                    width: 50px;
                    height: 50px;
                }
                .unsubscribe {
                    text-align: center;
                    margin-top: 20px;
                }
                .unsubscribe a {
                    color: #007bff;
                    text-decoration: none;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Weather Update</h1>
                </div>
                <div class="weather-info">
                    <div>
                        <h2>${data.city}</h2>
                        <p>${data.date}</p>
                    </div>
                    <img src="https:${data.icon}" alt="Weather Icon">
                    <div>
                        <p>Temperature: <span>${data.temperature}</span></p>
                        <p>Wind Speed: <span>${data.wind} km/h</span></p>
                        <p>Humidity: <span>${data.humidity}%</span></p>
                    </div>
                </div>
                <h3>4-Day Forecast</h3>
                <div class="forecast">
                ${data.forecast
					.map(
						(day) => `
                    <div class="forecast-day">
                        <p>${day.date}</p>
                        <img src="https:${day.icon}" alt="Weather Icon">
                        <p>${day.temperature}°C</p>
                    </div>
                `
					)
					.join("")}
                </div>
                <div class="unsubscribe">
                    <p>Don't want to receive weather updates anymore? <a href="${
						process.env.URL
					}/unsubscribe?token=${token}">Unsubscribe</a></p>
                </div>
            </div>
        </body>
        </html>`;
		await sendEmail(email, subject, text, html);
	} catch (error) {
		console.log("Error sending weather update:", error);
	}
};

module.exports = { sendComfirmationEmail, sendWeatherUpdate };
