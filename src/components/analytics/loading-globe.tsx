"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function LoadingGlobe() {
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Global Visitor Distribution</CardTitle>
        <CardDescription>
          Loading interactive globe...
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-r-primary/40 rounded-full animate-spin animation-delay-150"></div>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Loading globe visualization...</p>
              <p className="text-xs text-muted-foreground mt-1">This may take a moment</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
