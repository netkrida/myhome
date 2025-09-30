import { requireRole } from "@/server/lib/auth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PropertyCreationForm } from "@/components/dashboard/adminkos/add-property"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function AddPropertyPage() {
  // Ensure user has admin kos role
  await requireRole(["ADMINKOS"])

  return (
    <DashboardLayout title="Tambah Property Baru">
      <div className="px-4 lg:px-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/adminkos/properties">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Tambah Property Baru</h1>
              <p className="text-muted-foreground">
                Lengkapi informasi property kos Anda dengan detail
              </p>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardDescription>
                Ikuti langkah-langkah berikut untuk menambahkan property kos baru. 
                Pastikan semua informasi yang dimasukkan akurat dan lengkap.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PropertyCreationForm />
            </CardContent>
          </Card>
        </div>

        {/* Help Section */}
        <div className="max-w-4xl mx-auto mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tips Pengisian Form</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm mb-2">📝 Data Dasar</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Gunakan nama yang mudah diingat dan mencerminkan lokasi</li>
                    <li>• Pilih jenis kos sesuai target penghuni</li>
                    <li>• Tulis deskripsi yang menarik dan informatif</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2">📍 Lokasi</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Pastikan alamat lengkap dan akurat</li>
                    <li>• Gunakan fitur map untuk menentukan koordinat</li>
                    <li>• Pilih lokasi yang mudah diakses</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2">📸 Foto</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Upload foto dengan kualitas baik dan pencahayaan cukup</li>
                    <li>• Sertakan foto eksterior, interior, dan fasilitas</li>
                    <li>• Maksimal 10 foto per kategori</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2">⚙️ Fasilitas & Aturan</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Pilih fasilitas yang benar-benar tersedia</li>
                    <li>• Buat aturan yang jelas dan mudah dipahami</li>
                    <li>• Sesuaikan dengan target penghuni</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
