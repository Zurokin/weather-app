"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const API_KEY = "7cba7b851e204e379ec145532242108"; // Замените на ваш API-ключ
const WEATHER_API_URL = `https://api.weatherapi.com/v1`;
const FORECAST_API_URL = `${WEATHER_API_URL}/forecast.json`;

const formatDateTime = (dateTime: string, timezone: string) => {
  const date = new Date(dateTime);
  const options = {
    timeZone: timezone,
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  } as const;

  return date.toLocaleString("ru-RU", options);
};

export default function Home() {
  const [city, setCity] = useState("");
  const [cities, setCities] = useState<string[]>([]);
  const [weatherData, setWeatherData] = useState<any[]>([]);
  const [forecastData, setForecastData] = useState<{ [key: string]: any[] }>(
    {}
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentDateTimes, setCurrentDateTimes] = useState<{
    [key: string]: string;
  }>({});
  const [activeForecast, setActiveForecast] = useState<{
    [key: string]: "week" | "two-weeks" | null;
  }>({});

  const fetchWeatherForCity = async (cityName: string) => {
    try {
      const response = await fetch(
        `${WEATHER_API_URL}/current.json?key=${API_KEY}&q=${cityName}&lang=ru`
      );

      if (!response.ok) {
        throw new Error(`Не удалось получить данные для города: ${cityName}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      setError(error.message);
      return null;
    }
  };

  const fetchForecastForCity = async (cityName: string) => {
    try {
      const response = await fetch(
        `${FORECAST_API_URL}?key=${API_KEY}&q=${cityName}&days=7&lang=ru`
      );

      if (!response.ok) {
        throw new Error(
          `Не удалось получить прогноз погоды для города: ${cityName}`
        );
      }

      const data = await response.json();
      return data.forecast.forecastday;
    } catch (error: any) {
      setError(error.message);
      return [];
    }
  };

  const fetchTwoWeekForecastForCity = async (cityName: string) => {
    try {
      const response = await fetch(
        `${FORECAST_API_URL}?key=${API_KEY}&q=${cityName}&days=14&lang=ru`
      );

      if (!response.ok) {
        throw new Error(
          `Не удалось получить прогноз погоды для города: ${cityName}`
        );
      }

      const data = await response.json();
      return data.forecast.forecastday;
    } catch (error: any) {
      setError(error.message);
      return [];
    }
  };

  const handleAddCity = async () => {
    if (city && !cities.includes(city)) {
      setLoading(true);
      try {
        const weather = await fetchWeatherForCity(city);
        if (weather) {
          setCities([...cities, city]);
          setWeatherData([...weatherData, weather]);
          setCurrentDateTimes({
            ...currentDateTimes,
            [weather.location.name]: formatDateTime(
              new Date().toISOString(),
              weather.location.tz_id
            ),
          });
          setCity("");
          setError(null);
        }
      } catch (error) {
        setError("Ошибка при загрузке данных о погоде.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFetchForecast = async (cityName: string) => {
    setActiveForecast((prev) => ({ ...prev, [cityName]: "week" }));
    if (forecastData[cityName]) return;

    setLoading(true);
    try {
      const forecast = await fetchForecastForCity(cityName);
      setForecastData((prevData) => ({
        ...prevData,
        [cityName]: forecast,
      }));
      setError(null);
    } catch (error) {
      setError("Ошибка при загрузке прогноза погоды.");
    } finally {
      setLoading(false);
    }
  };

  const handleFetchTwoWeekForecast = async (cityName: string) => {
    setActiveForecast((prev) => ({ ...prev, [cityName]: "two-weeks" }));
    if (forecastData[`${cityName}-two-weeks`]) return;

    setLoading(true);
    try {
      const forecast = await fetchTwoWeekForecastForCity(cityName);
      setForecastData((prevData) => ({
        ...prevData,
        [`${cityName}-two-weeks`]: forecast,
      }));
      setError(null);
    } catch (error) {
      setError("Ошибка при загрузке прогноза погоды.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const updateTimes = () => {
      const updatedDateTimes = weatherData.reduce((acc, weather) => {
        acc[weather.location.name] = formatDateTime(
          new Date().toISOString(),
          weather.location.tz_id
        );
        return acc;
      }, {} as { [key: string]: string });
      setCurrentDateTimes(updatedDateTimes);
    };

    const interval = setInterval(updateTimes, 1000);

    return () => clearInterval(interval);
  }, [weatherData]);

  const getDayPartForecast = (forecast: any) => {
    const morning = forecast.hour.find(
      (hourData: any) => new Date(hourData.time).getHours() === 9
    );
    const day = forecast.hour.find(
      (hourData: any) => new Date(hourData.time).getHours() === 15
    );
    const night = forecast.hour.find(
      (hourData: any) => new Date(hourData.time).getHours() === 21
    );
    return { morning, day, night };
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-100 p-4">
      <h1 className="text-4xl font-bold mb-8">Зурокактамнаулице</h1>
      <div className="flex mb-4 w-full max-w-xl">
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Введите название места"
          className="p-2 rounded-lg border border-zinc-300 flex-grow mr-4"
        />
        <button
          onClick={handleAddCity}
          className="px-4 py-2 bg-rose-500 text-white rounded-lg"
          disabled={loading}
        >
          {loading ? "Загрузка..." : "Добавить город"}
        </button>
      </div>

      {error && <p className="text-red-500 mt-4">{error}</p>}
      {weatherData.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-6 w-full max-w-6xl">
          {weatherData.map((weather: any, index: number) => (
            <div
              key={index}
              className="p-6 bg-white rounded-lg shadow-lg text-center w-full max-w-6xl"
            >
              <h2 className="text-2xl font-bold mb-2">
                {weather.location.name}
              </h2>
              <Image
                width={80}
                height={80}
                src={`https:${weather.current.condition.icon}`}
                alt={weather.current.condition.text}
                className="mx-auto mb-2"
              />
              <p className="text-2xl mb-1">{weather.current.temp_c}°C</p>
              <p className="text-lg mb-2">{weather.current.condition.text}</p>
              <p className="text-sm text-zinc-500 mb-1">
                Влажность: {weather.current.humidity}%
              </p>
              <p className="text-sm text-zinc-500 mb-1">
                Давление: {weather.current.pressure_mb} mb
              </p>
              <p className="text-sm text-zinc-500 mb-2">
                Скорость ветра: {weather.current.wind_kph} км/ч
              </p>
              <p className="text-sm text-zinc-500 mb-4">
                Дата и время:{" "}
                {currentDateTimes[weather.location.name] || "Неизвестно"}
              </p>
              <div className="flex justify-center">
                <button
                  onClick={() => handleFetchForecast(weather.location.name)}
                  className="px-4 py-2 bg-rose-500 text-white rounded-lg mr-2"
                  disabled={loading}
                >
                  {loading ? "Загрузка..." : "Узнать погоду на неделю"}
                </button>
                <button
                  onClick={() =>
                    handleFetchTwoWeekForecast(weather.location.name)
                  }
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg"
                  disabled={loading}
                >
                  {loading ? "Загрузка..." : "Узнать погоду на 14 дней"}
                </button>
              </div>

              {activeForecast[weather.location.name] === "week" &&
                forecastData[weather.location.name] && (
                  <div className="mt-6 text-left">
                    <h3 className="text-lg font-bold mb-4">
                      Прогноз на неделю:
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {forecastData[weather.location.name].map(
                        (forecast: any, idx: number) => {
                          const date = new Date(forecast.date);
                          const options = {
                            weekday: "short" as const,
                            day: "numeric" as const,
                            month: "numeric" as const,
                          };
                          const formattedDate = date.toLocaleDateString(
                            "ru-RU",
                            options
                          );

                          const dayPartForecast = getDayPartForecast(forecast);

                          return (
                            <div
                              key={idx}
                              className="bg-white p-6 rounded-lg shadow-lg mb-6 w-full max-w-md mx-auto"
                            >
                              <div className="flex justify-between items-center border-b pb-3 mb-3">
                                <p className="text-lg font-bold">
                                  {formattedDate}
                                </p>
                                {/* <p className="text-sm text-zinc-500">
                                  {dayOfWeek}
                                </p> */}
                              </div>
                              <div className="flex flex-col space-y-4">
                                <div className="flex justify-between items-center">
                                  <p className="text-sm font-medium">Утром</p>
                                  <div className="flex items-center space-x-3">
                                    <Image
                                      width={32}
                                      height={32}
                                      src={`https:${dayPartForecast.morning.condition.icon}`}
                                      alt={
                                        dayPartForecast.morning.condition.text
                                      }
                                    />
                                    <p>{dayPartForecast.morning.temp_c}°C</p>
                                  </div>
                                  <p className="text-sm text-zinc-500">
                                    {dayPartForecast.morning.wind_kph} м/с
                                  </p>
                                </div>
                                <div className="flex justify-between items-center">
                                  <p className="text-sm font-medium">Днём</p>
                                  <div className="flex items-center space-x-3">
                                    <Image
                                      width={32}
                                      height={32}
                                      src={`https:${dayPartForecast.day.condition.icon}`}
                                      alt={dayPartForecast.day.condition.text}
                                    />
                                    <p>{dayPartForecast.day.temp_c}°C</p>
                                  </div>
                                  <p className="text-sm text-zinc-500">
                                    {dayPartForecast.day.wind_kph} м/с
                                  </p>
                                </div>
                                <div className="flex justify-between items-center">
                                  <p className="text-sm font-medium">Вечером</p>
                                  <div className="flex items-center space-x-3">
                                    <Image
                                      width={32}
                                      height={32}
                                      src={`https:${dayPartForecast.night.condition.icon}`}
                                      alt={dayPartForecast.night.condition.text}
                                    />
                                    <p>{dayPartForecast.night.temp_c}°C</p>
                                  </div>
                                  <p className="text-sm text-zinc-500">
                                    {dayPartForecast.night.wind_kph} м/с
                                  </p>
                                </div>
                                <div className="flex justify-between items-center">
                                  <p className="text-sm font-medium">Ночью</p>
                                  <div className="flex items-center space-x-3">
                                    <Image
                                      width={32}
                                      height={32}
                                      src={`https:${dayPartForecast.night.condition.icon}`}
                                      alt={dayPartForecast.night.condition.text}
                                    />
                                    <p>{dayPartForecast.night.temp_c}°C</p>
                                  </div>
                                  <p className="text-sm text-zinc-500">
                                    {dayPartForecast.night.wind_kph} м/с
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}

              {activeForecast[weather.location.name] === "two-weeks" &&
                forecastData[`${weather.location.name}-two-weeks`] && (
                  <div className="mt-6 text-left">
                    <h3 className="text-lg font-bold mb-4">
                      Прогноз на 14 дней:
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      {forecastData[`${weather.location.name}-two-weeks`].map(
                        (forecast: any, idx: number) => {
                          const date = new Date(forecast.date);
                          const options = {
                            weekday: "short" as const,
                            day: "numeric" as const,
                            month: "numeric" as const,
                          };
                          const formattedDate = date.toLocaleDateString(
                            "ru-RU",
                            options
                          );

                          const dayPartForecast = getDayPartForecast(forecast);

                          return (
                            <div
                              key={idx}
                              className="flex flex-col items-center bg-zinc-100 p-4 rounded-lg"
                            >
                              <p className="text-lg font-medium mb-2">
                                {formattedDate}
                              </p>
                              <div className="w-full flex justify-between">
                                <div className="text-center">
                                  <p className="font-bold">Утро</p>
                                  {dayPartForecast.morning && (
                                    <>
                                      <Image
                                        width={30}
                                        height={30}
                                        src={`https:${dayPartForecast.morning.condition.icon}`}
                                        alt={
                                          dayPartForecast.morning.condition.text
                                        }
                                      />
                                      <p>{dayPartForecast.morning.temp_c}°C</p>
                                      <p>
                                        {dayPartForecast.morning.condition.text}
                                      </p>
                                    </>
                                  )}
                                </div>
                                <div className="text-center">
                                  <p className="font-bold">День</p>
                                  {dayPartForecast.day && (
                                    <>
                                      <Image
                                        width={30}
                                        height={30}
                                        src={`https:${dayPartForecast.day.condition.icon}`}
                                        alt={dayPartForecast.day.condition.text}
                                      />
                                      <p>{dayPartForecast.day.temp_c}°C</p>
                                      <p>
                                        {dayPartForecast.day.condition.text}
                                      </p>
                                    </>
                                  )}
                                </div>
                                <div className="text-center">
                                  <p className="font-bold">Ночь</p>
                                  {dayPartForecast.night && (
                                    <>
                                      <Image
                                        width={30}
                                        height={30}
                                        src={`https:${dayPartForecast.night.condition.icon}`}
                                        alt={
                                          dayPartForecast.night.condition.text
                                        }
                                      />
                                      <p>{dayPartForecast.night.temp_c}°C</p>
                                      <p>
                                        {dayPartForecast.night.condition.text}
                                      </p>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
