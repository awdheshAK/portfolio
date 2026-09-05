export default function VideoCardSkeleton() {
  return (
    <div>
      <div className="skeleton aspect-video rounded-xl" />
      <div className="mt-2.5 flex gap-2.5">
        <div className="skeleton h-9 w-9 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="skeleton h-3.5 w-4/5 rounded" />
          <div className="skeleton h-3 w-3/5 rounded" />
          <div className="skeleton h-3 w-2/5 rounded" />
        </div>
      </div>
    </div>
  );
}
