const User = require("../models/User");
const { sendWeatherUpdate } = require("../common/SendEmail");

const sendmail = async (req, res) => {
	// Fetch all users
	const users = await User.find();
	await users.forEach(async (user) => {
		try {
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
			res.status(200).send("Email sent");
		} catch (error) {
			console.error("Error sending email:", error.message);
		}
	});
};

export default sendmail;
