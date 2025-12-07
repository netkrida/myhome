import Link from "next/link";
import Image from "next/image";
import { Building2, Mail, Phone, MapPin } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="bg-background text-foreground border-t py-12">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center mb-4">
              <Image
                src="/logo.png"
                alt="MyHome"
                width={160}
                height={48}
                className="h-9 w-auto sm:h-10"
              />
            </div>
            <p className="text-muted-foreground">
              Platform terpercaya untuk menemukan hunian kos impianmu dengan mudah dan aman.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Layanan</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><span className="hover:text-primary transition-colors cursor-default">Cari Kos</span></li>
              <li><span className="hover:text-primary transition-colors cursor-default">Daftar Properti</span></li>
              <li><span className="hover:text-primary transition-colors cursor-default">Tentang Kami</span></li>
              <li><span className="hover:text-primary transition-colors cursor-default">Kontak</span></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Bantuan</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><span className="hover:text-primary transition-colors cursor-default">Pusat Bantuan</span></li>
              <li><span className="hover:text-primary transition-colors cursor-default">Syarat & Ketentuan</span></li>
              <li><span className="hover:text-primary transition-colors cursor-default">Kebijakan Privasi</span></li>
              <li><span className="hover:text-primary transition-colors cursor-default">FAQ</span></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Kontak Kami</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-center">
                <Mail className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                info@myhome.co.id
              </li>
              <li className="flex items-center">
                <Phone className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                08116946828
              </li>
              <li className="flex items-center">
                <MapPin className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                Jakarta, Indonesia
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
          <p>&copy; 2025 myhome. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
