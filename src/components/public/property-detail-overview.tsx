import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PublicPropertyDetailDTO } from "@/server/types/property";
import { magicCardClass } from "./property-detail-utils";

interface PropertyDetailOverviewProps {
  property: PublicPropertyDetailDTO;
  mapsUrl: string;
}

export function PropertyDetailOverview({ property, mapsUrl }: PropertyDetailOverviewProps) {
  return (
    <div className="grid gap-8 xl:grid-cols-[1.6fr,1fr]">
      <Card className={magicCardClass}>
        <CardHeader>
          <CardTitle className="text-2xl text-slate-900 dark:text-slate-100">Tentang Properti</CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-300">Profil singkat dan highlight fasilitas utama.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-slate-600 dark:text-slate-300">
          <p className="leading-relaxed text-base">{property.description}</p>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Jenis Kamar</div>
              <p className="text-sm text-slate-700 dark:text-slate-200">{property.roomTypes.join(", ")}</p>
            </div>
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Lokasi</div>
              <p className="text-sm text-slate-700 dark:text-slate-200">
                {property.location.districtName}, {property.location.regencyName}, {property.location.provinceName}
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Koordinat</div>
              <p className="text-sm text-slate-700 dark:text-slate-200">
                {property.location.latitude.toFixed(6)}, {property.location.longitude.toFixed(6)}
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Terakhir Diperbarui</div>
              <p className="text-sm text-slate-700 dark:text-slate-200">{property.updatedAt.toLocaleDateString("id-ID")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={magicCardClass}>
        <CardHeader>
          <CardTitle className="text-2xl text-slate-900 dark:text-slate-100">Detail Lokasi</CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-300">Akses transportasi dan alamat lengkap properti.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50/60 px-3 py-1 text-blue-700 dark:border dark:border-blue-900/40 dark:bg-blue-900/30 dark:text-blue-200">
              <MapPin className="h-4 w-4" />
              {property.location.fullAddress}
            </div>
            <p className="text-slate-600 dark:text-slate-300">
              {property.location.districtName} · {property.location.regencyName} · {property.location.provinceName}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Tautan Lokasi</div>
            <Link
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200"
            >
              Buka di Google Maps
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}




