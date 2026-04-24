"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface ResponsiveMediaProps {
  src: string;
  alt: string;
  type: "image" | "video";
  className?: string;
  containerClassName?: string;
  
  // Image-specific props
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  placeholder?: "blur" | "empty";
  blurDataURL?: string;
  
  // Responsive URLs for different breakpoints
  responsiveUrls?: {
    "320"?: string;
    "640"?: string;
    "1280"?: string;
    "1920"?: string;
  };
  
  // Video-specific props
  poster?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  playsInline?: boolean;
  controls?: boolean;
  preload?: "none" | "metadata" | "auto";
  
  // Loading behavior
  loadingPriority?: "eager" | "lazy" | "auto";
  
  // Intersection observer for lazy loading
  threshold?: number;
  
  // Fallback handling
  fallbackSrc?: string;
  onError?: () => void;
  onLoad?: () => void;
  
  // Accessibility
  reducedMotion?: boolean;
  
  // Aspect ratio for consistent layout
  aspectRatio?: string; // e.g., "16/9", "4/3", "1/1"
}

// Default placeholder blur
const DEFAULT_BLUR_DATA_URL = 
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTVlN2ViIi8+PC9zdmc+";

// Responsive breakpoints
const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
};

/**
 * Generate srcset from responsive URLs
 */
function generateSrcSet(responsiveUrls?: ResponsiveMediaProps["responsiveUrls"]): string {
  if (!responsiveUrls) return "";
  
  const entries = Object.entries(responsiveUrls)
    .filter(([, url]) => url)
    .map(([width, url]) => `${url} ${width}w`);
  
  return entries.join(", ");
}

/**
 * Default sizes attribute based on common layouts
 */
function getDefaultSizes(): string {
  return "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";
}

export function ResponsiveMedia({
  src,
  alt,
  type,
  className,
  containerClassName,
  width,
  height,
  fill = false,
  sizes,
  priority = false,
  placeholder,
  blurDataURL,
  responsiveUrls,
  poster,
  autoPlay = false,
  loop = false,
  muted = true,
  playsInline = true,
  controls = false,
  preload = "metadata",
  loadingPriority = "auto",
  threshold = 0.1,
  fallbackSrc,
  onError,
  onLoad,
  reducedMotion,
  aspectRatio,
}: ResponsiveMediaProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(loadingPriority === "eager" || priority);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(reducedMotion ?? false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Detect reduced motion preference
  useEffect(() => {
    if (reducedMotion !== undefined) {
      setPrefersReducedMotion(reducedMotion);
      return;
    }
    
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setPrefersReducedMotion(mediaQuery.matches);
      
      const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, [reducedMotion]);

  // Intersection observer for lazy loading
  useEffect(() => {
    if (loadingPriority === "eager" || priority || isInView) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: "50px" }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [loadingPriority, priority, threshold, isInView]);

  // Handle video autoplay when in view
  useEffect(() => {
    if (type !== "video" || !videoRef.current || prefersReducedMotion) return;
    
    if (isInView && autoPlay && muted) {
      videoRef.current.play().catch(() => {
        // Autoplay failed, likely due to browser policy
      });
    } else if (!isInView && videoRef.current) {
      videoRef.current.pause();
    }
  }, [isInView, type, autoPlay, muted, prefersReducedMotion]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  // Determine the actual source to use
  const displaySrc = hasError && fallbackSrc ? fallbackSrc : src;
  
  // Compute placeholder
  const showPlaceholder = placeholder === "blur" || blurDataURL;
  const actualBlurDataURL = blurDataURL || DEFAULT_BLUR_DATA_URL;

  // Container styles with aspect ratio
  const containerStyles: React.CSSProperties = aspectRatio 
    ? { aspectRatio } 
    : {};

  // Show static image instead of video for reduced motion users
  if (type === "video" && prefersReducedMotion && poster) {
    return (
      <div 
        ref={containerRef}
        className={cn("relative overflow-hidden", containerClassName)}
        style={containerStyles}
      >
        {isInView && (
          <Image
            src={poster}
            alt={alt}
            fill={fill || (!width && !height)}
            width={!fill ? width : undefined}
            height={!fill ? height : undefined}
            className={cn(
              "object-cover transition-opacity duration-300",
              isLoaded ? "opacity-100" : "opacity-0",
              className
            )}
            onLoad={handleLoad}
            onError={handleError}
            sizes={sizes || getDefaultSizes()}
          />
        )}
      </div>
    );
  }

  // Render video
  if (type === "video") {
    return (
      <div 
        ref={containerRef}
        className={cn("relative overflow-hidden", containerClassName)}
        style={containerStyles}
      >
        {isInView ? (
          <>
            <video
              ref={videoRef}
              src={displaySrc}
              poster={poster}
              autoPlay={autoPlay && !prefersReducedMotion}
              loop={loop}
              muted={muted}
              playsInline={playsInline}
              controls={controls}
              preload={preload}
              className={cn(
                "w-full h-full object-cover transition-opacity duration-300",
                isLoaded ? "opacity-100" : "opacity-0",
                className
              )}
              onLoadedData={handleLoad}
              onError={handleError}
            />
            {/* Loading overlay */}
            {!isLoaded && (
              <div className="absolute inset-0 bg-muted animate-pulse" />
            )}
          </>
        ) : (
          // Placeholder while not in view
          <div className="absolute inset-0 bg-muted" />
        )}
      </div>
    );
  }

  // Render image
  const srcSet = generateSrcSet(responsiveUrls);
  const computedSizes = sizes || getDefaultSizes();

  return (
    <div 
      ref={containerRef}
      className={cn("relative overflow-hidden", containerClassName)}
      style={containerStyles}
    >
      {isInView ? (
        <Image
          src={displaySrc}
          alt={alt}
          fill={fill || (!width && !height)}
          width={!fill ? width : undefined}
          height={!fill ? height : undefined}
          sizes={computedSizes}
          priority={priority}
          placeholder={showPlaceholder ? "blur" : "empty"}
          blurDataURL={showPlaceholder ? actualBlurDataURL : undefined}
          className={cn(
            "object-cover transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0",
            className
          )}
          onLoad={handleLoad}
          onError={handleError}
          // Pass srcset via unoptimized when we have custom responsive URLs
          {...(srcSet && { unoptimized: true })}
        />
      ) : (
        // Placeholder while not in view
        <div 
          className="absolute inset-0 bg-muted"
          style={width && height ? { paddingBottom: `${(height / width) * 100}%` } : undefined}
        />
      )}
      
      {/* Loading state */}
      {isInView && !isLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
    </div>
  );
}

/**
 * Responsive image with automatic srcset generation
 */
export function ResponsiveImage(props: Omit<ResponsiveMediaProps, "type">) {
  return <ResponsiveMedia {...props} type="image" />;
}

/**
 * Responsive video with autoplay and intersection observer
 */
export function ResponsiveVideo(props: Omit<ResponsiveMediaProps, "type">) {
  return <ResponsiveMedia {...props} type="video" />;
}

/**
 * Background media container (full-cover image or video)
 */
export interface BackgroundMediaProps extends Omit<ResponsiveMediaProps, "fill" | "containerClassName"> {
  children?: React.ReactNode;
  overlay?: boolean;
  overlayClassName?: string;
}

export function BackgroundMedia({
  children,
  overlay = true,
  overlayClassName,
  className,
  ...props
}: BackgroundMediaProps) {
  return (
    <div className="relative w-full h-full overflow-hidden">
      <ResponsiveMedia
        {...props}
        fill
        className={cn("absolute inset-0 w-full h-full object-cover -z-10", className)}
      />
      {overlay && (
        <div 
          className={cn(
            "absolute inset-0 bg-black/40 -z-10",
            overlayClassName
          )} 
        />
      )}
      {children}
    </div>
  );
}

export default ResponsiveMedia;
