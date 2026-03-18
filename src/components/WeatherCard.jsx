import { Wind, Droplets, Thermometer } from "lucide-react";

function WeatherCard({weather}){

const icon = weather.weather[0].icon;

const iconUrl =
`https://openweathermap.org/img/wn/${icon}@4x.png`;

return(

<div className="bg-white/30 backdrop-blur-md p-6 rounded-xl text-center">

<h2 className="text-2xl font-semibold">
{weather.name}
</h2>

<img src={iconUrl} className="mx-auto"/>

<p className="capitalize">
{weather.weather[0].description}
</p>

<h1 className="text-5xl font-bold">
{Math.round(weather.main.temp)}°C
</h1>

<div className="grid grid-cols-3 gap-3 mt-4">

<div className="bg-white/50 p-3 rounded">
<Droplets className="mx-auto"/>
{weather.main.humidity}%
</div>

<div className="bg-white/50 p-3 rounded">
<Wind className="mx-auto"/>
{weather.wind.speed}
</div>

<div className="bg-white/50 p-3 rounded">
<Thermometer className="mx-auto"/>
{weather.main.feels_like}
</div>

</div>

</div>

);

}

export default WeatherCard;