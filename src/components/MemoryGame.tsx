import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Eye, RotateCcw, Trophy, Star } from 'lucide-react';

interface GameCard {
  id: number;
  number: number;
  isFlipped: boolean;
  isMatched: boolean;
}

interface GamePhase {
  rows: number;
  cols: number;
  numbers: number[];
  description: string;
}

const GAME_PHASES: GamePhase[] = [
  {
    rows: 3,
    cols: 4,
    numbers: [1, 2, 3, 4, 5, 6],
    description: "Fase 1: 4x3 - Números 1 a 6"
  },
  {
    rows: 4,
    cols: 4,
    numbers: [1, 2, 3, 4, 5, 6, 7, 8],
    description: "Fase 2: 4x4 - Números 1 a 8"
  },
  {
    rows: 5,
    cols: 4,
    numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    description: "Fase 3: 5x4 - Números 1 a 10"
  }
];

const MemoryGame: React.FC = () => {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [cards, setCards] = useState<GameCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [gameState, setGameState] = useState<'menu' | 'preview' | 'playing' | 'phaseCompleted' | 'completed' | 'gameOver'>('menu');
  const [showingPreview, setShowingPreview] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [totalScore, setTotalScore] = useState(0);

  const createCards = useCallback((phase: GamePhase): GameCard[] => {
    const totalCards = phase.rows * phase.cols;
    const pairsNeeded = Math.floor(totalCards / 2);
    const selectedNumbers = phase.numbers.slice(0, pairsNeeded);
    
    // Create pairs
    const numbers = [...selectedNumbers, ...selectedNumbers];
    
    // If odd number of cards, add one extra unique number
    if (totalCards % 2 === 1) {
      numbers.push(phase.numbers[pairsNeeded] || phase.numbers[phase.numbers.length - 1]);
    }
    
    // Shuffle cards
    const shuffled = numbers.sort(() => Math.random() - 0.5);
    
    return shuffled.map((number, index) => ({
      id: index,
      number,
      isFlipped: false,
      isMatched: false
    }));
  }, []);

  const initializeGame = useCallback(() => {
    const phase = GAME_PHASES[currentPhase];
    const newCards = createCards(phase);
    setCards(newCards);
    setFlippedCards([]);
    setMatchedPairs(0);
    setMoves(0);
    setGameState('preview');
    setShowingPreview(true);
    
    // Show preview for 3 seconds
    setTimeout(() => {
      setShowingPreview(false);
      setGameState('playing');
    }, 3000);
  }, [currentPhase, createCards]);

  const showPreview = () => {
    setShowingPreview(true);
    setShowOverlay(true);
    setGameState('preview');
    
    // Hide message after 1.5 seconds, keep overlay and numbers visible
    setTimeout(() => {
      setShowingPreview(false);
    }, 1500);
    
    // Hide overlay after 5 seconds total (1.5s message + 3.5s overlay with numbers)
    setTimeout(() => {
      setShowOverlay(false);
      setGameState('playing');
    }, 5000);
  };

  const handleCardClick = (cardId: number) => {
    if (gameState !== 'playing' || flippedCards.length >= 2) return;
    
    const card = cards[cardId];
    if (card.isFlipped || card.isMatched) return;

    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);
    
    setCards(prev => prev.map(c => 
      c.id === cardId ? { ...c, isFlipped: true } : c
    ));

    if (newFlippedCards.length === 2) {
      setMoves(prev => prev + 1);
      
      const [firstCard, secondCard] = newFlippedCards.map(id => cards[id]);
      
      setTimeout(() => {
        if (firstCard.number === secondCard.number) {
          // Match found
          setCards(prev => prev.map(c => 
            newFlippedCards.includes(c.id) 
              ? { ...c, isMatched: true, isFlipped: true }
              : c
          ));
          setMatchedPairs(prev => prev + 1);
          setScore(prev => prev + 100);
          
          toast({
            title: "Par encontrado! 🎉",
            description: "+100 pontos",
          });
        } else {
          // No match
          setCards(prev => prev.map(c => 
            newFlippedCards.includes(c.id) 
              ? { ...c, isFlipped: false }
              : c
          ));
        }
        setFlippedCards([]);
      }, 1000);
    }
  };

  const resetGame = () => {
    setCurrentPhase(0);
    setScore(0);
    setTotalScore(0);
    setGameState('menu');
  };

  const nextPhase = () => {
    setGameState('phaseCompleted');
  };

  const proceedToNextPhase = () => {
    const phaseScore = Math.max(0, 1000 - (moves * 10));
    const newTotalScore = totalScore + score + phaseScore;
    setTotalScore(newTotalScore);
    
    if (currentPhase < GAME_PHASES.length - 1) {
      setCurrentPhase(prev => prev + 1);
      setScore(0);
      initializeGame();
    } else {
      setGameState('completed');
    }
  };

  // Check for game completion
  useEffect(() => {
    if (gameState === 'playing' && cards.length > 0) {
      const totalPairs = Math.floor(cards.length / 2);
      if (matchedPairs === totalPairs) {
        setTimeout(nextPhase, 1000);
      }
    }
  }, [matchedPairs, cards.length, gameState]);

  // Game over condition (too many moves)
  useEffect(() => {
    if (gameState === 'playing' && moves >= 20) {
      setGameState('gameOver');
      toast({
        title: "Fim de jogo 😢",
        description: `Muitas tentativas! Pontuação: ${totalScore + score}`,
      });
    }
  }, [moves, gameState, totalScore, score]);

  const phase = GAME_PHASES[currentPhase];

  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl bg-card/90 backdrop-blur-sm border-primary/20 shadow-glow">
          <CardContent className="p-12 text-center">
            <div className="animate-bounce-in">
              <Trophy className="w-24 h-24 mx-auto mb-6 text-primary" />
              <h1 className="text-6xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
                Jogo da Memória
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Teste sua memória em 3 fases desafiadoras!
              </p>
              <div className="space-y-4 mb-8">
                {GAME_PHASES.map((phase, index) => (
                  <div key={index} className="flex items-center justify-center gap-4 text-lg">
                    <Badge variant="outline" className="w-16 h-8">
                      Fase {index + 1}
                    </Badge>
                    <span className="text-foreground">{phase.description}</span>
                  </div>
                ))}
              </div>
              <Button 
                onClick={initializeGame}
                size="lg"
                className="text-2xl px-12 py-6 bg-gradient-primary hover:scale-105 transition-transform shadow-button"
              >
                <Star className="w-6 h-6 mr-2" />
                Começar Jogo
              </Button>
              
              {/* Botões para testar fases específicas */}
              <div className="mt-6 flex justify-center gap-4">
                {GAME_PHASES.map((_, index) => (
                  <Button
                    key={index}
                    onClick={() => {
                      setCurrentPhase(index);
                      initializeGame();
                    }}
                    variant="outline"
                    size="sm"
                    className="text-sm"
                  >
                    Testar Fase {index + 1}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (gameState === 'completed') {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl bg-card/90 backdrop-blur-sm border-success/20 shadow-glow">
          <CardContent className="p-12 text-center">
            <div className="animate-bounce-in">
              <Trophy className="w-32 h-32 mx-auto mb-6 text-success animate-pulse-glow" />
              <h1 className="text-6xl font-bold mb-4 bg-gradient-success bg-clip-text text-transparent">
                Parabéns!
              </h1>
              <p className="text-2xl text-muted-foreground mb-6">
                Você completou todas as fases!
              </p>
              <div className="text-4xl font-bold text-success mb-8">
                Pontuação Final: {totalScore}
              </div>
              <Button 
                onClick={resetGame}
                size="lg"
                className="text-2xl px-12 py-6 bg-gradient-primary hover:scale-105 transition-transform shadow-button"
              >
                Jogar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (gameState === 'gameOver') {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl bg-card/90 backdrop-blur-sm border-destructive/20 shadow-glow">
          <CardContent className="p-12 text-center">
            <div className="animate-slide-up">
              <div className="text-6xl mb-6">😢</div>
              <h1 className="text-6xl font-bold mb-4 text-destructive">
                Fim de Jogo
              </h1>
              <p className="text-2xl text-muted-foreground mb-6">
                Muitas tentativas! Tente novamente.
              </p>
              <div className="text-3xl font-bold text-foreground mb-8">
                Pontuação Final: {totalScore + score}
              </div>
              <Button 
                onClick={resetGame}
                size="lg"
                className="text-2xl px-12 py-6 bg-gradient-primary hover:scale-105 transition-transform shadow-button"
              >
                <RotateCcw className="w-6 h-6 mr-2" />
                Tentar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (gameState === 'phaseCompleted') {
    const phaseScore = Math.max(0, 1000 - (moves * 10));
    const isLastPhase = currentPhase === GAME_PHASES.length - 1;
    
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl bg-card/90 backdrop-blur-sm border-success/20 shadow-glow">
          <CardContent className="p-12 text-center">
            <div className="animate-scale-in">
              <div className="text-8xl mb-6 animate-pulse">🎉</div>
              <h1 className="text-5xl font-bold mb-4 bg-gradient-success bg-clip-text text-transparent">
                Fase {currentPhase + 1} Completada!
              </h1>
              <p className="text-xl text-muted-foreground mb-6">
                Excelente trabalho!
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="text-2xl font-bold text-foreground">
                  Pontos da Fase: {score}
                </div>
                <div className="text-2xl font-bold text-success">
                  Bônus Eficiência: {phaseScore}
                </div>
                <div className="text-3xl font-bold text-primary">
                  Total: {totalScore + score + phaseScore}
                </div>
              </div>

              {!isLastPhase && (
                <div className="mb-8 p-6 bg-primary/10 rounded-xl border border-primary/20">
                  <h3 className="text-2xl font-bold text-primary mb-2">
                    Próxima Fase:
                  </h3>
                  <p className="text-lg text-foreground">
                    {GAME_PHASES[currentPhase + 1].description}
                  </p>
                </div>
              )}

              <Button 
                onClick={proceedToNextPhase}
                size="lg"
                className="text-2xl px-12 py-6 bg-gradient-primary hover:scale-105 transition-transform shadow-button"
              >
                {isLastPhase ? 'Ver Resultado Final' : 'Continuar para Próxima Fase'}
                <Star className="w-6 h-6 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Game Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            {phase.description}
          </h1>
          <div className="flex justify-center gap-8 text-xl">
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-warning" />
              <span className="text-foreground">Pontos: {score}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-foreground">Tentativas: {moves}/20</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-foreground">Pares: {matchedPairs}/{Math.floor(cards.length / 2)}</span>
            </div>
          </div>
        </div>

        {/* Preview Button */}
        {gameState === 'playing' && (
          <div className="text-center mb-6">
            <Button
              onClick={showPreview}
              variant="outline"
              className="bg-warning text-warning-foreground border-warning hover:bg-warning/90"
            >
              <Eye className="w-5 h-5 mr-2" />
              Ver Números (2s)
            </Button>
          </div>
        )}

        {/* Game Grid */}
        <div 
          className="grid gap-4 mx-auto max-w-3xl"
          style={{
            gridTemplateColumns: `repeat(${phase.cols}, 1fr)`,
            gridTemplateRows: `repeat(${phase.rows}, 1fr)`
          }}
        >
          {cards.map((card) => (
            <div
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className={`
                aspect-square rounded-2xl cursor-pointer transition-all duration-300 hover:scale-105
                flex items-center justify-center text-4xl font-bold shadow-card
                ${card.isMatched 
                  ? 'bg-gradient-success text-success-foreground animate-card-match' 
                  : card.isFlipped || showingPreview
                    ? 'bg-gradient-primary text-primary-foreground' 
                    : 'bg-game-card-back text-transparent hover:shadow-glow'
                }
                ${gameState === 'playing' && !card.isMatched ? 'hover:shadow-glow' : ''}
              `}
            >
              {(card.isFlipped || card.isMatched || showingPreview || showOverlay) ? card.number : '?'}
            </div>
          ))}
        </div>

        {/* Preview Overlay */}
        {showOverlay && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            {showingPreview && (
              <Card className="bg-card/95 backdrop-blur-sm border-primary/20">
                <CardContent className="p-8 text-center">
                  <Eye className="w-16 h-16 mx-auto mb-4 text-primary animate-pulse" />
                  <p className="text-2xl font-bold text-foreground">
                    Memorize os números!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MemoryGame;