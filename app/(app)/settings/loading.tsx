export default function SettingsLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto animate-pulse">
      <div className="mb-6">
        <div className="h-7 w-28 bg-slate-200 rounded mb-2" />
        <div className="h-4 w-52 bg-slate-100 rounded" />
      </div>
      <div className="space-y-4">
        <div className="h-56 bg-slate-100 rounded-xl" />
        <div className="h-48 bg-slate-100 rounded-xl" />
        <div className="h-12 bg-slate-200 rounded-xl" />
      </div>
    </div>
  );
}
