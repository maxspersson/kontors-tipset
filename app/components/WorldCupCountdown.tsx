"use client";

import { useEffect, useState } from "react";

const WORLD_CUP_START = new Date("2026-06-11T21:00:00+02:00").getTime();

function getTimeLeft() {
  const now = Date.now();
  const diff = Math.max(WORLD_CUP_START - now, 0);

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds };
}

export default function WorldCupCountdown() {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTimeLeft(getTimeLeft());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="countdown-grid">
      <div>
        <strong>{timeLeft.days}</strong>
        <span>dagar</span>
      </div>

      <div>
        <strong>{timeLeft.hours}</strong>
        <span>timmar</span>
      </div>

      <div>
        <strong>{timeLeft.minutes}</strong>
        <span>minuter</span>
      </div>

      <div>
        <strong>{timeLeft.seconds}</strong>
        <span>sekunder</span>
      </div>
    </div>
  );
}