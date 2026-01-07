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
// Tiny silent WAV file in base64 to keep the audio thread active
const SILENT_AUDIO_URL = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAgZGF0YQQAAAAAAA==';

const App: React.FC = () => {
  const [walkState, setWalkState] = useState<WalkState>(WalkState.Brisk);
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(BRISK_WALK_DURATION);
  const [totalTimeWalked, setTotalTimeWalked] = useLocalStorage('totalTimeWalked', 0);
  const [totalSteps, setTotalSteps] = useLocalStorage('totalSteps', 0);
  const [showHydrationToast, setShowHydrationToast] = useState(false);
  
  // PWA Install Prompt State
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  const chimeAudio = useRef<HTMLAudioElement | null>(null);
  const silentAudio = useRef<HTMLAudioElement | null>(null); // Ref for silent loop
  const lastHydrationReminderTime = useRef(0);

  // References for accurate timing handling (Background throttling fix)
  const endTimeRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  const wakeLockRef = useRef<any>(null);

  // Initialize Audio Objects
  useEffect(() => {
    chimeAudio.current = new Audio(CHIME_URL);
    silentAudio.current = new Audio(SILENT_AUDIO_URL);
    silentAudio.current.loop = true; // Crucial: Loop the silent audio
    
    // Cleanup
    return () => {
        if (silentAudio.current) {
            silentAudio.current.pause();
            silentAudio.current = null;
        }
    };
  }, []);

  const playChime = useCallback(() => {
    if (chimeAudio.current) {
      chimeAudio.current.currentTime = 0;
      chimeAudio.current.play().catch(error => console.error("Audio play failed:", error));
    }
  }, []);

  const triggerHaptic = useCallback(() => {
    if (navigator.vibrate) {
        // Pattern: Long vibrate (500ms), pause (200ms), Long vibrate (500ms)
        navigator.vibrate([500, 200, 500]);
    }
  }, []);

  const sendNotification = useCallback((title: string, body: string) => {
    if (Notification.permission === 'granted') {
        try {
            // Check if service worker is ready for richer notifications, else fallback to basic
            if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                 navigator.serviceWorker.ready.then((registration) => {
                    registration.showNotification(title, {
                        body: body,
                        icon: '/icon-192x192.png',
                        vibrate: [500, 200, 500],
                        tag: 'timer-update',
                        renotify: true
                    } as any);
                 });
            } else {
                new Notification(title, {
                    body: body,
                    icon: '/icon-192x192.png',
                });
            }
        } catch (e) {
            console.error("Notification failed", e);
        }
    }
  }, []);

  // Handle PWA Install Prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      console.log("PWA Install prompt captured");
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    setInstallPrompt(null);
  };

  // Function to request Wake Lock (Keep screen on)
  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        console.log('Screen Wake Lock active');
      } catch (err) {
        console.error(`${err.name}, ${err.message}`);
      }
    }
  };

  // Function to release Wake Lock
  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        console.log('Screen Wake Lock released');
      } catch (err) {
        console.error(`${err.name}, ${err.message}`);
      }
    }
  };

  // Main Timer Logic using Timestamp Delta
  useEffect(() => {
    let intervalId: number;

    if (isActive) {
      // 1. Activate Wake Lock
      requestWakeLock();

      // 2. Set Target Time if not set (Initial start or Resume)
      if (!endTimeRef.current) {
        endTimeRef.current = Date.now() + (timeLeft * 1000);
        lastTickRef.current = Date.now();
      }

      intervalId = setInterval(() => {
        const now = Date.now();
        
        // Calculate remaining time based on absolute timestamps
        const targetTime = endTimeRef.current || now;
        const delta = targetTime - now;
        const remainingSeconds = Math.max(0, Math.ceil(delta / 1000));

        // Calculate stats based on actual time passed since last tick
        const timePassedSinceLastTick = (now - lastTickRef.current) / 1000;
        lastTickRef.current = now;

        // Update UI
        setTimeLeft(remainingSeconds);

        // Update Stats
        if (timePassedSinceLastTick > 0) {
            setTotalTimeWalked(prev => prev + timePassedSinceLastTick);
            
            const stepsPerSecond = walkState === WalkState.Brisk ? 130 / 60 : 90 / 60;
            setTotalSteps(prev => prev + (stepsPerSecond * timePassedSinceLastTick));
        }

        // Phase Switch Logic
        if (remainingSeconds <= 0) {
          // 1. Play Sound
          playChime();
          
          // 2. Determine Next State
          const nextState = walkState === WalkState.Brisk ? WalkState.Leisurely : WalkState.Brisk;
          
          // 3. Trigger Haptic & Notification
          triggerHaptic();
          sendNotification(
            "Ganti Fase!", 
            `Waktunya ${nextState === WalkState.Brisk ? 'Jalan Bertenaga' : 'Jalan Santai'} sekarang!`
          );

          // 4. Update State & Timer
          const nextDuration = nextState === WalkState.Brisk ? BRISK_WALK_DURATION : LEISURELY_WALK_DURATION;
          
          setWalkState(nextState);
          setTimeLeft(nextDuration);
          
          // Reset the target time for the new phase immediately
          endTimeRef.current = now + (nextDuration * 1000);
        }

      }, 1000);
    } else {
      // Cleanup when paused
      releaseWakeLock();
      endTimeRef.current = null;
    }

    return () => {
      clearInterval(intervalId);
    };
  }, [isActive, walkState, playChime, timeLeft, setTotalTimeWalked, setTotalSteps, triggerHaptic, sendNotification]);
  
  // Re-request wake lock if visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isActive) {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isActive]);

  // Hydration Check
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
    // 1. Unlock Chime Audio (Browser Policy)
    if (chimeAudio.current) {
        chimeAudio.current.play().then(() => {
            chimeAudio.current?.pause();
            chimeAudio.current!.currentTime = 0;
        }).catch(err => console.log("Chime unlock error", err));
    }

    // 2. Start Silent Loop (Keep-Alive Hack)
    // This tricks the OS into thinking a music player is active
    if (silentAudio.current) {
        silentAudio.current.play().catch(err => console.error("Silent audio failed", err));
    }

    // 3. Request Notification Permission
    if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission();
    }
    
    // Ensure lastTick is set to now so stats don't jump
    lastTickRef.current = Date.now();
    setIsActive(true);
  };

  const handlePause = () => {
    setIsActive(false);
    // Pause silent loop to save battery when explicitly paused by user
    if (silentAudio.current) {
        silentAudio.current.pause();
    }
  };

  const handleReset = () => {
    setIsActive(false);
    if (silentAudio.current) {
        silentAudio.current.pause();
        silentAudio.current.currentTime = 0;
    }
    setWalkState(WalkState.Brisk);
    setTimeLeft(BRISK_WALK_DURATION);
    endTimeRef.current = null; // Clear ref
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

  // Dynamically update the browser's theme color
  useEffect(() => {
    const metaThemeColor = document.querySelector("meta[name=theme-color]");
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", themeColor);
    }
  }, [themeColor]);

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
              showInstall={!!installPrompt}
              onInstall={handleInstallClick}
            />
            <Stats 
              totalMinutes={Math.floor(totalTimeWalked / 60)} 
              totalSteps={Math.floor(totalSteps)}
            />
            <WeatherCard />
          </main>
          
          <footer className="w-full text-center text-slate-500 text-sm mt-8 pb-4">
            <p>&copy; Nasir MA, 2025</p>
          </footer>

        </div>
      </div>
    </>
  );
};

export default App;