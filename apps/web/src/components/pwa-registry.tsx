"use client";

import { useEffect } from "react";

export function PWARegistry() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", function () {
        navigator.serviceWorker.register("/sw.js").then(
          function (registration) {
            // Service Worker registration successful
          },
          function (err) {
            console.error("Service Worker registration failed: ", err);
          }
        );
      });
    }
  }, []);

  return null;
}
