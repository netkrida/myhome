import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { BookingCheckoutContent } from "@/components/public/booking/booking-checkout-content";
import { auth } from "@/server/auth";
import type { PublicPropertyDetailDTO, PropertyImageDTO } from "@/server/types/property";
import type { PropertyRoomTypesResponse, RoomAvailabilityInfo, RoomTypeDetailDTO } from "@/server/types/room";

interface PropertyDetailApiResponse {
  success: boolean;
  data?: PropertyDetailApiDTO;
}

interface PropertyDetailApiDTO extends Omit<PublicPropertyDetailDTO, "createdAt" | "updatedAt" | "images" | "rooms"> {
  createdAt: string;
  updatedAt: string;
  images: Array<Omit<PropertyImageDTO, "createdAt" | "updatedAt"> & {
    createdAt: string;
    updatedAt: string;
  }>;
  rooms: Array<{
    id: string;
    roomType: string;
    description?: string;
    size?: string;
    monthlyPrice: number;
    dailyPrice?: number;
    weeklyPrice?: number;
    quarterlyPrice?: number;
    yearlyPrice?: number;
    depositRequired: boolean;
    depositType?: "PERCENTAGE" | "FIXED";
    depositValue?: number;
    facilities: any[];
    isAvailable: boolean;
    images: Array<Omit<PropertyImageDTO, "createdAt" | "updatedAt"> & {
      createdAt: string;
      updatedAt: string;
    }>;
  }>;
}

interface PropertyRoomTypesApiResponse {
  success: boolean;
  data?: RoomTypesApiDTO;
}

interface RoomTypesApiDTO extends Omit<PropertyRoomTypesResponse, "roomTypes"> {
  roomTypes: Array<RoomTypeApiDTO>;
}

interface RoomTypeApiDTO extends Omit<RoomTypeDetailDTO, "rooms"> {
  rooms: Array<Omit<RoomAvailabilityInfo, "checkInDate" | "checkOutDate"> & {
    checkInDate: string | null;
    checkOutDate: string | null;
  }>;
}

function resolveBaseUrl() {
  const envBase =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXTAUTH_URL ??
    process.env.VERCEL_URL ??
    "http://localhost:3000";

  return envBase.startsWith("http") ? envBase : `https://${envBase}`;
}

function transformPropertyDetail(payload: PropertyDetailApiDTO): PublicPropertyDetailDTO {
  return {
    ...payload,
    createdAt: new Date(payload.createdAt),
    updatedAt: new Date(payload.updatedAt),
    images: payload.images.map((image) => ({
      ...image,
      createdAt: new Date(image.createdAt),
      updatedAt: new Date(image.updatedAt),
    })),
    rooms: payload.rooms.map((room) => ({
      ...room,
      images: room.images.map((image) => ({
        ...image,
        createdAt: new Date(image.createdAt),
        updatedAt: new Date(image.updatedAt),
      })),
    })),
  };
}

function transformRoomTypesResponse(payload: RoomTypesApiDTO): PropertyRoomTypesResponse {
  return {
    ...payload,
    roomTypes: payload.roomTypes.map((roomType) => ({
      ...roomType,
      rooms: roomType.rooms.map((room) => ({
        ...room,
        checkInDate: room.checkInDate ? new Date(room.checkInDate) : undefined,
        checkOutDate: room.checkOutDate ? new Date(room.checkOutDate) : undefined,
      })),
    })),
  };
}

export async function generateMetadata({ params }: { params: Promise<{ propertyId: string }> }): Promise<Metadata> {
  const { propertyId } = await params;
  const property = await getPropertyDetail(propertyId);

  if (!property) {
    return {
      title: "Form Booking | myhome",
      description: "Lengkapi detail pemesanan kamar kos Anda.",
    };
  }

  return {
    title: `Form Booking ${property.name} | myhome`,
    description: `Lanjutkan pemesanan kamar di ${property.name}.`,
  };
}

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ propertyId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { propertyId } = await params;
  const search = await searchParams;

  const roomTypeParam = typeof search?.roomType === "string" ? decodeURIComponent(search.roomType) : undefined;
  const roomIdParam = typeof search?.roomId === "string" ? search.roomId : undefined;

  const session = await auth();
  const callbackQuery = new URLSearchParams();
  if (roomTypeParam) callbackQuery.set("roomType", roomTypeParam);
  if (roomIdParam) callbackQuery.set("roomId", roomIdParam);
  const callbackPath = `/booking/${propertyId}${callbackQuery.toString() ? `?${callbackQuery.toString()}` : ""}`;

  if (!session) {
    redirect(`/login-customer?callbackUrl=${encodeURIComponent(callbackPath)}`);
  }

  if (session.user.role !== "CUSTOMER") {
    redirect(`/login-customer?callbackUrl=${encodeURIComponent(callbackPath)}&message=restricted`);
  }

  const [property, roomTypesResponse] = await Promise.all([
    getPropertyDetail(propertyId),
    getPropertyRoomTypes(propertyId),
  ]);

  if (!property || !roomTypesResponse) {
    notFound();
  }

  const availableRoomTypeNames = roomTypesResponse.roomTypes.map((roomType) => roomType.roomType);
  const initialRoomType = roomTypeParam && availableRoomTypeNames.includes(roomTypeParam)
    ? roomTypeParam
    : roomTypesResponse.roomTypes[0]?.roomType;

  const midtransClientKey = process.env.MIDTRANS_CLIENT_KEY;
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
  const snapScriptUrl = isProduction
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="container mx-auto px-4 py-10">
        <BookingCheckoutContent
          property={property}
          roomTypes={roomTypesResponse.roomTypes}
          summary={roomTypesResponse.summary}
          initialRoomType={initialRoomType}
          initialRoomId={roomIdParam}
          user={{
            id: session.user.id,
            role: session.user.role,
            name: session.user.name,
            email: session.user.email,
            phoneNumber: undefined,
          }}
          midtransClientKey={midtransClientKey}
          snapScriptUrl={snapScriptUrl}
        />
      </main>
      <PublicFooter />
    </div>
  );
}

async function getPropertyDetail(propertyId: string): Promise<PublicPropertyDetailDTO | null> {
  const baseUrl = resolveBaseUrl();
  const response = await fetch(`${baseUrl}/api/public/properties/${encodeURIComponent(propertyId)}`);

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as PropertyDetailApiResponse;
  if (!payload.success || !payload.data) {
    return null;
  }

  return transformPropertyDetail(payload.data);
}

async function getPropertyRoomTypes(propertyId: string): Promise<PropertyRoomTypesResponse | null> {
  const baseUrl = resolveBaseUrl();
  const url = new URL(`/api/public/properties/${encodeURIComponent(propertyId)}/room-types`, baseUrl);
  url.searchParams.set("includeOccupied", "true");

  const response = await fetch(url.toString());

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as PropertyRoomTypesApiResponse;
  if (!payload.success || !payload.data) {
    return null;
  }

  return transformRoomTypesResponse(payload.data);
}
