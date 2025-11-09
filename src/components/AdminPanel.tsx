import { useState, useEffect } from 'react';
import { X, Lock, Unlock } from 'lucide-react';
import { supabase, getOrCreateClientId } from '../lib/supabase';
import { unlockWorld, getUnlockedWorlds } from '../lib/worldProgress';

interface AdminPanelProps {
  onClose: () => void;
}

export const AdminPanel = ({ onClose }: AdminPanelProps) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unlockedWorlds, setUnlockedWorlds] = useState<number[]>([]);

  useEffect(() => {
    checkAdminStatus();
    loadUnlockedWorlds();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const clientId = getOrCreateClientId();
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('client_id', clientId)
        .maybeSingle();

      if (!error && data?.is_admin) {
        setIsAdmin(true);
      }
    } catch (err) {
      console.error('Error checking admin status:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUnlockedWorlds = async () => {
    const worlds = await getUnlockedWorlds();
    setUnlockedWorlds(worlds);
  };

  const handleUnlockWorld = async (worldId: number) => {
    await unlockWorld(worldId);
    await loadUnlockedWorlds();
  };

  const handleUnlockAll = async () => {
    for (let i = 1; i <= 10; i++) {
      await unlockWorld(i);
    }
    await loadUnlockedWorlds();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
          <div className="text-center">Verificando permisos...</div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Acceso Denegado</h3>
            <p className="text-sm text-gray-600 mb-4">
              No tienes permisos de administrador
            </p>
            <button
              onClick={onClose}
              className="w-full bg-gray-200 text-gray-800 py-3 rounded-xl font-bold hover:bg-gray-300 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">Panel Admin</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-4 mb-4">
          <div className="text-sm font-semibold text-purple-800 mb-2">
            Desbloquear Mundos
          </div>
          <p className="text-xs text-purple-600">
            Usa este panel para probar diferentes mundos sin completar niveles
          </p>
        </div>

        <div className="space-y-2 mb-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((worldId) => {
            const isUnlocked = unlockedWorlds.includes(worldId);
            return (
              <button
                key={worldId}
                onClick={() => handleUnlockWorld(worldId)}
                className={`w-full flex items-center justify-between p-3 rounded-xl font-semibold transition-all ${
                  isUnlocked
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>Mundo {worldId}</span>
                {isUnlocked ? (
                  <Unlock size={18} className="text-green-600" />
                ) : (
                  <Lock size={18} className="text-gray-400" />
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleUnlockAll}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all"
        >
          Desbloquear Todos
        </button>
      </div>
    </div>
  );
};
