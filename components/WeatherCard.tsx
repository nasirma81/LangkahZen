
import React, { useState, useEffect } from 'react';
import { Sun, AlertTriangle, Loader, CloudFog } from 'lucide-react';

interface WeatherData {
  temp: number;
  uvIndex: number;
  condition: string;
}

const capitalize = (s: string) => {
  if (typeof s !== 'string' || s.length === 0) return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const WeatherCard: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const API_KEY = (import.meta as unknown as { env: { VITE_OPENWEATHER_API_KEY?: string } }).env?.VITE_OPENWEATHER_API_KEY;

    const useMockData = (message?: string) => {
      if (message) console.warn(message);
      setError(null); 
      setTimeout(() => {
        setWeather({
          temp: 29,
          uvIndex: 7,
          condition: 'Sedikit Berawan',
        });
        setLoading(false);
      }, 800);
    };

    const fetchRealWeather = () => {
      if (!navigator.geolocation) {
        useMockData("Geolocation tidak didukung. Menampilkan data dummy.");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const apiUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${latitude}&lon=${longitude}&exclude=minutely,hourly,daily,alerts&appid=${API_KEY}&units=metric&lang=id`;
          
          try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
              const errorData = await response.json();
              let errorMessage = errorData.message || 'Gagal mengambil data cuaca.';
              if (response.status === 401) {
                  errorMessage = "API Key tidak valid. Menampilkan data dummy.";
              }
              throw new Error(errorMessage);
            }
            const data = await response.json();
            
            setWeather({
              temp: Math.round(data.current.temp),
              uvIndex: Math.round(data.current.uvi),
              condition: capitalize(data.current.weather[0].description),
            });
            setError(null);
          } catch (err) {
            useMockData(err instanceof Error ? err.message : "Terjadi kesalahan. Menampilkan data dummy.");
          } finally {
            setLoading(false);
          }
        },
        () => {
          useMockData("Gagal mengakses lokasi. Menampilkan data dummy.");
        }
      );
    };
    
    if (!API_KEY) {
      useMockData("VITE_OPENWEATHER_API_KEY tidak diatur. Menampilkan data dummy.");
    } else {
      fetchRealWeather();
    }
  }, []);

  if (loading) {
    return (
        <div className="w-full h-24 bg-white/50 rounded-lg flex items-center justify-center p-4">
            <Loader className="animate-spin text-slate-500 mr-2" size={20} />
            <p className="text-slate-500">Memuat data cuaca...</p>
        </div>
    );
  }

  if (error || !weather) {
    return (
        <div className="w-full bg-red-100 p-4 rounded-lg shadow-sm text-red-700 flex items-center">
            <CloudFog size={24} className="mr-3 flex-shrink-0" />
            <div>
                <p className="font-bold">Gagal Memuat Cuaca</p>
                <p className="text-sm">{error || "Tidak dapat menampilkan data cuaca saat ini."}</p>
            </div>
        </div>
    );
  }

  const showUvWarning = weather.uvIndex > 6;

  return (
    <div className="w-full bg-white/60 backdrop-blur-sm p-4 rounded-lg shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-full text-yellow-500">
                <Sun size={24} />
            </div>
            <div>
                <p className="text-lg font-bold">{weather.temp}°C · {weather.condition}</p>
                <p className="text-sm text-slate-500">Indeks UV: {weather.uvIndex}</p>
            </div>
        </div>
      </div>
      {showUvWarning && (
        <div className="mt-3 p-2 bg-red-100 text-red-700 rounded-md text-sm flex items-center">
            <AlertTriangle size={18} className="mr-2 flex-shrink-0"/>
            <span>Indeks UV Tinggi! Gunakan Sunscreen.</span>
        </div>
      )}
    </div>
  );
};

export default WeatherCard;
