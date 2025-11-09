import { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Star } from 'lucide-react';
import { GameCore } from './GameCore';
import { supabase } from '../lib/supabase';

interface ChallengeSceneProps {
  onBackToMenu: () => void;
}

const CHALLENGE_LEVELS = [1, 6, 11, 16, 21];

export const ChallengeScene = ({ onBackToMenu }: ChallengeSceneProps) => {
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
  const [completedChallenges, setCompletedChallenges] = useState<Set<number>>(new Set());
  const [isPlaying, setIsPlaying] = useState(false);
  const [scores, setScores] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChallengeProgress();
  }, []);

  const loadChallengeProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('scores')
        .select('level_id, score')
        .eq('user_id', user.id)
        .in('level_id', CHALLENGE_LEVELS);

      if (!error && data) {
        const completed = new Set<number>();
        const scoreMap: Record<number, number> = {};

        data.forEach(record => {
          completed.add(record.level_id);
          scoreMap[record.level_id] = record.score;
        });

        setCompletedChallenges(completed);
        setScores(scoreMap);
      }
    } catch (err) {
      console.error('Error loading challenge progress:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChallenge = (index: number) => {
    setCurrentChallengeIndex(index);
    setIsPlaying(true);
  };

  const handleChallengeComplete = async () => {
    await loadChallengeProgress();
    setIsPlaying(false);
  };

  const handleBackFromChallenge = () => {
    setIsPlaying(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 flex items-center justify-center">
        <div className="text-white text-2xl font-bold">Cargando desafíos...</div>
      </div>
    );
  }

  if (isPlaying) {
    return (
      <GameCore
        key={`challenge-${CHALLENGE_LEVELS[currentChallengeIndex]}`}
        level={CHALLENGE_LEVELS[currentChallengeIndex]}
        isDailyChallenge={true}
        onComplete={handleChallengeComplete}
        onBackToMenu={handleBackFromChallenge}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Desafíos Diarios</h2>
              <p className="text-sm text-gray-600">Completa un desafío cada día</p>
            </div>
            <button
              onClick={onBackToMenu}
              className="flex items-center gap-2 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              <ArrowLeft size={18} />
              Volver
            </button>
          </div>

          <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3">
              <Trophy className="text-yellow-600" size={32} />
              <div>
                <div className="text-lg font-bold text-gray-800">
                  {completedChallenges.size} / {CHALLENGE_LEVELS.length}
                </div>
                <div className="text-xs text-gray-600">Desafíos completados</div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {CHALLENGE_LEVELS.map((levelId, index) => {
            const isCompleted = completedChallenges.has(levelId);
            const score = scores[levelId] || 0;
            const isLocked = index > 0 && !completedChallenges.has(CHALLENGE_LEVELS[index - 1]);

            return (
              <div
                key={levelId}
                className={`bg-white rounded-2xl shadow-lg p-6 transition-all ${
                  isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl cursor-pointer'
                }`}
                onClick={() => !isLocked && handleSelectChallenge(index)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${
                      isCompleted
                        ? 'bg-gradient-to-br from-green-400 to-green-600 text-white'
                        : isLocked
                        ? 'bg-gray-300 text-gray-500'
                        : 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white'
                    }`}>
                      {isLocked ? '🔒' : isCompleted ? '✓' : index + 1}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">
                        Desafío {index + 1}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {isLocked ? 'Completa el desafío anterior' : isCompleted ? `Puntuación: ${score}` : 'Sin completar'}
                      </p>
                    </div>
                  </div>
                  {isCompleted && (
                    <div className="flex items-center gap-1">
                      <Star className="text-yellow-500 fill-yellow-500" size={20} />
                      <Star className="text-yellow-500 fill-yellow-500" size={20} />
                      <Star className="text-yellow-500 fill-yellow-500" size={20} />
                    </div>
                  )}
                  {!isLocked && !isCompleted && (
                    <button className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-6 py-2 rounded-lg font-bold hover:shadow-lg transition-all">
                      Jugar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
