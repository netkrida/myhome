"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconLoader2 } from "@tabler/icons-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	customerRegistrationSchema,
	type CustomerRegistrationInput,
} from "@/server/schemas/customer-registration";
import type { CampusDTO } from "@/server/types/campus";
import type { District, Province, Regency } from "@/server/services/wilayah.service";

export function CustomerRegisterForm() {
	const router = useRouter();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [formError, setFormError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	const [campuses, setCampuses] = useState<CampusDTO[]>([]);
	const [isLoadingCampuses, setIsLoadingCampuses] = useState(false);
	const [campusError, setCampusError] = useState<string | null>(null);
	const [campusQuery, setCampusQuery] = useState("");
	const [provinces, setProvinces] = useState<Province[]>([]);
	const [regencies, setRegencies] = useState<Regency[]>([]);
	const [districts, setDistricts] = useState<District[]>([]);
	const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
	const [isLoadingRegencies, setIsLoadingRegencies] = useState(false);
	const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
	const [wilayahError, setWilayahError] = useState<string | null>(null);

	const form = useForm<CustomerRegistrationInput>({
		resolver: zodResolver(customerRegistrationSchema),
		defaultValues: {
			fullName: "",
			email: "",
			phoneNumber: "",
			password: "",
			confirmPassword: "",
			provinceCode: "",
			provinceName: "",
			regencyCode: "",
			regencyName: "",
			districtCode: "",
			districtName: "",
			streetAddress: "",
			status: "PEKERJA",
			institutionName: "",
		},
	});

	const selectedStatus = form.watch("status");
	const watchedInstitution = form.watch("institutionName");
	const watchedProvinceCode = form.watch("provinceCode");
	const watchedRegencyCode = form.watch("regencyCode");

	useEffect(() => {
		setCampusQuery(watchedInstitution ?? "");
	}, [watchedInstitution]);

	useEffect(() => {
		if (selectedStatus === "PEKERJA") {
			form.setValue("institutionName", "");
			setCampusError(null);
		}
	}, [selectedStatus, form]);

	useEffect(() => {
		const loadProvinces = async () => {
			setIsLoadingProvinces(true);
			setWilayahError(null);
			try {
				const response = await fetch("/api/wilayah/provinces");
				if (!response.ok) {
					throw new Error(`Gagal memuat provinsi (${response.status})`);
				}
				const payload = await response.json();
				if (!payload?.success || !Array.isArray(payload?.data)) {
					throw new Error("Format data provinsi tidak valid");
				}
				setProvinces(payload.data as Province[]);
			} catch (error) {
				console.error("Error loading provinces:", error);
				setWilayahError("Gagal memuat data provinsi. Silakan refresh halaman.");
			} finally {
				setIsLoadingProvinces(false);
			}
		};

		void loadProvinces();
	}, []);

	useEffect(() => {
		if (!watchedProvinceCode) {
			setRegencies([]);
			setDistricts([]);
			form.setValue("regencyCode", "");
			form.setValue("regencyName", "");
			form.setValue("districtCode", "");
			form.setValue("districtName", "");
			form.clearErrors(["regencyCode", "districtCode"]);
			return;
		}

		const loadRegencies = async () => {
			setIsLoadingRegencies(true);
			setWilayahError(null);
			setRegencies([]);
			setDistricts([]);
			form.setValue("regencyCode", "");
			form.setValue("regencyName", "");
			form.setValue("districtCode", "");
			form.setValue("districtName", "");
			try {
				const response = await fetch(`/api/wilayah/regencies/${watchedProvinceCode}`);
				if (!response.ok) {
					throw new Error(`Gagal memuat kabupaten/kota (${response.status})`);
				}
				const payload = await response.json();
				if (!payload?.success || !Array.isArray(payload?.data)) {
					throw new Error("Format data kabupaten/kota tidak valid");
				}
				setRegencies(payload.data as Regency[]);
			} catch (error) {
				console.error("Error loading regencies:", error);
				setWilayahError("Gagal memuat data kabupaten/kota. Silakan coba lagi.");
			} finally {
				setIsLoadingRegencies(false);
			}
		};

		void loadRegencies();
	}, [watchedProvinceCode, form]);

	useEffect(() => {
		if (!watchedRegencyCode) {
			setDistricts([]);
			form.setValue("districtCode", "");
			form.setValue("districtName", "");
			form.clearErrors("districtCode");
			return;
		}

		const loadDistricts = async () => {
			setIsLoadingDistricts(true);
			setWilayahError(null);
			setDistricts([]);
			form.setValue("districtCode", "");
			form.setValue("districtName", "");
			try {
				const response = await fetch(`/api/wilayah/districts/${watchedRegencyCode}`);
				if (!response.ok) {
					throw new Error(`Gagal memuat kecamatan (${response.status})`);
				}
				const payload = await response.json();
				if (!payload?.success || !Array.isArray(payload?.data)) {
					throw new Error("Format data kecamatan tidak valid");
				}
				setDistricts(payload.data as District[]);
			} catch (error) {
				console.error("Error loading districts:", error);
				setWilayahError("Gagal memuat data kecamatan. Silakan coba lagi.");
			} finally {
				setIsLoadingDistricts(false);
			}
		};

		void loadDistricts();
	}, [watchedRegencyCode, form]);

	const fetchCampuses = useCallback(async () => {
		setIsLoadingCampuses(true);
		setCampusError(null);
		try {
			const response = await fetch("/api/public/campuses", {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
				cache: "no-store",
			});
			if (!response.ok) {
				throw new Error(`Gagal memuat daftar kampus (${response.status})`);
			}
			const payload = await response.json();
			if (!payload?.success || !Array.isArray(payload?.data)) {
				throw new Error("Format data kampus tidak valid");
			}
			setCampuses(payload.data as CampusDTO[]);
		} catch (error) {
			setCampusError("Gagal memuat daftar kampus. Coba lagi nanti.");
			// Jangan overwrite campuses jika gagal
		} finally {
			setIsLoadingCampuses(false);
		}
	}, []);

	useEffect(() => {
		if (selectedStatus === "MAHASISWA" && campuses.length === 0 && !isLoadingCampuses) {
			void fetchCampuses();
		}
	}, [selectedStatus, campuses.length, isLoadingCampuses, fetchCampuses]);

	const filteredCampuses = useMemo(() => {
		if (!campusQuery) {
			return campuses.slice(0, 50);
		}
		const query = campusQuery.toLowerCase();
		return campuses
			.filter((campus) => `${campus.name} ${campus.city}`.toLowerCase().includes(query))
			.slice(0, 50);
	}, [campuses, campusQuery]);

	const onSubmit = async (values: CustomerRegistrationInput) => {
		setIsSubmitting(true);
		setFormError(null);
		setSuccessMessage(null);

		try {
			const { confirmPassword, ...payload } = values;
			const response = await fetch("/api/auth/register/customer", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			const result = await response.json();

			if (!response.ok || !result.success) {
				const errorMessage = result?.error?.message ?? result?.error ?? "Terjadi kesalahan saat mendaftar";
				setFormError(errorMessage);

				const details = result?.error?.details?.errors ?? result?.details ?? [];
				if (Array.isArray(details)) {
					details.forEach((detail: any) => {
						if (detail?.field) {
							form.setError(detail.field as keyof CustomerRegistrationInput, {
								message: detail.message ?? errorMessage,
							});
						}
					});
				}
				return;
			}

			setSuccessMessage("Akun pemesan berhasil dibuat! Silakan login.");
			setTimeout(() => {
				router.push("/login-customer?message=registration-success");
			}, 2000);
		} catch (error) {
			console.error("Customer registration error:", error);
			setFormError("Terjadi kesalahan jaringan. Silakan coba lagi.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Card className="w-full">
			<CardHeader className="space-y-1">
				<CardTitle className="text-2xl text-center">Daftar sebagai Pemesan</CardTitle>
				<CardDescription className="text-center">
					Buat akun pemesan untuk memesan dan menyimpan kos favorit Anda.
				</CardDescription>
			</CardHeader>
			<CardContent>
				{formError && (
					<Alert variant="destructive" className="mb-4">
						<AlertDescription>{formError}</AlertDescription>
					</Alert>
				)}

				{successMessage && (
					<Alert className="mb-4 border-green-200 bg-green-50 text-green-700">
						<AlertDescription>{successMessage}</AlertDescription>
					</Alert>
				)}

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<input type="hidden" {...form.register("provinceName")} />
						<input type="hidden" {...form.register("regencyName")} />
						<input type="hidden" {...form.register("districtName")} />
						<FormField
							control={form.control}
							name="fullName"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Nama Lengkap</FormLabel>
									<FormControl>
										<Input placeholder="Masukkan nama lengkap" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

									<FormField
										control={form.control}
										name="email"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Email</FormLabel>
												<FormControl>
													<Input type="email" placeholder="contoh@email.com" {...field} />
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
									<FormLabel>Nomor HP</FormLabel>
									<FormControl>
										<Input placeholder="08123456789 atau +62812345678" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="password"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Password</FormLabel>
									<FormControl>
										<Input type="password" placeholder="Minimal 8 karakter" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="confirmPassword"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Konfirmasi Password</FormLabel>
									<FormControl>
										<Input type="password" placeholder="Ulangi password" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="provinceCode"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Provinsi</FormLabel>
									<Select
										onValueChange={(value) => {
											field.onChange(value);
											const selected = provinces.find((province) => province.code === value);
											form.setValue("provinceName", selected?.name ?? "", { shouldDirty: true });
											form.clearErrors(["provinceCode"]);
										}}
										value={field.value || undefined}
										disabled={isLoadingProvinces}
									>
										<FormControl>
											<SelectTrigger className="w-full">
												<SelectValue placeholder={isLoadingProvinces ? "Memuat provinsi..." : "Pilih Provinsi"} />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{provinces.map((province) => (
												<SelectItem key={province.code} value={province.code}>
													{province.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
									{wilayahError && !isLoadingProvinces && provinces.length === 0 && (
										<p className="text-xs text-red-500">{wilayahError}</p>
									)}
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="regencyCode"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Kabupaten/Kota</FormLabel>
									<Select
										onValueChange={(value) => {
											field.onChange(value);
											const selected = regencies.find((regency) => regency.code === value);
											form.setValue("regencyName", selected?.name ?? "", { shouldDirty: true });
											form.clearErrors(["regencyCode"]);
										}}
										value={field.value || undefined}
										disabled={isLoadingRegencies || !watchedProvinceCode || provinces.length === 0}
									>
										<FormControl>
											<SelectTrigger className="w-full">
												<SelectValue
													placeholder={
														!watchedProvinceCode
															? "Pilih provinsi terlebih dahulu"
														: isLoadingRegencies
															? "Memuat kabupaten/kota..."
															: "Pilih Kabupaten/Kota"
													}
												/>
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{regencies.map((regency) => (
												<SelectItem key={regency.code} value={regency.code}>
													{regency.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
									{wilayahError && !!watchedProvinceCode && regencies.length === 0 && !isLoadingRegencies && (
										<p className="text-xs text-red-500">{wilayahError}</p>
									)}
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="districtCode"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Kecamatan</FormLabel>
									<Select
										onValueChange={(value) => {
											field.onChange(value);
											const selected = districts.find((district) => district.code === value);
											form.setValue("districtName", selected?.name ?? "", { shouldDirty: true });
											form.clearErrors(["districtCode"]);
										}}
										value={field.value || undefined}
										disabled={isLoadingDistricts || !watchedRegencyCode || regencies.length === 0}
									>
										<FormControl>
											<SelectTrigger className="w-full">
												<SelectValue
													placeholder={
														!watchedRegencyCode
															? "Pilih kabupaten/kota terlebih dahulu"
														: isLoadingDistricts
															? "Memuat kecamatan..."
															: "Pilih Kecamatan"
													}
												/>
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{districts.map((district) => (
												<SelectItem key={district.code} value={district.code}>
													{district.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
									{wilayahError && !!watchedRegencyCode && districts.length === 0 && !isLoadingDistricts && (
										<p className="text-xs text-red-500">{wilayahError}</p>
									)}
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="streetAddress"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Alamat Jalan</FormLabel>
									<FormControl>
										<Textarea
											rows={3}
											placeholder="Masukkan alamat jalan lengkap (nama jalan, nomor, RT/RW, dll)"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="status"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Status</FormLabel>
									<FormControl>
										<RadioGroup
											onValueChange={(value) => field.onChange(value)}
											value={field.value}
											className="grid gap-3 sm:grid-cols-2"
										>
											<div className="flex items-center space-x-3 rounded-lg border p-3">
												<RadioGroupItem value="MAHASISWA" id="status-mahasiswa" />
												<Label htmlFor="status-mahasiswa" className="cursor-pointer text-sm font-medium">
													Mahasiswa
												</Label>
											</div>
											<div className="flex items-center space-x-3 rounded-lg border p-3">
												<RadioGroupItem value="PEKERJA" id="status-pekerja" />
												<Label htmlFor="status-pekerja" className="cursor-pointer text-sm font-medium">
													Pekerja
												</Label>
											</div>
										</RadioGroup>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{selectedStatus === "MAHASISWA" && (
							<FormField
								control={form.control}
								name="institutionName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Nama Kampus</FormLabel>
										<FormControl>
											<div className="space-y-2">
												<Input
													placeholder="Cari nama kampus"
													list="campus-options"
													{...field}
													onChange={(event) => {
														field.onChange(event.target.value);
														setCampusQuery(event.target.value);
													}}
												/>
												<datalist id="campus-options">
													{filteredCampuses.map((campus) => (
														<option key={campus.code} value={campus.name}>
															{campus.name}
															{campus.city ? ` - ${campus.city}` : ""}
														</option>
													))}
												</datalist>
											</div>
										</FormControl>
										{isLoadingCampuses && (
											<p className="text-xs text-muted-foreground">Memuat daftar kampus...</p>
										)}
										{campusError && (
											<p className="text-xs text-red-500">{campusError}</p>
										)}
										{!isLoadingCampuses && campuses.length === 0 && !campusError && (
											<p className="text-xs text-muted-foreground">
												Daftar kampus akan muncul setelah data berhasil dimuat.
											</p>
										)}
										<FormMessage />
									</FormItem>
								)}
							/>
						)}

						<Button type="submit" className="w-full" disabled={isSubmitting}>
							{isSubmitting ? (
								<span className="flex items-center justify-center gap-2">
									<IconLoader2 className="h-4 w-4 animate-spin" />
									Memproses...
								</span>
							) : (
								"Daftar"
							)}
						</Button>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}
