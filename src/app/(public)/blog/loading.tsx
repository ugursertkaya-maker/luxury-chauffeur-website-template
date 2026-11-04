export default function BlogLoading() {
  return (
    <div className="min-h-screen bg-[#0e0e0e]">
      <div className="bg-slate-900 py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="h-10 bg-slate-700 rounded w-64 mx-auto mb-4 animate-pulse" />
          <div className="h-5 bg-slate-700 rounded w-96 mx-auto animate-pulse" />
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-16">
        {[1, 2, 3].map(g => (
          <div key={g} className="mb-12">
            <div className="h-7 bg-[#1a1a1a] rounded w-40 mb-6 animate-pulse" />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-[#0e0e0e] border border-[#D4A017]/10 rounded-xl p-6">
                  <div className="h-4 bg-[#1a1a1a] rounded w-20 mb-3 animate-pulse" />
                  <div className="h-6 bg-[#1a1a1a] rounded w-full mb-2 animate-pulse" />
                  <div className="h-6 bg-[#1a1a1a] rounded w-3/4 mb-3 animate-pulse" />
                  <div className="h-4 bg-[#141414] rounded w-full mb-2 animate-pulse" />
                  <div className="h-4 bg-[#141414] rounded w-5/6 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
