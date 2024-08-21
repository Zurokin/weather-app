"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const API_KEY = "7cba7b851e204e379ec145532242108"; // Замените на ваш API-ключ
const WEATHER_API_URL = `https://api.weatherapi.com/v1/current.json`;

// Функция для форматирования даты и времени
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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentDateTimes, setCurrentDateTimes] = useState<{
    [key: string]: string;
  }>({});

  const fetchWeatherForCity = async (cityName: string) => {
    try {
      const response = await fetch(
        `${WEATHER_API_URL}?key=${API_KEY}&q=${cityName}&lang=ru`
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-100">
      <h1 className="text-4xl font-bold mb-8">Зурокактамнаулице</h1>
      <div className="flex mb-4">
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Введите название места"
          className="p-2 rounded-lg border border-zinc-300 mr-4"
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
        <div className="mt-8 flex flex-wrap gap-4">
          {weatherData.map((weather: any, index: number) => (
            <div
              key={index}
              className="p-4 bg-white rounded-lg shadow-lg text-center w-80"
            >
              <h2 className="text-2xl font-bold">{weather.location.name}</h2>
              <Image
                width={64}
                height={64}
                src={`https:${weather.current.condition.icon}`}
                alt={weather.current.condition.text}
                className="mx-auto"
              />
              <p className="text-xl">{weather.current.temp_c}°C</p>
              <p className="text-lg">{weather.current.condition.text}</p>
              <p className="text-sm text-zinc-500">
                Влажность: {weather.current.humidity}%
              </p>
              <p className="text-sm text-zinc-500">
                Давление: {weather.current.pressure_mb} mb
              </p>
              <p className="text-sm text-zinc-500">
                Скорость ветра: {weather.current.wind_kph} км/ч
              </p>
              <p className="text-sm text-zinc-500 mt-2">
                Дата и время:{" "}
                {currentDateTimes[weather.location.name] || "Неизвестно"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
