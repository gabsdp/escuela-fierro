"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, Book, Users, PlusCircle, Menu, X } from "lucide-react";
import LogoutButton from "./LogoutButton";

export default function AdminNavbar() {
  const [open, setOpen] = useState(false);

  const navLinks = [
    { href: "/admin", label: "Cursos", icon: Book },
    { href: "/admin/cursos/nuevo", label: "Nuevo curso", icon: PlusCircle },
    { href: "/admin/usuarios", label: "Usuarios", icon: Users },
  ];

  return (
    <header className="bg-[#1B3A7A] h-14 sm:h-16 flex items-center justify-between px-3 sm:px-6 relative">
      <Link href="/admin" className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        <BookOpen className="h-5 w-5 sm:h-7 sm:w-7 text-[#F5A623]" />
        <span className="text-white font-bold text-base sm:text-xl tracking-tight">
          Escuela Fierro
        </span>
        <span className="hidden sm:inline text-[#F5A623] text-xs font-semibold bg-[#F5A623]/15 px-2 py-0.5 rounded-full">
          ADMIN
        </span>
      </Link>

      {/* Desktop nav */}
      <nav className="hidden sm:flex items-center gap-1">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-2 text-white/70 hover:text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors hover:bg-white/10"
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        <div className="hidden sm:block">
          <LogoutButton />
        </div>

        {/* Hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="sm:hidden text-white/70 hover:text-white p-1.5"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="absolute top-full left-0 right-0 bg-[#1B3A7A] border-t border-white/10 shadow-lg z-50 sm:hidden">
          <nav className="flex flex-col py-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 text-white/80 hover:text-white hover:bg-white/10 px-4 py-3 text-sm font-medium transition-colors"
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
            <div className="border-t border-white/10 pt-2 mt-1 px-4 pb-1">
              <LogoutButton />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
