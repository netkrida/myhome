"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { IconEye, IconEyeOff, IconLoader2 } from "@tabler/icons-react";
import { adminKosRegistrationSchema, type AdminKosRegistrationInput } from "@/server/schemas/adminkos-registration";
import type { Province, Regency, District } from "@/server/services/wilayah.service";

export function AdminKosRegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Wilayah states
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [regencies, setRegencies] = useState<Regency[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingRegencies, setLoadingRegencies] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    setError: setFieldError,
  } = useForm<AdminKosRegistrationInput>({
    resolver: zodResolver(adminKosRegistrationSchema),
  });

  const watchedEmail = watch("email");
  const watchedProvinceCode = watch("provinceCode");
  const watchedRegencyCode = watch("regencyCode");

  // Load provinces on component mount
  useEffect(() => {
    const loadProvinces = async () => {
      setLoadingProvinces(true);
      try {
        const response = await fetch("/api/wilayah/provinces");
        
        // Check if response is actually JSON
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text();
          console.error("Expected JSON but got:", text.substring(0, 200));
          throw new Error("Server returned HTML instead of JSON");
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          setProvinces(data.data);
        } else {
          console.error("Failed to load provinces:", data.error);
        }
      } catch (error) {
        console.error("Error loading provinces:", error);
        setError("Gagal memuat data provinsi. Silakan refresh halaman.");
      } finally {
        setLoadingProvinces(false);
      }
    };

    loadProvinces();
  }, []);

  // Load regencies when province changes
  useEffect(() => {
    if (watchedProvinceCode) {
      const loadRegencies = async () => {
        setLoadingRegencies(true);
        setRegencies([]);
        setDistricts([]);
        setValue("regencyCode", "");
        setValue("regencyName", "");
        setValue("districtCode", "");
        setValue("districtName", "");

        try {
          const response = await fetch(`/api/wilayah/regencies/${watchedProvinceCode}`);
          
          // Check if response is actually JSON
          const contentType = response.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            const text = await response.text();
            console.error("Expected JSON but got:", text.substring(0, 200));
            throw new Error("Server returned HTML instead of JSON");
          }

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();

          if (data.success) {
            setRegencies(data.data);
          } else {
            console.error("Failed to load regencies:", data.error);
          }
        } catch (error) {
          console.error("Error loading regencies:", error);
        } finally {
          setLoadingRegencies(false);
        }
      };

      loadRegencies();
    } else {
      setRegencies([]);
      setDistricts([]);
    }
  }, [watchedProvinceCode, setValue]);

  // Load districts when regency changes
  useEffect(() => {
    if (watchedRegencyCode) {
      const loadDistricts = async () => {
        setLoadingDistricts(true);
        setDistricts([]);
        setValue("districtCode", "");
        setValue("districtName", "");

        try {
          const response = await fetch(`/api/wilayah/districts/${watchedRegencyCode}`);
          
          // Check if response is actually JSON
          const contentType = response.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            const text = await response.text();
            console.error("Expected JSON but got:", text.substring(0, 200));
            throw new Error("Server returned HTML instead of JSON");
          }

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();

          if (data.success) {
            setDistricts(data.data);
          } else {
            console.error("Failed to load districts:", data.error);
          }
        } catch (error) {
          console.error("Error loading districts:", error);
        } finally {
          setLoadingDistricts(false);
        }
      };

      loadDistricts();
    } else {
      setDistricts([]);
    }
  }, [watchedRegencyCode, setValue]);

  // Check email availability with debounce
  const checkEmailAvailability = async (email: string) => {
    if (!email || !email.includes("@")) return;

    try {
      const response = await fetch(`/api/auth/check-email?email=${encodeURIComponent(email)}`);
      const data = await response.json();

      if (!data.success) {
        setFieldError("email", { message: data.error });
        return;
      }

      if (!data.available) {
        setFieldError("email", { message: "Email sudah terdaftar" });
      }
    } catch (error) {
      console.error("Error checking email:", error);
    }
  };

  const onSubmit = async (data: AdminKosRegistrationInput) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/auth/register/adminkos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phoneNumber: data.phoneNumber,
          password: data.password,
          provinceCode: data.provinceCode,
          provinceName: data.provinceName,
          regencyCode: data.regencyCode,
          regencyName: data.regencyName,
          districtCode: data.districtCode,
          districtName: data.districtName,
          streetAddress: data.streetAddress,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || "Terjadi kesalahan saat mendaftar");
        
        // Handle field-specific errors
        if (result.details) {
          result.details.forEach((detail: any) => {
            setFieldError(detail.field as keyof AdminKosRegistrationInput, {
              message: detail.message,
            });
          });
        }
        return;
      }

      setSuccess("Akun AdminKos berhasil didaftarkan! Silakan login.");
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login?message=registration-success");
      }, 2000);

    } catch (error) {
      console.error("Registration error:", error);
      setError("Terjadi kesalahan jaringan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Daftar AdminKos
        </CardTitle>
        <CardDescription className="text-center">
          Buat akun AdminKos untuk mengelola properti kos Anda
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Hidden fields for names */}
          <input type="hidden" {...register("provinceName")} />
          <input type="hidden" {...register("regencyName")} />
          <input type="hidden" {...register("districtName")} />
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name">Nama Lengkap</Label>
            <Input
              id="name"
              type="text"
              placeholder="Masukkan nama lengkap"
              {...register("name")}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="contoh@email.com"
              {...register("email")}
              className={errors.email ? "border-red-500" : ""}
              onBlur={(e) => checkEmailAvailability(e.target.value)}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Phone Number Field */}
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Nomor HP</Label>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="08123456789 atau +62812345678"
              {...register("phoneNumber")}
              className={errors.phoneNumber ? "border-red-500" : ""}
            />
            {errors.phoneNumber && (
              <p className="text-sm text-red-500">{errors.phoneNumber.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Minimal 8 karakter"
                {...register("password")}
                className={errors.password ? "border-red-500 pr-10" : "pr-10"}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <IconEyeOff className="h-4 w-4" />
                ) : (
                  <IconEye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Ulangi password"
                {...register("confirmPassword")}
                className={errors.confirmPassword ? "border-red-500 pr-10" : "pr-10"}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <IconEyeOff className="h-4 w-4" />
                ) : (
                  <IconEye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Province Field */}
          <div className="space-y-2">
            <Label htmlFor="provinceCode">Provinsi</Label>
            <Select
              onValueChange={(value) => {
                const selectedProvince = provinces.find(p => p.code === value);
                if (selectedProvince) {
                  setValue("provinceCode", selectedProvince.code);
                  setValue("provinceName", selectedProvince.name);
                }
              }}
              disabled={loadingProvinces}
            >
              <SelectTrigger className={errors.provinceCode ? "border-red-500" : ""}>
                <SelectValue placeholder={loadingProvinces ? "Memuat provinsi..." : "Pilih Provinsi"} />
              </SelectTrigger>
              <SelectContent>
                {provinces.map((province) => (
                  <SelectItem key={province.code} value={province.code}>
                    {province.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.provinceCode && (
              <p className="text-sm text-red-500">{errors.provinceCode.message}</p>
            )}
          </div>

          {/* Regency Field */}
          <div className="space-y-2">
            <Label htmlFor="regencyCode">Kabupaten/Kota</Label>
            <Select
              onValueChange={(value) => {
                const selectedRegency = regencies.find(r => r.code === value);
                if (selectedRegency) {
                  setValue("regencyCode", selectedRegency.code);
                  setValue("regencyName", selectedRegency.name);
                }
              }}
              disabled={loadingRegencies || regencies.length === 0}
            >
              <SelectTrigger className={errors.regencyCode ? "border-red-500" : ""}>
                <SelectValue placeholder={
                  loadingRegencies ? "Memuat kabupaten/kota..." :
                  regencies.length === 0 ? "Pilih provinsi terlebih dahulu" :
                  "Pilih Kabupaten/Kota"
                } />
              </SelectTrigger>
              <SelectContent>
                {regencies.map((regency) => (
                  <SelectItem key={regency.code} value={regency.code}>
                    {regency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.regencyCode && (
              <p className="text-sm text-red-500">{errors.regencyCode.message}</p>
            )}
          </div>

          {/* District Field */}
          <div className="space-y-2">
            <Label htmlFor="districtCode">Kecamatan</Label>
            <Select
              onValueChange={(value) => {
                const selectedDistrict = districts.find(d => d.code === value);
                if (selectedDistrict) {
                  setValue("districtCode", selectedDistrict.code);
                  setValue("districtName", selectedDistrict.name);
                }
              }}
              disabled={loadingDistricts || districts.length === 0}
            >
              <SelectTrigger className={errors.districtCode ? "border-red-500" : ""}>
                <SelectValue placeholder={
                  loadingDistricts ? "Memuat kecamatan..." :
                  districts.length === 0 ? "Pilih kabupaten/kota terlebih dahulu" :
                  "Pilih Kecamatan"
                } />
              </SelectTrigger>
              <SelectContent>
                {districts.map((district) => (
                  <SelectItem key={district.code} value={district.code}>
                    {district.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.districtCode && (
              <p className="text-sm text-red-500">{errors.districtCode.message}</p>
            )}
          </div>

          {/* Street Address Field */}
          <div className="space-y-2">
            <Label htmlFor="streetAddress">Alamat Jalan</Label>
            <Textarea
              id="streetAddress"
              placeholder="Masukkan alamat jalan lengkap (nama jalan, nomor, RT/RW, dll)"
              rows={3}
              {...register("streetAddress")}
              className={errors.streetAddress ? "border-red-500" : ""}
            />
            {errors.streetAddress && (
              <p className="text-sm text-red-500">{errors.streetAddress.message}</p>
            )}
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Alert */}
          {success && (
            <Alert className="border-green-500 text-green-700">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                Mendaftar...
              </>
            ) : (
              "Daftar AdminKos"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
