"use client";

import Image from "next/image";
import { STORE_INFO } from "@/lib/menu-data";
import { isStoreOpen } from "@/lib/gps-utils";
import { Phone, MapPin, Clock } from "lucide-react";

export function Header() {
  const storeOpen = isStoreOpen();

  return (
    <header className="bg-gradient-to-r from-red-800 to-red-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md flex-shrink-0 bg-white">
            <Image
              src="/logo.jpg"
              alt="Pares ni Balong Logo"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-balance">{STORE_INFO.name}</h1>
            <div className="flex items-center gap-1 text-xs opacity-90">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{STORE_INFO.address}</span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1 text-xs">
                <Phone className="w-3 h-3" />
                <a href={`tel:${STORE_INFO.phone}`} className="hover:underline">
                  {STORE_INFO.phone}
                </a>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <Clock className="w-3 h-3" />
                <span>2PM - 1AM</span>
              </div>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
            storeOpen 
              ? "bg-green-500 text-white" 
              : "bg-red-500 text-white"
          }`}>
            {storeOpen ? "OPEN" : "CLOSED"}
          </div>
        </div>
      </div>

      {/* Store Image Banner */}
      <div className="relative w-full h-32 overflow-hidden">
        <Image
          src="/store.jpg"
          alt="Pares ni Balong Store"
          fill
          className="object-cover opacity-80"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-red-900/80 to-transparent" />
        <div className="absolute bottom-2 left-4 right-4">
          <p className="text-white text-sm font-medium drop-shadow-lg">
            Authentic Filipino Pares since Day 1
          </p>
        </div>
      </div>
    </header>
  );
}
