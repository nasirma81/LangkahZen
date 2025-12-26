
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { WalkState } from './types';
import TimerDisplay from './components/TimerDisplay';
import ControlButtons from './components/ControlButtons';
import Stats from './components/Stats';
import WeatherCard from './components/WeatherCard';
import BatikBackground from './components/BatikBackground';
import HydrationToast from './components/HydrationToast';
import useLocalStorage from './hooks/useLocalStorage';

const BRISK_WALK_DURATION = 3 * 60; // 3 minutes
const LEISURELY_WALK_DURATION = 3 * 60; // 3 minutes
const HYDRATION_INTERVAL = 15 * 60; // 15 minutes

const CHIME_URL = 'https://soundbible.com/mp3/service-bell_daniel_simion.mp3';

const App: React.FC = () => {
  const [walkState, setWalkState] = useState<WalkState>(WalkState.Brisk);
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(BRISK_WALK_DURATION);
  const [totalTimeWalked, setTotalTimeWalked] = useLocalStorage('totalTimeWalked', 0);
  const [totalSteps, setTotalSteps] = useLocalStorage('totalSteps', 0);
  const [showHydrationToast, setShowHydrationToast] = useState(false);

  const chimeAudio = useRef<HTMLAudioElement | null>(null);
  const lastHydrationReminderTime = useRef(0);

  // Hapus inisialisasi audio dari useEffect.
  // Kita akan melakukannya saat pengguna berinteraksi pertama kali.
  // useEffect(() => {
  //   chimeAudio.current = new Audio(CHIME_URL);
  //   chimeAudio.current.preload = 'auto';
  // }, []);

  const playChime = useCallback(() => {
    // Fungsi ini tetap sama, tapi sekarang akan bekerja karena audio sudah di-unlock.
    if (chimeAudio.current) {
      chimeAudio.current.currentTime = 0;
      chimeAudio.current.play().catch(error => console.error("Audio play failed:", error));
    }
  }, []);

  const switchWalkState = useCallback(() => {
    playChime();
    setWalkState(prevState => {
      if (prevState === WalkState.Brisk) {
        setTimeLeft(LEISURELY_WALK_DURATION);
        return WalkState.Leisurely;
      } else {
        setTimeLeft(BRISK_WALK_DURATION);
        return WalkState.Brisk;
      }
    });
  }, [playChime]);
  
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
  
    if (isActive) {
      interval = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime > 1) {
            return prevTime - 1;
          } else {
            switchWalkState();
            return 0; 
          }
        });
  
        setTotalTimeWalked(prevTotal => prevTotal + 1);
        setTotalSteps(prevSteps => {
          const stepsPerSecond = walkState === WalkState.Brisk ? 130 / 60 : 90 / 60;
          return prevSteps + stepsPerSecond;
        });
      }, 1000);
    }
  
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isActive, walkState, setTotalSteps, setTotalTimeWalked, switchWalkState]);
  

  useEffect(() => {
    const currentHydrationMilestone = Math.floor(totalTimeWalked / HYDRATION_INTERVAL);
    const lastHydrationMilestone = Math.floor(lastHydrationReminderTime.current / HYDRATION_INTERVAL);

    if (totalTimeWalked > 0 && currentHydrationMilestone > lastHydrationMilestone) {
        setShowHydrationToast(true);
        lastHydrationReminderTime.current = totalTimeWalked;
        setTimeout(() => setShowHydrationToast(false), 5000);
    }
  }, [totalTimeWalked]);

  const handleStart = () => {
    // SOLUSI: Inisialisasi dan 'unlock' audio saat tombol start ditekan pertama kali.
    if (!chimeAudio.current) {
      console.log('Initializing and unlocking audio context...');
      chimeAudio.current = new Audio(CHIME_URL);
      chimeAudio.current.preload = 'auto';

      // Trik untuk 'unlock': mainkan suara yang tidak terdengar.
      // Beberapa browser/webview hanya butuh .load(), tapi play/pause lebih andal.
      const promise = chimeAudio.current.play();
      if (promise !== undefined) {
        promise.then(() => {
          chimeAudio.current?.pause();
          chimeAudio.current!.currentTime = 0;
          console.log('Audio unlocked.');
        }).catch(error => {
          console.error("Audio unlock failed:", error);
          // Jika gagal, mungkin audio tidak akan berfungsi sama sekali.
          // Kita set ke null agar bisa dicoba lagi di interaksi berikutnya.
          chimeAudio.current = null;
        });
      }
    }
    
    setIsActive(true);
  };

  const handlePause = () => setIsActive(false);

  const handleReset = () => {
    setIsActive(false);
    setWalkState(WalkState.Brisk);
    setTimeLeft(BRISK_WALK_DURATION);
    if (window.confirm("Apakah Anda ingin mereset total statistik (langkah dan menit)?")) {
      setTotalTimeWalked(0);
      setTotalSteps(0);
      lastHydrationReminderTime.current = 0;
    }
  };

  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation tidak didukung oleh browser Anda.");
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
        const message = `Halo! Saya sedang berjalan menggunakan LangkahZen. Lokasi saya saat ini: ${mapsLink}`;

        if (navigator.share) {
          navigator.share({
            title: 'Lokasi Saya - LangkahZen',
            text: message,
          }).catch(console.error);
        } else {
          const whatsappLink = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
          window.open(whatsappLink, '_blank');
        }
      },
      (error) => {
        alert(`Gagal mendapatkan lokasi: ${error.message}. Pastikan izin lokasi telah diberikan.`);
      }
    );
  };
  
  const themeColor = walkState === WalkState.Brisk ? '#E2725B' : '#228B22';
  const duration = walkState === WalkState.Brisk ? BRISK_WALK_DURATION : LEISURELY_WALK_DURATION;

  return (
    <>
      <BatikBackground />
      <HydrationToast isVisible={showHydrationToast} />
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 text-slate-800 antialiased">
        <div className="w-full max-w-sm mx-auto flex flex-col items-center space-y-6">
          
          <header className="text-center">
            <h1 className="text-4xl font-bold tracking-tight">Langkah<span style={{ color: themeColor }}>Zen</span></h1>
            <p className="text-slate-500">Sassa-ka Walking Timer</p>
          </header>

          <main className="w-full flex flex-col items-center space-y-6">
            <TimerDisplay 
              timeLeft={timeLeft}
              walkState={walkState}
              duration={duration}
              color={themeColor}
            />
            <ControlButtons 
              isActive={isActive}
              onStart={handleStart}
              onPause={handlePause}
              onReset={handleReset}
              onShareLocation={handleShareLocation}
              themeColor={themeColor}
            />
            <Stats 
              totalMinutes={Math.floor(totalTimeWalked / 60)} 
              totalSteps={Math.floor(totalSteps)}
            />
            <WeatherCard />
          </main>
        </div>
      </div>
    </>
  );
};

export default App;
