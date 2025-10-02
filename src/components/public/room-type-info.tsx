import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BedDouble, 
  Ruler, 
  DollarSign, 
  Shield, 
  Users, 
  CheckCircle,
  Wifi,
  Car,
  Bath,
  Home
} from "lucide-react";
import type { RoomTypeDetailDTO } from "@/server/types/room";

interface RoomTypeInfoProps {
  roomType: RoomTypeDetailDTO;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDeposit(depositInfo: RoomTypeDetailDTO['depositInfo']): string {
  if (!depositInfo.depositRequired) {
    return 'Tidak ada deposit';
  }
  
  if (depositInfo.depositType === 'FIXED' && depositInfo.depositValue) {
    return formatCurrency(depositInfo.depositValue);
  }
  
  if (depositInfo.depositType === 'PERCENTAGE' && depositInfo.depositValue) {
    return `${depositInfo.depositValue}% dari harga sewa`;
  }
  
  return 'Deposit diperlukan';
}

function getCategoryIcon(category: string) {
  switch (category) {
    case 'room':
      return <Home className="h-4 w-4" />;
    case 'bathroom':
      return <Bath className="h-4 w-4" />;
    case 'parking':
      return <Car className="h-4 w-4" />;
    case 'property':
      return <Wifi className="h-4 w-4" />;
    default:
      return <CheckCircle className="h-4 w-4" />;
  }
}

function getCategoryLabel(category: string): string {
  switch (category) {
    case 'room':
      return 'Fasilitas Kamar';
    case 'bathroom':
      return 'Fasilitas Kamar Mandi';
    case 'parking':
      return 'Fasilitas Parkir';
    case 'property':
      return 'Fasilitas Properti';
    default:
      return 'Fasilitas Lainnya';
  }
}

export function RoomTypeInfo({ roomType }: RoomTypeInfoProps) {
  const { 
    roomType: typeName, 
    description, 
    totalRooms, 
    availableRooms, 
    occupiedRooms, 
    pricing, 
    depositInfo, 
    facilities, 
    mainImage 
  } = roomType;

  // Group facilities by category
  const facilitiesByCategory = facilities.reduce((acc, facility) => {
    const category = facility.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(facility);
    return acc;
  }, {} as Record<string, typeof facilities>);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-xl">{typeName}</CardTitle>
            {description && (
              <p className="text-muted-foreground">{description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={availableRooms > 0 ? "default" : "secondary"}
              className={availableRooms > 0 ? "bg-green-600 hover:bg-green-700" : ""}
            >
              <Users className="h-3 w-3 mr-1" />
              {availableRooms}/{totalRooms} Tersedia
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Image and Basic Info */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Image */}
          <div className="md:col-span-1">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border">
              {mainImage ? (
                <Image
                  src={mainImage}
                  alt={`${typeName} - Room Image`}
                  fill
                  sizes="(min-width: 768px) 300px, 100vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-muted text-muted-foreground">
                  <BedDouble className="h-12 w-12" />
                </div>
              )}
            </div>
          </div>

          {/* Pricing and Details */}
          <div className="md:col-span-2 space-y-4">
            {/* Pricing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span>Harga Bulanan</span>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {formatCurrency(pricing.monthlyPrice)}
                </div>
                <div className="text-sm text-muted-foreground">per bulan</div>
              </div>

              {pricing.dailyPrice && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span>Harga Harian</span>
                  </div>
                  <div className="text-xl font-semibold text-foreground">
                    {formatCurrency(pricing.dailyPrice)}
                  </div>
                  <div className="text-sm text-muted-foreground">per hari</div>
                </div>
              )}
            </div>

            {/* Additional Pricing */}
            {(pricing.weeklyPrice || pricing.quarterlyPrice || pricing.yearlyPrice) && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t">
                {pricing.weeklyPrice && (
                  <div className="text-center">
                    <div className="text-sm font-medium text-foreground">
                      {formatCurrency(pricing.weeklyPrice)}
                    </div>
                    <div className="text-xs text-muted-foreground">per minggu</div>
                  </div>
                )}
                {pricing.quarterlyPrice && (
                  <div className="text-center">
                    <div className="text-sm font-medium text-foreground">
                      {formatCurrency(pricing.quarterlyPrice)}
                    </div>
                    <div className="text-xs text-muted-foreground">per 3 bulan</div>
                  </div>
                )}
                {pricing.yearlyPrice && (
                  <div className="text-center">
                    <div className="text-sm font-medium text-foreground">
                      {formatCurrency(pricing.yearlyPrice)}
                    </div>
                    <div className="text-xs text-muted-foreground">per tahun</div>
                  </div>
                )}
              </div>
            )}

            {/* Deposit Info */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Shield className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-sm font-medium text-foreground">Deposit</div>
                <div className="text-sm text-muted-foreground">
                  {formatDeposit(depositInfo)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Facilities */}
        {Object.keys(facilitiesByCategory).length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Fasilitas</h3>
            <div className="space-y-4">
              {Object.entries(facilitiesByCategory).map(([category, categoryFacilities]) => (
                <div key={category} className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    {getCategoryIcon(category)}
                    <span>{getCategoryLabel(category)}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {categoryFacilities.map((facility) => (
                      <Badge 
                        key={facility.id} 
                        variant="outline" 
                        className="justify-start text-xs"
                      >
                        <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                        {facility.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button 
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={availableRooms === 0}
          >
            {availableRooms > 0 ? 'Pesan Kamar' : 'Tidak Tersedia'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
