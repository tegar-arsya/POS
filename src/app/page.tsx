'use client'
import Link from 'next/link';
import { Coffee, ChefHat, Beer } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-[url('https://images.unsplash.com/photo-1509785307050-d4066910ec1e?q=80&w=2048')] bg-cover bg-center">
      <div className="min-h-screen backdrop-blur-sm bg-black/60 flex flex-col items-center justify-center p-10">
        <div className="animate-fade-in-down">
          <h1 className="text-6xl font-extrabold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-yellow-300 to-orange-400">
            Coffee Shop POS
          </h1>
          <p className="text-gray-300 text-center mb-12 text-xl">
            Manage your orders with style and efficiency
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl w-full">
          <Link href="/cashier" className="transform hover:scale-105 transition-all duration-300">
            <div className="bg-gradient-to-br from-amber-500/90 to-yellow-600/90 p-8 rounded-xl shadow-xl backdrop-blur-sm">
              <Coffee className="w-12 h-12 mb-4 text-white" />
              <h2 className="text-2xl font-bold text-white mb-2">Cashier</h2>
              <p className="text-gray-100 text-sm">Manage orders and tables</p>
            </div>
          </Link>
          
          <Link href="/kitchen" className="transform hover:scale-105 transition-all duration-300">
            <div className="bg-gradient-to-br from-emerald-500/90 to-green-600/90 p-8 rounded-xl shadow-xl backdrop-blur-sm">
              <ChefHat className="w-12 h-12 mb-4 text-white" />
              <h2 className="text-2xl font-bold text-white mb-2">Kitchen</h2>
              <p className="text-gray-100 text-sm">Track food orders</p>
            </div>
          </Link>
          
          <Link href="/bar" className="transform hover:scale-105 transition-all duration-300">
            <div className="bg-gradient-to-br from-rose-500/90 to-red-600/90 p-8 rounded-xl shadow-xl backdrop-blur-sm">
              <Beer className="w-12 h-12 mb-4 text-white" />
              <h2 className="text-2xl font-bold text-white mb-2">Bar</h2>
              <p className="text-gray-100 text-sm">Manage drink orders</p>
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