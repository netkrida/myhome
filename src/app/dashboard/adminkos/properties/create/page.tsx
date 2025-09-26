"use client";

import { PropertyCreationForm } from "@/components/property/add-property";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function CreatePropertyPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <a href="/dashboard/adminkos/properties">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </a>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Tambah Properti Baru</h1>
          <p className="text-muted-foreground">
            Daftarkan properti kos baru Anda dengan mengisi formulir berikut
          </p>
        </div>
      </div>

      {/* Property Creation Form */}
      <PropertyCreationForm className="pb-8" />
    </div>
  );
}
