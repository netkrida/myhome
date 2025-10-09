"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Shift } from "@prisma/client";

interface AddReceptionistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  properties: Array<{ id: string; name: string }>;
}

export function AddReceptionistDialog({
  open,
  onOpenChange,
  onSuccess,
  properties,
}: AddReceptionistDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [generatedPassword, setGeneratedPassword] = React.useState("");

  // Form state
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phoneNumber, setPhoneNumber] = React.useState("");
  const [gender, setGender] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [propertyId, setPropertyId] = React.useState("");
  const [defaultShift, setDefaultShift] = React.useState("");
  const [sendInvitation, setSendInvitation] = React.useState(false);

  const generatePassword = () => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let newPassword = "";
    for (let i = 0; i < 12; i++) {
      newPassword += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setPassword(newPassword);
    setGeneratedPassword(newPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email) {
      alert("Nama dan email wajib diisi");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/adminkos/receptionist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phoneNumber: phoneNumber || undefined,
          gender: gender || undefined,
          password: password || undefined,
          propertyId: propertyId || undefined,
          defaultShift: defaultShift || undefined,
          sendInvitation,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal menambahkan receptionist");
      }

      // Show generated password if not sending invitation
      if (!sendInvitation && data.data.password) {
        alert(`Receptionist berhasil ditambahkan!\n\nPassword: ${data.data.password}\n\nHarap catat password ini karena tidak akan ditampilkan lagi.`);
      } else {
        alert("Receptionist berhasil ditambahkan!");
      }

      resetForm();
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding receptionist:", error);
      alert(error instanceof Error ? error.message : "Gagal menambahkan receptionist");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhoneNumber("");
    setGender("");
    setPassword("");
    setPropertyId("");
    setDefaultShift("");
    setSendInvitation(false);
    setGeneratedPassword("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Receptionist Baru</DialogTitle>
          <DialogDescription>
            Daftarkan receptionist baru untuk properti Anda
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Personal Info */}
          <div className="space-y-4 border-b pb-4">
            <h4 className="font-medium">Informasi Pribadi</h4>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Jenis Kelamin</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Pilih jenis kelamin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Laki-laki</SelectItem>
                    <SelectItem value="FEMALE">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">No. HP</Label>
                <Input
                  id="phone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="08123456789"
                />
              </div>
            </div>
          </div>

          {/* Assignment Info */}
          <div className="space-y-4 border-b pb-4">
            <h4 className="font-medium">Penugasan</h4>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="property">Properti</Label>
                <Select value={propertyId} onValueChange={setPropertyId}>
                  <SelectTrigger id="property">
                    <SelectValue placeholder="Pilih properti" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shift">Shift Default</Label>
                <Select value={defaultShift} onValueChange={setDefaultShift}>
                  <SelectTrigger id="shift">
                    <SelectValue placeholder="Pilih shift" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={Shift.MORNING}>Pagi (07:00 - 15:00)</SelectItem>
                    <SelectItem value={Shift.EVENING}>Siang (15:00 - 23:00)</SelectItem>
                    <SelectItem value={Shift.NIGHT}>Malam (23:00 - 07:00)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Password */}
          <div className="space-y-4">
            <h4 className="font-medium">Password</h4>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Kosongkan untuk generate otomatis"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <Button type="button" variant="outline" onClick={generatePassword}>
                  Generate
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Password akan di-generate otomatis jika dikosongkan
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="sendInvitation"
                checked={sendInvitation}
                onCheckedChange={(checked) => setSendInvitation(checked as boolean)}
              />
              <Label htmlFor="sendInvitation" className="text-sm font-normal cursor-pointer">
                Kirim undangan & password ke email
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

