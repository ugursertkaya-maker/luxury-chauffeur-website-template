export default function LocationsLoading() {
  return (
    <div className="min-h-screen bg-[#0e0e0e]">
      <div className="bg-slate-900 py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="h-10 bg-slate-700 rounded w-72 mx-auto mb-4 animate-pulse" />
          <div className="h-5 bg-slate-700 rounded w-80 mx-auto animate-pulse" />
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-16">
        {[1, 2].map(g => (
          <div key={g} className="mb-12">
            <div className="h-7 bg-[#1a1a1a] rounded w-48 mb-6 animate-pulse" />
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-[#0e0e0e] border border-[#D4A017]/10 rounded-xl p-5">
                  <div className="h-5 bg-[#1a1a1a] rounded w-3/4 mb-2 animate-pulse" />
                  <div className="h-4 bg-[#141414] rounded w-1/2 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
