export default function InvoicesLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-7 w-32 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 w-24 bg-slate-100 rounded animate-pulse mt-2" />
        </div>
        <div className="h-9 w-32 bg-slate-200 rounded-lg animate-pulse" />
      </div>

      {/* Tab skeleton */}
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-lg w-fit">
        {[80, 60, 60, 80, 55].map((w, i) => (
          <div key={i} className="h-7 rounded-md bg-slate-200 animate-pulse" style={{ width: w }} />
        ))}
      </div>

      {/* Card skeletons */}
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-slate-200 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 bg-slate-100 rounded-lg animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 w-28 bg-slate-200 rounded animate-pulse" />
                  <div className="h-3 w-36 bg-slate-100 rounded animate-pulse" />
                  <div className="h-3 w-48 bg-slate-100 rounded animate-pulse" />
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="h-5 w-16 bg-slate-100 rounded-full animate-pulse" />
                <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
