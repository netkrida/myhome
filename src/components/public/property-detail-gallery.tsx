import Image from "next/image";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PublicPropertyDetailDTO } from "@/server/types/property";
import {
  getImageCategoryLabel,
  groupImagesByCategory,
  orderedImageEntries,
} from "./property-detail-utils";

interface PropertyDetailGalleryProps {
  property: PublicPropertyDetailDTO;
}

export function PropertyDetailGallery({ property }: PropertyDetailGalleryProps) {
  const imageEntries = orderedImageEntries(groupImagesByCategory(property.images));

  if (imageEntries.length === 0) {
    return null;
  }

  return (
    <section id="galeri" className="space-y-6 transition-colors">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Galeri Properti</h2>
          <p className="text-sm text-muted-foreground">Dokumentasi visual area bangunan dan fasilitas.</p>
        </div>
        <Badge className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-600 dark:border-blue-900 dark:bg-blue-900/40 dark:text-blue-100">
          {property.images.length} foto
        </Badge>
      </div>

      <div className="space-y-8">
        {imageEntries.map(([category, images]) => (
          <div key={category} className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
              <Sparkles className="h-4 w-4 text-blue-500 dark:text-blue-300" />
              {getImageCategoryLabel(category)}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="group relative h-64 overflow-hidden rounded-3xl border border-border/70 bg-card shadow-md transition-colors"
                >
                  <Image
                    src={image.imageUrl}
                    alt={image.caption ?? `${property.name} - ${getImageCategoryLabel(category)}`}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition duration-700 group-hover:scale-105"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
