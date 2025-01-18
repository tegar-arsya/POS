import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-brown-500 to-brown-800 p-10 text-white">
      <h1 className="text-5xl font-extrabold mb-12 text-center bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-orange-500">
        Welcome to Coffee Shop POS
      </h1>
      <div className="flex gap-6">
        <Link href="/cashier">
          <Button className="px-6 py-3 bg-yellow-500 text-black hover:bg-yellow-600 rounded-lg shadow-lg transition-transform transform hover:scale-105">
            Cashier Dashboard
          </Button>
        </Link>
        <Link href="/kitchen">
          <Button className="px-6 py-3 bg-green-500 text-black hover:bg-green-600 rounded-lg shadow-lg transition-transform transform hover:scale-105">
            Kitchen Dashboard
          </Button>
        </Link>
        <Link href="/bar">
          <Button className="px-6 py-3 bg-red-500 text-black hover:bg-red-600 rounded-lg shadow-lg transition-transform transform hover:scale-105">
            Bar Dashboard
          </Button>
        </Link>
      </div>
      <footer className="mt-16 text-sm text-gray-300">
        Crafted with love for coffee lovers ☕
      </footer>
    </main>
  );
}
