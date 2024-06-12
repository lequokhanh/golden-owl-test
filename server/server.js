const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const api = require("./src/api");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");
const cron = require("node-cron");
const fetch = (...args) =>
	import("node-fetch").then(({ default: fetch }) => fetch(...args));
const User = require("./src/models/UserModel");
const { sendWeatherUpdate } = require("./src/common/SendEmail");
dotenv.config();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
	cors({
		origin: "*",
	})
);

mongoose
	.connect(process.env.MONGODB_URI)
	.then(() => {
		console.log("Connected to MongoDB");
	})
	.catch((error) => {
		console.error("Error connecting to MongoDB:", error.message);
	});
app.use("/api", api);

// schedule a cron job to run at 8:00 AM every day
const sendmail = async () => {
	// send email to all users in the database
	const users = await User.find();
	await users.forEach(async (user) => {
		const response = await fetch(
			`https://api.weatherapi.com/v1/forecast.json?key=${process.env.WEATHER_API_KEY}&q=id:${user.city}&days=4`
		);
		const data = await response.json();
		const { forecastday } = data.forecast;
		const forecast = forecastday.map((day) => {
			return {
				date: day.date,
				temperature: day.day.avgtemp_c,
				wind: day.day.maxwind_kph,
				humidity: day.day.avghumidity,
				icon: day.day.condition.icon,
			};
		});
		const dataFormatted = {
			city: data.location.name,
			temperature: data.current.temp_c,
			condition: data.current.condition.text,
			icon: data.current.condition.icon,
			wind: data.current.wind_kph,
			humidity: data.current.humidity,
			date: data.current.last_updated,
			forecast,
		};
		sendWeatherUpdate(user.email, dataFormatted);
	});
};

cron.schedule("0 8 * * *", sendmail);
server.listen(PORT, () => {
	console.log("Server is running on port", PORT);
});
