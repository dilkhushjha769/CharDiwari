import Link from 'next/link';
import Image from 'next/image';

// Site footer, shared by the home page and the property pages. Links go to
// home page sections (/#…) so they work from any page.
export default function Footer() {
  return (
    <footer className="border-t border-stone-200/80 py-12 bg-white text-sm text-stone-600">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <Image
            src="/dwarkesh-logo-transparent.png"
            alt="Dwarkesh Real Estate Group"
            width={1024}
            height={551}
            className="h-8 w-auto max-w-[50px] object-contain drop-shadow-xs"
          />
          <div className="flex flex-col">
            <span className="font-serif font-bold tracking-[0.14em] text-stone-900 text-sm uppercase leading-none">
              Dwarkesh
            </span>
            <span className="text-[9px] font-semibold tracking-[0.20em] text-stone-500 uppercase font-sans mt-0.5">
              Real Estate Group
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-8 text-stone-600">
          <Link href="/#collection" className="focus-ring rounded-sm hover:text-stone-900 transition-colors duration-150 ease-[cubic-bezier(0.16,1,0.3,1)]">
            Buy Homes
          </Link>
          <Link href="/#collection" className="focus-ring rounded-sm hover:text-stone-900 transition-colors duration-150 ease-[cubic-bezier(0.16,1,0.3,1)]">
            Rentals
          </Link>
          <Link href="/#emi-calculator" className="focus-ring rounded-sm hover:text-stone-900 transition-colors duration-150 ease-[cubic-bezier(0.16,1,0.3,1)]">
            EMI Calculator
          </Link>
          <Link href="/auth" className="focus-ring rounded-sm hover:text-stone-900 transition-colors duration-150 ease-[cubic-bezier(0.16,1,0.3,1)]">
            Sign In
          </Link>
          <Link href="/profile" className="focus-ring rounded-sm hover:text-stone-900 transition-colors duration-150 ease-[cubic-bezier(0.16,1,0.3,1)]">
            My Profile
          </Link>
          <span className="text-stone-500">© 2026 Dwarkesh</span>
        </div>
      </div>
    </footer>
  );
}
