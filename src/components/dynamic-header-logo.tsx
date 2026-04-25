"use client";

import useSWR from "swr";

interface LogoData {
  success: boolean;
  url: string;
  mediaType: string;
  altText: string;
}

const fetcher = async (url: string): Promise<LogoData> => {
  const res = await fetch(url);
  if (!res.ok) {
    return { success: false, url: "/logo.svg", mediaType: "image", altText: "Topchart" };
  }
  return res.json();
};

export function DynamicHeaderLogo() {
  const { data } = useSWR<LogoData>("/api/content/header-logo", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300000,
  });

  const url = data?.url || "/logo.svg";
  const mediaType = data?.mediaType || "image";
  const altText = data?.altText || "Topchart";

  if (mediaType === "video") {
    return (
      <div className="relative h-14 w-auto flex items-center">
        <video
          src={url}
          autoPlay
          loop
          muted
          playsInline
          poster="/icon.png"
          className="h-14 w-auto"
          onCanPlay={(e) => {
            const target = e.target as HTMLVideoElement;
            target.style.opacity = "1";
          }}
          onError={(e) => {
            const target = e.target as HTMLVideoElement;
            target.style.display = "none";
            const fallback = target.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = "block";
          }}
          style={{ opacity: 0, transition: "opacity 0.3s ease" }}
        />
        <img
          src="/logo.svg"
          alt={altText}
          className="h-10 w-auto object-contain"
          style={{ display: "none" }}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
          }}
        />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={altText}
      className="h-10 w-auto object-contain"
      loading="eager"
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        if (target.src !== window.location.origin + "/logo.svg") {
          target.src = "/logo.svg";
        }
      }}
    />
  );
}
