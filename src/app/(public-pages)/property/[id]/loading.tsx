import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader />
      <section className="bg-white pb-12 pt-8">
        <div className="container mx-auto flex flex-col gap-8 px-6">
          <div className="grid gap-4 lg:grid-cols-[2fr,1.15fr]">
            <Skeleton className="h-[320px] rounded-3xl" />
            <div className="flex flex-col gap-4">
              <Skeleton className="aspect-[16/9] rounded-3xl" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="aspect-[4/3] rounded-2xl" />
                <Skeleton className="aspect-[4/3] rounded-2xl" />
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
            <div className="space-y-4">
              <Skeleton className="h-8 w-48 rounded-full" />
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <div className="flex flex-wrap gap-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-8 w-36 rounded-full" />
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-28 rounded-3xl" />
              <Skeleton className="h-12 rounded-full" />
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto space-y-8 px-6 pb-16">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card
              key={index}
              className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white/80 shadow"
            >
              <CardHeader className="space-y-3 pb-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-3 w-36" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white/80 shadow">
          <CardContent className="space-y-4 p-6">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <Card
              key={index}
              className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white/80 shadow"
            >
              <CardContent className="space-y-4 p-6">
                <Skeleton className="h-6 w-56" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 4 }).map((__, badgeIndex) => (
                    <Skeleton key={badgeIndex} className="h-6 w-20 rounded-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white/80 shadow">
          <CardContent className="space-y-4 p-6">
            <Skeleton className="h-6 w-48" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, imageIndex) => (
                <Skeleton key={imageIndex} className="h-48 w-full rounded-3xl" />
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
      <PublicFooter />
    </div>
  );
}


