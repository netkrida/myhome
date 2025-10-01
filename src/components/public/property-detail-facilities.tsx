import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PublicPropertyDetailDTO } from "@/server/types/property";
import { ShieldCheck } from "lucide-react";
import type { DetailFacility } from "./property-detail-utils";
import {
  groupFacilitiesByCategory,
  orderedFacilityEntries,
  resolveFacilityLabel,
  iconForFacilityCategory,
  magicCardClass,
} from "./property-detail-utils";

interface PropertyDetailFacilitiesProps {
  property: PublicPropertyDetailDTO;
}

export function PropertyDetailFacilities({ property }: PropertyDetailFacilitiesProps) {
  const facilities = Array.isArray(property.facilities)
    ? (property.facilities as DetailFacility[])
    : [];

  const facilityEntries = orderedFacilityEntries(groupFacilitiesByCategory(facilities));

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Card className={magicCardClass}>
        <CardHeader>
          <CardTitle className="text-2xl">Fasilitas Properti</CardTitle>
          <CardDescription>Kenyamanan penunjang yang tersedia untuk penghuni.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {facilityEntries.length === 0 ? (
            <p className="text-sm text-slate-500">Belum ada data fasilitas.</p>
          ) : (
            facilityEntries.map(([category, items]) => (
              <div key={category} className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                  {iconForFacilityCategory(category)}
                  {resolveFacilityLabel(category)}
                </div>
                <div className="flex flex-wrap gap-2">
                  {items.map((facility) => (
                    <Badge
                      key={facility.id}
                      variant="outline"
                      className="rounded-full border-slate-200 bg-white px-3 py-1 text-[13px] font-medium text-slate-600"
                    >
                      {facility.name}
                    </Badge>
                  ))}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className={magicCardClass}>
        <CardHeader>
          <CardTitle className="text-2xl">Peraturan Penghuni</CardTitle>
          <CardDescription>Pedoman kenyamanan dan keamanan bersama.</CardDescription>
        </CardHeader>
        <CardContent>
          {property.rules.length === 0 ? (
            <p className="text-sm text-slate-500">Belum ada peraturan yang dicantumkan.</p>
          ) : (
            <ul className="space-y-3 text-sm text-slate-600">
              {property.rules.map((rule) => (
                <li key={rule.id} className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-blue-500" />
                  <span>{rule.name}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
