"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
    IconDeviceFloppy,
    IconEye,
    IconLoader2,
    IconFileText,
    IconShieldLock,
    IconCheck,
    IconRefresh
} from "@tabler/icons-react";

interface SiteContent {
    id: string;
    type: string;
    title: string;
    content: string;
    isPublished: boolean;
    updatedAt: string;
}

export default function SiteContentPage() {
    const [termsContent, setTermsContent] = useState<SiteContent | null>(null);
    const [privacyContent, setPrivacyContent] = useState<SiteContent | null>(null);
    const [activeTab, setActiveTab] = useState("terms");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    // Form state
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [isPublished, setIsPublished] = useState(false);

    const router = useRouter();

    const fetchContent = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/superadmin/site-content");
            const data = await response.json();

            if (data.success) {
                const contents = data.data as SiteContent[];
                const terms = contents.find(c => c.type === "terms");
                const privacy = contents.find(c => c.type === "privacy");

                setTermsContent(terms || null);
                setPrivacyContent(privacy || null);

                // Set initial form values based on active tab
                if (activeTab === "terms" && terms) {
                    setTitle(terms.title);
                    setContent(terms.content);
                    setIsPublished(terms.isPublished);
                } else if (activeTab === "privacy" && privacy) {
                    setTitle(privacy.title);
                    setContent(privacy.content);
                    setIsPublished(privacy.isPublished);
                } else {
                    // Default values for new content
                    setTitle(activeTab === "terms" ? "Syarat dan Ketentuan" : "Kebijakan Privasi");
                    setContent("");
                    setIsPublished(false);
                }
            }
        } catch (error) {
            console.error("Failed to fetch content:", error);
            toast.error("Gagal memuat konten");
        } finally {
            setIsLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        fetchContent();
    }, [fetchContent]);

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        setShowPreview(false);

        if (value === "terms" && termsContent) {
            setTitle(termsContent.title);
            setContent(termsContent.content);
            setIsPublished(termsContent.isPublished);
        } else if (value === "privacy" && privacyContent) {
            setTitle(privacyContent.title);
            setContent(privacyContent.content);
            setIsPublished(privacyContent.isPublished);
        } else {
            setTitle(value === "terms" ? "Syarat dan Ketentuan" : "Kebijakan Privasi");
            setContent("");
            setIsPublished(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const response = await fetch("/api/superadmin/site-content", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: activeTab,
                    title,
                    content,
                    isPublished,
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success(`Konten ${activeTab === "terms" ? "Syarat dan Ketentuan" : "Kebijakan Privasi"} berhasil disimpan`);
                fetchContent();
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error("Failed to save content:", error);
            toast.error("Gagal menyimpan konten");
        } finally {
            setIsSaving(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const currentContent = activeTab === "terms" ? termsContent : privacyContent;

    return (
        <DashboardLayout title="Konten Website">
            <div className="px-4 lg:px-6">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent">
                            Konten Website
                        </h1>
                        <p className="text-muted-foreground">
                            Kelola konten halaman Syarat dan Ketentuan serta Kebijakan Privasi
                        </p>
                    </div>

                    <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
                        <TabsList className="grid w-full max-w-md grid-cols-2">
                            <TabsTrigger value="terms" className="flex items-center gap-2">
                                <IconFileText className="h-4 w-4" />
                                Syarat & Ketentuan
                            </TabsTrigger>
                            <TabsTrigger value="privacy" className="flex items-center gap-2">
                                <IconShieldLock className="h-4 w-4" />
                                Kebijakan Privasi
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value={activeTab}>
                            <Card className="border-border/50 shadow-lg">
                                <CardHeader className="border-b border-border/50 bg-muted/30">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                {activeTab === "terms" ? (
                                                    <IconFileText className="h-5 w-5 text-primary" />
                                                ) : (
                                                    <IconShieldLock className="h-5 w-5 text-primary" />
                                                )}
                                                {activeTab === "terms" ? "Syarat dan Ketentuan" : "Kebijakan Privasi"}
                                            </CardTitle>
                                            <CardDescription>
                                                {currentContent?.updatedAt
                                                    ? `Terakhir diperbarui: ${formatDate(currentContent.updatedAt)}`
                                                    : "Belum ada konten"}
                                            </CardDescription>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    id="published"
                                                    checked={isPublished}
                                                    onCheckedChange={setIsPublished}
                                                />
                                                <Label htmlFor="published" className="text-sm">
                                                    {isPublished ? (
                                                        <span className="flex items-center gap-1 text-green-600">
                                                            <IconCheck className="h-4 w-4" /> Dipublikasikan
                                                        </span>
                                                    ) : (
                                                        "Draft"
                                                    )}
                                                </Label>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 space-y-6">
                                    {isLoading ? (
                                        <div className="flex items-center justify-center py-12">
                                            <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
                                        </div>
                                    ) : showPreview ? (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h2 className="text-xl font-semibold">Preview</h2>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setShowPreview(false)}
                                                >
                                                    <IconRefresh className="h-4 w-4 mr-2" />
                                                    Kembali ke Editor
                                                </Button>
                                            </div>
                                            <div className="border rounded-xl p-6 bg-background min-h-[400px]">
                                                <h1 className="text-2xl font-bold mb-4">{title}</h1>
                                                <div
                                                    className="prose prose-sm max-w-none dark:prose-invert"
                                                    dangerouslySetInnerHTML={{ __html: content }}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {/* Title Input */}
                                            <div className="space-y-2">
                                                <Label htmlFor="title">Judul</Label>
                                                <Input
                                                    id="title"
                                                    value={title}
                                                    onChange={(e) => setTitle(e.target.value)}
                                                    placeholder="Masukkan judul..."
                                                    className="text-lg font-medium"
                                                />
                                            </div>

                                            {/* Content Editor */}
                                            <div className="space-y-2">
                                                <Label htmlFor="content">Konten (HTML)</Label>
                                                <textarea
                                                    id="content"
                                                    value={content}
                                                    onChange={(e) => setContent(e.target.value)}
                                                    placeholder="Masukkan konten dalam format HTML..."
                                                    className="w-full min-h-[400px] p-4 rounded-xl border border-input bg-background text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    Gunakan tag HTML seperti &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;ol&gt;, &lt;strong&gt;, dll.
                                                </p>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-3 pt-4 border-t">
                                                <Button
                                                    onClick={handleSave}
                                                    disabled={isSaving}
                                                    className="bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90"
                                                >
                                                    {isSaving ? (
                                                        <IconLoader2 className="h-4 w-4 animate-spin mr-2" />
                                                    ) : (
                                                        <IconDeviceFloppy className="h-4 w-4 mr-2" />
                                                    )}
                                                    Simpan
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setShowPreview(true)}
                                                    disabled={!content}
                                                >
                                                    <IconEye className="h-4 w-4 mr-2" />
                                                    Preview
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </DashboardLayout>
    );
}
