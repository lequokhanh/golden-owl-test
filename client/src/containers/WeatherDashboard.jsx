import {
	Flex,
	FormControl,
	FormLabel,
	Spinner,
	Text,
	Box,
	Grid,
	GridItem,
	Button,
	Image,
	Input,
	List,
	ListItem,
	useToast,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import {
	AutoComplete,
	AutoCompleteInput,
	AutoCompleteItem,
	AutoCompleteList,
} from "@choc-ui/chakra-autocomplete";
import axios from "axios";
const api = "https://golden-owl-test-backend.vercel.app/api";
const headers = {
	"Content-Type": "application/json",
	"Access-Control-Allow-Origin": "*", // allow CORS
};
const axiosInstance = axios.create({
	baseURL: api,
	headers,
});

function WeatherDashboard() {
	const [cities, setCities] = useState([]);
	const [selectedCity, setSelectedCity] = useState();
	const [input, setInput] = useState("");
	const [position, setPosition] = useState({
		latitude: null,
		longitude: null,
	});
	const [isUsingCurrentLocation, setIsUsingCurrentLocation] = useState(false);
	const [weatherData, setWeatherData] = useState({});
	const [email, setEmail] = useState("");
	const [history, setHistory] = useState([]);
	const Toast = useToast();
	useEffect(() => {
		const fetchData = async () => {
			setCities([]);
			try {
				const response = await axiosInstance.get(
					`${api}/city?city=${input || "%20"}`
				);
				const data = response.data;
				setCities(data);
			} catch (error) {
				console.error("Error fetching cities:", error);
			}
		};
		fetchData();
	}, [input]);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await axiosInstance.get(
					`${api}/forecast?city=id%3A${selectedCity}`
				);
				const data = response.data;
				setWeatherData(data);
				addToHistory(data);
			} catch (error) {
				console.error("Error fetching current weather:", error);
			}
		};
		if (selectedCity) fetchData();
	}, [selectedCity]);

	useEffect(() => {
		if (isUsingCurrentLocation) {
			if ("geolocation" in navigator) {
				navigator.geolocation.getCurrentPosition(function (position) {
					setPosition({
						latitude: position.coords.latitude,
						longitude: position.coords.longitude,
					});
				});
			} else {
				console.log("Geolocation is not available in your browser.");
			}
			setIsUsingCurrentLocation(false);
		}
	}, [isUsingCurrentLocation]);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await axiosInstance.get(
					`${api}/city?city=${position.latitude},${position.longitude}`
				);
				const data = response.data;
				setSelectedCity(data[0].id);
			} catch (error) {
				console.error("Error fetching current weather:", error);
			}
		};
		if (position.latitude && position.longitude) fetchData();
	}, [position]);

	useEffect(() => {
		const savedHistory = JSON.parse(localStorage.getItem("weatherHistory"));
		if (savedHistory) {
			setHistory(savedHistory);
		}
	}, []);

	const handleSubscription = async () => {
		try {
			// check if email is valid
			if (!email.includes("@")) {
				Toast({
					title: "Invalid email",
					description: "Please enter a valid email address",
					status: "error",
					duration: 5000,
					isClosable: true,
				});
				return;
			}
			const response = await axios.post(`${api}/subscribe`, {
				email,
				city: selectedCity,
			});
			if (response.status === 200) {
				Toast({
					title: "Subscription successful",
					description: "You will receive updates via email",
					status: "success",
					duration: 5000,
					isClosable: true,
				});
			} else {
				Toast({
					title: "Subscription failed",
					description: "Please try again later",
					status: "error",
					duration: 5000,
					isClosable: true,
				});
			}
		} catch (error) {
			console.error("Error subscribing:", error);
		}
	};

	const addToHistory = (data) => {
		if (history.some((item) => item.city === data.city)) {
			return;
		}
		const newHistory = [data, ...history];
		setHistory(newHistory);
		localStorage.setItem("weatherHistory", JSON.stringify(newHistory));
	};

	return (
		<>
			<Box bg="#5372f0" p={6} alignContent={"center"}>
				<Text
					fontSize="2xl"
					fontWeight="bold"
					mb={4}
					align={"center"}
					color={"#fff"}
				>
					Weather Dashboard
				</Text>
			</Box>
			<Flex
				w="full"
				justifyContent="center"
				flexDir={["column", "row"]}
				bg="#e3f2fd"
			>
				<Flex mt={10} ml={5} mr={5} flexDir={"column"}>
					<FormControl w="full">
						<FormLabel>Enter a City Name</FormLabel>
						<AutoComplete openOnFocus>
							<AutoCompleteInput
								bg={"#fff"}
								variant={"filled"}
								placeholder="E.g., New York, London, Tokyo"
								onChange={(e) => setInput(e.target.value)}
							/>
							<AutoCompleteList
								loadingState={
									cities.length === 0 ? <Spinner /> : null
								}
							>
								{cities.map((city, cid) => (
									<AutoCompleteItem
										key={`option-${cid}`}
										value={city.id}
										label={city.name}
										textTransform="capitalize"
										onClick={() => setSelectedCity(city.id)}
									>
										{city.name}
									</AutoCompleteItem>
								))}
							</AutoCompleteList>
						</AutoComplete>
					</FormControl>
					<Box position="relative" align={"center"}>
						<Text
							p={2}
							w={"fit-content"}
							fontWeight="bold"
							align={"center"}
							bg={"#e3f2fd"}
						>
							or
						</Text>
						<Box
							position="absolute"
							top="50%"
							left="0"
							right="0"
							height="1px"
							bg="#000000"
							zIndex="-1"
						/>
					</Box>
					<Button
						color={"#fff"}
						bg={"#6c757d"}
						variant="outline"
						size="md"
						onClick={() => setIsUsingCurrentLocation(true)}
					>
						Use Current Location
					</Button>
					{history.length > 0 && (
						<Box mt={8}>
							<Text fontSize="lg" fontWeight="bold" mb={2}>
								History
							</Text>
							<List spacing={3}>
								{history.map((item, index) => (
									<ListItem
										key={index}
										p={2}
										bg={"#fff"}
										borderRadius="md"
										cursor={"pointer"}
										onClick={() => setWeatherData(item)}
									>
										<Text fontWeight="bold">
											{item.city} ({item.date})
										</Text>
										<Text>
											Temperature: {item.temperature}
										</Text>
										<Text>Wind: {item.wind}</Text>
										<Text>Humidity: {item.humidity}</Text>
									</ListItem>
								))}
							</List>
						</Box>
					)}
				</Flex>

				<Flex
					w="full"
					flexDirection="column"
					justifyContent="top"
					p={4}
					mt={10}
				>
					{Object.keys(weatherData).length !== 0 ? (
						<>
							<Box
								bg="#5372f0"
								p={6}
								color="white"
								borderRadius="md"
								mb={4}
							>
								<Flex alignItems="center" mb={2}>
									<Flex flexDir={"column"} w="full">
										<Text
											fontSize="xl"
											fontWeight="bold"
											mr={2}
										>
											{weatherData.city} (
											{weatherData.date})
										</Text>
										<Text>
											Temperature:{" "}
											{weatherData.temperature}
										</Text>
										<Text>Wind: {weatherData.wind}</Text>
										<Text>
											Humidity: {weatherData.humidity}
										</Text>
									</Flex>
									<Flex
										ml={4}
										flexDir={"column"}
										w={"200px"}
										alignItems="center"
										justifyContent="center"
									>
										<Image src={weatherData.icon} />
										<Text ml={2}>Partly Cloudy</Text>
									</Flex>
								</Flex>
							</Box>
							<Text fontSize="lg" fontWeight="bold" mb={2}>
								4-Day Forecast
							</Text>
							<Grid templateColumns="repeat(4, 1fr)" gap={4}>
								{weatherData.forecast.map((forecast, index) => (
									<GridItem
										key={index}
										bg="#6c757d"
										p={4}
										borderRadius="md"
										textAlign="left"
									>
										<Text color={"#fff"}>
											{forecast.date}
										</Text>
										<Image src={forecast.icon} />
										<Text color={"#fff"}>
											Temp: {forecast.temperature}
										</Text>
										<Text color={"#fff"}>
											Wind: {forecast.wind}
										</Text>
										<Text color={"#fff"}>
											Humidity: {forecast.humidity}
										</Text>
									</GridItem>
								))}
							</Grid>
							<Box mt={8}>
								<FormControl>
									<FormLabel>Subscribe for updates</FormLabel>
									<Input
										w={["full", "300px"]}
										placeholder="Enter your email"
										value={email}
										onChange={(e) =>
											setEmail(e.target.value)
										}
									/>
								</FormControl>
								<Button
									mt={4}
									colorScheme="blue"
									onClick={handleSubscription}
								>
									Subscribe
								</Button>
							</Box>
						</>
					) : (
						<Text fontSize="lg" fontWeight="bold" mb={2}>
							No weather data available
						</Text>
					)}
				</Flex>
			</Flex>
		</>
	);
}

export default WeatherDashboard;
