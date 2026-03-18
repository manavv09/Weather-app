import {
LineChart,
Line,
XAxis,
YAxis,
Tooltip,
ResponsiveContainer
} from "recharts";

function TempChart({forecast}){

const data = forecast?.list.slice(0,8).map(item=>({
time: item.dt_txt.slice(11,16),
temp: item.main.temp
}));

return(

<div className="bg-white/30 backdrop-blur-md p-6 rounded-xl h-72">

<h2 className="text-xl mb-4">
Hourly Temperature
</h2>

<ResponsiveContainer width="100%" height="100%">

<LineChart data={data}>

<XAxis dataKey="time"/>

<YAxis/>

<Tooltip/>

<Line
type="monotone"
dataKey="temp"
stroke="#2563eb"
strokeWidth={3}
/>

</LineChart>

</ResponsiveContainer>

</div>

);

}

export default TempChart;