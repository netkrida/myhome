"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileText, Calendar, ArrowLeft, BookOpen, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";

interface SiteContent {
    id: string;
    type: string;
    title: string;
    content: string;
    isPublished: boolean;
    updatedAt: string;
}

export default function TermsPage() {
    const [content, setContent] = useState<SiteContent | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const response = await fetch("/api/public/site-content?type=terms");
                const data = await response.json();

                if (data.success && data.data) {
                    setContent(data.data);
                } else {
                    setError("Konten tidak ditemukan");
                }
            } catch (err) {
                console.error("Failed to fetch terms:", err);
                setError("Gagal memuat konten");
            } finally {
                setIsLoading(false);
            }
        };

        fetchContent();
    }, []);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <PublicHeader />
            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative overflow-hidden pt-20 pb-12 lg:pt-28 lg:pb-16">
                    {/* Background elements */}
                    <div className="absolute inset-0 -z-10">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-violet-500/5 to-background" />
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[300px] bg-primary/10 blur-[120px] rounded-full" />
                    </div>

                    <div className="container mx-auto px-4 text-center">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6 border border-primary/20"
                        >
                            <FileText className="h-4 w-4" />
                            <span className="text-sm font-medium">Dokumen Legal</span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1, duration: 0.6 }}
                            className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent"
                        >
                            {isLoading ? "Memuat..." : content?.title || "Syarat dan Ketentuan"}
                        </motion.h1>

                        {content?.updatedAt && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 0.6 }}
                                className="flex items-center justify-center gap-2 text-muted-foreground"
                            >
                                <Calendar className="h-4 w-4" />
                                <span className="text-sm">Terakhir diperbarui: {formatDate(content.updatedAt)}</span>
                            </motion.div>
                        )}
                    </div>
                </section>

                {/* Content Section */}
                <section className="py-8 lg:py-12">
                    <div className="container mx-auto px-4">
                        <div className="max-w-4xl mx-auto">
                            {/* Back Button */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5 }}
                                className="mb-8"
                            >
                                <Link href="/">
                                    <Button variant="ghost" size="sm" className="gap-2 hover:bg-primary/10">
                                        <ArrowLeft className="h-4 w-4" />
                                        Kembali ke Beranda
                                    </Button>
                                </Link>
                            </motion.div>

                            {/* Main Content Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 0.6 }}
                                className="bg-card border border-border/50 rounded-3xl shadow-lg overflow-hidden"
                            >
                                {isLoading ? (
                                    <div className="p-8 lg:p-12 text-center">
                                        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-4">
                                            <BookOpen className="h-8 w-8 text-primary animate-pulse" />
                                        </div>
                                        <p className="text-muted-foreground">Memuat konten...</p>
                                    </div>
                                ) : error ? (
                                    <div className="p-8 lg:p-12 text-center">
                                        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-destructive/10 mb-4">
                                            <FileText className="h-8 w-8 text-destructive" />
                                        </div>
                                        <h2 className="text-xl font-semibold mb-2">Konten Tidak Tersedia</h2>
                                        <p className="text-muted-foreground mb-6">{error}</p>
                                        <Link href="/">
                                            <Button>Kembali ke Beranda</Button>
                                        </Link>
                                    </div>
                                ) : content ? (
                                    <div className="p-8 lg:p-12">
                                        {/* Content Info Header */}
                                        <div className="flex items-center gap-3 pb-6 mb-8 border-b border-border/50">
                                            <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-violet-600 text-white">
                                                <List className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h2 className="font-semibold text-lg">{content.title}</h2>
                                                <p className="text-sm text-muted-foreground">
                                                    Mohon baca dengan seksama sebelum menggunakan layanan kami
                                                </p>
                                            </div>
                                        </div>

                                        {/* Rendered HTML Content */}
                                        <div
                                            className="prose prose-lg max-w-none dark:prose-invert
                        prose-headings:font-bold prose-headings:tracking-tight
                        prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:text-foreground
                        prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3 prose-h3:text-foreground
                        prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-4
                        prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6
                        prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6
                        prose-li:text-muted-foreground prose-li:mb-2
                        prose-strong:text-foreground prose-strong:font-semibold
                        prose-a:text-primary prose-a:underline prose-a:underline-offset-4 prose-a:hover:text-primary/80"
                                            dangerouslySetInnerHTML={{ __html: content.content }}
                                        />
                                    </div>
                                ) : null}
                            </motion.div>

                            {/* Footer Note */}
                            {content && (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.4, duration: 0.6 }}
                                    className="text-center text-sm text-muted-foreground mt-8"
                                >
                                    Dengan menggunakan layanan myHome, Anda menyetujui syarat dan ketentuan ini.
                                </motion.p>
                            )}
                        </div>
                    </div>
                </section>
            </main>
            <PublicFooter />
        </div>
    );
}
