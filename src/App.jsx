import { useEffect, useMemo, useState } from "react";

/**
 * Open-Meteo version (NO API KEY)
 * - City -> Lat/Lon via Open-Meteo Geocoding
 * - Weather via Open-Meteo Forecast
 */

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });

const formatClock = (iso) =>
  new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-xl border border-white/10">
      <p className="text-xs text-white/70">{label}</p>
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function ForecastCard({ day, emoji, tempMax, tempMin, codeText }) {
  return (
    <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-xl border border-white/10 hover:bg-white/15 transition">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-white/80">{day}</p>
          <p className="mt-1 text-xs text-white/60">{codeText}</p>
        </div>

        <div className="text-3xl drop-shadow-xl">{emoji}</div>
      </div>

      <div className="mt-3 flex items-end justify-between">
        <p className="text-2xl font-extrabold text-white">
          {Math.round(tempMax)}°
        </p>
        <p className="text-sm text-white/60">Min {Math.round(tempMin)}°</p>
      </div>

      <div className="mt-3 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
        <div className="h-full w-2/3 rounded-full bg-white/25" />
      </div>
    </div>
  );
}

/** Weather code -> emoji + label */
function codeToInfo(code) {
  // https://open-meteo.com/en/docs
  if (code === 0) return { emoji: "☀️", text: "Clear sky" };
  if (code === 1 || code === 2) return { emoji: "🌤️", text: "Partly cloudy" };
  if (code === 3) return { emoji: "☁️", text: "Overcast" };

  if (code === 45 || code === 48) return { emoji: "🌫️", text: "Fog" };

  if ([51, 53, 55].includes(code)) return { emoji: "🌦️", text: "Drizzle" };
  if ([56, 57].includes(code))
    return { emoji: "🌧️", text: "Freezing drizzle" };

  if ([61, 63, 65].includes(code)) return { emoji: "🌧️", text: "Rain" };
  if ([66, 67].includes(code)) return { emoji: "🌧️", text: "Freezing rain" };

  if ([71, 73, 75].includes(code)) return { emoji: "❄️", text: "Snow" };
  if (code === 77) return { emoji: "🌨️", text: "Snow grains" };

  if ([80, 81, 82].includes(code))
    return { emoji: "🌧️", text: "Rain showers" };
  if ([85, 86].includes(code))
    return { emoji: "🌨️", text: "Snow showers" };

  if (code === 95) return { emoji: "⛈️", text: "Thunderstorm" };
  if (code === 96 || code === 99)
    return { emoji: "⛈️", text: "Thunderstorm + hail" };

  return { emoji: "🌡️", text: "Weather" };
}

export default function App() {
  const [query, setQuery] = useState("Delhi");
  const [city, setCity] = useState("Delhi");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [place, setPlace] = useState(null); // {name, country, lat, lon}
  const [current, setCurrent] = useState(null);
  const [forecast, setForecast] = useState([]);

  const bgClass = useMemo(() => {
    if (!current) return "from-slate-950 via-indigo-950 to-slate-950";

    const code = current?.weather_code ?? 0;

    // Rainy / storm
    if ([61, 63, 65, 80, 81, 82, 95, 96, 99].includes(code))
      return "from-slate-950 via-blue-950 to-slate-950";

    // Snow
    if ([71, 73, 75, 77, 85, 86].includes(code))
      return "from-slate-900 via-slate-700 to-slate-900";

    // Clear / sunny
    if ([0, 1].includes(code))
      return "from-indigo-950 via-purple-950 to-slate-950";

    // Cloudy default
    return "from-slate-950 via-slate-900 to-indigo-950";
  }, [current]);

  const weatherTheme = useMemo(() => {
    if (!current)
      return {
        type: "default",
        isRain: false,
        isSnow: false,
        isSunny: false,
        isCloudy: true,
      };

    const code = current?.weather_code ?? 0;

    const isRain = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code);
    const isStorm = [95, 96, 99].includes(code);
    const isSnow = [71, 73, 75, 77, 85, 86].includes(code);
    const isSunny = [0, 1].includes(code);
    const isCloudy = [2, 3, 45, 48].includes(code);

    return {
      type: isStorm
        ? "storm"
        : isRain
        ? "rain"
        : isSnow
        ? "snow"
        : isSunny
        ? "sun"
        : isCloudy
        ? "cloud"
        : "default",
      isRain: isRain || isStorm,
      isSnow,
      isSunny,
      isCloudy,
      isStorm,
    };
  }, [current]);

  const fetchCityLatLon = async (cityName) => {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        cityName
      )}&count=1&language=en&format=json`
    );

    const data = await res.json();

    if (!data?.results?.length) {
      throw new Error("City not found!");
    }

    const r = data.results[0];
    return {
      name: r.name,
      country: r.country,
      lat: r.latitude,
      lon: r.longitude,
      timezone: r.timezone,
    };
  };

  const fetchWeather = async (cityName) => {
    setLoading(true);
    setErr("");

    try {
      const loc = await fetchCityLatLon(cityName);
      setPlace(loc);

      const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) throw new Error("Weather not available!");

      // Current
      const c = data.current;
      const info = codeToInfo(c.weather_code);

      setCurrent({
        temp: c.temperature_2m,
        feels: c.apparent_temperature,
        humidity: c.relative_humidity_2m,
        wind: c.wind_speed_10m,
        weather_code: c.weather_code,
        text: info.text,
        emoji: info.emoji,
        time: c.time,
      });

      // 5 day forecast
      const days = (data.daily.time || []).slice(0, 5).map((date, i) => {
        const code = data.daily.weather_code[i];
        const info = codeToInfo(code);

        return {
          date,
          code,
          emoji: info.emoji,
          text: info.text,
          tempMax: data.daily.temperature_2m_max[i],
          tempMin: data.daily.temperature_2m_min[i],
        };
      });

      setForecast(days);
      setCity(`${loc.name}${loc.country ? `, ${loc.country}` : ""}`);
    } catch (e) {
      setErr(e.message || "Something went wrong!");
      setPlace(null);
      setCurrent(null);
      setForecast([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather("Delhi");
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    fetchWeather(query.trim());
  };

  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${bgClass} text-white flex items-center justify-center px-4 py-10 relative`}
    >
      {/* Inline CSS for weather effects */}
      <style>{`
        @keyframes rainFall {
          0% { transform: translateY(-30%); }
          100% { transform: translateY(30%); }
        }

        @keyframes snowFall {
          0% { transform: translateY(-20%); }
          100% { transform: translateY(20%); }
        }

        @keyframes cloudsMove {
          0% { transform: translateX(-10%); }
          100% { transform: translateX(10%); }
        }

        .rain-layer {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(transparent 0%, rgba(255,255,255,0.35) 60%, transparent 100%),
            linear-gradient(transparent 0%, rgba(255,255,255,0.25) 60%, transparent 100%);
          background-size: 3px 28px, 2px 22px;
          background-position: 0 0, 40px 20px;
          background-repeat: repeat;
          transform: skewX(-10deg);
          animation: rainFall 1.2s linear infinite;
        }

        .rain-layer-2 {
          opacity: 0.6;
          filter: blur(0.2px);
          animation-duration: 0.9s;
        }

        .snow-layer {
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1.5px),
            radial-gradient(rgba(255,255,255,0.45) 1px, transparent 1.5px);
          background-size: 26px 26px, 18px 18px;
          background-position: 0 0, 10px 14px;
          background-repeat: repeat;
          animation: snowFall 6s linear infinite;
        }

        .snow-layer-2 {
          opacity: 0.55;
          filter: blur(0.4px);
          animation-duration: 9s;
        }

        .cloud-layer {
          position: absolute;
          inset: -20% -20% -20% -20%;
          background-image:
            radial-gradient(rgba(255,255,255,0.10) 35%, transparent 60%),
            radial-gradient(rgba(255,255,255,0.08) 35%, transparent 60%),
            radial-gradient(rgba(255,255,255,0.06) 35%, transparent 60%);
          background-size: 420px 220px, 520px 260px, 640px 300px;
          background-position: 0% 30%, 40% 50%, 70% 20%;
          background-repeat: no-repeat;
          animation: cloudsMove 8s ease-in-out infinite alternate;
          filter: blur(1px);
        }
      `}</style>
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-fuchsia-500/15 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full bg-sky-500/15 blur-3xl" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-[420px] w-[420px] rounded-full bg-indigo-500/10 blur-3xl" />

        {/* Weather effects */}
        {weatherTheme.isRain ? (
          <div className="absolute inset-0 opacity-40">
            <div className="rain-layer" />
            <div className="rain-layer rain-layer-2" />
          </div>
        ) : null}

        {weatherTheme.isSnow ? (
          <div className="absolute inset-0 opacity-60">
            <div className="snow-layer" />
            <div className="snow-layer snow-layer-2" />
          </div>
        ) : null}

        {weatherTheme.isSunny ? (
          <div className="absolute -top-24 right-10 h-44 w-44 rounded-full bg-yellow-200/10 blur-2xl" />
        ) : null}

        {weatherTheme.isCloudy ? (
          <div className="absolute inset-0 opacity-35">
            <div className="cloud-layer" />
          </div>
        ) : null}
      </div>

      <div className="relative w-full max-w-5xl">
        {/* Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-white/60">Weather</p>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              {city}
            </h1>
            {current?.time ? (
              <p className="mt-1 text-sm text-white/50">
                Updated {formatClock(current.time)}
              </p>
            ) : null}
          </div>

          {/* Search */}
          <form onSubmit={onSearch} className="w-full md:w-[420px] flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search city..."
              className="w-full rounded-2xl bg-white/10 border border-white/10 px-4 py-3 outline-none placeholder:text-white/40 focus:border-white/30"
            />
            <button
              type="submit"
              className="rounded-2xl px-5 py-3 font-semibold bg-white text-slate-900 hover:bg-white/90 active:scale-[0.98] transition"
            >
              Search
            </button>
          </form>
        </div>

        {/* Main Grid */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current */}
          <div className="lg:col-span-2 rounded-3xl bg-white/10 border border-white/10 backdrop-blur-xl p-6">
            {loading ? (
              <div className="animate-pulse">
                <div className="h-6 w-40 bg-white/10 rounded-lg" />
                <div className="mt-6 h-28 w-full bg-white/10 rounded-2xl" />
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="h-14 bg-white/10 rounded-2xl" />
                  <div className="h-14 bg-white/10 rounded-2xl" />
                  <div className="h-14 bg-white/10 rounded-2xl" />
                  <div className="h-14 bg-white/10 rounded-2xl" />
                </div>
              </div>
            ) : err ? (
              <div className="text-center py-12">
                <p className="text-lg font-semibold">Oops 😅</p>
                <p className="mt-2 text-white/70">{err}</p>
              </div>
            ) : current ? (
              <>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div>
                    <p className="text-sm text-white/60">Now</p>

                    <div className="mt-3 flex items-center gap-4">
                      <div className="text-6xl md:text-7xl drop-shadow-2xl">
                        {current.emoji}
                      </div>

                      <div>
                        <p className="text-5xl md:text-6xl font-extrabold leading-none">
                          {Math.round(current.temp)}°
                        </p>
                        <p className="mt-2 text-white/70">{current.text}</p>
                        <p className="mt-1 text-sm text-white/50">
                          Feels like {Math.round(current.feels)}°
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl bg-black/20 border border-white/10 p-5">
                    <p className="text-xs text-white/60">Location</p>
                    <p className="text-base font-semibold mt-1">
                      {place?.name}
                    </p>
                    <p className="mt-1 text-xs text-white/50">
                      {place?.country}
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="rounded-2xl bg-white/5 border border-white/10 px-3 py-2">
                        <p className="text-[11px] text-white/60">Lat</p>
                        <p className="text-sm font-semibold">
                          {place?.lat?.toFixed?.(2)}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white/5 border border-white/10 px-3 py-2">
                        <p className="text-[11px] text-white/60">Lon</p>
                        <p className="text-sm font-semibold">
                          {place?.lon?.toFixed?.(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Stat label="Humidity" value={`${current.humidity}%`} />
                  <Stat label="Wind" value={`${Math.round(current.wind)} km/h`} />
                  <Stat label="Condition" value={current.text} />
                  <Stat label="Country" value={place?.country || "-"} />
                </div>
              </>
            ) : null}
          </div>

          {/* 5-day */}
          <div className="rounded-3xl bg-white/10 border border-white/10 backdrop-blur-xl p-6">
            <p className="text-sm text-white/60">Next 5 days</p>

            {loading ? (
              <div className="mt-4 space-y-3 animate-pulse">
                <div className="h-24 bg-white/10 rounded-2xl" />
                <div className="h-24 bg-white/10 rounded-2xl" />
                <div className="h-24 bg-white/10 rounded-2xl" />
                <div className="h-24 bg-white/10 rounded-2xl" />
              </div>
            ) : forecast?.length ? (
              <div className="mt-4 grid gap-3">
                {forecast.map((d) => (
                  <ForecastCard
                    key={d.date}
                    day={formatDate(d.date)}
                    emoji={d.emoji}
                    tempMax={d.tempMax}
                    tempMin={d.tempMin}
                    codeText={d.text}
                  />
                ))}
              </div>
            ) : (
              <p className="mt-4 text-white/60 text-sm">
                Search a city to see forecast.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
