"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Star, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Testimonial {
  id: string;
  name: string;
  role: string;
  location: string;
  rating: number;
  comment: string;
  avatar?: string;
  propertyName: string;
}

const testimonials: Testimonial[] = [
  {
    id: "1",
    name: "Sarah Putri",
    role: "Mahasiswa",
    location: "Malang",
    rating: 5,
    comment: "Kos Mawar Residence sangat nyaman dan bersih. Fasilitas lengkap dan pemilik sangat ramah. Lokasi strategis dekat kampus, jadi tidak perlu khawatir terlambat kuliah.",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
    propertyName: "Kos Mawar Residence"
  },
  {
    id: "2",
    name: "Ahmad Rizki",
    role: "Karyawan",
    location: "Jakarta",
    rating: 5,
    comment: "Boarding House Melati memberikan pengalaman tinggal yang luar biasa. Desain modern, AC dingin, dan internet cepat. Sangat cocok untuk pekerja muda seperti saya.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    propertyName: "Boarding House Melati"
  },
  {
    id: "3",
    name: "Dinda Sari",
    role: "Mahasiswa",
    location: "Bandung",
    rating: 5,
    comment: "Kos Anggrek Premium benar-benar premium! Fasilitas gym dan rooftop garden membuat saya betah tinggal di sini. Lingkungan aman dan teman-teman sesama penghuni juga baik.",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    propertyName: "Kos Anggrek Premium"
  },
  {
    id: "4",
    name: "Budi Santoso",
    role: "Mahasiswa",
    location: "Yogyakarta",
    rating: 4,
    comment: "Pelayanan myhome sangat membantu dalam mencari kos yang sesuai budget. Proses booking mudah dan transparan. Terima kasih sudah membantu menemukan hunian yang tepat!",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    propertyName: "Wisma Dahlia"
  },
  {
    id: "5",
    name: "Rina Wati",
    role: "Karyawan",
    location: "Surabaya",
    rating: 5,
    comment: "Aplikasi myhome sangat user-friendly. Bisa lihat foto-foto kos dengan jelas, baca review dari penghuni lain, dan langsung booking online. Sangat recommended!",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face",
    propertyName: "Kos Tulip Modern"
  }
];

export function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerPage = 3;
  const totalPages = Math.ceil(testimonials.length / itemsPerPage);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % totalPages);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const getCurrentTestimonials = () => {
    const start = currentIndex * itemsPerPage;
    return testimonials.slice(start, start + itemsPerPage);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <section className="bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Apa Kata Mereka?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Dengarkan pengalaman nyata dari ribuan penghuni yang telah menemukan hunian impian mereka melalui myhome.
          </p>
        </div>

        <div className="relative">
          {/* Navigation Buttons */}
          <div className="absolute -left-4 top-1/2 -translate-y-1/2 z-10">
            <Button
              variant="outline"
              size="icon"
              onClick={prevSlide}
              disabled={currentIndex === 0}
              className="bg-white shadow-lg hover:shadow-xl"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          <div className="absolute -right-4 top-1/2 -translate-y-1/2 z-10">
            <Button
              variant="outline"
              size="icon"
              onClick={nextSlide}
              disabled={currentIndex === totalPages - 1}
              className="bg-white shadow-lg hover:shadow-xl"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Testimonials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {getCurrentTestimonials().map((testimonial) => (
              <Card key={testimonial.id} className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Quote Icon */}
                    <div className="flex justify-between items-start">
                      <Quote className="h-8 w-8 text-blue-600 opacity-20" />
                      <div className="flex gap-1">
                        {renderStars(testimonial.rating)}
                      </div>
                    </div>

                    {/* Comment */}
                    <p className="text-gray-700 leading-relaxed text-sm">
                      "{testimonial.comment}"
                    </p>

                    {/* Property Name */}
                    <div className="text-xs text-blue-600 font-medium">
                      {testimonial.propertyName}
                    </div>

                    {/* User Info */}
                    <div className="flex items-center gap-3 pt-4 border-t">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                        <AvatarFallback>
                          {testimonial.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-sm text-gray-900">
                          {testimonial.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {testimonial.role} • {testimonial.location}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination Dots */}
          <div className="flex justify-center mt-8 gap-2">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? "bg-blue-600" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            Bergabunglah dengan ribuan penghuni yang puas
          </p>
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
            Mulai Cari Kos Sekarang
          </Button>
        </div>
      </div>
    </section>
  );
}
