import Link from 'next/link';
import { Shield, Key, Users, Building2 } from 'lucide-react';

export default function AccesosHome() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-6">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Gestión de Accesos</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Administra los códigos de acceso y links para los vigilantes de manera segura y eficiente
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Administrar Negocios Card */}
        <Link 
          href="/accesos/negocios" 
          className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div className="text-blue-600 group-hover:text-blue-700 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Administrar Negocios</h2>
            <p className="text-gray-600 leading-relaxed">
              Gestiona los negocios, genera códigos de acceso únicos y controla el estado de los accesos de manera centralizada.
            </p>
            <div className="mt-6 flex items-center text-blue-600 font-medium">
              <span>Gestionar códigos</span>
              <Key className="w-4 h-4 ml-2" />
            </div>
          </div>
        </Link>

        {/* Links de Acceso Card */}
        <Link 
          href="/accesos/links" 
          className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-green-600/5 to-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="text-green-600 group-hover:text-green-700 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Links de Acceso</h2>
            <p className="text-gray-600 leading-relaxed">
              Obtén y comparte los links de acceso personalizados para que los vigilantes puedan ingresar de forma segura.
            </p>
            <div className="mt-6 flex items-center text-green-600 font-medium">
              <span>Ver links</span>
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </div>
          </div>
        </Link>
      </div>

      {/* Stats Section */}
      <div className="mt-16 max-w-4xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">Funcionalidades Principales</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Key className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Códigos Seguros</h4>
              <p className="text-sm text-gray-600">Generación automática de códigos únicos y seguros</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Control de Acceso</h4>
              <p className="text-sm text-gray-600">Gestión centralizada de permisos y accesos</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Links Personalizados</h4>
              <p className="text-sm text-gray-600">URLs únicas para cada negocio y vigilante</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 