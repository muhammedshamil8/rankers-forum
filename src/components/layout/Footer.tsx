import Link from 'next/link';
import { Twitter, Facebook, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';
import Image from 'next/image';

export function Footer() {
  const currentYear = 2026; // As per the image Requirement

  return (
    <footer className="bg-linear-to-r from-[#2F129B] to-[#3B82F6] text-white py-10 font-sans overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand and Description */}
          <div className="space-y-6 lg:col-span-2">
            <div className="flex items-center gap-3">
              <Image src="/logo.svg" alt="Logo"
                width={180}
                height={180}
                className='-translate-x-5' />
            </div>
            <p className="text-blue-100/90 text-sm  md:text-[15px] leading-relaxed max-w-sm">
              Rankers Forum helps NEET aspirants explore possible medical college options based on rank, historical data, and counselling trends.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="hover:opacity-80 transition-opacity">
                <Twitter className="w-5 h-5" />
              </Link>
              <Link href="#" className="hover:opacity-80 transition-opacity">
                <Facebook className="w-5 h-5" />
              </Link>
              <Link href="#" className="hover:opacity-80 transition-opacity">
                <Instagram className="w-5 h-5" />
              </Link>
              <Link href="#" className="hover:opacity-80 transition-opacity">
                <Linkedin className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Navigation</h3>
            <ul className="text-sm md:text-[15px] space-y-4 text-blue-100/90">
              <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link href="#how-it-works" className="hover:text-white transition-colors">How it works</Link></li>
              <li><Link href="#features" className="hover:text-white transition-colors">What you&apos;ll get</Link></li>
              <li><Link href="#faq" className="hover:text-white transition-colors">FAQ&apos;s</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Legal</h3>
            <ul className="text-sm md:text-[15px] space-y-4 text-blue-100/90">
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
              <li><Link href="/disclaimer" className="hover:text-white transition-colors">Disclaimer</Link></li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Contact & Support</h3>
            <div className="text-sm md:text-[15px] space-y-4 text-blue-100/90 text-[15px] leading-relaxed">

              <p>
                Rankers Forum <br />
                2nd Floor, Knowledge Hub Building,<br />BTM Layout, Bengaluru,<br />Karnataka – 560076, India</p>
              <p className="flex items-center gap-2 text-wrap">
                <span>Email:</span>
                <a href="mailto:support@rankersforum.in" className="hover:text-white transition-colors text-wrap">support@rankersforum.in</a>
              </p>
              <p className="flex items-center gap-2">
                <span>Phone:</span>
                <a href="tel:+919876543210" className="hover:text-white transition-colors">+91 98765 43210</a>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/20">
          <p className="text-sm text-blue-100/80">
            Copyright © rankers forum. @{currentYear}
          </p>
        </div>
      </div>
    </footer>
  );
}
