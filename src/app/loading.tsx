export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-red-500"></div>
        </div>
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 bg-clip-text text-transparent">
          🔥 Loading Heavy Content...
        </h1>
        <p className="text-xl text-gray-400">
          Server is processing your request...
        </p>
        <div className="mt-6 space-y-2">
          <div className="h-2 bg-gray-700 rounded w-64 mx-auto">
            <div className="h-2 bg-gradient-to-r from-red-500 to-blue-500 rounded animate-pulse"></div>
          </div>
          <p className="text-sm text-gray-500">Preparing server-side content</p>
        </div>
      </div>
    </div>
  );
}
