import Link from "next/link"
import Image from "next/image"
import { Heart } from "lucide-react"

export function PublicFooter() {
  return (
    <div>
      {/* Curve divider: CTA -> Footer */}
      <div className="relative h-6 bg-[#6367FF] overflow-hidden">
        <svg className="absolute bottom-0 left-0 w-full h-full" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,70 C260,10 520,10 780,70 C1040,130 1250,130 1440,70 L1440,120 L0,120 Z" fill="#333" />
        </svg>
      </div>

      <footer className="bg-[#333] py-8 px-5 md:px-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#fff] flex items-center justify-center">
              <Image
                src="/linkstoreLogo.png"
                alt="Linkstore logo"
                width={24}
                height={24}
                className="h-6 w-6 object-contain"
              />
            </div>
            <span className="font-display text-xl text-[#fff] tracking-widest">linkstore</span>
          </Link>

          <ul className="flex gap-0 border border-[#333] bg-[#333]">
            {[
              { label: "privacy", href: "/privacy" },
              { label: "terms", href: "/terms" },
              { label: "blog", href: "#" },
              { label: "contact", href: "/contact" },
            ].map((item, i) => (
              <li key={item.label} className={i > 0 ? "border-l border-[#333]" : ""}>
                <Link
                  href={item.href}
                  className="block text-[11px] text-[#fff] hover:text-[#000000] px-4 py-2.5 font-mono tracking-wider transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-1.5 text-[11px] text-[#fff] font-mono">
            made with <Heart className="w-3 h-3 text-[#6367FF] fill-[#6367FF]" /> by linkstore
          </div>
        </div>
      </footer>
    </div>
  )
}
