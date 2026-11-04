export default function AirportsLoading() {
  return (
    <div className="min-h-screen bg-[#0e0e0e]">
      <div className="bg-slate-900 py-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="h-10 bg-slate-700 rounded w-64 mx-auto mb-4 animate-pulse" />
          <div className="h-5 bg-slate-700 rounded w-72 mx-auto animate-pulse" />
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-[#0e0e0e] border border-[#D4A017]/10 rounded-xl p-6 flex gap-4">
            <div className="w-14 h-14 bg-[#1a1a1a] rounded-lg flex-shrink-0 animate-pulse" />
            <div className="flex-1">
              <div className="h-5 bg-[#1a1a1a] rounded w-3/4 mb-2 animate-pulse" />
              <div className="h-4 bg-[#141414] rounded w-1/2 mb-3 animate-pulse" />
              <div className="h-4 bg-[#141414] rounded w-2/3 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
