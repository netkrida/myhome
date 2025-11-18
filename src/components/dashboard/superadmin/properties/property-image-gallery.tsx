"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Building2,
  Users,
  Map,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Image as ImageIcon,
  Grid3X3
} from "lucide-react";
import type { PropertyImageDTO } from "@/server/types";

interface PropertyImageGalleryProps {
  images: {
    building: PropertyImageDTO[];
    shared: PropertyImageDTO[];
    floorPlan: PropertyImageDTO[];
  };
}

interface ImageViewerProps {
  images: PropertyImageDTO[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

function ImageViewer({ images, currentIndex, isOpen, onClose, onNext, onPrevious }: ImageViewerProps) {
  if (!images.length || currentIndex < 0 || currentIndex >= images.length) {
    return null;
  }

  const currentImage = images[currentIndex];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{currentImage?.caption || `Foto ${currentIndex + 1}`}</span>
            <Badge variant="secondary">
              {currentIndex + 1} dari {images.length}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="relative">
          <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
            <Image
              src={currentImage?.imageUrl || ''}
              alt={currentImage?.caption || `Foto ${currentIndex + 1}`}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
              unoptimized
            />
          </div>
          
          {/* Navigation Buttons */}
          {images.length > 1 && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                onClick={onPrevious}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                onClick={onNext}
                disabled={currentIndex === images.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        {/* Thumbnail Navigation */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto py-2">
            {images.map((image, index) => (
              <button
                key={image.id}
                className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                  index === currentIndex ? 'border-primary' : 'border-transparent'
                }`}
                onClick={() => {
                  // This would need to be passed as a prop or handled differently
                }}
              >
                <Image
                  src={image.imageUrl}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="64px"
                  unoptimized
                />
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function PropertyImageGallery({ images }: PropertyImageGalleryProps) {
  const [viewerState, setViewerState] = useState<{
    isOpen: boolean;
    images: PropertyImageDTO[];
    currentIndex: number;
  }>({
    isOpen: false,
    images: [],
    currentIndex: 0,
  });

  // Combine all images
  const allImages = [
    ...images.building,
    ...images.shared,
    ...images.floorPlan
  ];

  const openViewer = (index: number) => {
    setViewerState({
      isOpen: true,
      images: allImages,
      currentIndex: index,
    });
  };

  const closeViewer = () => {
    setViewerState({
      isOpen: false,
      images: [],
      currentIndex: 0,
    });
  };

  const nextImage = () => {
    setViewerState(prev => ({
      ...prev,
      currentIndex: Math.min(prev.currentIndex + 1, prev.images.length - 1),
    }));
  };

  const previousImage = () => {
    setViewerState(prev => ({
      ...prev,
      currentIndex: Math.max(prev.currentIndex - 1, 0),
    }));
  };

  if (allImages.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Belum Ada Foto</h3>
          <p className="text-muted-foreground text-center">
            Properti ini belum memiliki foto yang dapat ditampilkan.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Gallery Layout - Mamikos Style */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-96">
        {/* Main Image */}
        <div className="lg:col-span-3">
          <div
            className="relative w-full h-full bg-gray-100 rounded-lg overflow-hidden cursor-pointer group"
            onClick={() => openViewer(0)}
          >
            <Image
              src={allImages[0]?.imageUrl || ''}
              alt={allImages[0]?.caption || "Foto utama properti"}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 1024px) 100vw, 75vw"
              unoptimized
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            {/* Photo count overlay */}
            <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-lg text-sm">
              1 / {allImages.length}
            </div>
          </div>
        </div>

        {/* Thumbnail Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
          {allImages.slice(1, 5).map((image, index) => (
            <div
              key={image.id}
              className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer group"
              onClick={() => openViewer(index + 1)}
            >
              <Image
                src={image.imageUrl}
                alt={image.caption || `Foto ${index + 2}`}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 1024px) 50vw, 25vw"
                unoptimized
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <ZoomIn className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              {/* Show "more photos" overlay on last thumbnail if there are more images */}
              {index === 3 && allImages.length > 5 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="text-white text-center">
                    <Grid3X3 className="h-6 w-6 mx-auto mb-1" />
                    <div className="text-sm font-medium">+{allImages.length - 5}</div>
                    <div className="text-xs">foto lainnya</div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* View All Photos Button */}
      {allImages.length > 1 && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => openViewer(0)}
            className="flex items-center gap-2"
          >
            <ImageIcon className="h-4 w-4" />
            Lihat Semua Foto ({allImages.length})
          </Button>
        </div>
      )}

      {/* Image Viewer */}
      <ImageViewer
        images={viewerState.images}
        currentIndex={viewerState.currentIndex}
        isOpen={viewerState.isOpen}
        onClose={closeViewer}
        onNext={nextImage}
        onPrevious={previousImage}
      />
    </div>
  );
}
