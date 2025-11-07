import { useState, useEffect } from 'react';
import { Lock, Trophy, Leaf, Dumbbell, Gamepad2, PawPrint, Rocket, Coins, Waves, Pizza, Music, Sparkles, Cpu } from 'lucide-react';
import { canEnterWorld, isWorldCompleted, purchaseWorld, ensureWorld, WORLD_COSTS } from '../lib/worldProgress';
import { getLocalCoins } from '../lib/progression';

const worldIcons = [Leaf, Dumbbell, Gamepad2, PawPrint, Rocket, Waves, Pizza, Music, Sparkles, Cpu];
const worldNames = ['Naturaleza', 'Deportes', 'Juegos', 'Animales', 'Espacio', 'Océano', 'Comida', 'Música', 'Belleza', 'Tecnología'];
const worldColors = [
  { from: 'from-emerald-500', to: 'to-green-700' },
  { from: 'from-yellow-500', to: 'to-orange-700' },
  { from: 'from-purple-500', to: 'to-pink-700' },
  { from: 'from-orange-500', to: 'to-red-700' },
  { from: 'from-indigo-500', to: 'to-blue-700' },
  { from: 'from-cyan-500', to: 'to-teal-700' },
  { from: 'from-red-500', to: 'to-pink-700' },
  { from: 'from-violet-500', to: 'to-purple-700' },
  { from: 'from-fuchsia-500', to: 'to-pink-700' },
  { from: 'from-slate-500', to: 'to-gray-700' },
];

interface WorldMapProps {
  currentWorld: number;
  currentLevel: number;
  worldsCompleted: number;
  onSelectWorld: (world: number) => void;
  onBackToMenu: () => void;
}

export function WorldMap({ currentWorld, currentLevel, worldsCompleted, onSelectWorld, onBackToMenu }: WorldMapProps) {
  const [worldAccess, setWorldAccess] = useState<Record<number, boolean>>({ 1: true });
  const [worldsComplete, setWorldsComplete] = useState<Record<number, boolean>>({});
  const [coins, setCoins] = useState(0);
  const [purchaseModalWorld, setPurchaseModalWorld] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadWorldStates = async () => {
      const access: Record<number, boolean> = { 1: true };
      const complete: Record<number, boolean> = {};

      for (let i = 1; i <= 10; i++) {
        ensureWorld(`world-${i}`, 5);

        if (i > 1) {
          canEnterWorld(`world-${i}`).then(canEnter => {
            setWorldAccess(prev => ({ ...prev, [i]: canEnter }));
          });
        }

        isWorldCompleted(`world-${i}`).then(completed => {
          setWorldsComplete(prev => ({ ...prev, [i]: completed }));
        });
      }

      setCoins(getLocalCoins());
    };

    loadWorldStates();
  }, []);

  const handleWorldClick = async (worldId: number) => {
    if (worldId === 1 || worldAccess[worldId]) {
      onSelectWorld(worldId);
      return;
    }

    setPurchaseModalWorld(worldId);
  };

  const handlePurchaseWorld = async () => {
    if (!purchaseModalWorld) return;

    setLoading(true);
    const worldKey = `world-${purchaseModalWorld}` as keyof typeof WORLD_COSTS;
    const cost = WORLD_COSTS[worldKey];
    const result = await purchaseWorld(worldKey, cost);

    if (result.ok) {
      setWorldAccess({ ...worldAccess, [purchaseModalWorld]: true });
      setCoins(getLocalCoins());
      setPurchaseModalWorld(null);
      onSelectWorld(purchaseModalWorld);
    } else {
      alert(result.reason);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-400 via-blue-500 to-indigo-700 p-6">
      <button
        onClick={onBackToMenu}
        className="mb-6 text-white flex items-center gap-2 font-semibold text-lg hover:scale-105 transition-transform"
      >
        ← Volver
      </button>

      <h1 className="text-4xl font-bold text-white text-center mb-3">Elige tu Mundo</h1>
      <p className="text-white/80 text-center mb-10 text-lg">10 Mundos · 50 Niveles · Aventura Épica</p>

      <div className="grid grid-cols-1 gap-6 max-w-md mx-auto">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((worldId) => {
          const isUnlocked = worldAccess[worldId] ?? false;
          const Icon = worldIcons[worldId - 1];
          const colors = worldColors[worldId - 1];
          const isCurrent = currentWorld === worldId;
          const isCompleted = worldsComplete[worldId] ?? false;

          return (
            <button
              key={worldId}
              onClick={() => handleWorldClick(worldId)}
              className={`relative p-6 rounded-3xl shadow-2xl transition-all transform ${
                isUnlocked
                  ? `bg-gradient-to-br ${colors.from} ${colors.to} hover:scale-105 active:scale-95`
                  : 'bg-gray-700 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Icon size={32} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-2xl font-bold">Mundo {worldId}</h3>
                    <p className="text-sm opacity-90">{worldNames[worldId - 1]}</p>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  {isCompleted ? (
                    <>
                      <Trophy className="text-yellow-300" size={28} />
                      <span className="text-xs bg-yellow-300/20 px-2 py-0.5 rounded-full">
                        Completado
                      </span>
                    </>
                  ) : !isUnlocked ? (
                    <Lock size={28} />
                  ) : null}
                </div>
              </div>

              {isCurrent && !isCompleted && (
                <div className="mt-3 text-sm bg-white/20 rounded-lg px-3 py-1.5 inline-block backdrop-blur-sm">
                  📍 Nivel actual: {currentLevel} / 5
                </div>
              )}
            </button>
          );
        })}
      </div>

      {purchaseModalWorld && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="text-6xl mb-4">🔓</div>
            <h3 className="text-3xl font-bold text-gray-800 mb-2">
              Desbloquear Mundo {purchaseModalWorld}
            </h3>
            <p className="text-gray-600 mb-4">
              {worldNames[purchaseModalWorld - 1]}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Al desbloquear este mundo, podrás jugar el nivel 1. Los demás niveles se desbloquean jugando.
            </p>

            <div className="bg-gradient-to-r from-yellow-400 to-amber-500 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-center gap-2">
                <Coins size={24} className="text-white" />
                <span className="text-2xl font-bold text-white">
                  {WORLD_COSTS[`world-${purchaseModalWorld}` as keyof typeof WORLD_COSTS]}
                </span>
              </div>
              <div className="text-xs text-white/80 mt-1">
                Tienes: {coins} monedas
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPurchaseModalWorld(null)}
                disabled={loading}
                className="flex-1 bg-gray-500 text-white py-3 rounded-xl font-semibold hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handlePurchaseWorld}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
              >
                {loading ? 'Desbloqueando...' : 'Desbloquear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
