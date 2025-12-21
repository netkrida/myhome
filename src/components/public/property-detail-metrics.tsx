import { Calendar, DoorOpen, LayoutGrid, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { PublicPropertyDetailDTO } from "@/server/types/property";
import { getPropertyTypeMeta, magicCardClass } from "./property-detail-utils";

interface PropertyDetailMetricsProps {
  property: PublicPropertyDetailDTO;
}

export function PropertyDetailMetrics({ property }: PropertyDetailMetricsProps) {
  const typeMeta = getPropertyTypeMeta(property.propertyType);
  
  // Calculate available rooms dynamically from rooms that are not occupied
  const availableRoomsCount = property.rooms?.filter(room => room.isAvailable).length ?? property.availableRooms;

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      <Card className={`${magicCardClass} h-full`}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Jenis Kos</span>
            <Sparkles className="h-5 w-5 text-blue-500 dark:text-blue-300" />
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{typeMeta?.label ?? "Kos"}</div>
          <p className="text-sm text-slate-500 dark:text-slate-300">{typeMeta?.description ?? "Hunian dengan fasilitas lengkap"}</p>
        </CardContent>
      </Card>

      <Card className={`${magicCardClass} h-full`}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Tahun Dibangun</span>
            <Calendar className="h-5 w-5 text-blue-500 dark:text-blue-300" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{property.buildYear}</div>
          <p className="text-sm text-slate-500 dark:text-slate-300">Properti terpelihara dan siap huni</p>
        </CardContent>
      </Card>

      <Card className={`${magicCardClass} h-full`}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Jumlah Kamar</span>
            <LayoutGrid className="h-5 w-5 text-blue-500 dark:text-blue-300" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{property.totalRooms}</div>
          <p className="text-sm text-slate-500 dark:text-slate-300">Total kamar di properti ini</p>
        </CardContent>
      </Card>

      <Card className={`${magicCardClass} h-full`}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Ketersediaan</span>
            <DoorOpen className="h-5 w-5 text-blue-500 dark:text-blue-300" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{availableRoomsCount}</div>
          <p className="text-sm text-slate-500 dark:text-slate-300">Kamar siap disewa</p>
        </CardContent>
      </Card>
    </div>
  );
}
