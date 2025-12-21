'use client';

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { differenceInCalendarDays, format } from "date-fns";
import { toast } from "sonner";
import { Loader2, Search, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import type { DirectBookingPaymentMode, OfflinePaymentMethod, LeaseType } from "@/server/types/booking";

type StepKey = "customer" | "room" | "schedule" | "payment" | "review";

type PricingSummary = {
  pricePerUnit: number;
  units: number;
  totalAmount: number;
  depositAmount?: number | null;
  discountAmount?: number;
  finalAmount?: number;
};

interface StepDefinition {
  key: StepKey;
  title: string;
  description: string;
}

const steps: StepDefinition[] = [
  { key: "customer", title: "Customer", description: "Pilih atau buat data customer" },
  { key: "room", title: "Kamar", description: "Pilih kamar yang akan dibooking" },
  { key: "schedule", title: "Jadwal", description: "Atur tanggal check-in dan check-out" },
  { key: "payment", title: "Pembayaran", description: "Pilih metode dan akun pembukuan" },
  { key: "review", title: "Review", description: "Periksa kembali dan konfirmasi" },
];

const leaseTypeOptions: { label: string; value: LeaseType }[] = [
  { label: "Harian", value: "DAILY" },
  { label: "Mingguan", value: "WEEKLY" },
  { label: "Bulanan", value: "MONTHLY" },
  { label: "Triwulanan", value: "QUARTERLY" },
  { label: "Tahunan", value: "YEARLY" },
];

const paymentModes: { label: string; value: DirectBookingPaymentMode }[] = [
  { label: "Lunas", value: "FULL" },
  { label: "Deposit", value: "DEPOSIT" },
];

const paymentMethods: { label: string; value: OfflinePaymentMethod }[] = [
  { label: "Cash", value: "CASH" },
  { label: "Transfer ke Admin", value: "TRANSFER-ADMIN" },
];

interface CustomerCandidate {
  id: string;
  name?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
}

interface ReceptionistProfileInfo {
  id: string;
  propertyId?: string | null;
  propertyName?: string | null;
  adminKosId?: string | null;
}

interface LedgerAccountOption {
  id: string;
  name: string;
  code?: string;
  isSystem: boolean;
}

interface ReceptionistRoomInfo {
  id: string;
  roomNumber: string;
  roomType: string;
  isAvailable: boolean;
  pricing: {
    dailyPrice?: number;
    weeklyPrice?: number;
    monthlyPrice: number;
    quarterlyPrice?: number;
    yearlyPrice?: number;
  };
  depositRequired: boolean;
  depositType: string | null;
  depositValue?: number | null;
  hasDeposit: boolean;
  depositPercentage?: string | null;
}

export function DirectBookingForm() {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [profile, setProfile] = useState<ReceptionistProfileInfo | null>(null);
  const [rooms, setRooms] = useState<ReceptionistRoomInfo[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [ledgerAccounts, setLedgerAccounts] = useState<LedgerAccountOption[]>([]);
  const [ledgerAccountsLoading, setLedgerAccountsLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const [customerResults, setCustomerResults] = useState<CustomerCandidate[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerCandidate | null>(null);
  const [newCustomer, setNewCustomer] = useState({ name: "", phoneNumber: "", email: "" });

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [leaseType, setLeaseType] = useState<LeaseType>("MONTHLY");
  const [checkInDate, setCheckInDate] = useState<string>("");
  const [checkOutDate, setCheckOutDate] = useState<string>("");

  const [paymentMode, setPaymentMode] = useState<DirectBookingPaymentMode>("FULL");
  const [paymentMethod, setPaymentMethod] = useState<OfflinePaymentMethod>("CASH");
  const [selectedLedgerAccountId, setSelectedLedgerAccountId] = useState<string>("");
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountNote, setDiscountNote] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);

  const currentStep = steps[activeStepIndex] ?? steps[0]!;
  const currentStepKey = currentStep.key;

  useEffect(() => {
    const loadProfileAndRooms = async () => {
      try {
        const profileResponse = await fetch("/api/receptionist/profile");
        const profileData = await profileResponse.json();
        if (!profileResponse.ok || !profileData.success) {
          throw new Error(profileData.error || "Gagal mengambil profil resepsionis");
        }
        setProfile(profileData.data as ReceptionistProfileInfo);

        setRoomsLoading(true);
        setLedgerAccountsLoading(true);
        const [roomsResponse, accountsResponse] = await Promise.all([
          fetch("/api/receptionist/rooms"),
          fetch("/api/receptionist/ledger/accounts"),
        ]);

        const roomsPayload = await roomsResponse.json();
        if (!roomsResponse.ok || !roomsPayload.success) {
          throw new Error(roomsPayload.error || "Gagal mengambil data kamar");
        }
        setRooms(roomsPayload.data.rooms as ReceptionistRoomInfo[]);

        const accountsPayload = await accountsResponse.json();
        if (!accountsResponse.ok || !accountsPayload.success) {
          throw new Error(accountsPayload.error || "Gagal mengambil akun pembukuan");
        }
        const accounts = accountsPayload.data as LedgerAccountOption[];
        // Filter out system accounts for receptionist
        const nonSystemAccounts = accounts.filter(a => !a.isSystem);
        setLedgerAccounts(nonSystemAccounts);
        setSelectedLedgerAccountId(nonSystemAccounts[0]?.id ?? "");
        if (nonSystemAccounts.length === 0) {
          toast.error("Belum ada akun pemasukan aktif. Minta AdminKos menyiapkan akun pembukuan terlebih dahulu.");
        }
      } catch (error) {
        console.error(error);
        toast.error(error instanceof Error ? error.message : "Gagal memuat data awal resepsionis");
      } finally {
        setRoomsLoading(false);
        setLedgerAccountsLoading(false);
      }
    };

    loadProfileAndRooms();
  }, []);

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === selectedRoomId) || null,
    [rooms, selectedRoomId]
  );

  const selectedLedgerAccount = useMemo(
    () => ledgerAccounts.find((account) => account.id === selectedLedgerAccountId) || null,
    [ledgerAccounts, selectedLedgerAccountId]
  );

  const pricingSummary = useMemo<PricingSummary | null>(() => {
    if (!selectedRoom) {
      return null;
    }

    const checkIn = checkInDate ? new Date(checkInDate) : null;
    const checkOut = checkOutDate ? new Date(checkOutDate) : null;
    const durationDays = checkIn && checkOut ? Math.max(differenceInCalendarDays(checkOut, checkIn), 0) : null;

    const pricePerUnit = computePricePerUnit(selectedRoom, leaseType);
    if (pricePerUnit === null) {
      return null;
    }

    const units = computeUnits(leaseType, durationDays);
    const totalAmount = pricePerUnit * units;
    const depositAmount = computeDeposit(selectedRoom, totalAmount);
    const validDiscount = discountAmount > 0 && discountAmount < totalAmount ? discountAmount : 0;
    const finalAmount = totalAmount - validDiscount;

    return {
      pricePerUnit,
      units,
      totalAmount,
      depositAmount,
      discountAmount: validDiscount,
      finalAmount,
    };
  }, [selectedRoom, leaseType, checkInDate, checkOutDate, discountAmount]);

  const readyForSubmission =
    (selectedCustomer || (newCustomer.name && newCustomer.phoneNumber)) &&
    selectedRoom &&
    pricingSummary &&
    checkInDate &&
    paymentMode &&
    paymentMethod &&
    selectedLedgerAccountId &&
    !ledgerAccountsLoading;

  const nextDisabled = (() => {
    switch (currentStepKey) {
      case "customer":
        return !selectedCustomer && !(newCustomer.name && newCustomer.phoneNumber);
      case "room":
        return !selectedRoom;
      case "schedule":
        return !checkInDate || !pricingSummary;
      case "payment":
        if (paymentMode === "DEPOSIT" && pricingSummary?.depositAmount == null) {
          return true;
        }
        if (ledgerAccountsLoading) {
          return true;
        }
        if (ledgerAccounts.length === 0) {
          return true;
        }
        return !paymentMethod || !selectedLedgerAccountId;
      default:
        return !readyForSubmission;
    }
  })();

  const handleCustomerSearch = async () => {
    if (searchQuery.trim().length < 2) {
      toast.error("Masukkan minimal 2 karakter untuk mencari customer");
      return;
    }

    try {
      setSearchingCustomer(true);
      const response = await fetch(`/api/receptionist/customers/search?q=${encodeURIComponent(searchQuery.trim())}`);
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Gagal mencari customer");
      }
      setCustomerResults(payload.data as CustomerCandidate[]);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Gagal mencari customer");
    } finally {
      setSearchingCustomer(false);
    }
  };

  const handleSubmit = async () => {
    if (!readyForSubmission) {
      toast.error("Data booking belum lengkap");
      return;
    }

    const room = selectedRoom;
    if (!room) {
      toast.error("Pilih kamar yang ingin dibooking");
      return;
    }

    if (!pricingSummary) {
      toast.error("Ringkasan harga belum tersedia");
      return;
    }

    const propertyId = profile?.propertyId;
    if (!propertyId) {
      toast.error("Profil resepsionis belum terhubung dengan properti");
      return;
    }

    const ledgerAccountId = selectedLedgerAccountId;
    if (!ledgerAccountId) {
      toast.error("Pilih akun pembukuan untuk mencatat transaksi");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        customer: selectedCustomer
          ? { id: selectedCustomer.id }
          : {
              name: newCustomer.name,
              phoneNumber: newCustomer.phoneNumber,
              email: newCustomer.email || undefined,
            },
        propertyId,
        roomId: room.id,
        leaseType,
        checkInDate: toStartOfDayIso(checkInDate),
        checkOutDate: checkOutDate ? toStartOfDayIso(checkOutDate) : undefined,
        payment: {
          mode: paymentMode,
          method: paymentMethod,
          ledgerAccountId,
        },
        discountAmount: pricingSummary?.discountAmount || undefined,
        discountNote: discountNote || undefined,
      };

      const response = await fetch("/api/receptionist/bookings/direct", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Gagal membuat booking langsung");
      }

      toast.success("Booking berhasil dibuat", {
        description: `Kode Booking: ${result.data.bookingCode}`,
      });

      resetState();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Gagal membuat booking");
    } finally {
      setSubmitting(false);
    }
  };

  const resetState = () => {
    setActiveStepIndex(0);
    setSearchQuery("");
    setCustomerResults([]);
    setSelectedCustomer(null);
    setNewCustomer({ name: "", phoneNumber: "", email: "" });
    setSelectedRoomId(null);
    setLeaseType("MONTHLY");
    setCheckInDate("");
    setCheckOutDate("");
    setPaymentMode("FULL");
    setPaymentMethod("CASH");
    setSelectedLedgerAccountId(ledgerAccounts.filter(a => !a.isSystem)[0]?.id ?? "");
    setDiscountAmount(0);
    setDiscountNote("");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Booking Langsung</CardTitle>
              {profile?.propertyName && (
                <p className="mt-1 text-sm text-muted-foreground">{profile.propertyName}</p>
              )}
            </div>
            <Badge variant="secondary">Step {activeStepIndex + 1} dari {steps.length}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <Stepper activeIndex={activeStepIndex} />

          <div className="border rounded-lg p-6 space-y-6">
            {currentStepKey === "customer" && (
              <CustomerStep
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onSearch={handleCustomerSearch}
                searching={searchingCustomer}
                results={customerResults}
                selectedCustomer={selectedCustomer}
                onSelectCustomer={setSelectedCustomer}
                onResetCustomer={() => setSelectedCustomer(null)}
                newCustomer={newCustomer}
                onChangeNewCustomer={setNewCustomer}
              />
            )}

            {currentStepKey === "room" && (
              <RoomStep
                rooms={rooms}
                loading={roomsLoading}
                selectedRoomId={selectedRoomId}
                onSelectRoom={setSelectedRoomId}
              />
            )}

            {currentStepKey === "schedule" && (
              <ScheduleStep
                leaseType={leaseType}
                onLeaseTypeChange={setLeaseType}
                checkInDate={checkInDate}
                onCheckInDateChange={setCheckInDate}
                checkOutDate={checkOutDate}
                onCheckOutDateChange={setCheckOutDate}
                pricingSummary={pricingSummary}
              />
            )}

            {currentStepKey === "payment" && pricingSummary && (
              <PaymentStep
                paymentMode={paymentMode}
                onPaymentModeChange={setPaymentMode}
                paymentMethod={paymentMethod}
                onPaymentMethodChange={setPaymentMethod}
                pricingSummary={pricingSummary}
                ledgerAccounts={ledgerAccounts}
                ledgerAccountsLoading={ledgerAccountsLoading}
                selectedLedgerAccountId={selectedLedgerAccountId}
                onLedgerAccountChange={setSelectedLedgerAccountId}
                discountAmount={discountAmount}
                onDiscountAmountChange={setDiscountAmount}
                discountNote={discountNote}
                onDiscountNoteChange={setDiscountNote}
              />
            )}

            {currentStepKey === "review" && pricingSummary && profile && (
              <ReviewStep
                profile={profile}
                customer={selectedCustomer || {
                  id: "",
                  name: newCustomer.name,
                  email: newCustomer.email,
                  phoneNumber: newCustomer.phoneNumber,
                }}
                room={selectedRoom || undefined}
                pricingSummary={pricingSummary}
                checkInDate={checkInDate}
                checkOutDate={checkOutDate}
                paymentMode={paymentMode}
                paymentMethod={paymentMethod}
                ledgerAccount={selectedLedgerAccount}
                discountNote={discountNote}
              />
            )}
          </div>

          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveStepIndex((prev) => Math.max(prev - 1, 0))}
              disabled={activeStepIndex === 0 || submitting}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Sebelumnya
            </Button>

            {activeStepIndex < steps.length - 1 ? (
              <Button
                type="button"
                onClick={() => setActiveStepIndex((prev) => Math.min(prev + 1, steps.length - 1))}
                disabled={nextDisabled || submitting}
              >
                Selanjutnya <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} disabled={!readyForSubmission || submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                {submitting ? "Memproses" : "Konfirmasi Booking"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stepper({ activeIndex }: { activeIndex: number }) {
  return (
    <ol className="flex flex-col gap-4 md:flex-row md:gap-8">
      {steps.map((step, index) => {
        const isActive = index === activeIndex;
        const isCompleted = index < activeIndex;
        return (
          <li key={step.key} className="flex flex-1 items-start gap-3">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-medium ${
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : isCompleted
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : "border-muted-foreground/30 text-muted-foreground"
              }`}
            >
              {index + 1}
            </span>
            <div>
              <p className={`text-sm font-semibold ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                {step.title}
              </p>
              <p className="text-xs text-muted-foreground">{step.description}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

interface CustomerStepProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  onSearch: () => void;
  searching: boolean;
  results: CustomerCandidate[];
  selectedCustomer: CustomerCandidate | null;
  onSelectCustomer: (customer: CustomerCandidate) => void;
  onResetCustomer: () => void;
  newCustomer: { name: string; phoneNumber: string; email: string };
  onChangeNewCustomer: (value: { name: string; phoneNumber: string; email: string }) => void;
}

function CustomerStep({
  searchQuery,
  setSearchQuery,
  onSearch,
  searching,
  results,
  selectedCustomer,
  onSelectCustomer,
  onResetCustomer,
  newCustomer,
  onChangeNewCustomer,
}: CustomerStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Cari Customer Existing</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Cari berdasarkan nama, email, atau nomor telepon"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            disabled={searching}
          />
          <Button type="button" onClick={onSearch} disabled={searching}>
            {searching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            Cari
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Minimal 2 karakter. Pilih salah satu hasil untuk menggunakan data customer tersebut.</p>
      </div>

      {results.length > 0 && (
        <div className="space-y-3">
          <Label>Hasil Pencarian</Label>
          <div className="grid gap-3 md:grid-cols-2">
            {results.map((customer) => (
              <button
                key={customer.id}
                type="button"
                className={`rounded-lg border p-3 text-left transition hover:border-primary ${
                  selectedCustomer?.id === customer.id ? "border-primary bg-primary/5" : "border-border"
                }`}
                onClick={() => onSelectCustomer(customer)}
              >
                <p className="font-medium">{customer.name || "Customer Tanpa Nama"}</p>
                <p className="text-sm text-muted-foreground">{customer.email || "Email tidak tersedia"}</p>
                <p className="text-sm text-muted-foreground">{customer.phoneNumber || "No. telepon tidak tersedia"}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-background px-2 text-muted-foreground">atau buat customer baru</span>
        </div>
      </div>

      {selectedCustomer ? (
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{selectedCustomer.name || "Customer"}</p>
              <p className="text-sm text-muted-foreground">{selectedCustomer.email || "Email tidak tersedia"}</p>
              <p className="text-sm text-muted-foreground">{selectedCustomer.phoneNumber || "No. telepon tidak tersedia"}</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={onResetCustomer}>
              Ganti Customer
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="customer-name">Nama Customer</Label>
            <Input
              id="customer-name"
              placeholder="Nama lengkap"
              value={newCustomer.name}
              onChange={(event) => onChangeNewCustomer({ ...newCustomer, name: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer-phone">No. Telepon</Label>
            <Input
              id="customer-phone"
              placeholder="08xxxxxxxxxx"
              value={newCustomer.phoneNumber}
              onChange={(event) => onChangeNewCustomer({ ...newCustomer, phoneNumber: event.target.value })}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="customer-email">Email (opsional)</Label>
            <Input
              id="customer-email"
              placeholder="email@contoh.com"
              value={newCustomer.email}
              onChange={(event) => onChangeNewCustomer({ ...newCustomer, email: event.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface RoomStepProps {
  rooms: ReceptionistRoomInfo[];
  loading: boolean;
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
}

function RoomStep({ rooms, loading, selectedRoomId, onSelectRoom }: RoomStepProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (rooms.length === 0) {
    return <p className="text-sm text-muted-foreground">Tidak ada kamar aktif pada properti ini.</p>;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {rooms.map((room) => {
        const isSelected = selectedRoomId === room.id;
        return (
          <button
            key={room.id}
            type="button"
            className={`rounded-lg border p-4 text-left transition hover:border-primary ${
              isSelected ? "border-primary bg-primary/5" : "border-border"
            }`}
            onClick={() => onSelectRoom(room.id)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">
                  {room.roomNumber} · {room.roomType}
                </p>
                <p className="text-sm text-muted-foreground">
                  Bulanan: Rp {room.pricing.monthlyPrice.toLocaleString("id-ID")}
                </p>
              </div>
              <Badge variant={room.isAvailable ? "secondary" : "outline"}>
                {room.isAvailable ? "Tersedia" : "Terisi"}
              </Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
              {room.pricing.dailyPrice && <span>Harian: Rp {room.pricing.dailyPrice.toLocaleString("id-ID")}</span>}
              {room.pricing.weeklyPrice && <span>Mingguan: Rp {room.pricing.weeklyPrice.toLocaleString("id-ID")}</span>}
              {room.pricing.quarterlyPrice && <span>Triwulan: Rp {room.pricing.quarterlyPrice.toLocaleString("id-ID")}</span>}
              {room.pricing.yearlyPrice && <span>Tahunan: Rp {room.pricing.yearlyPrice.toLocaleString("id-ID")}</span>}
            </div>
          </button>
        );
      })}
    </div>
  );
}

interface ScheduleStepProps {
  leaseType: LeaseType;
  onLeaseTypeChange: (type: LeaseType) => void;
  checkInDate: string;
  onCheckInDateChange: (value: string) => void;
  checkOutDate: string;
  onCheckOutDateChange: (value: string) => void;
  pricingSummary: PricingSummary | null;
}

function ScheduleStep({
  leaseType,
  onLeaseTypeChange,
  checkInDate,
  onCheckInDateChange,
  checkOutDate,
  onCheckOutDateChange,
  pricingSummary,
}: ScheduleStepProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label>Jenis Sewa</Label>
        <Select value={leaseType} onValueChange={(value: LeaseType) => onLeaseTypeChange(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih jenis sewa" />
          </SelectTrigger>
          <SelectContent>
            {leaseTypeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="check-in-date">Tanggal Check-in</Label>
        <Input
          id="check-in-date"
          type="date"
          value={checkInDate}
          onChange={(event) => onCheckInDateChange(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="check-out-date">Tanggal Check-out (opsional)</Label>
        <Input
          id="check-out-date"
          type="date"
          value={checkOutDate}
          onChange={(event) => onCheckOutDateChange(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">Jika dikosongkan, sistem akan menghitung sesuai tipe sewa.</p>
      </div>

      {pricingSummary && (
        <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
          <p className="text-sm font-semibold">Ringkasan Harga</p>
          <div className="space-y-1 text-sm">
            <p>Harga per unit: Rp {pricingSummary.pricePerUnit.toLocaleString("id-ID")}</p>
            <p>Jumlah unit: {pricingSummary.units}</p>
            <p>Total: Rp {pricingSummary.totalAmount.toLocaleString("id-ID")}</p>
            {pricingSummary.depositAmount != null && (
              <p>Deposit: Rp {pricingSummary.depositAmount.toLocaleString("id-ID")}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface PaymentStepProps {
  paymentMode: DirectBookingPaymentMode;
  onPaymentModeChange: (mode: DirectBookingPaymentMode) => void;
  paymentMethod: OfflinePaymentMethod;
  onPaymentMethodChange: (method: OfflinePaymentMethod) => void;
  pricingSummary: PricingSummary;
  ledgerAccounts: LedgerAccountOption[];
  ledgerAccountsLoading: boolean;
  selectedLedgerAccountId: string;
  onLedgerAccountChange: (accountId: string) => void;
  discountAmount: number;
  onDiscountAmountChange: (amount: number) => void;
  discountNote: string;
  onDiscountNoteChange: (note: string) => void;
}

function PaymentStep({
  paymentMode,
  onPaymentModeChange,
  paymentMethod,
  onPaymentMethodChange,
  pricingSummary,
  ledgerAccounts,
  ledgerAccountsLoading,
  selectedLedgerAccountId,
  onLedgerAccountChange,
  discountAmount,
  onDiscountAmountChange,
  discountNote,
  onDiscountNoteChange,
}: PaymentStepProps) {
  const depositRequiredButMissing = paymentMode === "DEPOSIT" && pricingSummary.depositAmount == null;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label>Mode Pembayaran</Label>
        <Select value={paymentMode} onValueChange={(value: DirectBookingPaymentMode) => onPaymentModeChange(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih mode pembayaran" />
          </SelectTrigger>
          <SelectContent>
            {paymentModes.map((mode) => (
              <SelectItem key={mode.value} value={mode.value}>
                {mode.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {depositRequiredButMissing && (
          <p className="text-xs text-amber-600">
            Kamar ini tidak memiliki konfigurasi deposit. Gunakan mode pembayaran Lunas.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Metode Pembayaran</Label>
        <Select value={paymentMethod} onValueChange={(value: OfflinePaymentMethod) => onPaymentMethodChange(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih metode" />
          </SelectTrigger>
          <SelectContent>
            {paymentMethods.map((method) => (
              <SelectItem key={method.value} value={method.value}>
                {method.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label>Akun Pembukuan</Label>
        {ledgerAccountsLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Memuat akun pembukuan...
          </div>
        ) : ledgerAccounts.length === 0 ? (
          <p className="text-sm text-amber-600">
            Tidak ada akun pemasukan aktif. Hubungi AdminKos untuk menambahkan akun pembukuan.
          </p>
        ) : (
          <Select
            value={selectedLedgerAccountId}
            onValueChange={onLedgerAccountChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih akun pemasukan" />
            </SelectTrigger>
            <SelectContent>
              {ledgerAccounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {`${account.name}${account.code ? ` · ${account.code}` : ""}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Discount Section */}
      <div className="space-y-2">
        <Label htmlFor="discount-amount">Potongan Harga (Rp)</Label>
        <Input
          id="discount-amount"
          type="number"
          min="0"
          max={pricingSummary.totalAmount - 1}
          value={discountAmount || ""}
          onChange={(e) => onDiscountAmountChange(Number(e.target.value) || 0)}
          placeholder="0"
        />
        <p className="text-xs text-muted-foreground">Masukkan potongan harga jika ada</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="discount-note">Catatan Potongan</Label>
        <Input
          id="discount-note"
          type="text"
          value={discountNote}
          onChange={(e) => onDiscountNoteChange(e.target.value)}
          placeholder="Contoh: Diskon promo awal tahun"
          maxLength={255}
        />
      </div>

      <div className="md:col-span-2 rounded-lg border bg-muted/40 p-4 space-y-2 text-sm">
        <p className="font-semibold">Ringkasan Pembayaran</p>
        <div className="space-y-1">
          <p>Total Sewa: Rp {pricingSummary.totalAmount.toLocaleString("id-ID")}</p>
          {pricingSummary.discountAmount && pricingSummary.discountAmount > 0 && (
            <p className="text-green-600">Potongan: -Rp {pricingSummary.discountAmount.toLocaleString("id-ID")}</p>
          )}
          {pricingSummary.discountAmount && pricingSummary.discountAmount > 0 && (
            <p className="font-semibold">Harga Setelah Diskon: Rp {pricingSummary.finalAmount?.toLocaleString("id-ID")}</p>
          )}
          {paymentMode === "DEPOSIT" && pricingSummary.depositAmount != null ? (
            <p>Jumlah Deposit: Rp {pricingSummary.depositAmount.toLocaleString("id-ID")}</p>
          ) : (
            <p className="font-semibold border-t pt-1 mt-1">
              Jumlah Dibayar: Rp {(pricingSummary.finalAmount ?? pricingSummary.totalAmount).toLocaleString("id-ID")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

interface ReviewStepProps {
  profile: ReceptionistProfileInfo;
  customer: CustomerCandidate;
  room?: ReceptionistRoomInfo | null;
  pricingSummary: PricingSummary;
  checkInDate: string;
  checkOutDate: string;
  paymentMode: DirectBookingPaymentMode;
  paymentMethod: OfflinePaymentMethod;
  ledgerAccount?: LedgerAccountOption | null;
  discountNote?: string;
}

function ReviewStep({
  profile,
  customer,
  room,
  pricingSummary,
  checkInDate,
  checkOutDate,
  paymentMode,
  paymentMethod,
  ledgerAccount,
  discountNote,
}: ReviewStepProps) {
  return (
    <div className="space-y-4 text-sm">
      <ReviewSection title="Customer">
        <ReviewItem label="Nama" value={customer.name || "-"} />
        <ReviewItem label="Email" value={customer.email || "-"} />
        <ReviewItem label="No. Telepon" value={customer.phoneNumber || "-"} />
      </ReviewSection>

      <ReviewSection title="Detail Kamar">
        <ReviewItem label="Properti" value={profile.propertyName || "-"} />
        <ReviewItem label="Kamar" value={room ? `${room.roomNumber} · ${room.roomType}` : "-"} />
      </ReviewSection>

      <ReviewSection title="Jadwal">
        <ReviewItem label="Check-in" value={format(new Date(checkInDate), "dd MMMM yyyy")} />
        <ReviewItem label="Check-out" value={checkOutDate ? format(new Date(checkOutDate), "dd MMMM yyyy") : "-"} />
        <ReviewItem label="Durasi" value={`${pricingSummary.units} unit sewa`} />
      </ReviewSection>

      <ReviewSection title="Pembayaran">
        <ReviewItem label="Mode" value={paymentMode === "FULL" ? "Lunas" : "Deposit"} />
        <ReviewItem label="Metode" value={paymentMethod === "CASH" ? "Cash" : "Transfer ke Admin"} />
        <ReviewItem
          label="Akun Pembukuan"
          value={ledgerAccount ? `${ledgerAccount.name}${ledgerAccount.code ? ` · ${ledgerAccount.code}` : ""}` : "-"}
        />
        <ReviewItem label="Harga per unit" value={`Rp ${pricingSummary.pricePerUnit.toLocaleString("id-ID")}`} />
        <ReviewItem label="Total" value={`Rp ${pricingSummary.totalAmount.toLocaleString("id-ID")}`} />
        {pricingSummary.discountAmount != null && pricingSummary.discountAmount > 0 && (
          <>
            <ReviewItem label="Potongan" value={`-Rp ${pricingSummary.discountAmount.toLocaleString("id-ID")}`} />
            {discountNote && <ReviewItem label="Catatan Potongan" value={discountNote} />}
            <ReviewItem label="Harga Setelah Diskon" value={`Rp ${(pricingSummary.finalAmount ?? pricingSummary.totalAmount).toLocaleString("id-ID")}`} />
          </>
        )}
        {paymentMode === "DEPOSIT" && pricingSummary.depositAmount != null && (
          <ReviewItem label="Deposit" value={`Rp ${pricingSummary.depositAmount.toLocaleString("id-ID")}`} />
        )}
      </ReviewSection>
    </div>
  );
}

function ReviewSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm font-semibold mb-3">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right whitespace-nowrap">{value}</span>
    </div>
  );
}

function computePricePerUnit(room: ReceptionistRoomInfo, leaseType: LeaseType): number | null {
  const baseMonthly = room.pricing.monthlyPrice;
  switch (leaseType) {
    case "DAILY":
      return room.pricing.dailyPrice ?? Math.round(baseMonthly / 30);
    case "WEEKLY":
      return room.pricing.weeklyPrice ?? Math.round((baseMonthly / 30) * 7);
    case "MONTHLY":
      return baseMonthly;
    case "QUARTERLY":
      return room.pricing.quarterlyPrice ?? baseMonthly * 3;
    case "YEARLY":
      return room.pricing.yearlyPrice ?? baseMonthly * 12;
    default:
      return null;
  }
}

function computeUnits(leaseType: LeaseType, durationDays: number | null): number {
  if (durationDays == null || Number.isNaN(durationDays) || durationDays <= 0) {
    switch (leaseType) {
      case "DAILY":
        return 1;
      case "WEEKLY":
        return 1;
      case "MONTHLY":
        return 1;
      case "QUARTERLY":
        return 1;
      case "YEARLY":
        return 1;
      default:
        return 1;
    }
  }

  switch (leaseType) {
    case "DAILY":
      return Math.max(durationDays, 1);
    case "WEEKLY":
      return Math.max(1, Math.ceil(durationDays / 7));
    case "MONTHLY":
      return Math.max(1, Math.ceil(durationDays / 30));
    case "QUARTERLY":
      return Math.max(1, Math.ceil(durationDays / 90));
    case "YEARLY":
      return Math.max(1, Math.ceil(durationDays / 365));
    default:
      return 1;
  }
}

function computeDeposit(room: ReceptionistRoomInfo, totalAmount: number): number | null {
  if (!(room.depositRequired || room.hasDeposit)) {
    return null;
  }

  if (room.depositType === "FIXED" && room.depositValue) {
    return room.depositValue;
  }

  if (room.depositType === "PERCENTAGE" && room.depositValue) {
    return (totalAmount * room.depositValue) / 100;
  }

  if (room.depositPercentage) {
    const map: Record<string, number> = {
      TEN_PERCENT: 10,
      TWENTY_PERCENT: 20,
      THIRTY_PERCENT: 30,
      FORTY_PERCENT: 40,
      FIFTY_PERCENT: 50,
    };
    const percentage = map[room.depositPercentage];
    if (percentage) {
      return (totalAmount * percentage) / 100;
    }
  }

  return null;
}

function toStartOfDayIso(dateString: string): string {
  return new Date(`${dateString}T00:00:00`).toISOString();
}
