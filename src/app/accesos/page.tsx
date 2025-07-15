import Link from 'next/link';

export default function AccesosHome() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-8">Gestión de Accesos</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-2xl">
        <Link href="/accesos/negocios" className="block p-8 bg-white rounded-lg shadow hover:shadow-lg transition border text-center">
          <h2 className="text-xl font-semibold mb-2">Administrar Negocios</h2>
          <p className="text-gray-600">Gestiona los negocios, genera y visualiza códigos de acceso.</p>
        </Link>
        <Link href="/accesos/links" className="block p-8 bg-white rounded-lg shadow hover:shadow-lg transition border text-center">
          <h2 className="text-xl font-semibold mb-2">Links de Acceso</h2>
          <p className="text-gray-600">Obtén y comparte los links de acceso para los vigilantes.</p>
        </Link>
      </div>
    </div>
  );
} 