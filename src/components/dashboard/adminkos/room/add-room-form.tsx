"use client";

import { useState } from "react";
import { Step1RoomPhotos } from "./add-room/step-1-room-photos";
import { RoomPricingForm } from "./room-pricing-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Camera,
  Receipt,
  FileText,
  Save,
  ArrowLeft
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DepositPercentage } from "@/server/types/room";
import { createRoomStep1Schema } from "@/server/schemas/room.schemas";
import { z } from "zod";

type Step1Data = z.infer<typeof createRoomStep1Schema>;

interface Step2Data {
  depositPercentage: DepositPercentage;
  dailyPrice?: number;
  weeklyPrice?: number;
  monthlyPrice?: number;
  quarterlyPrice?: number;
  yearlyPrice?: number;
}

export function AddRoomForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<{
    step1?: Step1Data;
    step2?: Step2Data;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("photos");

  const handleStep1Data = (data: Step1Data) => {
    setFormData(prev => ({ ...prev, step1: data }));
  };

  const handleStep2Data = (data: Step2Data) => {
    setFormData(prev => ({ ...prev, step2: data }));
  };

  const handleSubmit = async () => {
    if (!formData.step1 || !formData.step2) {
      toast.error("Harap lengkapi semua informasi kamar");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const submitData = {
        ...formData.step1,
        ...formData.step2,
        // Add default values that might be needed
        propertyId: "temp-property-id", // This should come from property selection
        roomNumber: "001", // This should be generated or input by user
        roomType: "STANDARD", // This should be selectable
        size: 12, // This should be input by user
        capacity: 1, // This should be input by user
        facilities: [], // This should be selectable
        rules: [], // This should be input by user
      };

      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        throw new Error('Failed to create room');
      }

      toast.success("Kamar berhasil ditambahkan!");
      
      // Clear form persistence
      sessionStorage.removeItem('room-creation-step-1');
      
      // Redirect to rooms list
      router.push('/dashboard/adminkos/rooms');
      
    } catch (error) {
      console.error('Error creating room:', error);
      toast.error("Gagal menambahkan kamar. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.step1?.roomTypePhotos &&
                     Object.keys(formData.step1.roomTypePhotos).length > 0 &&
                     formData.step2?.depositPercentage;

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className={`relative ${formData.step1 ? 'border-green-200 bg-green-50/50' : ''}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900">
                <Camera className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-sm font-medium">
                  Foto & Deskripsi
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Upload foto kamar dan deskripsi
                </p>
              </div>
              {formData.step1 && (
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  ✓ Selesai
                </Badge>
              )}
            </div>
          </CardHeader>
        </Card>

        <Card className={`relative ${formData.step2 ? 'border-green-200 bg-green-50/50' : ''}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 text-green-600 dark:bg-green-900">
                <Receipt className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-sm font-medium">
                  Harga & Pembayaran
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Atur harga sewa dan ketentuan
                </p>
              </div>
              {formData.step2 && (
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  ✓ Selesai
                </Badge>
              )}
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Form Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="photos" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Foto & Deskripsi
          </TabsTrigger>
          <TabsTrigger value="pricing" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Harga & Pembayaran
          </TabsTrigger>
        </TabsList>

        {/* Step 1: Photos & Description */}
        <TabsContent value="photos" className="space-y-6">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Camera className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold">Foto & Deskripsi Kamar</h2>
            </div>
            <p className="text-muted-foreground">
              Upload foto kamar yang menarik dan berikan deskripsi yang detail
            </p>
          </div>
          
          <Step1RoomPhotos
            onDataChange={handleStep1Data}
            initialData={formData.step1}
            roomTypes={["Kamar Standard"]}
          />

          <div className="flex justify-end">
            <Button 
              onClick={() => setActiveTab("pricing")}
              disabled={!formData.step1}
            >
              Lanjut ke Harga
              <Receipt className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </TabsContent>

        {/* Step 2: Pricing */}
        <TabsContent value="pricing" className="space-y-6">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Receipt className="h-5 w-5 text-green-600" />
              <h2 className="text-xl font-semibold">Harga & Ketentuan Pembayaran</h2>
            </div>
            <p className="text-muted-foreground">
              Tentukan harga sewa dan ketentuan pembayaran yang sesuai
            </p>
          </div>
          
          <RoomPricingForm 
            onDataChange={handleStep2Data}
            initialData={formData.step2}
          />

          <div className="flex justify-between">
            <Button 
              variant="outline"
              onClick={() => setActiveTab("photos")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
            
            <Button 
              onClick={handleSubmit}
              disabled={!isFormValid || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Simpan Kamar
                </>
              )}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Navigation Actions */}
      <div className="flex justify-between pt-6 border-t">
        <Button 
          variant="outline" 
          onClick={() => router.push('/dashboard/adminkos/rooms')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali ke Daftar Kamar
        </Button>
        
        <div className="text-sm text-muted-foreground">
          Progress tersimpan otomatis
        </div>
      </div>
    </div>
  );
}