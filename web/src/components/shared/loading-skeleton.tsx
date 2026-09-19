import { Skeleton } from "@/components/ui/skeleton";

export function CardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6">
      <Skeleton className="h-4 w-32 mb-3" />
      <Skeleton className="h-3 w-48 mb-2" />
      <Skeleton className="h-3 w-40" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function GraphSkeleton() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <Skeleton className="mx-auto h-8 w-8 rounded-full mb-3" />
        <Skeleton className="h-3 w-24 mx-auto" />
      </div>
    </div>
  );
}
