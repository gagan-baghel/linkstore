"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, X } from "lucide-react"

const navItems = ["How it works", "Features", "Builder", "Reviews", "Creators"]
const tickerItems = [
  "link in bio ↗",
  "no cap",
  "clicks = cash ",
  "free forever",
  "setup in 3 min",
  "your brand. your rules.",
  "going live rn ⚡",
  "built different",
]

export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    handleScroll()
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header>
      {/* ── TICKER ── */}
      <div className="bg-[#6367FF] text-[#fff] py-2 overflow-hidden border-b border-[#C9BEFF]">
        <div className="flex gap-0 whitespace-nowrap animate-ticker w-max">
          {[...Array(2)].fill(tickerItems).flat().map((item, i) => (
            <span key={i} className="font-mono text-[11px] tracking-widest px-6 shrink-0">
              {item} <span className="text-[#8494FF]/30 mx-2">•</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── NAVBAR ── */}
      <nav
        className={`sticky mx-4 rounded-xl top-0 z-[100] px-5 md:px-10 py-3 transition-all ${
          scrolled ? "bg-[#FFDBFD] backdrop-blur" : "bg-[#FFDBFD]"
        }`}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2 group">
            <div className="w-7 h-7 bg-[#FFFFFF] flex items-center justify-center">
              <Image
                src="/linkstoreLogo.png"
                alt="Linkstore logo"
                width={28}
                height={28}
                className="h-7 w-7 object-contain"
                priority
              />
            </div>
            <span className="text-xl font-display tracking-widest text-[#000000]">linkstore</span>
          </a>

          <ul className="hidden md:flex items-center gap-0 rounded-full overflow-hidden">
            {navItems.map((item) => (
              <li key={item}>
                <a
                  href={`#${item.toLowerCase().replace(/\s/g, "")}`}
                  className="block px-5 py-2 text-[11px] font-mono tracking-wider font-semibold text-[#6367FF] hover:text-[#000000] hover:bg-[#FFDBFD] transition-colors"
                >
                  {item}
                </a>
              </li>
            ))}
          </ul>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/dashboard"
              className="px-5 py-2.5 border border-[#C9BEFF] text-sm font-semibold text-[#8494FF] hover:text-[#000000] hover:bg-[#FFDBFD] transition-colors rounded-full"
            >
              Log in
            </Link>
            <Link
              href="/dashboard"
              className="px-5 py-2.5 bg-[#6367FF] text-[#FFFFFF] text-sm font-bold tracking-wider hover:bg-[#8494FF] transition-colors rounded-full"
            >
              Get started →
            </Link>
          </div>

          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden p-2"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-[#FFFFFF] border-b border-[#C9BEFF] py-4 px-5">
            <ul className="flex flex-col gap-0 border border-[#C9BEFF] mb-4 bg-white/70 rounded-xl overflow-hidden">
              {navItems.map((item, i) => (
                <li key={item} className={i > 0 ? "border-t border-[#C9BEFF]" : ""}>
                  <a
                    onClick={() => setMobileMenuOpen(false)}
                    href={`#${item.toLowerCase().replace(/\s/g, "")}`}
                    className="block px-4 py-3 font-mono text-sm tracking-wide text-[#000000]"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
            <Link
              href="/dashboard"
              className="block bg-[#6367FF] text-[#FFFFFF] px-5 py-3 font-bold tracking-wider text-center rounded-full"
              onClick={() => setMobileMenuOpen(false)}
            >
              Get started →
            </Link>
          </div>
        )}
      </nav>
    </header>
  )
}
