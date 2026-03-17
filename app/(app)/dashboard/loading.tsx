export default function DashboardLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto animate-pulse">
      <div className="mb-5">
        <div className="h-7 w-36 bg-slate-200 rounded mb-2" />
        <div className="h-4 w-48 bg-slate-100 rounded" />
      </div>
      {/* Score banner */}
      <div className="h-40 bg-slate-100 rounded-xl mb-6" />
      {/* Cards */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div className="h-36 bg-slate-100 rounded-xl" />
        <div className="h-36 bg-slate-100 rounded-xl" />
      </div>
      {/* Checklist */}
      <div className="h-64 bg-slate-100 rounded-xl mb-4" />
      {/* Incidents */}
      <div className="h-40 bg-slate-100 rounded-xl" />
    </div>
  );
}
