export default function IncidentsLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-7 w-32 bg-slate-200 rounded mb-2" />
          <div className="h-4 w-36 bg-slate-100 rounded" />
        </div>
        <div className="h-9 w-28 bg-slate-200 rounded-lg" />
      </div>
      <div className="h-16 bg-amber-50 rounded-xl mb-6" />
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-xl" />)}
      </div>
    </div>
  );
}
