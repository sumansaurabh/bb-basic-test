import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-4xl font-bold mb-4 text-yellow-500">
          404 - Page Not Found
        </h1>
        <p className="text-xl text-gray-400 mb-6">
          The load testing page you&apos;re looking for doesn&apos;t exist
        </p>
        <Link
          href="/"
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold text-white transition-colors inline-block"
        >
          🏠 Go to Load Test Home
        </Link>
      </div>
    </div>
  );
}
