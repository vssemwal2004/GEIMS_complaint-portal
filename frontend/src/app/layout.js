import "./globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";

export const metadata = {
  title: "GEIMS Complaint Portal",
  description: "Complaint portal"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <div className="mx-auto max-w-5xl px-4 py-8">{children}</div>
        </main>
        <Footer />
      </body>
    </html>
  );
}
