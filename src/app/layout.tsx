import Providers from "@/app/providers";
import ErrorBoundary from "@/components/ErrorBoundary";
import ToastContainer from "@/components/ToastContainer";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-100">
        <ErrorBoundary>
          <Providers>
            {children}
            <ToastContainer />
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
