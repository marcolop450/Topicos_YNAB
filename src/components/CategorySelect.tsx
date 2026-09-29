import React, { useState, useRef, useEffect } from 'react';
import { FolderPlus, Plus, ChevronDown, Check, Sparkles, X } from 'lucide-react';
import { Category, CategoryGroup, READY_TO_ASSIGN_CATEGORY_ID } from '../types';

interface CategorySelectProps {
  categories: Category[];
  groups: CategoryGroup[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  onCreateCategory: (name: string, groupId: string) => Category;
  onCreateGroup: (name: string) => CategoryGroup;
  showReadyToAssign?: boolean;
  disabled?: boolean;
}

export const CategorySelect: React.FC<CategorySelectProps> = ({
  categories,
  groups,
  selectedCategoryId,
  onSelectCategory,
  onCreateCategory,
  onCreateGroup,
  showReadyToAssign = false,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isCreatingInline, setIsCreatingInline] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer click afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsCreatingInline(false);
        setIsCreatingGroup(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Encontrar nombre de la categoría seleccionada
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const isRTASelected = selectedCategoryId === READY_TO_ASSIGN_CATEGORY_ID;

  // Filtrado de categorías por búsqueda (ocultando categorías archivadas a menos que ya estén seleccionadas)
  const filteredCategories = categories.filter(
    (c) =>
      (!c.isHidden || c.id === selectedCategoryId) &&
      c.name.toLowerCase().includes(search.toLowerCase())
  );

  // Agrupar categorías filtradas por su grupo
  const categoriesByGroup = groups.map((grp) => ({
    group: grp,
    items: filteredCategories.filter((c) => c.groupId === grp.id),
  }));

  const handleStartInlineCreate = () => {
    setNewCatName(search.trim());
    setSelectedGroupId(groups[0]?.id || '');
    setIsCreatingInline(true);
  };

  const handleConfirmInlineCreate = (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!newCatName.trim()) return;

    let targetGroupId = selectedGroupId;

    // Si se está creando un nuevo grupo padre al vuelo
    if (isCreatingGroup && newGroupName.trim()) {
      const createdGroup = onCreateGroup(newGroupName.trim());
      targetGroupId = createdGroup.id;
    }

    if (!targetGroupId) return;

    const createdCategory = onCreateCategory(newCatName.trim(), targetGroupId);
    onSelectCategory(createdCategory.id);
    setIsCreatingInline(false);
    setIsCreatingGroup(false);
    setNewCatName('');
    setNewGroupName('');
    setSearch('');
    setIsOpen(false);
  };

  return (
    <div className={`relative w-full ${isOpen ? 'z-50' : 'z-10'}`} ref={dropdownRef}>
      {/* Botón trigger del selector */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setIsOpen(!isOpen);
          setSearch('');
        }}
        className={`w-full flex items-center justify-between px-3 py-2 bg-white text-slate-900 border rounded-lg text-sm text-left transition-all ${
          isOpen ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-300 hover:border-slate-400'
        } ${disabled ? 'bg-slate-100 cursor-not-allowed text-slate-400' : ''}`}
      >
        <span className="truncate font-medium">
          {isRTASelected ? (
            <span className="text-emerald-700 font-semibold flex items-center">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              Listo para Asignar (Ready to Assign)
            </span>
          ) : selectedCategory ? (
            <span>
              <span className="text-slate-400 text-xs mr-1">
                {groups.find((g) => g.id === selectedCategory.groupId)?.name} /
              </span>
              {selectedCategory.name}
            </span>
          ) : (
            <span className="text-slate-400">Seleccionar categoría...</span>
          )}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-400 ml-2 shrink-0" />
      </button>

      {/* Menú desplegable */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {!isCreatingInline ? (
            <>
              {/* Barra de búsqueda interna */}
              <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                <input
                  type="text"
                  autoFocus
                  placeholder="Buscar o crear categoría..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md outline-none focus:border-blue-500"
                />
              </div>

              <div className="max-h-60 overflow-y-auto p-1 text-sm">
                {/* Opción Listo para Asignar si está habilitada */}
                {showReadyToAssign && (
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onSelectCategory(READY_TO_ASSIGN_CATEGORY_ID);
                      setSearch('');
                      setIsOpen(false);
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onSelectCategory(READY_TO_ASSIGN_CATEGORY_ID);
                      setSearch('');
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-emerald-700 hover:bg-emerald-50 font-medium transition-colors ${
                      isRTASelected ? 'bg-emerald-50' : ''
                    }`}
                  >
                    <span className="flex items-center">
                      <Sparkles className="w-4 h-4 mr-2 text-emerald-600" />
                      Listo para Asignar (Ready to Assign)
                    </span>
                    {isRTASelected && <Check className="w-4 h-4 text-emerald-600" />}
                  </button>
                )}

                {/* Categorías agrupadas */}
                {categoriesByGroup.map(
                  ({ group, items }) =>
                    items.length > 0 && (
                      <div key={group.id} className="mb-2">
                        <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          {group.name}
                        </div>
                        {items.map((cat) => {
                          const isSelected = cat.id === selectedCategoryId;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onSelectCategory(cat.id);
                                setSearch('');
                                setIsOpen(false);
                              }}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onSelectCategory(cat.id);
                                setSearch('');
                                setIsOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-left text-slate-700 hover:bg-slate-100 transition-colors ${
                                isSelected ? 'bg-blue-50 text-blue-700 font-semibold' : ''
                              }`}
                            >
                              <span>{cat.name}</span>
                              {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                            </button>
                          );
                        })}
                      </div>
                    )
                )}

                {filteredCategories.length === 0 && !showReadyToAssign && (
                  <div className="p-3 text-center text-xs text-slate-400">
                    No se encontraron categorías
                  </div>
                )}
              </div>

              {/* Botón de Creación In-Line al fondo */}
              <div className="p-2 border-t border-slate-100 bg-slate-50">
                <button
                  type="button"
                  onClick={handleStartInlineCreate}
                  className="w-full flex items-center justify-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>
                    Crear nueva categoría {search ? `"${search}"` : ''}
                  </span>
                </button>
              </div>
            </>
          ) : (
            /* Formulario In-Line para Crear Categoría y/o Grupo Padre */
            <div className="p-3 bg-white space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center">
                  <FolderPlus className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                  Nueva Categoría In-Line
                </h4>
                <button
                  type="button"
                  onClick={() => setIsCreatingInline(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nombre de la Categoría:
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder="ej. Gimnasio, Netflix..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.stopPropagation();
                      handleConfirmInlineCreate();
                    }
                  }}
                  className="w-full px-2.5 py-1.5 text-xs border rounded-md outline-none focus:border-blue-500"
                />
              </div>

              {!isCreatingGroup ? (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-600">
                      Grupo Padre:
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCreatingGroup(true)}
                      className="text-[11px] text-blue-600 font-semibold hover:underline"
                    >
                      + Nuevo Grupo
                    </button>
                  </div>
                  <select
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border rounded-md outline-none bg-white focus:border-blue-500"
                  >
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="p-2 bg-blue-50/50 border border-blue-100 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-blue-800">
                      Nombre del Nuevo Grupo:
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCreatingGroup(false)}
                      className="text-[11px] text-slate-500 hover:underline"
                    >
                      Elegir existente
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="ej. Salud y Bienestar"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                        handleConfirmInlineCreate();
                      }
                    }}
                    className="w-full px-2.5 py-1.5 text-xs border border-blue-200 rounded-md outline-none bg-white focus:border-blue-500"
                  />
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCreatingInline(false)}
                  className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-md"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleConfirmInlineCreate();
                  }}
                  className="px-3 py-1 text-xs bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Guardar y Seleccionar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
