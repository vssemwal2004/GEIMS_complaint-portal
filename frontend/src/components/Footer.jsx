export default function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto max-w-5xl px-4 py-4 text-sm text-gray-600">
        © {new Date().getFullYear()} © GEIMS. All Rights Reserved
      </div>
    </footer>
  );
}
