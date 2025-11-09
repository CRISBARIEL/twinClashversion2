import { Card } from '../types';
import { getSkinById, getDefaultSkin, getEquippedTheme } from '../lib/skins';
import { playSoundFlip } from '../utils/soundManager';
import { useState, useEffect } from 'react';
// removed custom photo feature

interface GameCardProps {
  card: Card;
  image: string;
  onClick: (id: number) => void;
  disabled: boolean;
  showHint?: boolean;
}

export const GameCard = ({ card, image, onClick, disabled, showHint = false }: GameCardProps) => {
  const [skin, setSkin] = useState(getDefaultSkin());

  useEffect(() => {
    const loadSkin = async () => {
      const themeId = await getEquippedTheme();
      const loadedSkin = getSkinById(themeId) || getDefaultSkin();
      setSkin(loadedSkin);
    };

    loadSkin();

    const handleThemeChange = () => {
      loadSkin();
    };

    window.addEventListener('themeChanged', handleThemeChange);
    return () => window.removeEventListener('themeChanged', handleThemeChange);
  }, []);

  const handleClick = () => {
    if (!disabled && !card.isFlipped && !card.isMatched) {
      playSoundFlip();
      onClick(card.id);
    }
  };

  return (
    <div
      className="relative aspect-square cursor-pointer perspective-1000 touch-manipulation"
      onClick={handleClick}
      style={{ minHeight: '60px', minWidth: '60px' }}
    >
      <div
        className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
          card.isFlipped || card.isMatched ? 'rotate-y-180' : ''
        } ${showHint ? 'hint-pulse' : ''}`}
      >
        <div className="absolute w-full h-full backface-hidden">
          <div className={`w-full h-full ${skin.cardBackColor} rounded-lg shadow-md flex items-center justify-center border-2 ${skin.cardBorderColor} ${showHint ? 'ring-2 ring-yellow-400 ring-opacity-75' : ''}`}>
            <div className="text-2xl sm:text-3xl text-white font-bold">?</div>
            {showHint && (
              <div className="absolute inset-0 rounded-lg border-2 border-yellow-400 animate-ping opacity-75"></div>
            )}
          </div>
        </div>

        <div className="absolute w-full h-full backface-hidden rotate-y-180">
          <div className={`w-full h-full bg-white rounded-lg shadow-md flex items-center justify-center border-2 ${skin.cardBorderColor} overflow-hidden`}>
            <div className="text-3xl sm:text-4xl">{image}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
