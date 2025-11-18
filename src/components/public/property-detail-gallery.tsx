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
          <h2 className="text-xl font-semibold text-foreground sm:text-2xl">Galeri Properti</h2>
          <p className="text-sm text-muted-foreground">Dokumentasi visual area bangunan dan fasilitas.</p>
        </div>
        <Badge className="w-fit rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-600 dark:border-blue-900 dark:bg-blue-900/40 dark:text-blue-100">
          {property.images.length} foto
        </Badge>
      </div>

      <div className="space-y-6">
        {imageEntries.map(([category, images]) => (
          <div key={category} className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
              <Sparkles className="h-4 w-4 text-blue-500 dark:text-blue-300" />
              {getImageCategoryLabel(category)}
            </div>

            {/* Mobile: Horizontal Scroll */}
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide sm:hidden">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="group relative h-28 w-44 shrink-0 snap-start overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm transition-all hover:shadow-md"
                >
                  <Image
                    src={image.imageUrl}
                    alt={image.caption ?? `${property.name} - ${getImageCategoryLabel(category)}`}
                    fill
                    sizes="176px"
                    className="object-cover transition duration-300 group-hover:scale-105"
                    unoptimized
                  />
                </div>
              ))}
            </div>

            {/* Desktop: Grid */}
            <div className="hidden gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-3">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="group relative h-48 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all hover:shadow-md"
                >
                  <Image
                    src={image.imageUrl}
                    alt={image.caption ?? `${property.name} - ${getImageCategoryLabel(category)}`}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition duration-300 group-hover:scale-105"
                    unoptimized
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
