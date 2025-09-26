import Link from "next/link";
import { Building2, Mail, Phone, MapPin } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                M
              </div>
              <span className="text-xl font-bold">MultiKost</span>
            </div>
            <p className="text-gray-400">
              Platform terpercaya untuk menemukan hunian kos impianmu dengan mudah dan aman.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Layanan</h3>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/search" className="hover:text-white transition-colors">Cari Kos</Link></li>
              <li><Link href="/properties" className="hover:text-white transition-colors">Daftar Properti</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">Tentang Kami</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Kontak</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Bantuan</h3>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/help" className="hover:text-white transition-colors">Pusat Bantuan</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Syarat & Ketentuan</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Kebijakan Privasi</Link></li>
              <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Kontak Kami</h3>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                info@multikost.com
              </li>
              <li className="flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                +62 21 1234 5678
              </li>
              <li className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Jakarta, Indonesia
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 MultiKost. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
