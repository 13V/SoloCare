export default function MyComplianceLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-11 w-11 bg-slate-200 rounded-xl animate-pulse" />
        <div className="space-y-2">
          <div className="h-7 w-64 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 w-48 bg-slate-100 rounded animate-pulse" />
        </div>
      </div>
      <div className="flex justify-between items-center mb-4">
        <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
        <div className="h-9 w-36 bg-slate-200 rounded-lg animate-pulse" />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-36 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}
