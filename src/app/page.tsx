"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { LogIn, Coffee, CoffeeIcon, User, ShoppingBag, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function Home() {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setLoaded(true)
  }, [])

  return (
    <main className="min-h-screen bg-[url('https://images.unsplash.com/photo-1509785307050-d4066910ec1e?q=80&w=2048')] bg-cover bg-center bg-fixed relative">
      {/* Overlay with subtle coffee bean pattern */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-0"></div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-between p-6 md:p-10">
        {/* Header */}
        <header
          className={`w-full max-w-7xl mx-auto transition-all duration-1000 ${loaded ? "opacity-100" : "opacity-0 -translate-y-10"}`}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Coffee className="h-8 w-8 text-amber-400 mr-2" />
              <span className="text-amber-400 font-bold text-xl">BREW HAVEN</span>
            </div>
            <nav className="hidden md:flex space-x-1">
              <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-amber-800/30">
                <Info className="h-4 w-4 mr-2" />
                About
              </Button>
              <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-amber-800/30">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Menu
              </Button>
              <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-amber-800/30">
                <User className="h-4 w-4 mr-2" />
                Account
              </Button>
            </nav>
          </div>
        </header>

        {/* Main content */}
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-7xl mx-auto">
          <div
            className={`max-w-xl w-full mx-auto text-center transition-all duration-1000 delay-300 ${loaded ? "opacity-100" : "opacity-0 scale-95"}`}
          >
            <div className="mb-6 relative">
              <CoffeeIcon className="h-16 w-16 mx-auto text-amber-400 mb-4" />
              <h1 className="text-4xl md:text-6xl font-extrabold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-yellow-300 to-orange-400 drop-shadow-lg">
                Brew Haven
              </h1>
              <p className="text-gray-300 text-center mb-8 text-lg md:text-xl max-w-md mx-auto">
                Where every cup tells a story and every sip is an experience
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/login" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white border-none shadow-lg hover:shadow-xl transition-all duration-300 group"
                  >
                    <LogIn className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                    Sign In
                  </Button>
                </Link>

                {/* <Link href="/register" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full border-amber-400 text-amber-400 hover:bg-amber-400/10 hover:text-amber-300 transition-all duration-300"
                  >
                    <User className="w-5 h-5 mr-2" />
                    Create Account
                  </Button>
                </Link> */}
              </div>
            </div>
          </div>

          {/* Features */}
          <div
            className={`w-full mt-12 transition-all duration-1000 delay-500 ${loaded ? "opacity-100" : "opacity-0 translate-y-10"}`}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
              <Card className="bg-black/40 border-amber-900/50 backdrop-blur-md hover:bg-black/50 transition-all duration-300 hover:shadow-amber-500/20 hover:shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="bg-amber-400/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Coffee className="h-6 w-6 text-amber-400" />
                  </div>
                  <h3 className="text-amber-400 font-bold text-lg mb-2">Premium Coffee</h3>
                  <p className="text-gray-300 text-sm">Sourced from the finest beans around the world</p>
                </CardContent>
              </Card>

              <Card className="bg-black/40 border-amber-900/50 backdrop-blur-md hover:bg-black/50 transition-all duration-300 hover:shadow-amber-500/20 hover:shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="bg-amber-400/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingBag className="h-6 w-6 text-amber-400" />
                  </div>
                  <h3 className="text-amber-400 font-bold text-lg mb-2">Online Ordering</h3>
                  <p className="text-gray-300 text-sm">Quick and easy ordering for pickup or delivery</p>
                </CardContent>
              </Card>

              <Card className="bg-black/40 border-amber-900/50 backdrop-blur-md hover:bg-black/50 transition-all duration-300 hover:shadow-amber-500/20 hover:shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="bg-amber-400/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="h-6 w-6 text-amber-400" />
                  </div>
                  <h3 className="text-amber-400 font-bold text-lg mb-2">Loyalty Rewards</h3>
                  <p className="text-gray-300 text-sm">Earn points with every purchase and get free drinks</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer
          className={`w-full max-w-7xl mx-auto text-center transition-all duration-1000 delay-700 ${loaded ? "opacity-100" : "opacity-0 translate-y-10"}`}
        >
          <div className="border-t border-amber-900/30 pt-6 mt-6">
            <p className="text-gray-400 text-sm">
              <span className="text-amber-400">☕</span> Crafted with love for coffee lovers
            </p>
            <div className="flex justify-center space-x-4 mt-4 text-xs text-gray-500">
              <a href="#" className="hover:text-amber-400 transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-amber-400 transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-amber-400 transition-colors">
                Contact
              </a>
            </div>
          </div>
        </footer>
      </div>
    </main>
  )
}
