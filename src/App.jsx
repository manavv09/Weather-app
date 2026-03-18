import { useState } from "react";
import WeatherCard from "./components/WeatherCard";
import Forecast from "./components/Forecast";
import TempChart from "./components/TempChart";
import axios from "axios";

function App() {

const [city,setCity] = useState("");
const [weather,setWeather] = useState(null);
const [forecast,setForecast] = useState(null);
const [dark,setDark] = useState(false);

const API_KEY = "69ba577ebbd75983c9e4b17dda537ad2";

const getWeather = async () => {

const weatherRes = await axios.get(
`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`
);

setWeather(weatherRes.data);

const forecastRes = await axios.get(
`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${API_KEY}`
);

setForecast(forecastRes.data);

};

return (

<div className={`${dark ? "bg-gray-900 text-white" : "bg-gradient-to-br from-blue-400 to-purple-400"} min-h-screen p-8`}>

<div className="max-w-6xl mx-auto">

<div className="flex justify-between mb-6">

<h1 className="text-3xl font-bold">
Weather Dashboard
</h1>

<button
onClick={()=>setDark(!dark)}
className="border px-4 py-1 rounded"
>
{dark ? "☀ Light" : "🌙 Dark"}
</button>

</div>

<div className="flex gap-3 mb-6">

<input
className="p-3 rounded w-full text-black"
placeholder="Enter city"
value={city}
onChange={(e)=>setCity(e.target.value)}
/>

<button
onClick={getWeather}
className="bg-blue-600 text-white px-5 rounded"
>
Search
</button>

</div>

{weather && (

<div className="grid grid-cols-3 gap-6">

<div className="col-span-1">
<WeatherCard weather={weather}/>
</div>

<div className="col-span-2">
<TempChart forecast={forecast}/>
</div>

</div>

)}

{forecast && <Forecast forecast={forecast}/>}

</div>

</div>

);

}

export default App;