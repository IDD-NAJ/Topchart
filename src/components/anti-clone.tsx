"use client";

import { useEffect } from "react";

const ALLOWED_HOSTS = [
  "topchart.gh",
  "www.topchart.gh",
];

function isAllowedHost(hostname: string): boolean {
  if (ALLOWED_HOSTS.includes(hostname)) return true;
  if (hostname.endsWith(".netlify.app")) return true;
  if (hostname.endsWith(".vercel.app")) return true;
  return false;
}

export function AntiClone() {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") return;

    if (!isAllowedHost(window.location.hostname)) {
      document.body.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#0d1627;color:white;font-family:system-ui;text-align:center;padding:2rem;">
          <div>
            <h1 style="font-size:2rem;margin-bottom:1rem;">Unauthorized Copy</h1>
            <p style="color:#8a9ba8;">This is not the official Topchart website.</p>
            <a href="https://topchart.gh" style="color:#4a9ac8;margin-top:1rem;display:inline-block;">Visit the real Topchart →</a>
          </div>
        </div>
      `;
      return;
    }

    const blockShortcuts = (e: KeyboardEvent) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && e.key === "I") ||
        (e.ctrlKey && e.shiftKey && e.key === "J") ||
        (e.ctrlKey && e.key === "u")
      ) {
        e.preventDefault();
      }
    };

    const blockContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    document.addEventListener("keydown", blockShortcuts);
    document.addEventListener("contextmenu", blockContextMenu);

    console.log(
      "%c⚠️ Stop!",
      "color:#ff4444;font-size:40px;font-weight:bold;"
    );
    console.log(
      "%cThis browser feature is intended for developers. If someone told you to copy-paste something here, it is a scam.",
      "color:#ffaa00;font-size:16px;"
    );

    return () => {
      document.removeEventListener("keydown", blockShortcuts);
      document.removeEventListener("contextmenu", blockContextMenu);
    };
  }, []);

  return null;
}
