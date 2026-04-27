import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lumina AI - Meeting Note Taker",
  description: "AI-powered meeting transcription and summarization",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#13131A",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.1)",
            },
            success: {
              iconTheme: {
                primary: "#22D3EE",
                secondary: "#0A0A0F",
              },
            },
            error: {
              iconTheme: {
                primary: "#ef4444",
                secondary: "#0A0A0F",
              },
            },
          }}
        />
      </body>
    </html>
  );
}
