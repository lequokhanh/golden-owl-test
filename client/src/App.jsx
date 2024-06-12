import { ChakraProvider } from "@chakra-ui/react";
import WeatherDashboard from "./containers/WeatherDashboard";

function App() {
	return (
		<ChakraProvider>
			<WeatherDashboard />
		</ChakraProvider>
	);
}

export default App;
