import { useState, useEffect, useRef, useCallback } from 'react';
import { RotateCcw, Share2, Trophy, List, ArrowLeft } from 'lucide-react';
import { GameCard } from './GameCard';
import { Leaderboard } from './Leaderboard';
import { PowerUpButtons } from './PowerUpButtons';
import { CoinShop } from './CoinShop';
import { ExitConfirmModal } from './ExitConfirmModal';
import { SoundGear } from './SoundGear';
import { ShareModal } from './ShareModal';
import { Card, PREVIEW_TIME, FLIP_DELAY, GameMetrics, BestScore } from '../types';
import { createConfetti } from '../utils/confetti';
import { getSeedFromURLorToday, shuffleWithSeed } from '../lib/seed';
import { submitScoreAndReward, getCrewIdFromURL, setCrewIdInURL } from '../lib/api';
import { addCoins } from '../lib/progression';
import { getLevelConfig } from '../lib/levels';
import { getThemeImages } from '../lib/themes';
import { soundManager } from '../lib/sound';
import { useBackExitGuard } from '../hooks/useBackExitGuard';

interface GameCoreProps {
  level: number;
  onComplete: () => void;
  onBackToMenu: () => void;
  isDailyChallenge?: boolean;
  // removed custom photo feature
}

export const GameCore = ({ level, onComplete, onBackToMenu, isDailyChallenge = false }: GameCoreProps) => {
  const levelConfig = getLevelConfig(level);
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [isPreview, setIsPreview] = useState(true);
  const [timeLeft, setTimeLeft] = useState(levelConfig?.timeLimit || 60);
  const [gameOver, setGameOver] = useState(false);
  const [moves, setMoves] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showWinModal, setShowWinModal] = useState(false);
  const [bestScore, setBestScore] = useState<BestScore | null>(null);
  const [seed] = useState(() => isDailyChallenge ? getSeedFromURLorToday() : `random-${Date.now()}`);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [isPioneer, setIsPioneer] = useState(false);
  const [crewId, setCrewId] = useState(() => getCrewIdFromURL());
  const [finalTime, setFinalTime] = useState(0);
  const [finalMoves, setFinalMoves] = useState(0);
  const [hintCards, setHintCards] = useState<number[]>([]);
  const [consecutiveMisses, setConsecutiveMisses] = useState(0);
  const [powerUpUsed, setPowerUpUsed] = useState(false);
  const [showCoinShop, setShowCoinShop] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareData, setShareData] = useState({ text: '', url: '' });

  const handleExitConfirmed = useCallback(() => {
    soundManager.stopLevelMusic();
    onBackToMenu();
  }, [onBackToMenu]);

  const { open: exitModalOpen, openModal: openExitModal, closeModal: closeExitModal } = useBackExitGuard({
    enabled: !showWinModal && !gameOver,
    onConfirmExit: handleExitConfirmed,
    isLevelCompleted: showWinModal,
  });

  const isCheckingRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const previewTimerRef = useRef<number | null>(null);
  const elapsedTimerRef = useRef<number | null>(null);
  const gameStartTimeRef = useRef<number>(0);
  const hintTimeoutRef = useRef<number | null>(null);

  const initializeLevel = useCallback(() => {
    console.log('[GameCore] initializeLevel', { level, seed });

    const config = getLevelConfig(level);
    const pairs = config?.pairs || 6;
    const timeLimit = config?.timeLimit || 60;
    const theme = config?.theme || 'nature';

    const themeImages = getThemeImages(theme);
    const selectedImages = themeImages.slice(0, pairs);

    const cardPairs = selectedImages.flatMap((img, idx) => [
      { id: idx * 2, imageIndex: idx, isFlipped: false, isMatched: false },
      { id: idx * 2 + 1, imageIndex: idx, isFlipped: false, isMatched: false },
    ]);

    const shuffled = isDailyChallenge ? shuffleWithSeed(cardPairs, seed) : cardPairs.sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setFlippedCards([]);
    setMatchedPairs(0);
    setIsPreview(true);
    setGameOver(false);
    setTimeLeft(timeLimit);
    setMoves(0);
    setTimeElapsed(0);
    setShowWinModal(false);
    setHintCards([]);
    setConsecutiveMisses(0);
    setPowerUpUsed(false);
    gameStartTimeRef.current = 0;

    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    previewTimerRef.current = window.setTimeout(() => {
      setIsPreview(false);
    }, PREVIEW_TIME * 1000);
    if (isDailyChallenge) {
      const stored = localStorage.getItem(`best:${seed}`);
      if (stored) {
        try {
          setBestScore(JSON.parse(stored));
        } catch (e) {
          setBestScore(null);
        }
      } else {
        setBestScore(null);
      }
    }
  }, [level, seed, isDailyChallenge]);

  useEffect(() => {
    console.log('[GameCore] mount for level', level);
    initializeLevel();

    return () => {
      console.log('[GameCore] unmount for level', level);
      if (timerRef.current) clearInterval(timerRef.current);
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
    };
  }, [level, initializeLevel]);

  useEffect(() => {
    if (isPreview || gameOver) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
      return;
    }

    if (gameStartTimeRef.current === 0) {
      gameStartTimeRef.current = Date.now();
    }

    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
          soundManager.playLose();
          setGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    elapsedTimerRef.current = window.setInterval(() => {
      setTimeElapsed(Math.floor((Date.now() - gameStartTimeRef.current) / 1000));
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    };
  }, [isPreview, gameOver]);

  useEffect(() => {
    const totalPairs = levelConfig?.pairs || 6;
    if (matchedPairs === totalPairs && matchedPairs > 0) {
      console.log('[GameCore] LEVEL COMPLETED', { level, matchedPairs, moves, timeElapsed });
      if (timerRef.current) clearInterval(timerRef.current);
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
      createConfetti();
      soundManager.playWin();

      if (isDailyChallenge) {
        const finalTimeValue = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
        setTimeElapsed(finalTimeValue);
        setFinalTime(finalTimeValue);
        setFinalMoves(moves);

        const stored = localStorage.getItem(`best:${seed}`);
        let shouldSave = true;
        if (stored) {
          try {
            const prev: BestScore = JSON.parse(stored);
            if (finalTimeValue > prev.time || (finalTimeValue === prev.time && moves >= prev.moves)) {
              shouldSave = false;
            }
          } catch (e) {
            //
          }
        }

        if (shouldSave) {
          const newBest: BestScore = { time: finalTimeValue, moves, date: new Date().toISOString() };
          localStorage.setItem(`best:${seed}`, JSON.stringify(newBest));
          setBestScore(newBest);
        }

        submitScoreAndReward({ seed, timeMs: finalTimeValue * 1000, moves, crewId }).then((result) => {
          if (result.isPioneer) {
            setIsPioneer(true);
          }
        }).catch((err) => {
          console.error('[GameCore] Failed to submit score:', err);
        });

        addCoins(10);

        setShowWinModal(true);
      } else {
        addCoins(10);
        onComplete();
      }
    }
  }, [matchedPairs, level, onComplete, isDailyChallenge, moves, seed, timeElapsed]);

  const handleCardClick = useCallback((id: number) => {
    if (isPreview || isCheckingRef.current || flippedCards.length >= 2) return;

    const card = cards.find((c) => c.id === id);
    if (!card || card.isMatched || flippedCards.includes(id)) return;

    const newFlipped = [...flippedCards, id];
    setFlippedCards(newFlipped);

    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isFlipped: true } : c))
    );

    if (newFlipped.length === 2) {
      isCheckingRef.current = true;
      setMoves((prev) => prev + 1);

      const [firstId, secondId] = newFlipped;
      const firstCard = cards.find((c) => c.id === firstId);
      const secondCard = cards.find((c) => c.id === secondId);

      if (firstCard && secondCard && firstCard.imageIndex === secondCard.imageIndex) {
        soundManager.playMatch();
        setCards((prev) =>
          prev.map((c) =>
            c.id === firstId || c.id === secondId ? { ...c, isMatched: true } : c
          )
        );
        setMatchedPairs((prev) => prev + 1);
        setFlippedCards([]);
        setConsecutiveMisses(0);
        setHintCards([]);
        isCheckingRef.current = false;
      } else {
        setConsecutiveMisses((prev) => prev + 1);
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === firstId || c.id === secondId
                ? { ...c, isFlipped: false }
                : c
            )
          );
          setFlippedCards([]);
          isCheckingRef.current = false;
        }, FLIP_DELAY);
      }
    }
  }, [cards, flippedCards, isPreview]);

  useEffect(() => {
    if (consecutiveMisses >= 4 && !isPreview && !gameOver && hintCards.length === 0) {
      const unmatchedCards = cards.filter(c => !c.isMatched && !c.isFlipped);

      if (unmatchedCards.length >= 2) {
        const imageIndexes = new Map<number, number[]>();
        unmatchedCards.forEach(card => {
          if (!imageIndexes.has(card.imageIndex)) {
            imageIndexes.set(card.imageIndex, []);
          }
          imageIndexes.get(card.imageIndex)!.push(card.id);
        });

        for (const [, cardIds] of imageIndexes) {
          if (cardIds.length >= 2) {
            const [first, second] = cardIds.slice(0, 2);
            setHintCards([first, second]);

            if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
            hintTimeoutRef.current = window.setTimeout(() => {
              setHintCards([]);
            }, 3000);

            break;
          }
        }
      }
    }
  }, [consecutiveMisses, isPreview, gameOver, cards, hintCards.length]);

  const handlePowerUp = useCallback((percentage: number) => {
    const unmatchedCards = cards.filter(c => !c.isMatched);
    const totalPairs = unmatchedCards.length / 2;
    const pairsToReveal = Math.max(1, Math.floor(totalPairs * (percentage / 100)));

    const pairsByImage = new Map<number, number[]>();
    unmatchedCards.forEach(card => {
      if (!pairsByImage.has(card.imageIndex)) {
        pairsByImage.set(card.imageIndex, []);
      }
      pairsByImage.get(card.imageIndex)!.push(card.id);
    });

    const availablePairs = Array.from(pairsByImage.entries()).filter(([, ids]) => ids.length === 2);
    const pairsToMatch = availablePairs.slice(0, pairsToReveal);

    const cardIdsToMatch: number[] = [];
    pairsToMatch.forEach(([, ids]) => {
      cardIdsToMatch.push(...ids);
    });

    setCards(prev => prev.map(c => {
      if (cardIdsToMatch.includes(c.id)) {
        return { ...c, isFlipped: true, isMatched: true };
      }
      return c;
    }));

    setMatchedPairs(prev => prev + pairsToMatch.length);
    setPowerUpUsed(true);
    createConfetti();
  }, [cards]);

  const handleRestart = useCallback(() => {
    initializeLevel();
  }, [initializeLevel]);

  const handleShare = useCallback(() => {
    let shareText: string;
    let shareUrl: string;

    if (isDailyChallenge) {
      const url = new URL(window.location.href);
      url.searchParams.set('seed', seed);
      url.searchParams.set('time', finalTime.toString());
      url.searchParams.set('moves', finalMoves.toString());

      let currentCrewId = crewId;
      if (!currentCrewId) {
        const newCrewId = crypto.randomUUID().slice(0, 8);
        url.searchParams.set('crew', newCrewId);
        setCrewIdInURL(newCrewId);
        setCrewId(newCrewId);
        currentCrewId = newCrewId;
      } else {
        url.searchParams.set('crew', currentCrewId);
      }

      shareUrl = url.toString();
      shareText = `¡Completé el reto diario en ${finalTime}s con ${finalMoves} movimientos! ¿Puedes superarme?`;
    } else {
      shareUrl = window.location.origin;
      shareText = `¡Completé el Nivel ${level} en ${finalTime}s con ${finalMoves} movimientos! 🎉 Juega TwinClash y pon a prueba tu memoria.`;
    }

    setShareData({ text: shareText, url: shareUrl });
    setShowShareModal(true);
  }, [seed, finalTime, finalMoves, crewId, isDailyChallenge, level]);

  const config = getLevelConfig(level);
  const theme = config?.theme || 'nature';
  const themeImages = getThemeImages(theme);
  const pairs = config?.pairs || 6;
  const selectedImages = themeImages.slice(0, pairs);
  const timeLimit = config?.timeLimit || 60;

  const getGridColumns = () => {
    if (pairs <= 10) return 4;
    if (pairs <= 12) return 4;
    if (pairs <= 15) return 5;
    return 6;
  };

  const gridCols = getGridColumns();

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500">
      <div className="flex-shrink-0 bg-white shadow-md px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-gray-800">
              {isDailyChallenge ? 'Reto' : `Nivel ${level}`}
            </h2>
            {isDailyChallenge && bestScore && (
              <span className="flex items-center gap-1 text-xs text-gray-600">
                <Trophy size={12} className="text-yellow-500" />
                {bestScore.time}s
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <SoundGear />
            <div className={`text-lg font-bold ${timeLeft <= 10 ? 'text-red-600 animate-pulse' : 'text-blue-600'}`}>
              {isPreview ? `${Math.max(0, Math.ceil(timeLeft - (timeLimit - PREVIEW_TIME)))}s` : `${timeLeft}s`}
            </div>
          </div>
        </div>
        {isDailyChallenge && (
          <div className="flex gap-3 text-xs font-semibold text-gray-600">
            <span>{timeElapsed}s</span>
            <span>{moves} mov</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-transparent p-2" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="flex items-center justify-center min-h-full">
          <div
            className="grid gap-2 justify-center mx-auto"
            style={{
              gridTemplateColumns: `repeat(${gridCols}, minmax(60px, 70px))`
            }}
          >
            {cards.map((card) => (
              <GameCard
                key={card.id}
                card={{ ...card, isFlipped: isPreview || card.isFlipped }}
                image={selectedImages[card.imageIndex]}
                onClick={handleCardClick}
                disabled={isPreview || isCheckingRef.current}
                showHint={hintCards.includes(card.id)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 bg-white border-t border-gray-200 px-3 py-2 sticky bottom-0 z-50">
        <div className="flex gap-2 mb-2">
          <button
            onClick={openExitModal}
            className="bg-gray-500 text-white py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 hover:bg-gray-600 transition-colors touch-manipulation"
          >
            <ArrowLeft size={14} />
            Salir
          </button>
          <button
            onClick={handleRestart}
            className="flex-1 bg-orange-500 text-white py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 hover:bg-orange-600 transition-colors touch-manipulation"
          >
            <RotateCcw size={14} />
            Reiniciar
          </button>
          {isDailyChallenge && (
            <button
              onClick={() => setShowLeaderboard(true)}
              className="flex-1 bg-yellow-500 text-white py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 hover:bg-yellow-600 transition-colors touch-manipulation"
            >
              <List size={14} />
              Top
            </button>
          )}
        </div>

        {!isDailyChallenge && (
          <div className="border-t border-gray-200 pt-2">
            <div className="text-xs text-gray-600 font-semibold mb-1 text-center">
              💡 Ayuda
            </div>
            <PowerUpButtons
              onPowerUpUsed={handlePowerUp}
              disabled={isPreview || gameOver || powerUpUsed}
            />
            {powerUpUsed && (
              <div className="text-xs text-center text-green-600 font-semibold mt-1">
                ✅ Usada
              </div>
            )}
            <button
              onClick={() => setShowCoinShop(true)}
              className="w-full mt-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-2 px-3 rounded-lg font-bold text-xs shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-1 touch-manipulation"
            >
              💰 Comprar
            </button>
          </div>
        )}
      </div>

      {gameOver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="text-6xl mb-4">😢</div>
            <h3 className="text-3xl font-bold text-red-600 mb-2">Game Over</h3>
            <p className="text-gray-600 mb-6">Se acabó el tiempo</p>
            <div className="flex gap-3">
              <button
                onClick={onBackToMenu}
                className="flex-1 bg-gray-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
              >
                Salir
              </button>
              <button
                onClick={handleRestart}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      )}

      {showWinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-3xl font-bold text-green-600 mb-4">¡Completado!</h3>

            {isPioneer && (
              <div className="bg-gradient-to-r from-yellow-400 to-amber-500 rounded-xl p-4 mb-4">
                <div className="text-3xl mb-2">🏆</div>
                <div className="text-white font-bold text-lg">¡Medalla Pionero!</div>
                <div className="text-yellow-100 text-sm">+20 monedas por ser el primero</div>
              </div>
            )}

            <div className="bg-gray-100 rounded-xl p-4 mb-6">
              <div className="flex justify-around text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{finalTime}s</div>
                  <div className="text-xs text-gray-600">Tiempo</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{finalMoves}</div>
                  <div className="text-xs text-gray-600">Movimientos</div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleShare}
                className="flex-1 bg-blue-500 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors"
              >
                <Share2 size={18} />
                Compartir
              </button>
              <button
                onClick={handleRestart}
                className="flex-1 bg-green-500 text-white py-3 rounded-xl font-semibold hover:bg-green-600 transition-colors"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      )}

      {showLeaderboard && (
        <Leaderboard
          seed={seed}
          onClose={() => setShowLeaderboard(false)}
          onPlayNow={() => {
            setShowLeaderboard(false);
            handleRestart();
          }}
        />
      )}

      {showCoinShop && (
        <CoinShop
          onClose={() => setShowCoinShop(false)}
        />
      )}

      <ExitConfirmModal
        open={exitModalOpen}
        onStay={closeExitModal}
        onExit={handleExitConfirmed}
      />

      <ShareModal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareText={shareData.text}
        shareUrl={shareData.url}
      />
    </div>
  );
};
