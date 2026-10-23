import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

interface AutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelectItem?: (item: any | null) => void;
  fetchData?: () => Promise<any[]>;
  data?: any[];
  selectedItemFallback?: any;
  displayField: string | ((item: any) => string);
  searchFields: string[];
  placeholder?: string;
  label?: string;
  idField?: string;
}

export default function Autocomplete({
  value,
  onChange,
  onSelectItem,
  fetchData,
  data,
  selectedItemFallback,
  displayField,
  searchFields,
  placeholder = "Buscar...",
  label,
  idField = "id"
}: AutocompleteProps) {
  const [items, setItems] = useState<any[]>(data || []);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (Array.isArray(data) && data.length > 0) {
      setItems(data);
      return;
    }
    if (!fetchData) {
      if (Array.isArray(data)) setItems(data);
      return;
    }
    const loadData = async () => {
      setLoading(true);
      try {
        const res = await fetchData();
        setItems(res || []);
      } catch (err) {
        console.error("Error fetching data for autocomplete:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [data, fetchData]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getItemId = (item: any) =>
    item ? (item[idField] || item.id || item.vehicle_id || item.client_id || item._id || "") : "";

  const selectedItem = useMemo(() => {
    if (!value) return null;
    const found = items.find((i) => getItemId(i) === value || String(i[idField]) === String(value));
    if (found) return found;
    if (selectedItemFallback && (getItemId(selectedItemFallback) === value || String(selectedItemFallback[idField]) === String(value))) {
      return selectedItemFallback;
    }
    return null;
  }, [items, value, idField, selectedItemFallback]);

  const filteredItems = useMemo(() => {
    if (!searchTerm) return items;
    return items.filter((item) => {
      return searchFields.some((field) => {
        const val = item[field];
        return val && String(val).toLowerCase().includes(searchTerm.toLowerCase());
      });
    });
  }, [items, searchTerm, searchFields]);

  const getLabel = (item: any) => {
    if (!item) return "";
    return typeof displayField === "function" ? displayField(item) : item[displayField];
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      {label && <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>}
      <div 
        className={`relative flex items-center w-full px-4 py-2.5 border-2 rounded-xl transition cursor-pointer bg-white ${isOpen ? 'border-primary/50 ring-2 ring-primary/30' : 'border-gray-200'}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex-1 truncate">
          {selectedItem ? (
            <span className="text-sm font-medium text-gray-800">{getLabel(selectedItem)}</span>
          ) : (
            <span className="text-sm text-gray-400">{placeholder}</span>
          )}
        </div>
        
        {selectedItem && (
          <button 
            type="button"
            className="p-1 hover:bg-gray-100 rounded-full mr-1 transition"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
              onSelectItem?.(null);
              setSearchTerm("");
            }}
          >
            <X size={14} className="text-gray-400 hover:text-gray-600" />
          </button>
        )}
        <ChevronDown size={18} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-lg border border-gray-100 max-h-60 overflow-hidden flex flex-col">
          <div className="p-3 border-b border-gray-50 flex items-center gap-2 bg-gray-50/50">
            <Search size={16} className="text-gray-400" />
            <input
              type="text"
              autoFocus
              className="w-full bg-transparent outline-none text-sm"
              placeholder="Escribe para buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="overflow-y-auto flex-1 p-1">
            {loading ? (
              <div className="p-4 text-center text-sm text-gray-400">Cargando...</div>
            ) : filteredItems.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-400">No se encontraron resultados</div>
            ) : (
              filteredItems.map((item) => {
                const itemId = getItemId(item);
                const isSelected = value === itemId || String(item[idField]) === String(value);
                return (
                  <div
                    key={itemId || Math.random().toString()}
                    className={`px-3 py-2.5 rounded-lg text-sm cursor-pointer transition ${isSelected ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-gray-50 text-gray-700'}`}
                    onClick={() => {
                      onChange(itemId);
                      onSelectItem?.(item);
                      setIsOpen(false);
                      setSearchTerm("");
                    }}
                  >
                    {getLabel(item)}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
