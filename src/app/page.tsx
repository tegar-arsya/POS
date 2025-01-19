'use client'
import Link from 'next/link';
import { LogIn } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-[url('https://images.unsplash.com/photo-1509785307050-d4066910ec1e?q=80&w=2048')] bg-cover bg-center">
      <div className="min-h-screen backdrop-blur-sm bg-black/60 flex flex-col items-center justify-center p-10">
        <div className="animate-fade-in-down max-w-md w-full">
          <h1 className="text-6xl font-extrabold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-yellow-300 to-orange-400">
            Coffee Shop
          </h1>
          <p className="text-gray-300 text-center mb-12 text-xl">
            Welcome back, please sign in
          </p>
          
          <Link 
            href="/login" 
            className="block transform hover:scale-105 transition-all duration-300"
          >
            <div className="bg-gradient-to-br from-amber-500/90 to-yellow-600/90 p-8 rounded-xl shadow-xl backdrop-blur-sm">
              <div className="flex items-center justify-center mb-4">
                <LogIn className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 text-center">Login</h2>
              <p className="text-gray-100 text-sm text-center">Access your account</p>
            </div>
          </Link>
        </div>

        <footer className="mt-16 text-gray-300 text-center">
          <p className="animate-pulse">☕ Crafted with love for coffee lovers</p>
        </footer>
      </div>
    </main>
  );
}