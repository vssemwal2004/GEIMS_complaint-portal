import "./globals.css";
import Navbar from "../components/navbar";
import FooterRevealShell from "../components/FooterRevealShell";

export const metadata = {
  title: "GEIMS Complaint Portal",
  description: "Complaint portal"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Navbar />
        <FooterRevealShell>
          <main className="flex-1">{children}</main>
        </FooterRevealShell>
      </body>
    </html>
  );
}
