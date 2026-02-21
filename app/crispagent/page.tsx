"use client";

import { useEffect } from "react";
import Script from "next/script";

declare global {
  interface Window {
    $crisp: unknown[];
    CRISP_WEBSITE_ID: string;
  }
}

export default function CrispAgentPage() {
  useEffect(() => {
    window.$crisp = [];
    window.CRISP_WEBSITE_ID = "bde444a1-ffb6-41a1-ba7b-ccb66915cde5";

    // Auto-open the chat window once Crisp is ready
    const interval = setInterval(() => {
      if (window.$crisp && typeof (window.$crisp as any).push === "function") {
        try {
          (window.$crisp as any).push(["do", "chat:open"]);
          clearInterval(interval);
        } catch {
          // Crisp not fully loaded yet
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Script
        src="https://client.crisp.chat/l.js"
        strategy="afterInteractive"
        async
      />
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6">
        <h1 className="text-3xl font-bold mb-4">Customer Support</h1>
        <p className="text-muted-foreground text-center max-w-md">
          Our AI support agent is ready to help. The chat window should open
          automatically — if not, click the chat icon in the bottom-right corner.
        </p>
      </div>
    </>
  );
}
