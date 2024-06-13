const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const api = require("./src/api");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");

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

server.listen(PORT, () => {
	console.log("Server is running on port", PORT);
});
