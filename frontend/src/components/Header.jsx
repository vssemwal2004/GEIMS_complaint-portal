import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b">
      <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
        <Link href="/" className="font-semibold">
          GEIMS
        </Link>
        <nav className="text-sm text-gray-700">
          <Link href="/" className="hover:underline">
            Home
          </Link>
        </nav>
      </div>
    </header>
  );
}
