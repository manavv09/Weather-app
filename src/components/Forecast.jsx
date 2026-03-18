function Forecast({forecast}){

const daily = forecast.list.filter(item =>
item.dt_txt.includes("12:00:00")
);

return(

<div className="grid grid-cols-5 gap-4 mt-8">

{daily.slice(0,5).map((item,index)=>{

const icon = item.weather[0].icon;

const iconUrl =
`https://openweathermap.org/img/wn/${icon}.png`;

return(

<div
key={index}
className="bg-white/30 backdrop-blur-md p-4 rounded text-center"
>

<p>
{new Date(item.dt_txt).toLocaleDateString()}
</p>

<img src={iconUrl} className="mx-auto"/>

<p className="font-bold">
{Math.round(item.main.temp)}°C
</p>

</div>

);

})}

</div>

);

}

export default Forecast;