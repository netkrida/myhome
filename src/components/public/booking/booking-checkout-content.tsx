"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { addDays, format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

import { RoomMapping } from "@/components/public/room-mapping";
import { formatCurrency } from "@/components/public/property-detail-utils";
import { useMidtransSnap } from "@/hooks/use-midtrans-snap";

import type { PublicPropertyDetailDTO } from "@/server/types/property";
import type { PropertyRoomTypesResponse, RoomAvailabilityInfo, RoomTypeDetailDTO } from "@/server/types/room";
import { LeaseType } from "@/server/types/booking";
import type { LeaseType as LeaseTypeValue } from "@/server/types/booking";

interface BookingCheckoutContentProps {
  property: PublicPropertyDetailDTO;
  roomTypes: RoomTypeDetailDTO[];
  summary: PropertyRoomTypesResponse["summary"];
  initialRoomType?: string;
  initialRoomId?: string;
  user: {
    id: string;
    role: string;
    name?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
  };
  midtransClientKey?: string;
  snapScriptUrl: string;
}

type DepositOption = "deposit" | "full";

type BookingFormValues = z.infer<typeof bookingFormSchema>;

function hasValidPrice(value?: number | null) {
  return typeof value === "number" && value > 0;
}

const leaseTypeLabels: Record<LeaseTypeValue, { label: string; description: string }> = {
  [LeaseType.DAILY]: {
    label: "Harian",
    description: "Ideal untuk masa inap singkat",
  },
  [LeaseType.WEEKLY]: {
    label: "Mingguan",
    description: "Pilihan fleksibel sampai 7 hari",
  },
  [LeaseType.MONTHLY]: {
    label: "Bulanan",
    description: "Pilihan populer untuk kost",
  },
  [LeaseType.QUARTERLY]: {
    label: "Triwulan",
    description: "Menginap selama 3 bulan",
  },
  [LeaseType.YEARLY]: {
    label: "Tahunan",
    description: "Harga terbaik untuk 12 bulan",
  },
};

const leaseTypeValues = Object.values(LeaseType) as [LeaseTypeValue, ...LeaseTypeValue[]];

const bookingFormSchema = z.object({
  fullName: z.string().min(3, "Nama lengkap minimal 3 karakter"),
  email: z.string().email("Email tidak valid"),
  phoneNumber: z
    .string()
    .min(9, "Nomor ponsel minimal 9 digit")
    .max(20, "Nomor ponsel maksimal 20 digit"),
  roomType: z.string().min(1, "Pilih tipe kamar"),
  roomId: z.string().min(1, "Silakan pilih kamar"),
  leaseType: z.enum(leaseTypeValues),
  checkInDate: z.string().min(1, "Tanggal check-in wajib diisi"),
  depositOption: z.enum(["deposit", "full"]),
});

function formatDateForInput(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function formatDateReadable(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "EEEE, dd MMMM yyyy", { locale: localeId });
}

function calculateCheckOutDate(checkInDate: Date, leaseType: LeaseTypeValue) {
  const date = new Date(checkInDate);
  switch (leaseType) {
    case LeaseType.DAILY:
      date.setDate(date.getDate() + 1);
      break;
    case LeaseType.WEEKLY:
      date.setDate(date.getDate() + 7);
      break;
    case LeaseType.MONTHLY:
      date.setMonth(date.getMonth() + 1);
      break;
    case LeaseType.QUARTERLY:
      date.setMonth(date.getMonth() + 3);
      break;
    case LeaseType.YEARLY:
      date.setFullYear(date.getFullYear() + 1);
      break;
  }
  return date;
}

function getLeaseTypePrice(pricing: RoomTypeDetailDTO["pricing"], leaseType: LeaseTypeValue) {
  switch (leaseType) {
    case LeaseType.DAILY:
      return pricing.dailyPrice ?? pricing.monthlyPrice / 30;
    case LeaseType.WEEKLY:
      return pricing.weeklyPrice ?? (pricing.monthlyPrice / 30) * 7;
    case LeaseType.MONTHLY:
      return pricing.monthlyPrice;
    case LeaseType.QUARTERLY:
      return pricing.quarterlyPrice ?? pricing.monthlyPrice * 3;
    case LeaseType.YEARLY:
      return pricing.yearlyPrice ?? pricing.monthlyPrice * 12;
    default:
      return pricing.monthlyPrice;
  }
}

function getAvailableLeaseTypes(
  pricing: RoomTypeDetailDTO["pricing"]
) {
  const options: LeaseTypeValue[] = [];
  if (hasValidPrice(pricing.dailyPrice)) options.push(LeaseType.DAILY);
  if (hasValidPrice(pricing.weeklyPrice)) options.push(LeaseType.WEEKLY);
  if (hasValidPrice(pricing.monthlyPrice)) options.push(LeaseType.MONTHLY);
  if (hasValidPrice(pricing.quarterlyPrice)) options.push(LeaseType.QUARTERLY);
  if (hasValidPrice(pricing.yearlyPrice)) options.push(LeaseType.YEARLY);
  return options;
}

function calculateBookingAmounts(
  pricing: RoomTypeDetailDTO["pricing"],
  depositInfo: RoomTypeDetailDTO["depositInfo"],
  leaseType: LeaseTypeValue,
  depositOption: DepositOption
) {
  const totalAmount = getLeaseTypePrice(pricing, leaseType);
  const depositApplicable = depositInfo.depositRequired && typeof depositInfo.depositValue === "number";

  let depositAmount: number | null = null;
  if (depositApplicable) {
    if (depositInfo.depositType === "FIXED") {
      depositAmount = depositInfo.depositValue ?? null;
    } else if (depositInfo.depositType === "PERCENTAGE" && depositInfo.depositValue) {
      depositAmount = Math.round((totalAmount * depositInfo.depositValue) / 100);
    }
  }

  const useDeposit = depositApplicable && depositOption === "deposit" && depositAmount !== null;
  const payableNow = useDeposit ? depositAmount! : totalAmount;
  const remainingAmount = useDeposit ? totalAmount - depositAmount! : 0;

  return {
    totalAmount,
    depositAmount: useDeposit ? depositAmount! : null,
    payableNow,
    remainingAmount,
  };
}

export function BookingCheckoutContent({
  property,
  roomTypes,
  summary,
  initialRoomType,
  initialRoomId,
  user,
  midtransClientKey,
  snapScriptUrl,
}: BookingCheckoutContentProps) {
  const router = useRouter();
  const [selectedRoomTypeName, setSelectedRoomTypeName] = useState(
    initialRoomType ?? roomTypes[0]?.roomType ?? ""
  );

  const activeRoomType = useMemo(
    () => roomTypes.find((roomType) => roomType.roomType === selectedRoomTypeName) ?? roomTypes[0],
    [roomTypes, selectedRoomTypeName]
  );

  const defaultRoom = useMemo(() => {
    if (!activeRoomType) return undefined;
    if (initialRoomId) {
      return activeRoomType.rooms.find((room) => room.id === initialRoomId);
    }
    return activeRoomType.rooms.find((room) => room.isAvailable && !room.isOccupied);
  }, [activeRoomType, initialRoomId]);

  const defaultLeaseType = useMemo(() => {
    if (!activeRoomType) return LeaseType.MONTHLY as LeaseTypeValue;
    const available = getAvailableLeaseTypes(activeRoomType.pricing);
    return available.includes(LeaseType.MONTHLY as LeaseTypeValue)
      ? (LeaseType.MONTHLY as LeaseTypeValue)
      : available[0] ?? (LeaseType.MONTHLY as LeaseTypeValue);
  }, [activeRoomType]);

  const depositAvailable = Boolean(
    activeRoomType?.depositInfo.depositRequired && activeRoomType.depositInfo.depositValue
  );

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      fullName: user.name ?? "",
      email: user.email ?? "",
      phoneNumber: user.phoneNumber ?? "",
      roomType: activeRoomType?.roomType ?? "",
      roomId: defaultRoom?.id ?? "",
      leaseType: defaultLeaseType,
      checkInDate: formatDateForInput(addDays(new Date(), 1)),
      depositOption: depositAvailable ? "deposit" : "full",
    },
  });

  const { isReady: isSnapReady, error: snapError, pay } = useMidtransSnap({
    clientKey: midtransClientKey,
    snapScriptUrl,
  });

  const roomId = form.watch("roomId");
  const leaseType = form.watch("leaseType") as LeaseTypeValue;
  const depositOption = form.watch("depositOption") as DepositOption;
  const checkInDate = form.watch("checkInDate");

  const selectedRoom = useMemo<RoomAvailabilityInfo | undefined>(
    () => activeRoomType?.rooms.find((room) => room.id === roomId),
    [activeRoomType, roomId]
  );

  const availableLeaseTypes = useMemo(
    () => (activeRoomType ? getAvailableLeaseTypes(activeRoomType.pricing) : []),
    [activeRoomType]
  );

  const effectiveLeaseType = useMemo<LeaseTypeValue | undefined>(() => {
    if (!availableLeaseTypes.length) {
      return undefined;
    }
    return availableLeaseTypes.includes(leaseType) ? leaseType : availableLeaseTypes[0];
  }, [availableLeaseTypes, leaseType]);

  useEffect(() => {
    if (!availableLeaseTypes.length) {
      return;
    }

    const currentLeaseType = form.getValues("leaseType") as LeaseTypeValue;
    const firstAvailableType = availableLeaseTypes[0];
    if (!availableLeaseTypes.includes(currentLeaseType) && firstAvailableType) {
      form.setValue("leaseType", firstAvailableType, { shouldValidate: true });
    }
  }, [availableLeaseTypes, form]);

  useEffect(() => {
    if (!depositAvailable && form.getValues("depositOption") !== "full") {
      form.setValue("depositOption", "full", { shouldValidate: true });
    }
  }, [depositAvailable, form]);

  const amounts = useMemo(() => {
    if (!activeRoomType || !effectiveLeaseType) {
      return {
        totalAmount: 0,
        depositAmount: null,
        payableNow: 0,
        remainingAmount: 0,
      };
    }

    const safeDepositOption: DepositOption = depositAvailable ? depositOption : "full";
    return calculateBookingAmounts(activeRoomType.pricing, activeRoomType.depositInfo, effectiveLeaseType, safeDepositOption);
  }, [activeRoomType, effectiveLeaseType, depositAvailable, depositOption]);

  const handleSelectRoom = useCallback(
    (room: RoomAvailabilityInfo) => {
      form.setValue("roomId", room.id, { shouldValidate: true });
    },
    [form]
  );

  const handleRoomTypeChange = useCallback(
    (value: string) => {
      setSelectedRoomTypeName(value);
      form.setValue("roomType", value);
      const nextRoomType = roomTypes.find((rt) => rt.roomType === value);
      if (nextRoomType) {
        const autoRoom = nextRoomType.rooms.find((room) => room.isAvailable && !room.isOccupied);
        form.setValue("roomId", autoRoom?.id ?? "");

        const nextLeaseTypes = getAvailableLeaseTypes(nextRoomType.pricing);
        const fallbackLeaseType = nextLeaseTypes.includes(form.getValues("leaseType") as LeaseTypeValue)
          ? (form.getValues("leaseType") as LeaseTypeValue)
          : nextLeaseTypes[0] ?? (LeaseType.MONTHLY as LeaseTypeValue);
        form.setValue("leaseType", fallbackLeaseType);

        const depositEnabled = Boolean(
          nextRoomType.depositInfo.depositRequired && nextRoomType.depositInfo.depositValue
        );
        form.setValue("depositOption", depositEnabled ? form.getValues("depositOption") ?? "deposit" : "full");
      }
    },
    [form, roomTypes]
  );

  const onSubmit = form.handleSubmit(async (values) => {
    if (!midtransClientKey) {
      toast.error("Konfigurasi Midtrans belum tersedia. Hubungi admin.");
      return;
    }

    if (!isSnapReady) {
      toast.error("Pembayaran belum siap. Mohon tunggu beberapa saat.");
      return;
    }

    if (!selectedRoom) {
      toast.error("Silakan pilih kamar terlebih dahulu.");
      return;
    }

    const checkIn = new Date(values.checkInDate);
    if (Number.isNaN(checkIn.getTime())) {
      toast.error("Tanggal check-in tidak valid.");
      return;
    }

    const payload = {
      userId: user.id,
      roomId: values.roomId,
      checkInDate: values.checkInDate,
      leaseType: values.leaseType,
      depositOption: depositAvailable ? values.depositOption : "full",
      paymentMethod: "midtrans-snap",
    };

    toast.loading("Membuat booking dan menyiapkan pembayaran...");

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const message = errorBody?.error ?? "Gagal membuat booking";
        throw new Error(message);
      }

      const result = await response.json();
      const bookingId = result.booking?.id as string | undefined;
      const paymentToken = result.paymentToken as string | undefined;

      if (!bookingId || !paymentToken) {
        throw new Error("Respons pembayaran tidak lengkap");
      }

      toast.dismiss();
      toast.success("Booking berhasil dibuat. Membuka pembayaran...");

      pay(paymentToken, {
        onSuccess: (snapResult: Record<string, unknown>) => {
          toast.success("Pembayaran berhasil.");
          router.push(`/booking/success/${bookingId}`);
        },
        onPending: (snapResult: Record<string, unknown>) => {
          toast.info("Pembayaran menunggu konfirmasi.");
          router.push(`/booking/success/${bookingId}?status=pending`);
        },
        onError: (snapResult: Record<string, unknown>) => {
          toast.error("Pembayaran gagal. Silakan coba lagi.");
          router.push(`/booking/failure/${bookingId}`);
        },
        onClose: () => {
          toast("Anda menutup jendela pembayaran. Booking tetap tersimpan dalam status pending.");
        },
      });
    } catch (error) {
      console.error("[booking] error creating booking", error);
      toast.dismiss();
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan saat membuat booking");
    }
  });

  const checkInDisplayDate = useMemo(() => {
    try {
      return formatDateReadable(new Date(checkInDate));
    } catch (error) {
      return "-";
    }
  }, [checkInDate]);

  const checkOutDate = useMemo(() => {
    if (!checkInDate) return null;
    return calculateCheckOutDate(new Date(checkInDate), leaseType);
  }, [checkInDate, leaseType]);

  const checkOutDisplayDate = useMemo(() => {
    if (!checkOutDate) return "-";
    return formatDateReadable(checkOutDate);
  }, [checkOutDate]);

  const propertyMainImage = property.images?.[0]?.imageUrl ?? null;

  if (!activeRoomType) {
    return (
      <div className="space-y-8">
        <Alert variant="destructive">
          <AlertTitle>Data kamar tidak tersedia</AlertTitle>
          <AlertDescription>Properti ini belum memiliki konfigurasi kamar aktif. Mohon hubungi pengelola.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-8 pb-32 lg:grid-cols-[1fr_minmax(320px,360px)] lg:pb-8">
        <Form {...form}>
          <form className="space-y-8" onSubmit={onSubmit}>
          <BookingStepper
            stepStatuses={{
              contact: Boolean(form.watch("fullName") && form.watch("email") && form.watch("phoneNumber")),
              stay: Boolean(form.watch("roomId") && checkInDate),
              payment: false,
            }}
          />

          <Card>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center justify-between gap-3">
                <span>1. Detail Pemesan</span>
                <Badge variant="outline">Data akun Anda aman</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Lengkap</FormLabel>
                      <FormControl>
                        <Input placeholder="Nama sesuai identitas" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nomor Ponsel</FormLabel>
                      <FormControl>
                        <Input placeholder="08xxxxxxxxxx" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Email Aktif</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="nama@email.com" {...field} />
                      </FormControl>
                      <FormDescription>
                        Konfirmasi pembayaran akan dikirim ke email ini.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Detail Menginap</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="roomType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pilih Tipe Kamar</FormLabel>
                      <Select value={field.value} onValueChange={handleRoomTypeChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih tipe kamar" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roomTypes.map((roomType) => (
                            <SelectItem key={roomType.roomType} value={roomType.roomType}>
                              {roomType.roomType} ({roomType.availableRooms} tersedia)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="checkInDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tanggal Check-in</FormLabel>
                      <FormControl>
                        <Input type="date" min={formatDateForInput(new Date())} {...field} />
                      </FormControl>
                      <FormDescription>
                        Check-out otomatis dihitung sesuai durasi sewa.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="leaseType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Durasi Sewa</FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="grid gap-3 sm:grid-cols-2"
                        >
                          {availableLeaseTypes.map((option) => (
                            <div
                              key={option}
                              className="flex items-start gap-3 rounded-lg border border-border/70 bg-card/80 p-3"
                            >
                              <RadioGroupItem value={option} id={`lease-${option}`} />
                              <div className="space-y-1">
                                <label htmlFor={`lease-${option}`} className="text-sm font-semibold leading-none">
                                  {leaseTypeLabels[option].label}
                                </label>
                                <p className="text-xs text-muted-foreground">
                                  {leaseTypeLabels[option].description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {depositAvailable && (
                  <FormField
                    control={form.control}
                    name="depositOption"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Metode Pembayaran</FormLabel>
                        <FormControl>
                          <RadioGroup value={field.value} onValueChange={field.onChange} className="space-y-3">
                            <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-card/80 p-3">
                              <RadioGroupItem value="deposit" id="deposit-option" />
                              <div className="space-y-1">
                                <label htmlFor="deposit-option" className="text-sm font-semibold leading-none">
                                  Bayar Uang Muka (Deposit)
                                </label>
                                <p className="text-xs text-muted-foreground">
                                  Bayar deposit terlebih dahulu, sisa dapat dilunasi sebelum check-in.
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-card/80 p-3">
                              <RadioGroupItem value="full" id="full-option" />
                              <div className="space-y-1">
                                <label htmlFor="full-option" className="text-sm font-semibold leading-none">
                                  Bayar Lunas Sekarang
                                </label>
                                <p className="text-xs text-muted-foreground">
                                  Pembayaran langsung lunas dan kamar otomatis dikonfirmasi.
                                </p>
                              </div>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-semibold">Peta Kamar</h3>
                  <Badge variant="outline">
                    {activeRoomType?.availableRooms ?? 0} kamar tersedia
                  </Badge>
                </div>
                <RoomMapping
                  roomType={activeRoomType}
                  propertyName={property.name}
                  propertyId={property.id}
                  onSelectRoom={handleSelectRoom}
                  selectedRoomId={roomId}
                  actionLabel="Pilih Kamar Ini"
                />
                {!selectedRoom && (
                  <Alert variant="destructive">
                    <AlertTitle>Belum memilih kamar</AlertTitle>
                    <AlertDescription>
                      Pilih salah satu kamar tersedia pada peta untuk melanjutkan pemesanan.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {snapError && (
            <Alert variant="destructive">
              <AlertTitle>Pembayaran belum siap</AlertTitle>
              <AlertDescription>{snapError}</AlertDescription>
            </Alert>
          )}

          {!midtransClientKey && (
            <Alert variant="destructive">
              <AlertTitle>Konfigurasi pembayaran belum tersedia</AlertTitle>
              <AlertDescription>
                Kunci klien Midtrans belum dikonfigurasi. Hubungi administrator sistem untuk bantuan lebih lanjut.
              </AlertDescription>
            </Alert>
          )}

          {/* Desktop button - hidden on mobile */}
          <div className="hidden justify-end lg:flex">
            <Button
              type="submit"
              size="lg"
              className="w-full rounded-full px-8 sm:w-auto"
              disabled={!midtransClientKey || !selectedRoom}
            >
              Lanjut ke Pembayaran Midtrans
            </Button>
          </div>
        </form>
      </Form>

      <aside className="hidden space-y-6 lg:block">
        <Card className="overflow-hidden">
          {propertyMainImage && (
            <div className="relative h-40 w-full">
              <Image src={propertyMainImage} alt={property.name} fill className="object-cover" unoptimized />
            </div>
          )}
          <CardHeader>
            <CardTitle>{property.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{property.location.fullAddress}</p>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>Tamu</span>
              <span>{form.watch("fullName") || "-"}</span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>Tipe Kamar</span>
              <span>{activeRoomType?.roomType}</span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>Nomor Kamar</span>
              <span>{selectedRoom?.roomNumber ?? "Belum dipilih"}</span>
            </div>
            <div className="flex flex-col gap-2 rounded-lg bg-muted/50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2 font-semibold">
                <span>Check-in</span>
                <span>{checkInDisplayDate}</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>Check-out</span>
                <span>{checkOutDisplayDate}</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>Durasi</span>
                <span>{leaseTypeLabels[leaseType].label}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ringkasan Pembayaran</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>Harga ({leaseTypeLabels[leaseType].label})</span>
              <span>{formatCurrency(amounts.totalAmount)}</span>
            </div>
            {amounts.depositAmount !== null && (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>Deposit</span>
                <span>{formatCurrency(amounts.depositAmount)}</span>
              </div>
            )}
            {amounts.remainingAmount > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 text-muted-foreground">
                <span>Sisa bayar saat check-in</span>
                <span>{formatCurrency(amounts.remainingAmount)}</span>
              </div>
            )}
            <div className="border-t pt-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-base font-semibold">
                <span>Bayar Sekarang</span>
                <span>{formatCurrency(amounts.payableNow)}</span>
              </div>
              {amounts.remainingAmount > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Sisa pembayaran dapat dilunasi sebelum atau saat check-in.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ringkasan Properti</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>Total kamar</span>
              <span>{summary.totalRooms}</span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>Kamar tersedia</span>
              <span>{summary.totalAvailable}</span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>Kamar terisi</span>
              <span>{summary.totalOccupied}</span>
            </div>
          </CardContent>
        </Card>
      </aside>
    </div>

    {/* Sticky CTA for Mobile */}
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-background/90 lg:hidden">
      <div className="mx-auto flex max-w-screen-xl items-center justify-between gap-3">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">Total Bayar</p>
          <p className="text-lg font-bold">{formatCurrency(amounts.payableNow)}</p>
        </div>
        <Button
          type="submit"
          size="lg"
          className="rounded-full px-6"
          disabled={!midtransClientKey || !selectedRoom}
          onClick={onSubmit}
        >
          Bayar Sekarang
        </Button>
      </div>
    </div>
  </>
  );
}

interface BookingStepperProps {
  stepStatuses: {
    contact: boolean;
    stay: boolean;
    payment: boolean;
  };
}

function BookingStepper({ stepStatuses }: BookingStepperProps) {
  const steps = [
    { key: "contact", label: "Detail Pemesan" },
    { key: "stay", label: "Detail Menginap" },
    { key: "payment", label: "Metode Bayar" },
  ] as const;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card/80 p-4 sm:flex-row sm:items-center sm:justify-between">
      {steps.map((step, index) => {
        const isCompleted = stepStatuses[step.key];
        const isActive = index === 0 || (!stepStatuses.contact && index === 0) || (!stepStatuses.stay && index === 1);
        return (
          <div key={step.key} className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold",
                isCompleted
                  ? "border-blue-500 bg-blue-500 text-white"
                  : isActive
                    ? "border-blue-500 text-blue-500"
                    : "border-border text-muted-foreground"
              )}
            >
              {index + 1}
            </div>
            <div className="text-sm font-medium">
              <div>{step.label}</div>
              <div className="text-xs text-muted-foreground">
                {isCompleted ? "Lengkap" : isActive ? "Sedang diisi" : "Menunggu"}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}










