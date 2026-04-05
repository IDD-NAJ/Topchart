"use client"

import Script from "next/script"

export function ExternalScripts() {
  return (
    <>
      <Script
        id="orchids-browser-logs"
        src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts/orchids-browser-logs.js"
        strategy="afterInteractive"
        data-orchids-project-id="f24335f4-a10f-4ea7-8625-1431e2922e91"
      />
      <Script
        src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts//route-messenger.js"
        strategy="afterInteractive"
        data-target-origin="*"
        data-message-type="ROUTE_CHANGE"
        data-include-search-params="true"
        data-only-in-iframe="true"
        data-debug="true"
        data-custom-data='{"appName": "YourApp", "version": "1.0.0", "greeting": "hi"}'
      />
    </>
  )
}
