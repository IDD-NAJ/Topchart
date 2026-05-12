"use client";

import { useEffect, useRef, useState } from "react";

interface VideoBackgroundProps {
  src: string;
  fallbackImage?: string;
  className?: string;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  playsInline?: boolean;
}

export function VideoBackground({
  src,
  fallbackImage,
  className = "",
  autoplay = true,
  muted = true,
  loop = true,
  playsInline = true,
}: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLowBandwidth, setIsLowBandwidth] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      setIsLowBandwidth(connection.saveData || (connection.effectiveType && connection.effectiveType.includes('2g')));
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => {
      if (videoRef.current) {
        observer.unobserve(videoRef.current);
      }
    };
  }, []);

  const handleVideoError = () => {
    if (fallbackImage) {
      setUseFallback(true);
    }
  };

  if (useFallback || (isLowBandwidth && fallbackImage)) {
    return (
      <div className={`video-background-fallback ${className}`}>
        <img
          src={fallbackImage}
          alt="Video fallback"
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      src={isVisible ? src : undefined}
      autoPlay={autoplay}
      muted={muted}
      loop={loop}
      playsInline={playsInline}
      preload="metadata"
      className={`video-background ${className}`}
      onError={handleVideoError}
    />
  );
}
