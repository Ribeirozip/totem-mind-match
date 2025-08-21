import React from 'react';

interface GameCardProps {
  id: number;
  image: string;
  isFlipped: boolean;
  isMatched: boolean;
  showingPreview: boolean;
  showOverlay: boolean;
  gameState: string;
  onClick: (id: number) => void;
}

const GameCard: React.FC<GameCardProps> = ({
  id,
  image,
  isFlipped,
  isMatched,
  showingPreview,
  showOverlay,
  gameState,
  onClick
}) => {
  return (
    <div
      onClick={() => onClick(id)}
      className={`
        aspect-square rounded-lg md:rounded-2xl cursor-pointer transition-all duration-100 hover:scale-105
        flex items-center justify-center text-2xl md:text-4xl font-bold shadow-card
        ${isMatched 
          ? 'bg-gradient-success text-success-foreground animate-card-match shadow-[0_0_20px_rgba(34,197,94,0.5)]' 
          : isFlipped || showingPreview
          ? 'bg-gradient-primary text-primary-foreground' 
          : 'bg-game-card-back text-transparent hover:shadow-glow'
        }
        ${gameState === 'playing' && !isMatched ? 'hover:shadow-glow' : ''}
        ${isFlipped && !isMatched ? 'shadow-[0_0_15px_rgba(239,68,68,0.4)]' : ''}
      `}
    >
      {(isFlipped || isMatched || showingPreview || showOverlay) ? (
        <img
          src={image}
          alt="Imagem do card"
          className="w-3/4 h-3/4 object-contain"
          loading="eager"
          decoding="sync"
        />
      ) : (
        '?'
      )}
    </div>
  );
};

export default GameCard;