"use client"

import { useEffect } from "react"

interface JsonLdInjectorProps {
  data: object
}

export function JsonLdInjector({ data }: JsonLdInjectorProps) {
  useEffect(() => {
    // Remove any existing JSON-LD script with this id
    const existing = document.getElementById("json-ld-schema")
    if (existing) {
      existing.remove()
    }

    // Create and inject new JSON-LD script
    const script = document.createElement("script")
    script.id = "json-ld-schema"
    script.type = "application/ld+json"
    script.textContent = JSON.stringify(data)
    document.head.appendChild(script)

    return () => {
      // Cleanup on unmount
      const scriptToRemove = document.getElementById("json-ld-schema")
      if (scriptToRemove) {
        scriptToRemove.remove()
      }
    }
  }, [data])

  return null
}
