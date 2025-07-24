import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import  Skeleton from '@/components/ui/skeleton';
import ReactDOM from 'react-dom';

interface Colaborador {
  id: number;
  nombre: string;
  apellido: string;
  placa?: string;
  cedula?: string;
}

interface CollaboratorSearchProps {
  colaboradores: Colaborador[];
  onSelect: (colaborador: Colaborador) => void;
  initialValue?: string;
  idPuesto: number;
  turnoId: number;
  isSaving?: boolean;
  hasNote?: boolean;
  onContextMenu?: (e: React.MouseEvent) => void;
}

function AutocompletePortal({ children, inputRef }: { children: React.ReactNode; inputRef: React.RefObject<HTMLInputElement> }) {
  const [style, setStyle] = useState<React.CSSProperties>({});
  
  useEffect(() => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setStyle({
        position: 'fixed',
        left: rect.left,
        top: rect.bottom,
        width: rect.width,
        zIndex: 9999,
      });
    }
  }, [inputRef]);
  
  return ReactDOM.createPortal(
    <div style={style} className="bg-white border max-h-40 overflow-y-auto shadow-lg">
      {children}
    </div>,
    document.body
  );
}

export function CollaboratorSearch({
  colaboradores,
  onSelect,
  initialValue = '',
  idPuesto,
  turnoId,
  isSaving = false,
  hasNote = false,
  onContextMenu,
}: CollaboratorSearchProps) {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Colaborador[]>([]);
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const buscarColaboradores = useCallback((texto: string) => {
    if (texto.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    const lower = texto.toLowerCase();
    const results = colaboradores.filter(c =>
      (c.nombre && c.nombre.toLowerCase().includes(lower)) ||
      (c.apellido && c.apellido.toLowerCase().includes(lower)) ||
      (c.placa && c.placa.toLowerCase().includes(lower)) ||
      (c.cedula && c.cedula.toLowerCase().includes(lower)) ||
      (`${c.nombre} ${c.apellido}`.toLowerCase().includes(lower)) ||
      (`${c.apellido} ${c.nombre}`.toLowerCase().includes(lower))
    );
    setSearchResults(results.slice(0, 20));
    setIsSearching(false);
  }, [colaboradores]);

  useEffect(() => {
    buscarColaboradores(searchTerm);
  }, [searchTerm, buscarColaboradores]);

  return (
    <div className="relative" onContextMenu={onContextMenu}>
      <Input
        type="text"
        className={`w-[250px] border rounded px-2 py-3 min-h-[48px] max-h-[200px] resize-none overflow-y-auto whitespace-normal break-words ${hasNote ? 'bg-red-100' : ''} ${isSaving ? 'opacity-50' : ''}`}
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          buscarColaboradores(e.target.value);
        }}
        disabled={isSaving}
        autoComplete="off"
        placeholder="Buscar colaborador..."
        onFocus={() => setIsAutocompleteOpen(true)}
        onBlur={() => setTimeout(() => setIsAutocompleteOpen(false), 150)}
        ref={inputRef}
      />
      {searchTerm && isAutocompleteOpen && inputRef.current && (
        <AutocompletePortal inputRef={inputRef}>
          {isSearching ? (
            <div className="px-3 py-2">
              <Skeleton className="h-6 w-full mb-2" />
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-6 w-1/2" />
            </div>
          ) : searchResults.length > 0 ? (
            searchResults.slice(0, 8).map(c => (
              <div
                key={c.id}
                className="px-3 py-2 hover:bg-blue-100 cursor-pointer"
                onClick={() => {
                  onSelect(c);
                  setSearchTerm(`${c.nombre} ${c.apellido}${c.placa ? ' (' + c.placa + ')' : ''}`);
                }}
              >
                {c.nombre} {c.apellido} {c.placa ? '(' + c.placa + ')' : ''}
              </div>
            ))
          ) : (
            searchTerm.length >= 2 && (
              <div className="px-3 py-2 text-gray-400">Sin resultados</div>
            )
          )}
        </AutocompletePortal>
      )}
    </div>
  );
}