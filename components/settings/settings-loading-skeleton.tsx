import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings, Database, HardDrive } from "lucide-react";

export function SettingsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Storage Mode Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="border-primary flex items-center gap-2 border-l-4 pl-4">
            <Settings className="h-5 w-5" />
            API Key Storage
          </CardTitle>
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Encrypted Database Storage Skeleton */}
            <div className="rounded-lg border p-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Database className="text-muted-foreground mt-0.5 h-5 w-5" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-5 w-12" />
                    </div>
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-3 w-3 rounded-full" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Local Storage Skeleton */}
            <div className="rounded-lg border p-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <HardDrive className="text-muted-foreground mt-0.5 h-5 w-5" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-5 w-12" />
                    </div>
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-3 w-3 rounded-full" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Current status skeleton */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Provider Cards Skeleton */}
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index} className="overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </div>
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="relative">
              <Skeleton className="h-10 w-full" />
              <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Save button skeleton */}
      <div className="flex justify-end">
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}
