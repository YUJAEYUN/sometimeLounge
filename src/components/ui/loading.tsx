export default function Loading() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
        <p className="text-sm text-muted-foreground">잠시만 기다려주세요...</p>
      </div>
    </div>
  )
}
