"use client";

import { useEffect, useState } from "react";
import { ANNOUNCEMENT_MESSAGES } from "@/config/site";

export function AnnouncementBar() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % ANNOUNCEMENT_MESSAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-neutral-900 py-2 text-center text-xs font-medium tracking-wide text-white sm:text-sm">
      <p aria-live="polite">{ANNOUNCEMENT_MESSAGES[index]}</p>
    </div>
  );
}
