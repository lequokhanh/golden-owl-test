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
	const [showLoadMore, setShowLoadMore] = useState(true);
	const [forecastDaysToShow, setForecastDaysToShow] = useState(4);
	const [isNeedToForecast, setIsNeedToForecast] = useState(true);
	// State to control showing load more button

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
					`${api}/forecast?city=id%3A${selectedCity}&day=${forecastDaysToShow}`
				);
				const data = response.data;
				setWeatherData(data);
				addToHistory(data);
			} catch (error) {
				console.error("Error fetching current weather:", error);
			}
		};
		if (selectedCity && isNeedToForecast) fetchData();
		if (forecastDaysToShow === 14) setShowLoadMore(false);
		else setShowLoadMore(true);
	}, [selectedCity, forecastDaysToShow]);

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
				setIsNeedToForecast(true);
				setSelectedCity(data[0].id);
				setForecastDaysToShow(4);
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
		let newHistory = [];
		if (history.some((item) => item.city === data.city)) {
			// replace existing item in history
			newHistory = history.map((item) =>
				item.city === data.city ? data : item
			);
		} else {
			newHistory = [data, ...history];
		}
		setHistory(newHistory);
		localStorage.setItem("weatherHistory", JSON.stringify(newHistory));
	};

	const handleLoadMore = () => {
		setForecastDaysToShow(Math.min(forecastDaysToShow + 4, 14));
	};

	return (
		<>
			<Box 
				bgGradient="linear(135deg, #667eea 0%, #764ba2 100%)"
				p={8} 
				alignContent={"center"}
				position="relative"
				overflow="hidden"
			>
				<Text
					fontSize={["3xl", "4xl"]}
					fontWeight="800"
					align={"center"}
					color={"white"}
					textShadow="0 2px 4px rgba(0,0,0,0.3)"
					letterSpacing="wide"
				>
					🌤️ Weather Dashboard
				</Text>
			</Box>
			<Flex
				w="full"
				justifyContent="center"
				flexDir={["column", "row"]}
				bgGradient="linear(to-br, #f7fafc, #edf2f7)"
				minH="100vh"
				p={4}
			>
				<Box
					bg="white"
					borderRadius="2xl"
					boxShadow="xl"
					p={8}
					m={[4, 6]}
					maxW={["full", "400px"]}
					border="1px solid"
					borderColor="gray.100"
				>
					<FormControl w="full" mb={6}>
						<FormLabel 
							fontSize="lg" 
							fontWeight="600"
							color="gray.700"
							mb={3}
						>
							🌍 Enter a City Name
						</FormLabel>
						<AutoComplete openOnFocus>
							<AutoCompleteInput
								bg="gray.50"
								variant="filled"
								placeholder="E.g., New York, London, Tokyo"
								fontSize="md"
								borderRadius="lg"
								border="2px solid transparent"
								_hover={{
									bg: "gray.100",
									borderColor: "blue.300"
								}}
								_focus={{
									bg: "white",
									borderColor: "blue.500",
									boxShadow: "0 0 0 3px rgba(66, 153, 225, 0.1)"
								}}
								onChange={(e) => setInput(e.target.value)}
							/>
							<AutoCompleteList
								loadingState={
									cities.length === 0 ? <Spinner color="blue.500" size="md" /> : null
								}
								bg="white"
								border="1px solid"
								borderColor="gray.200"
								borderRadius="lg"
								boxShadow="lg"
							>
								{cities.map((city, cid) => (
									<AutoCompleteItem
										key={`option-${cid}`}
										value={city.id}
										label={city.name}
										textTransform="capitalize"
										_hover={{
											bg: "blue.50",
											color: "blue.600"
										}}
										onClick={() => {
											setIsNeedToForecast(true);
											setSelectedCity(city.id);
											setForecastDaysToShow(4);
										}}
									>
										{city.name}
									</AutoCompleteItem>
								))}
							</AutoCompleteList>
						</AutoComplete>
					</FormControl>
					
					<Box position="relative" align={"center"} my={6}>
						<Text
							px={4}
							py={2}
							w={"fit-content"}
							fontWeight="500"
							align={"center"}
							bg={"white"}
							color="gray.500"
							fontSize="sm"
							position="relative"
							zIndex={1}
						>
							or
						</Text>
						<Box
							position="absolute"
							top="50%"
							left="0"
							right="0"
							height="1px"
							bg="gray.200"
							zIndex="0"
						/>
					</Box>
					
					<Button
						w="full"
						size="lg"
						bgGradient="linear(135deg, #667eea 0%, #764ba2 100%)"
						color="white"
						fontWeight="600"
						borderRadius="lg"
						boxShadow="md"
						_hover={{
							bgGradient: "linear(135deg, #5a67d8 0%, #6b46c1 100%)",
							transform: "translateY(-2px)",
							boxShadow: "lg"
						}}
						_active={{
							transform: "translateY(0)",
							boxShadow: "md"
						}}
						transition="all 0.2s"
						onClick={() => setIsUsingCurrentLocation(true)}
					>
						📍 Use Current Location
					</Button>
					{history.length > 0 && (
						<Box mt={8}>
							<Text 
								fontSize="lg" 
								fontWeight="600" 
								mb={4}
								color="gray.700"
								display="flex"
								alignItems="center"
								gap={2}
							>
								📅 Search History
							</Text>
							<List spacing={3}>
								{history.map((item, index) => (
									<ListItem
										key={index}
										p={4}
										bg="white"
										borderRadius="lg"
										border="1px solid"
										borderColor="gray.100"
										cursor="pointer"
										boxShadow="sm"
										transition="all 0.2s"
										_hover={{
											borderColor: "blue.300",
											boxShadow: "md",
											transform: "translateY(-1px)"
										}}
										onClick={() => {
											setWeatherData(item);
											setForecastDaysToShow(
												item.forecast.length
											);
											setIsNeedToForecast(false);
											setSelectedCity(item.city);
										}}
									>
										<Text fontWeight="600" color="gray.800" mb={2}>
											🏙️ {item.city} ({item.date})
										</Text>
										<Text fontSize="sm" color="gray.600" mb={1}>
											🌡️ Temperature: {item.temperature}
										</Text>
										<Text fontSize="sm" color="gray.600" mb={1}>
											💨 Wind: {item.wind}
										</Text>
										<Text fontSize="sm" color="gray.600">
											💧 Humidity: {item.humidity}
										</Text>
									</ListItem>
								))}
							</List>
						</Box>
					)}
				</Box>

				<Flex
					w="full"
					flexDirection="column"
					justifyContent="top"
					p={4}
					mt={[4, 10]}
				>
					{Object.keys(weatherData).length !== 0 ? (
						<>
							<Box
								bgGradient="linear(135deg, #667eea 0%, #764ba2 100%)"
								p={8}
								color="white"
								borderRadius="2xl"
								mb={6}
								boxShadow="xl"
								border="1px solid"
								borderColor="whiteAlpha.200"
								position="relative"
								overflow="hidden"
							>
								<Flex alignItems="center" mb={2} position="relative" zIndex={1}>
									<Flex flexDir={"column"} w="full">
										<Text
											fontSize={["xl", "2xl"]}
											fontWeight="700"
											mr={2}
											mb={3}
											textShadow="0 2px 4px rgba(0,0,0,0.2)"
										>
											🏙️ {weatherData.city} ({weatherData.date})
										</Text>
										<Text fontSize="lg" mb={2} opacity={0.9}>
											🌡️ Temperature: {weatherData.temperature}
										</Text>
										<Text fontSize="lg" mb={2} opacity={0.9}>
											💨 Wind: {weatherData.wind}
										</Text>
										<Text fontSize="lg" opacity={0.9}>
											💧 Humidity: {weatherData.humidity}
										</Text>
									</Flex>
									<Flex
										ml={4}
										flexDir={"column"}
										w={"200px"}
										alignItems="center"
										justifyContent="center"
										bg="whiteAlpha.200"
										borderRadius="xl"
										p={4}
										backdropFilter="blur(10px)"
									>
										<Image src={weatherData.icon} w="80px" h="80px" />
										<Text ml={2} textAlign="center" fontWeight="500">
											Partly Cloudy
										</Text>
									</Flex>
								</Flex>
							</Box>
							
							<Text 
								fontSize={["lg", "xl"]} 
								fontWeight="600" 
								mb={4}
								color="gray.700"
								display="flex"
								alignItems="center"
								gap={2}
							>
								📊 {`${forecastDaysToShow}-Day Forecast`}
							</Text>
							
							<Grid templateColumns={["repeat(2, 1fr)", "repeat(4, 1fr)"]} gap={4} mb={6}>
								{weatherData.forecast.map((forecast, index) => (
									<GridItem
										key={index}
										bg="white"
										p={6}
										borderRadius="xl"
										textAlign="center"
										boxShadow="lg"
										border="1px solid"
										borderColor="gray.100"
										transition="all 0.2s"
										_hover={{
											transform: "translateY(-4px)",
											boxShadow: "xl",
											borderColor: "blue.300"
										}}
									>
										<Text color="gray.700" fontWeight="600" mb={3}>
											{forecast.date}
										</Text>
										<Image 
											src={forecast.icon} 
											mx="auto" 
											mb={3}
											w="60px"
											h="60px"
										/>
										<Text color="gray.600" fontSize="sm" mb={2}>
											🌡️ {forecast.temperature}
										</Text>
										<Text color="gray.600" fontSize="sm" mb={2}>
											💨 {forecast.wind}
										</Text>
										<Text color="gray.600" fontSize="sm">
											💧 {forecast.humidity}
										</Text>
									</GridItem>
								))}
							</Grid>
							
							{showLoadMore && (
								<Button
									mt={4}
									size="lg"
									bgGradient="linear(135deg, #4299e1 0%, #3182ce 100%)"
									color="white"
									fontWeight="600"
									borderRadius="lg"
									boxShadow="md"
									_hover={{
										bgGradient: "linear(135deg, #3182ce 0%, #2c5282 100%)",
										transform: "translateY(-2px)",
										boxShadow: "lg"
									}}
									_active={{
										transform: "translateY(0)",
										boxShadow: "md"
									}}
									transition="all 0.2s"
									onClick={handleLoadMore}
								>
									📈 Load More Forecast
								</Button>
							)}
							
							<Box 
								mt={8} 
								bg="white" 
								p={6} 
								borderRadius="xl" 
								boxShadow="lg"
								border="1px solid"
								borderColor="gray.100"
							>
								<Text 
									fontSize="lg" 
									fontWeight="600" 
									mb={4}
									color="gray.700"
									display="flex"
									alignItems="center"
									gap={2}
								>
									📧 Subscribe for Weather Updates
								</Text>
								<FormControl mb={4}>
									<Input
										w={["full", "350px"]}
										placeholder="Enter your email address"
										value={email}
										size="lg"
										borderRadius="lg"
										border="2px solid"
										borderColor="gray.200"
										_hover={{
											borderColor: "blue.300"
										}}
										_focus={{
											borderColor: "blue.500",
											boxShadow: "0 0 0 3px rgba(66, 153, 225, 0.1)"
										}}
										onChange={(e) => setEmail(e.target.value)}
									/>
								</FormControl>
								<Button
									size="lg"
									bgGradient="linear(135deg, #48bb78 0%, #38a169 100%)"
									color="white"
									fontWeight="600"
									borderRadius="lg"
									boxShadow="md"
									_hover={{
										bgGradient: "linear(135deg, #38a169 0%, #2f855a 100%)",
										transform: "translateY(-2px)",
										boxShadow: "lg"
									}}
									_active={{
										transform: "translateY(0)",
										boxShadow: "md"
									}}
									transition="all 0.2s"
									onClick={handleSubscription}
								>
									✉️ Subscribe Now
								</Button>
							</Box>
						</>
					) : (
						<Box
							bg="white"
							p={12}
							borderRadius="2xl"
							textAlign="center"
							boxShadow="lg"
							border="1px solid"
							borderColor="gray.100"
						>
							<Text fontSize="6xl" mb={4}>🌤️</Text>
							<Text 
								fontSize={["lg", "xl"]} 
								fontWeight="600" 
								color="gray.600"
								mb={2}
							>
								No weather data available
							</Text>
							<Text fontSize="md" color="gray.500">
								Search for a city above to see the weather forecast
							</Text>
						</Box>
					)}
				</Flex>
			</Flex>
		</>
	);
}

export default WeatherDashboard;
