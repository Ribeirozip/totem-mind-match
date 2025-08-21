import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Eye, RotateCcw, Trophy, Star } from 'lucide-react';
import PlayerDataForm from './PlayerDataForm';

interface GameCard {
  id: number;
  image: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface PlayerData {
  name: string;
  number: string;
  timestamp: string;
}

interface GamePhase {
  rows: number;
  cols: number;
  images: string[];
  description: string;
}

const GAME_PHASES: GamePhase[] = [
  {
    rows: 3,
    cols: 4,
    images: [
      "/lovable-uploads/a7b897cb-aee6-47f6-93fb-e3ab8d2d3295.png", // ADS Branco
      "/lovable-uploads/b4b4fd92-faf9-43e2-acfb-70e2d901b250.png", // ADS Preto
      "/lovable-uploads/eab82a43-bc39-4fd8-b191-95683e8c703e.png", // CEUMA
      "/lovable-uploads/17d6b71f-1195-46cc-913e-693f072a375c.png", // Símbolo 1
      "/lovable-uploads/f712ccf9-72dd-4e72-be37-064a7c628dc7.png", // Símbolo 2
      "/lovable-uploads/87aaf2c8-0d08-42a2-8c9e-f84f9f93251b.png", // Oxygeni
    ],
    description: "Fase 1: 3x4 - ADS, CEUMA e Símbolos"
  },
  {
    rows: 4,
    cols: 5,
    images: [
      "/lovable-uploads/a7b897cb-aee6-47f6-93fb-e3ab8d2d3295.png", // ADS Branco
      "/lovable-uploads/b4b4fd92-faf9-43e2-acfb-70e2d901b250.png", // ADS Preto
      "/lovable-uploads/eab82a43-bc39-4fd8-b191-95683e8c703e.png", // CEUMA
      "/lovable-uploads/17d6b71f-1195-46cc-913e-693f072a375c.png", // Símbolo 1
      "/lovable-uploads/f712ccf9-72dd-4e72-be37-064a7c628dc7.png", // Símbolo 2
      "/lovable-uploads/87aaf2c8-0d08-42a2-8c9e-f84f9f93251b.png", // Oxygeni
      "/lovable-uploads/b8e17fac-a14f-4cd1-82a7-74022cd0a010.png", // Ceuma Branco
      "/lovable-uploads/22ea7d84-3900-4a4e-8d0b-00d21cc028ce.png", // Imagem colada
      "/lovable-uploads/daf953fc-c4f7-4cad-bcd2-fa7c56c0e8eb.png", // Imagem colada 2
      "/lovable-uploads/5f768eea-5e0a-4f8e-85e2-8e160c27b409.png", // Incode
    ],
    description: "Fase 2: 4x5 - Logos ADS, CEUMA e Símbolos"
  },
  {
    rows: 4,
    cols: 5,
    images: [
      "/lovable-uploads/a7b897cb-aee6-47f6-93fb-e3ab8d2d3295.png", // ADS Branco
      "/lovable-uploads/b4b4fd92-faf9-43e2-acfb-70e2d901b250.png", // ADS Preto
      "/lovable-uploads/eab82a43-bc39-4fd8-b191-95683e8c703e.png", // CEUMA
      "/lovable-uploads/17d6b71f-1195-46cc-913e-693f072a375c.png", // Símbolo 1
      "/lovable-uploads/f712ccf9-72dd-4e72-be37-064a7c628dc7.png", // Símbolo 2
      "/lovable-uploads/87aaf2c8-0d08-42a2-8c9e-f84f9f93251b.png", // Oxygeni
      "/lovable-uploads/b8e17fac-a14f-4cd1-82a7-74022cd0a010.png", // Ceuma Branco
      "/lovable-uploads/22ea7d84-3900-4a4e-8d0b-00d21cc028ce.png", // Imagem colada
      "/lovable-uploads/daf953fc-c4f7-4cad-bcd2-fa7c56c0e8eb.png", // Imagem colada 2
      "/lovable-uploads/5f768eea-5e0a-4f8e-85e2-8e160c27b409.png", // Incode
    ],
    description: "Fase 3: 4x5 - Logos ADS, CEUMA e Símbolos (30s)"
  }
];

const MemoryGame: React.FC = () => {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [cards, setCards] = useState<GameCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [gameState, setGameState] = useState<'dataEntry' | 'menu' | 'preview' | 'playing' | 'phaseCompleted' | 'completed' | 'gameOver'>('dataEntry');
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [showingPreview, setShowingPreview] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [previewUsesLeft, setPreviewUsesLeft] = useState(2);
  const [previewCountdown, setPreviewCountdown] = useState(0);
  const [efficiencyBonus, setEfficiencyBonus] = useState(1000);
  const [phaseStartTime, setPhaseStartTime] = useState(0);

  const [countdown, setCountdown] = useState(30);
  const [timeUp, setTimeUp] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const efficiencyTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const createCards = useCallback((phase: GamePhase): GameCard[] => {
    const totalCards = phase.rows * phase.cols;
    const pairsNeeded = Math.floor(totalCards / 2);
    const selectedImages = phase.images.slice(0, pairsNeeded);
    // Cada imagem aparece exatamente 2 vezes (um par)
    const images = [...selectedImages, ...selectedImages];
    const shuffled = images.sort(() => Math.random() - 0.5);
    return shuffled.map((image, index) => ({
      id: index,
      image,
      isFlipped: false,
      isMatched: false
    }));
  }, []);
  const startPhase = useCallback((phaseIndex: number) => {
    const phase = GAME_PHASES[phaseIndex];
    const newCards = createCards(phase);
    setCurrentPhase(phaseIndex);
    setCards(newCards);
    setFlippedCards([]);
    setMatchedPairs(0);
    setMoves(0);
    setScore(0);
    setEfficiencyBonus(1000); // Reset efficiency bonus to 1000
    setPhaseStartTime(Date.now()); // Record phase start time
    setGameState('preview');
    setShowingPreview(true);
    setShowOverlay(true);
    // initial preview duration 1.5s
    setTimeout(() => {
      setShowingPreview(false);
      setShowOverlay(false);
      setGameState('playing');
    }, 1500);
    // If it's phase 3, preset the countdown to 30 (will be used when playing)
    if (phaseIndex === 2) {
      setCountdown(30);
      setTimeUp(false);
    }
  }, [createCards]);

  // Initialize game from menu (starts currentPhase)
  const initializeGame = useCallback(() => {
    startPhase(currentPhase);
  }, [currentPhase, startPhase]);

  // Show preview on button click (2s) — overlay visible while preview shown
  const showPreview = () => {
    if (previewUsesLeft <= 0 || gameState !== 'playing') return;
    setPreviewUsesLeft(prev => prev - 1);
    setPreviewCountdown(2);
    setShowingPreview(true);
    setShowOverlay(true);
    const countdownInterval = setInterval(() => {
      setPreviewCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setShowingPreview(false);
          setShowOverlay(false);
          // return to playing
          setGameState('playing');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    // Switch temporarily to preview state to pause timer effect
    setGameState('preview');
  };

  // Efficiency timer: decreases bonus by 50 based on phase (10s for phase 1, 15s for phases 2&3)
  useEffect(() => {
    const clearEfficiencyTimer = () => {
      if (efficiencyTimerRef.current) {
        clearInterval(efficiencyTimerRef.current);
        efficiencyTimerRef.current = null;
      }
    };

    if (gameState === 'playing') {
      clearEfficiencyTimer();
      // Phase 1: 10 seconds, Phases 2&3: 15 seconds
      const timerInterval = currentPhase === 0 ? 10000 : 15000;
      efficiencyTimerRef.current = setInterval(() => {
        setEfficiencyBonus(prev => Math.max(0, prev - 50));
      }, timerInterval);
    } else {
      clearEfficiencyTimer();
    }

    return () => clearEfficiencyTimer();
  }, [gameState, currentPhase]);

  // Timer effect for phase 3: starts only when currentPhase === 2 and gameState === 'playing'
  useEffect(() => {
    // Cleanup any previous timer
    const clearTimer = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };

    if (currentPhase === 2 && gameState === 'playing') {
      // start/continue timer (do NOT reset countdown here — countdown was set when entering phase)
      setTimeUp(false);
      // ensure no duplicate intervals
      clearTimer();
      timerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            // time finished
            clearTimer();
            setTimeUp(true);
            const totalPairs = Math.floor(cards.length / 2);
            // only game over if still missing pairs
            if (matchedPairs < totalPairs) {
              setGameState('gameOver');
              toast({
                title: "Tempo esgotado!",
                description: "Você não encontrou todos os pares a tempo.",
              });
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // not playing in phase 3 — ensure timer paused/cleared
      clearTimer();
    }

    return () => clearTimer();
  }, [currentPhase, gameState, matchedPairs, cards.length]);

  // When all pairs are found -> advance to phaseCompleted
  useEffect(() => {
    if (gameState === 'playing' && cards.length > 0) {
      const totalPairs = Math.floor(cards.length / 2);
      if (matchedPairs === totalPairs) {
        // clear timer if any
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        // small delay to show last match
        setTimeout(() => {
          setGameState('phaseCompleted');
        }, 800);
      }
    }
  }, [matchedPairs, cards.length, gameState]);

  // Game over by many moves
  useEffect(() => {
    if (gameState === 'playing' && moves > Math.floor(cards.length / 2) + 2) {
      const totalPairs = Math.floor(cards.length / 2);
      // Verificar se o usuário completou todos os pares na última tentativa
      if (matchedPairs === totalPairs) {
        // Jogador ganhou na última tentativa - não é game over
        return;
      }
      setGameState('gameOver');
      toast({
        title: "Fim de jogo 😢",
        description: `Muitas tentativas! Pontuação: ${totalScore + score}`,
      });
    }
  }, [moves, gameState, totalScore, score, cards.length, matchedPairs]);

  const handleCardClick = (cardId: number) => {
    // block clicks while not playing or while preview overlay is visible
    if (gameState !== 'playing' || showingPreview || showOverlay) return;
    if (flippedCards.includes(cardId)) return;

    const card = cards.find(c => c.id === cardId);
    if (!card || card.isMatched) return;

    // CORREÇÃO: Bloquear mais de 2 cliques simultâneos
    if (flippedCards.length >= 2) return;

    const newFlipped = [...flippedCards, cardId];
    setFlippedCards(newFlipped);

    // flip visually
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, isFlipped: true } : c));

    if (newFlipped.length === 2) {
      setMoves(prev => prev + 1);
      const [firstId, secondId] = newFlipped;
      const firstCard = cards.find(c => c.id === firstId);
      const secondCard = cards.find(c => c.id === secondId);

      setTimeout(() => {
        if (firstCard && secondCard && firstCard.image === secondCard.image) {
          // match
          setCards(prev => prev.map(c =>
            (c.id === firstId || c.id === secondId) ? { ...c, isMatched: true, isFlipped: true } : c
          ));
          setMatchedPairs(prev => prev + 1);
          setScore(prev => prev + 100);
          toast({ title: "Par encontrado! 🎉", description: "+100 pontos" });
        } else {
          // error - deduct 50 points from score
          setScore(prev => Math.max(0, prev - 50));
          // flip back
          setCards(prev => prev.map(c =>
            (c.id === firstId || c.id === secondId) ? { ...c, isFlipped: false } : c
          ));
        }
        setFlippedCards([]);
      }, 3000);
    }
  };

  const resetGame = () => {
    // clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setCurrentPhase(0);
    setCards([]);
    setFlippedCards([]);
    setMatchedPairs(0);
    setScore(0);
    setTotalScore(0);
    setMoves(0);
    setGameState('dataEntry');
    setPlayerData(null);
    setShowingPreview(false);
    setShowOverlay(false);
    setPreviewUsesLeft(2);
    setPreviewCountdown(0);
    setCountdown(30);
    setTimeUp(false);
  };

  const handlePlayerDataSubmit = (data: PlayerData) => {
    setPlayerData(data);
    setGameState('menu');
  };

  const nextPhase = () => setGameState('phaseCompleted');

  const proceedToNextPhase = () => {
    const newTotalScore = totalScore + score + efficiencyBonus;
    setTotalScore(newTotalScore);

    const nextIndex = currentPhase + 1;
    if (nextIndex < GAME_PHASES.length) {
      // start next phase
      startPhase(nextIndex);
    } else {
      setGameState('completed');
    }
  };

  const phase = GAME_PHASES[currentPhase];

  // UI: data entry
  if (gameState === 'dataEntry') {
    return <PlayerDataForm onSubmit={handlePlayerDataSubmit} />;
  }

  // UI: menu
  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center p-4 md:p-6">
        <Card className="w-full max-w-2xl mx-2 bg-card/90 backdrop-blur-sm border-primary/20 shadow-glow">
          <CardContent className="p-6 md:p-12 text-center">
            <div className="animate-bounce-in">
              <Trophy className="w-24 h-24 mx-auto mb-6 text-primary" />
              <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
                Jogo da Memória
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8">
                Teste sua memória em 3 fases desafiadoras!
              </p>
              <div className="space-y-4 mb-8">
                {GAME_PHASES.map((ph, index) => (
                  <div key={index} className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-sm md:text-lg">
                    <Badge variant="outline" className="w-16 h-8 text-xs md:text-sm">
                      Fase {index + 1}
                    </Badge>
                    <span className="text-foreground text-center">{ph.description}</span>
                  </div>
                ))}
              </div>
              <Button
                onClick={() => startPhase(0)}
                size="lg"
                className="text-lg md:text-2xl px-8 md:px-12 py-4 md:py-6 bg-gradient-primary hover:scale-105 transition-transform shadow-button"
              >
                <Star className="w-5 h-5 md:w-6 md:h-6 mr-2" />
                Começar Jogo
              </Button>

              <div className="mt-6 flex flex-wrap justify-center gap-2 md:gap-4">
                {GAME_PHASES.map((_, index) => (
                  <Button
                    key={index}
                    onClick={() => startPhase(index)}
                    variant="outline"
                    size="sm"
                    className="text-xs md:text-sm"
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

  // UI: completed
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
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={resetGame}
                  size="lg"
                  className="text-xl px-8 py-4 bg-gradient-primary hover:scale-105 transition-transform shadow-button"
                >
                  Novo Jogo
                </Button>
                <Button
                  onClick={() => setGameState('dataEntry')}
                  variant="outline"
                  size="lg"
                  className="text-xl px-8 py-4"
                >
                  Voltar ao Início
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // UI: gameOver
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
                Muitas tentativas ou tempo esgotado! Tente novamente.
              </p>
              <div className="text-3xl font-bold text-foreground mb-8">
                Pontuação Final: {totalScore + score}
              </div>
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={resetGame}
                  size="lg"
                  className="text-xl px-8 py-4 bg-gradient-primary hover:scale-105 transition-transform shadow-button"
                >
                  <RotateCcw className="w-6 h-6 mr-2" />
                  Tentar Novamente
                </Button>
                <Button
                  onClick={() => setGameState('dataEntry')}
                  variant="outline"
                  size="lg"
                  className="text-xl px-8 py-4"
                >
                  Voltar ao Início
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // UI: phaseCompleted
  if (gameState === 'phaseCompleted') {
    const isLastPhase = currentPhase === GAME_PHASES.length - 1;

    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center p-4 md:p-6">
        <Card className="w-full max-w-2xl mx-2 bg-card/90 backdrop-blur-sm border-success/20 shadow-glow">
          <CardContent className="p-6 md:p-12 text-center">
            <div className="animate-scale-in">
              <div className="text-8xl mb-6 animate-pulse">🎉</div>
              <h1 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-success bg-clip-text text-transparent">
                Fase {currentPhase + 1} Completada!
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-6">
                Excelente trabalho!
              </p>

              <div className="space-y-4 mb-8">
                <div className="text-lg md:text-2xl font-bold text-foreground">
                  Pontos da Fase: {score}
                </div>
                <div className="text-lg md:text-2xl font-bold text-success">
                  Bônus Eficiência: {efficiencyBonus}
                </div>
                <div className="text-xl md:text-3xl font-bold text-primary">
                  Total: {totalScore + score + efficiencyBonus}
                </div>
              </div>

              {!isLastPhase && (
                <div className="mb-8 p-4 md:p-6 bg-primary/10 rounded-xl border border-primary/20">
                  <h3 className="text-lg md:text-2xl font-bold text-primary mb-2">
                    Próxima Fase:
                  </h3>
                  <p className="text-base md:text-lg text-foreground">
                    {GAME_PHASES[currentPhase + 1].description}
                  </p>
                </div>
              )}

              <Button
                onClick={proceedToNextPhase}
                size="lg"
                className="text-lg md:text-2xl px-8 md:px-12 py-4 md:py-6 bg-gradient-primary hover:scale-105 transition-transform shadow-button w-full sm:w-auto"
              >
                {isLastPhase ? 'Ver Resultado Final' : 'Continuar para Próxima Fase'}
                <Star className="w-5 h-5 md:w-6 md:h-6 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default: playing / preview UI
  return (
    <div className="min-h-screen bg-gradient-background p-2 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Game Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            {phase.description}
          </h1>
          <div className="flex flex-wrap justify-center gap-4 md:gap-8 text-sm md:text-xl">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 md:w-6 md:h-6 text-warning" />
              <span className="text-foreground">Pontos: {score}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-foreground">Tentativas: {moves}/{Math.floor(cards.length / 2) + 2}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-foreground">Pares: {matchedPairs}/{Math.floor(cards.length / 2)}</span>
            </div>
          </div>
          
          {/* Cronômetro visível apenas na fase 3 (index 2) enquanto jogando */}
          {currentPhase === 2 && gameState === 'playing' && (
            <div className="text-center mt-4">
              <div className="inline-block px-4 md:px-6 py-2 bg-black/70 rounded-xl border border-white/20">
                <p className="text-base md:text-lg text-white font-bold">
                  Tempo restante: <span className="text-red-500">{countdown}s</span>
                </p>
              </div>
            </div>
          )}

          {currentPhase === 2 && timeUp && (
            <div className="text-center mt-4">
              <p className="text-red-600 font-semibold text-base md:text-lg">Tempo esgotado!</p>
            </div>
          )}
        </div>

        {/* Preview Button */}
        {gameState === 'playing' && (
          <div className="text-center mb-6">
            <Button
              onClick={showPreview}
              variant="outline"
              size="sm"
              className="bg-warning text-warning-foreground border-warning hover:bg-warning/90 text-sm md:text-base"
            >
              <Eye className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              <span className="hidden sm:inline">Visualizar figuras </span>
              <span className="sm:hidden">Ver </span>
              ({previewUsesLeft})
            </Button>
          </div>
        )}

        {/* Game Grid */}
        <div
          className="grid gap-2 md:gap-4 mx-auto px-2 md:px-0"
          style={{
            gridTemplateColumns: `repeat(${phase.cols}, 1fr)`,
            gridTemplateRows: `repeat(${phase.rows}, 1fr)`,
            maxWidth: phase.cols > 4 ? '100%' : '600px'
          }}
        >
          {cards.map((card) => (
            <div
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className={`
                aspect-square rounded-lg md:rounded-2xl cursor-pointer transition-all duration-150 hover:scale-105
                flex items-center justify-center text-2xl md:text-4xl font-bold shadow-card
                ${card.isMatched 
                  ? 'bg-gradient-success text-success-foreground animate-card-match' 
                  : card.isFlipped || showingPreview
                  ? 'bg-gradient-primary text-primary-foreground' 
                  : 'bg-game-card-back text-transparent hover:shadow-glow'
                }
                ${gameState === 'playing' && !card.isMatched ? 'hover:shadow-glow' : ''}
              `}
            >
              {(card.isFlipped || card.isMatched || showingPreview || showOverlay) ? (
                <img
                  src={card.image}
                  alt="Imagem do card"
                  className="w-3/4 h-3/4 object-contain"
                />
              ) : (
                '?'
              )}
            </div>
          ))}
        </div>

        {/* Preview Overlay */}
        {showOverlay && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          </div>
        )}

      </div>

      <div>
        {timeUp && (
          <div className="text-red-500 text-center font-bold text-xl mt-4">
            Tempo esgotado!
          </div>
        )}
      </div>
    </div>
  );
};

export default MemoryGame;
