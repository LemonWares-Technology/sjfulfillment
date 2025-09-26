import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./lib/auth-context";
import { NotificationProvider } from "./lib/notification-context";
import { WebSocketProvider } from "./lib/websocket-context";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "SJFulfillment Platform",
  description: "Complete fulfillment management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          <NotificationProvider>
            <WebSocketProvider>
              {children}
              <Toaster position="top-right" />
            </WebSocketProvider>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
