const router = require("express").Router();
const User = require("../models/UserModel");
const jwt = require("jsonwebtoken");
const {
	sendComfirmationEmail,
	sendWeatherUpdate,
} = require("../common/SendEmail");
const fetch = (...args) =>
	import("node-fetch").then(({ default: fetch }) => fetch(...args));

router.get("/city", async (req, res) => {
	const { city } = req.query || "%20";
	const response = await fetch(
		`https://api.weatherapi.com/v1/search.json?q=${city}&key=${process.env.WEATHER_API_KEY}`
	);
	const data = await response.json();
	if (data.error) {
		return res.status(404).json({ message: data.error.message });
	}
	const unique = new Set();
	const filteredData = data.filter((city) => {
		if (unique.has(city.name)) {
			return false;
		}
		unique.add(city.name);
		return true;
	});
	filteredData.forEach((city) => {
		delete city.url;
		delete city.lat;
		delete city.lon;
	});
	res.json(filteredData);
});

router.get("/forecast", async (req, res) => {
	const { city, day } = req.query;
	const response = await fetch(
		`https://api.weatherapi.com/v1/forecast.json?key=${process.env.WEATHER_API_KEY}&q=${city}&days=${day}`
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
	res.json(dataFormatted);
});

router.post("/subscribe", async (req, res) => {
	const { email, city } = req.body;

	const user = new User({
		email,
		city: city,
	});
	try {
		await user.save();
		const response = await fetch(
			`https://api.weatherapi.com/v1/search.json?q=id:${city}&key=${process.env.WEATHER_API_KEY}`
		);
		const data = await response.json();
		await sendComfirmationEmail(email, data[0].name);
		res.json({ message: "Subscription successful" });
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
});

router.get("/unsubscribe", async (req, res) => {
	const { token } = req.query;
	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		await User.findOneAndDelete({ email: decoded.email });
		// send html
		res.send("<h1>Unsubscribed successfully</h1>");
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
});

router.get("/cron", async (req, res) => {
	User.find()
		.then(async (users) => {
			users.forEach(async (user) => {
				console.log(user.email, user.city);
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
				await sendWeatherUpdate(user.email, dataFormatted);
			});
		})
		.then(() => {
			res.json({ message: "Emails sent" });
		})
		.catch((error) => {
			res.status(400).json({ message: error.message });
		});
});

module.exports = router;
