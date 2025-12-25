"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    ShieldCheck,
    Zap,
    Users,
    Sparkles,
    Building2,
    Search,
    ArrowRight,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";

interface LandingStats {
    totalProperties: number;
    activeUsers: number;
    totalCities: number;
}

export default function AboutPage() {
    const [stats, setStats] = useState<LandingStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch("/api/public/stats");
                const data = await response.json();
                if (data.success && data.data) {
                    setStats(data.data);
                }
            } catch (error) {
                console.error("Failed to fetch statistics:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: "easeOut" as any }
        }
    };

    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + "M+";
        if (num >= 1000) return (num / 1000).toFixed(1) + "K+";
        return num.toString();
    };

    const displayStats = [
        {
            label: "Properti Terdaftar",
            value: isLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : formatNumber(stats?.totalProperties || 0)
        },
        {
            label: "Pengguna Aktif",
            value: isLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : formatNumber(stats?.activeUsers || 0)
        },
        {
            label: "Kota Terjangkau",
            value: isLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (stats?.totalCities || 0).toString()
        }
    ];

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <PublicHeader />
            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative overflow-hidden pt-20 pb-16 lg:pt-32 lg:pb-24">
                    {/* Background elements */}
                    <div className="absolute inset-0 -z-10">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-primary/5 blur-[120px] rounded-full" />
                        <div className="absolute -top-24 -right-24 w-96 h-96 bg-violet-500/10 blur-[100px] rounded-full" />
                    </div>

                    <div className="container mx-auto px-4 text-center">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6 border border-primary/20"
                        >
                            <span className="text-sm font-medium">Tentang myHome</span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                            className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent"
                        >
                            Membangun Masa Depan <br className="hidden md:block" /> Hunian Digital Indonesia
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                            className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
                        >
                            myHome adalah platform digital yang memudahkan pencarian dan pembookingan kos secara cepat, aman, dan terpercaya. Kami hadir sebagai solusi bagi mahasiswa, pekerja, maupun perantau yang membutuhkan hunian nyaman tanpa proses yang rumit.
                        </motion.p>
                    </div>
                </section>

                {/* Main Content Section */}
                <section className="py-16 md:py-24 relative">
                    <div className="container mx-auto px-4">
                        <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
                            {/* Visual Part */}
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                                className="relative aspect-square md:aspect-auto md:h-[600px] rounded-3xl overflow-hidden shadow-2xl group"
                            >
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
                                <Image
                                    src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2070&auto=format&fit=crop"
                                    alt="Modern Living"
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute bottom-8 left-8 right-8 z-20">
                                    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl">
                                        <p className="text-white text-lg font-medium italic">
                                            "Menemukan tempat tinggal kini semudah menyentuh layar smartphone Anda."
                                        </p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Text Part */}
                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                className="space-y-8"
                            >
                                <motion.div variants={itemVariants} className="space-y-4">
                                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2">
                                        <Search className="h-6 w-6" />
                                    </div>
                                    <h2 className="text-3xl font-bold">Pencarian yang Pintar</h2>
                                    <p className="text-muted-foreground leading-relaxed text-lg text-justify">
                                        Melalui myHome, pengguna dapat melihat informasi kos secara lengkap mulai dari lokasi, fasilitas, harga, hingga ketersediaan kamar secara real-time. Proses pemesanan dirancang simpel dan transparan, sehingga pengguna dapat langsung melakukan booking tanpa harus datang ke lokasi terlebih dahulu.
                                    </p>
                                </motion.div>

                                <motion.div variants={itemVariants} className="space-y-4">
                                    <div className="h-12 w-12 rounded-2xl bg-violet-100 flex items-center justify-center text-violet-600 mb-2">
                                        <Building2 className="h-6 w-6" />
                                    </div>
                                    <h2 className="text-3xl font-bold">Solusi Bagi Pemilik</h2>
                                    <p className="text-muted-foreground leading-relaxed text-lg text-justify">
                                        Bagi pemilik kos, myHome membantu dalam mengelola data kos, kamar, dan pemesanan secara terpusat. Sistem ini mempermudah promosi kos, meningkatkan keterisian kamar, serta mengurangi proses administrasi yang tidak efisien.
                                    </p>
                                </motion.div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Values / Features Card Section */}
                <section className="py-20 bg-muted/30">
                    <div className="container mx-auto px-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center mb-16"
                        >
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">Komitmen Kami</h2>
                            <div className="w-20 h-1.5 bg-primary mx-auto rounded-full" />
                        </motion.div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[
                                {
                                    icon: <Zap className="w-6 h-6" />,
                                    title: "Cepat & Efisien",
                                    desc: "Proses booking instan yang memangkas waktu tunggu Anda.",
                                    color: "bg-blue-500"
                                },
                                {
                                    icon: <ShieldCheck className="w-6 h-6" />,
                                    title: "Aman & Terpercaya",
                                    desc: "Sistem pembayaran dan pengelolaan data yang terjamin keamanannya.",
                                    color: "bg-emerald-500"
                                },
                                {
                                    icon: <Users className="w-6 h-6" />,
                                    title: "Berfokus pada Pengguna",
                                    desc: "Dukungan pelanggan yang siap membantu kapan saja.",
                                    color: "bg-orange-500"
                                }
                            ].map((feature, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="bg-background border border-border/50 p-8 rounded-3xl hover:shadow-xl transition-all duration-300 group"
                                >
                                    <div className={`w-14 h-14 ${feature.color} text-white rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        {feature.desc}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Vision & Partnership Section */}
                <section className="py-24 overflow-hidden relative">
                    <div className="container mx-auto px-4">
                        <div className="bg-gradient-to-br from-primary to-violet-700 rounded-[40px] p-8 md:p-16 relative overflow-hidden text-white shadow-2xl">
                            {/* Shapes */}
                            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-48 -mt-48" />
                            <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full blur-3xl -ml-48 -mb-48" />

                            <div className="relative z-20 max-w-4xl">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    className="space-y-6"
                                >
                                    <h2 className="text-3xl md:text-5xl font-bold leading-tight">
                                        Lebih dari sekadar aplikasi, myHome adalah Partner Hunian Anda.
                                    </h2>
                                    <p className="text-white/80 text-lg md:text-xl leading-relaxed">
                                        Kami berkomitmen untuk menghadirkan pengalaman terbaik dalam mencari dan mengelola kos dengan memanfaatkan teknologi digital yang modern, aman, dan mudah digunakan. myHome bukan sekadar aplikasi, tetapi partner hunian terpercaya untuk menemukan tempat tinggal yang benar-benar terasa seperti rumah.
                                    </p>

                                    <div className="pt-8 flex flex-wrap gap-4">
                                        <Link href="/register">
                                            <Button size="lg" variant="secondary" className="h-14 px-8 rounded-full text-primary font-bold hover:scale-105 transition-all shadow-xl bg-white hover:bg-white/90">
                                                Gabung Jadi Mitra
                                                <ArrowRight className="ml-2 w-5 h-5" />
                                            </Button>
                                        </Link>
                                        <Link href="/cari-kos">
                                            <Button size="lg" variant="outline" className="h-14 px-8 rounded-full border-white text-white hover:bg-white/20 transition-all backdrop-blur-sm bg-white/5">
                                                Cari Kos Sekarang
                                            </Button>
                                        </Link>
                                    </div>
                                </motion.div>
                            </div>

                            <div className="hidden lg:flex absolute -right-32 top-1/2 -translate-y-1/2 w-1/3 aspect-square bg-white/10 rounded-2xl backdrop-blur-3xl transform rotate-12 items-center justify-center p-12 border border-white/20 z-10 pointer-events-none">
                                <div className="w-full h-full border-4 border-dashed border-white/30 rounded-xl flex items-center justify-center">
                                    <Building2 className="w-32 h-32 text-white/40" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Quick Stats or Trust Indicators */}
                <section className="py-16">
                    <div className="container mx-auto px-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                            {displayStats.map((stat, idx) => (
                                <div key={idx} className="text-center group">
                                    <div className="text-3xl md:text-4xl font-bold text-primary mb-2 group-hover:scale-110 transition-transform h-12 flex items-center justify-center">
                                        {stat.value}
                                    </div>
                                    <div className="text-sm font-medium text-muted-foreground uppercase tracking-widest leading-relaxed">
                                        {stat.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>
            <PublicFooter />
        </div>
    );
}
