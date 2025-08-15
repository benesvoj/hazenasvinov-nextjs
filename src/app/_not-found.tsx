import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Stránka nenalezena</h2>
          <p className="text-gray-500 mb-8">
            Omlouváme se, ale požadovaná stránka nebyla nalezena.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link 
            href="/"
            className="inline-block w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Zpět na hlavní stránku
          </Link>
          
          <Link 
            href="/contact"
            className="inline-block w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors duration-200"
          >
            Kontaktujte nás
          </Link>
        </div>
      </div>
    </div>
  );
}
