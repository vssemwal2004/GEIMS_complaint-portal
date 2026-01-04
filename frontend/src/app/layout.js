import "./globals.css";
import Navbar from "../components/navbar";
import Footer from "../components/footer";

export const metadata = {
  title: "GEIMS Complaint Portal",
  description: "Complaint portal"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
