import Skeleton from './ui/Skeleton'

function PageFallback() {
  return (
    <div
      role="status"
      aria-label="Memuat halaman"
      className="grid min-h-svh place-items-center bg-white px-6"
    >
      <div aria-hidden="true" className="flex w-full max-w-xl flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  )
}

export default PageFallback
