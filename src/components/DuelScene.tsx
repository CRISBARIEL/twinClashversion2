import { useState, useEffect, useRef, useCallback } from 'react';
import { Trophy, Clock, Users, ArrowLeft } from 'lucide-react';
import { GameCard } from './GameCard';
import { DuelInvitePanel } from './DuelInvitePanel';
import { Card } from '../types';
import { getImagesForLevel } from '../utils/imageManager';
import { prng } from '../lib/seed';
// removed custom photo feature
import { getOrCreateClientId } from '../lib/supabase';
import { DuelRoom } from '../lib/realtime';
import { createConfetti } from '../utils/confetti';
import { addCoins } from '../lib/progression';

interface DuelSceneProps {
  onBackToMenu: () => void;
}

const DUEL_DURATION = 60;
const PAIRS_COUNT = 6;
const PREVIEW_DURATION = 3;

export const DuelScene = ({ onBackToMenu }: DuelSceneProps) => {
  const [roomId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const existingRoom = params.get('room');
    if (existingRoom) {
      return existingRoom;
    }
    const newRoom = Math.random().toString(36).substring(2, 8);
    const url = new URL(window.location.href);
    url.searchParams.set('mode', 'duel');
    url.searchParams.set('room', newRoom);
    window.history.replaceState({}, '', url.toString());
    return newRoom;
  });

  const [gameState, setGameState] = useState<'lobby' | 'countdown' | 'preview' | 'playing' | 'ended'>('lobby');
  const [seed, setSeed] = useState('');
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [takenPairs, setTakenPairs] = useState<Set<number>>(new Set());
  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DUEL_DURATION);
  const [countdown, setCountdown] = useState(3);
  const [previewTime, setPreviewTime] = useState(PREVIEW_DURATION);
  const [opponentConnected, setOpponentConnected] = useState(false);
  const [winner, setWinner] = useState<'me' | 'opponent' | 'tie' | null>(null);
  const [showWinModal, setShowWinModal] = useState(false);
  const [showInvitePanel, setShowInvitePanel] = useState(false);

  const clientId = getOrCreateClientId();
  const duelRoomRef = useRef<DuelRoom | null>(null);
  const isCheckingRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);
  const previewTimerRef = useRef<number | null>(null);
  const playersRef = useRef<Set<string>>(new Set([clientId]));
  const gameEndedRef = useRef(false);

  const generateCards = useCallback((gameSeed: string) => {
    const levelImages = getImagesForLevel(1);
    const cardPairs = levelImages.slice(0, PAIRS_COUNT).flatMap((img, idx) => [
      { id: idx * 2, imageIndex: idx, isFlipped: false, isMatched: false },
      { id: idx * 2 + 1, imageIndex: idx, isFlipped: false, isMatched: false },
    ]);

    const rng = prng(gameSeed);
    const shuffled = [...cardPairs];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
  }, []);

  const stopAllTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (previewTimerRef.current) {
      clearInterval(previewTimerRef.current);
      previewTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.get('room')) {
      params.set('room', roomId);
      window.history.replaceState({}, '', `?${params.toString()}`);
    }

    const room = new DuelRoom(roomId);
    duelRoomRef.current = room;

    room.join((event) => {
      console.log('[DuelScene] Event:', event);

      if (event.type === 'join' && event.clientId !== clientId) {
        playersRef.current.add(event.clientId);
        setOpponentConnected(true);
      }

      if (event.type === 'start') {
        gameEndedRef.current = false;
        setSeed(event.seed);
        setGameState('countdown');
        const generatedCards = generateCards(event.seed);
        setCards(generatedCards);
        setMyScore(0);
        setOpponentScore(0);
      }

      if (event.type === 'pair') {
        const { clientId: eventClientId, pairIndexA, pairIndexB } = event;
        const cardA = cards.find((c) => c.id === pairIndexA);
        const cardB = cards.find((c) => c.id === pairIndexB);

        if (cardA && cardB && cardA.imageIndex === cardB.imageIndex) {
          setTakenPairs((prev) => new Set(prev).add(cardA.imageIndex));
          setCards((prev) =>
            prev.map((c) =>
              c.id === pairIndexA || c.id === pairIndexB ? { ...c, isMatched: true } : c
            )
          );

          if (eventClientId === clientId) {
            const newMyScore = myScore + 1;
            setMyScore(newMyScore);
            addCoins(5);
          } else {
            const newOpponentScore = opponentScore + 1;
            setOpponentScore(newOpponentScore);
            if (newOpponentScore >= PAIRS_COUNT) {
              endGame(eventClientId, myScore, newOpponentScore);
            }
          }
        }
      }

      if (event.type === 'end') {
        if (gameEndedRef.current) return;
        gameEndedRef.current = true;

        stopAllTimers();
        setGameState('ended');
        setShowWinModal(true);

        if (event.winnerClientId === clientId) {
          setWinner('me');
          addCoins(20);
          createConfetti();
        } else if (event.scoreA === event.scoreB) {
          setWinner('tie');
        } else {
          setWinner('opponent');
        }
      }

      if (event.type === 'exit') {
        stopAllTimers();
        alert('⚠️ El oponente abandonó la partida');
        onBackToMenu();
      }
    });

    room.emit({ type: 'join', clientId });

    return () => {
      room.leave();
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [roomId, clientId, generateCards, cards]);

  useEffect(() => {
    if (gameState === 'countdown') {
      setCountdown(3);
      countdownTimerRef.current = window.setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
            setGameState('preview');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    if (gameState === 'preview') {
      setPreviewTime(PREVIEW_DURATION);
      setCards((prev) => prev.map((c) => ({ ...c, isFlipped: true })));

      previewTimerRef.current = window.setInterval(() => {
        setPreviewTime((prev) => {
          if (prev <= 1) {
            if (previewTimerRef.current) clearInterval(previewTimerRef.current);
            setCards((prevCards) => prevCards.map((c) => ({ ...c, isFlipped: false })));
            setGameState('playing');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      if (previewTimerRef.current) clearInterval(previewTimerRef.current);
    };
  }, [gameState]);

  useEffect(() => {
    if (gameState === 'playing') {
      setTimeLeft(DUEL_DURATION);
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            const finalWinner = myScore > opponentScore ? clientId : myScore < opponentScore ? 'opponent' : 'tie';
            endGame(finalWinner, myScore, opponentScore);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, myScore, opponentScore, clientId]);

  const startGame = () => {
    if (!opponentConnected) {
      alert('Esperando a que se una un oponente...');
      return;
    }

    const gameSeed = `duel-${Date.now()}`;
    duelRoomRef.current?.emit({ type: 'start', seed: gameSeed, duration: DUEL_DURATION });
  };

  const endGame = (winnerId: string, finalMyScore: number, finalOpponentScore: number) => {
    if (gameEndedRef.current) return;
    gameEndedRef.current = true;

    stopAllTimers();

    setGameState('ended');
    setShowWinModal(true);

    duelRoomRef.current?.emit({
      type: 'end',
      winnerClientId: winnerId,
      scoreA: finalMyScore,
      scoreB: finalOpponentScore,
    });

    if (winnerId === clientId) {
      setWinner('me');
      addCoins(20);
      createConfetti();
    } else if (finalMyScore === finalOpponentScore) {
      setWinner('tie');
    } else {
      setWinner('opponent');
    }
  };

  const handleCardClick = useCallback(
    (id: number) => {
      if (gameState !== 'playing' || gameState === 'preview' || gameEndedRef.current || isCheckingRef.current || flippedCards.length >= 2) return;

      const card = cards.find((c) => c.id === id);
      if (!card || card.isMatched || flippedCards.includes(id)) return;

      const newFlipped = [...flippedCards, id];
      setFlippedCards(newFlipped);

      setCards((prev) => prev.map((c) => (c.id === id ? { ...c, isFlipped: true } : c)));

      if (newFlipped.length === 2) {
        isCheckingRef.current = true;

        const [firstId, secondId] = newFlipped;
        const firstCard = cards.find((c) => c.id === firstId);
        const secondCard = cards.find((c) => c.id === secondId);

        if (
          firstCard &&
          secondCard &&
          firstCard.imageIndex === secondCard.imageIndex &&
          !takenPairs.has(firstCard.imageIndex)
        ) {
          duelRoomRef.current?.emit({
            type: 'pair',
            clientId,
            pairIndexA: firstId,
            pairIndexB: secondId,
          });

          const newScore = myScore + 1;
          if (newScore >= PAIRS_COUNT) {
            endGame(clientId, newScore, opponentScore);
          }

          setFlippedCards([]);
          isCheckingRef.current = false;
        } else {
          setTimeout(() => {
            setCards((prev) =>
              prev.map((c) =>
                c.id === firstId || c.id === secondId ? { ...c, isFlipped: false } : c
              )
            );
            setFlippedCards([]);
            isCheckingRef.current = false;
          }, 600);
        }
      }
    },
    [cards, flippedCards, gameState, takenPairs, clientId]
  );

  const copyRoomLink = () => {
    setShowInvitePanel(true);
  };

  const handleExit = () => {
    if (gameState === 'playing' || gameState === 'preview' || gameState === 'countdown') {
      const confirmExit = confirm('¿Seguro que quieres salir de la partida?');
      if (!confirmExit) return;

      stopAllTimers();
      duelRoomRef.current?.emit({ type: 'exit', clientId });
    }
    onBackToMenu();
  };

  const levelImages = getImagesForLevel(1);
  // removed custom photo feature

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-400 via-pink-500 to-purple-600 flex flex-col p-4">
      <div className="bg-white rounded-2xl shadow-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-gray-800">Duelo 1v1</h2>
          <button
            onClick={handleExit}
            className="flex items-center gap-2 bg-red-500 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors"
          >
            <ArrowLeft size={16} />
            {(gameState === 'playing' || gameState === 'preview' || gameState === 'countdown') ? 'Salir' : 'Volver'}
          </button>
        </div>

        {gameState === 'lobby' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Users size={16} className={opponentConnected ? 'text-green-500' : 'text-gray-400'} />
              <span className={opponentConnected ? 'text-green-600 font-semibold' : 'text-gray-600'}>
                {opponentConnected ? '¡Oponente conectado!' : 'Esperando oponente...'}
              </span>
            </div>
            <div className="text-xs text-gray-500">Sala: {roomId}</div>
            <button
              onClick={copyRoomLink}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all mb-2"
            >
              📲 Invitar Rival
            </button>
            <button
              onClick={startGame}
              disabled={!opponentConnected}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
            >
              Iniciar Duelo
            </button>
          </div>
        )}

        {(gameState === 'playing' || gameState === 'countdown' || gameState === 'preview') && (
          <div className="flex items-center justify-around text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{myScore}</div>
              <div className="text-xs text-gray-600">Tú</div>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={20} className={gameState === 'preview' ? 'text-blue-500' : 'text-red-500'} />
              <div className={`text-2xl font-bold ${gameState === 'preview' ? 'text-blue-600' : timeLeft <= 10 ? 'text-red-600 animate-pulse' : 'text-gray-800'}`}>
                {gameState === 'preview' ? `${previewTime}s` : `${timeLeft}s`}
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{opponentScore}</div>
              <div className="text-xs text-gray-600">Rival</div>
            </div>
          </div>
        )}
        {gameState === 'preview' && (
          <div className="mt-2 text-center">
            <div className="text-sm font-semibold text-blue-600">👀 Memoriza las cartas</div>
          </div>
        )}
      </div>

      {gameState === 'lobby' && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-white">
            <Users size={64} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">Comparte el enlace de la sala con tu oponente</p>
          </div>
        </div>
      )}

      {gameState === 'countdown' && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-9xl font-bold text-white animate-pulse">{countdown}</div>
        </div>
      )}

      {(gameState === 'preview' || gameState === 'playing') && (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-lg">
            <div className="grid grid-cols-4 gap-3">
              {cards.map((card) => (
                <GameCard
                  key={card.id}
                  card={card}
                  image={levelImages[card.imageIndex]}
                  onClick={handleCardClick}
                  disabled={gameState === 'preview' || isCheckingRef.current}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {showWinModal && gameState === 'ended' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="text-6xl mb-4">
              {winner === 'me' ? '🏆' : winner === 'tie' ? '🤝' : '😢'}
            </div>
            <h3 className={`text-3xl font-bold mb-2 ${winner === 'me' ? 'text-green-600' : winner === 'tie' ? 'text-yellow-600' : 'text-gray-600'}`}>
              {winner === 'me' ? '¡Has Ganado!' : winner === 'tie' ? '¡Empate!' : 'Has Perdido'}
            </h3>
            {winner === 'me' && (
              <p className="text-sm text-gray-600 mb-4">
                ¡Increíble! +20 monedas
              </p>
            )}
            {winner === 'opponent' && (
              <p className="text-sm text-gray-600 mb-4">
                ¡Sigue intentándolo!
              </p>
            )}
            <div className="bg-gray-100 rounded-xl p-4 mb-6">
              <div className="flex justify-around">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{myScore}</div>
                  <div className="text-xs text-gray-600">Tú</div>
                </div>
                <div className="text-2xl font-bold text-gray-400">VS</div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{opponentScore}</div>
                  <div className="text-xs text-gray-600">Rival</div>
                </div>
              </div>
            </div>
            <button
              onClick={onBackToMenu}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all"
            >
              Volver al Menú
            </button>
          </div>
        </div>
      )}

      {showInvitePanel && (
        <DuelInvitePanel
          roomId={roomId}
          onClose={() => setShowInvitePanel(false)}
        />
      )}
    </div>
  );
};
