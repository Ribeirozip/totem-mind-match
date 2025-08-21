import React, { useState, useEffect, useCallback, useRef, useReducer } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Eye, RotateCcw, Trophy, Star } from 'lucide-react';
import PlayerDataForm from './PlayerDataForm';
import GameCard from './GameCard';
import { useImagePreloader } from '@/hooks/useImagePreloader';
import { useGameTimer } from '@/hooks/useGameTimer';

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

interface GameState {
  currentPhase: number;
  cards: GameCard[];
  flippedCards: number[];
  matchedPairs: number;
  score: number;
  moves: number;
  gameState: 'dataEntry' | 'menu' | 'preview' | 'playing' | 'phaseCompleted' | 'completed' | 'gameOver';
  playerData: PlayerData | null;
  showingPreview: boolean;
  showOverlay: boolean;
  totalScore: number;
  previewUsesLeft: number;
  previewCountdown: number;
  efficiencyBonus: number;
  phaseStartTime: number;
  countdown: number;
  timeUp: boolean;
}

type GameAction = 
  | { type: 'SET_PHASE'; payload: number }
  | { type: 'SET_CARDS'; payload: GameCard[] }
  | { type: 'SET_FLIPPED_CARDS'; payload: number[] }
  | { type: 'SET_MATCHED_PAIRS'; payload: number }
  | { type: 'SET_SCORE'; payload: number }
  | { type: 'SET_MOVES'; payload: number }
  | { type: 'SET_GAME_STATE'; payload: GameState['gameState'] }
  | { type: 'SET_PLAYER_DATA'; payload: PlayerData }
  | { type: 'SET_SHOWING_PREVIEW'; payload: boolean }
  | { type: 'SET_SHOW_OVERLAY'; payload: boolean }
  | { type: 'SET_TOTAL_SCORE'; payload: number }
  | { type: 'SET_PREVIEW_USES_LEFT'; payload: number }
  | { type: 'SET_PREVIEW_COUNTDOWN'; payload: number }
  | { type: 'SET_EFFICIENCY_BONUS'; payload: number }
  | { type: 'SET_PHASE_START_TIME'; payload: number }
  | { type: 'SET_COUNTDOWN'; payload: number }
  | { type: 'SET_TIME_UP'; payload: boolean }
  | { type: 'RESET_GAME' }
  | { type: 'INCREMENT_MATCHED_PAIRS' }
  | { type: 'INCREMENT_MOVES' }
  | { type: 'DECREMENT_PREVIEW_USES' }
  | { type: 'ADD_SCORE'; payload: number };

const initialState: GameState = {
  currentPhase: 0,
  cards: [],
  flippedCards: [],
  matchedPairs: 0,
  score: 0,
  moves: 0,
  gameState: 'dataEntry',
  playerData: null,
  showingPreview: false,
  showOverlay: false,
  totalScore: 0,
  previewUsesLeft: 2,
  previewCountdown: 0,
  efficiencyBonus: 1000,
  phaseStartTime: 0,
  countdown: 30,
  timeUp: false,
};

const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'SET_PHASE':
      return { ...state, currentPhase: action.payload };
    case 'SET_CARDS':
      return { ...state, cards: action.payload };
    case 'SET_FLIPPED_CARDS':
      return { ...state, flippedCards: action.payload };
    case 'SET_MATCHED_PAIRS':
      return { ...state, matchedPairs: action.payload };
    case 'SET_SCORE':
      return { ...state, score: action.payload };
    case 'SET_MOVES':
      return { ...state, moves: action.payload };
    case 'SET_GAME_STATE':
      return { ...state, gameState: action.payload };
    case 'SET_PLAYER_DATA':
      return { ...state, playerData: action.payload };
    case 'SET_SHOWING_PREVIEW':
      return { ...state, showingPreview: action.payload };
    case 'SET_SHOW_OVERLAY':
      return { ...state, showOverlay: action.payload };
    case 'SET_TOTAL_SCORE':
      return { ...state, totalScore: action.payload };
    case 'SET_PREVIEW_USES_LEFT':
      return { ...state, previewUsesLeft: action.payload };
    case 'SET_PREVIEW_COUNTDOWN':
      return { ...state, previewCountdown: action.payload };
    case 'SET_EFFICIENCY_BONUS':
      return { ...state, efficiencyBonus: action.payload };
    case 'SET_PHASE_START_TIME':
      return { ...state, phaseStartTime: action.payload };
    case 'SET_COUNTDOWN':
      return { ...state, countdown: action.payload };
    case 'SET_TIME_UP':
      return { ...state, timeUp: action.payload };
    case 'INCREMENT_MATCHED_PAIRS':
      return { ...state, matchedPairs: state.matchedPairs + 1 };
    case 'INCREMENT_MOVES':
      return { ...state, moves: state.moves + 1 };
    case 'DECREMENT_PREVIEW_USES':
      return { ...state, previewUsesLeft: state.previewUsesLeft - 1 };
    case 'ADD_SCORE':
      return { ...state, score: Math.max(0, state.score + action.payload) };
    case 'RESET_GAME':
      return { ...initialState };
    default:
      return state;
  }
};

const MemoryGame: React.FC = () => {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const efficiencyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { startTimer: startCountdownTimer, clearTimer: clearCountdownTimer } = useGameTimer();
  const { startTimer: startEfficiencyTimer, clearTimer: clearEfficiencyTimer } = useGameTimer();

  // Preload images for current phase
  const currentPhaseImages = GAME_PHASES[state.currentPhase]?.images || [];
  useImagePreloader(currentPhaseImages);

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
    dispatch({ type: 'SET_PHASE', payload: phaseIndex });
    dispatch({ type: 'SET_CARDS', payload: newCards });
    dispatch({ type: 'SET_FLIPPED_CARDS', payload: [] });
    dispatch({ type: 'SET_MATCHED_PAIRS', payload: 0 });
    dispatch({ type: 'SET_MOVES', payload: 0 });
    dispatch({ type: 'SET_SCORE', payload: 0 });
    dispatch({ type: 'SET_EFFICIENCY_BONUS', payload: 1000 });
    dispatch({ type: 'SET_PHASE_START_TIME', payload: Date.now() });
    dispatch({ type: 'SET_GAME_STATE', payload: 'preview' });
    dispatch({ type: 'SET_SHOWING_PREVIEW', payload: true });
    dispatch({ type: 'SET_SHOW_OVERLAY', payload: true });
    
    // initial preview duration 1.5s
    setTimeout(() => {
      dispatch({ type: 'SET_SHOWING_PREVIEW', payload: false });
      dispatch({ type: 'SET_SHOW_OVERLAY', payload: false });
      dispatch({ type: 'SET_GAME_STATE', payload: 'playing' });
    }, 1500);
    
    // If it's phase 3, preset the countdown to 30 (will be used when playing)
    if (phaseIndex === 2) {
      dispatch({ type: 'SET_COUNTDOWN', payload: 30 });
      dispatch({ type: 'SET_TIME_UP', payload: false });
    }
  }, [createCards]);

  // Initialize game from menu (starts currentPhase)
  const initializeGame = useCallback(() => {
    startPhase(state.currentPhase);
  }, [state.currentPhase, startPhase]);

  // Show preview on button click (2s) — overlay visible while preview shown
  const showPreview = () => {
    if (state.previewUsesLeft <= 0 || state.gameState !== 'playing') return;
    dispatch({ type: 'DECREMENT_PREVIEW_USES' });
    dispatch({ type: 'SET_PREVIEW_COUNTDOWN', payload: 2 });
    dispatch({ type: 'SET_SHOWING_PREVIEW', payload: true });
    dispatch({ type: 'SET_SHOW_OVERLAY', payload: true });
    dispatch({ type: 'SET_GAME_STATE', payload: 'preview' });
    
    const countdownTick = () => {
      dispatch({ type: 'SET_PREVIEW_COUNTDOWN', payload: state.previewCountdown - 1 });
      if (state.previewCountdown <= 1) {
        dispatch({ type: 'SET_SHOWING_PREVIEW', payload: false });
        dispatch({ type: 'SET_SHOW_OVERLAY', payload: false });
        dispatch({ type: 'SET_GAME_STATE', payload: 'playing' });
      } else {
        setTimeout(countdownTick, 1000);
      }
    };
    
    setTimeout(countdownTick, 1000);
  };

  // Efficiency timer: decreases bonus by 50 based on phase (10s for phase 1, 15s for phases 2&3)
  useEffect(() => {
    if (state.gameState === 'playing') {
      clearEfficiencyTimer();
      // Phase 1: 10 seconds, Phases 2&3: 15 seconds
      const timerInterval = state.currentPhase === 0 ? 10000 : 15000;
      
      const efficiencyTick = () => {
        dispatch({ type: 'SET_EFFICIENCY_BONUS', payload: Math.max(0, state.efficiencyBonus - 50) });
        if (state.gameState === 'playing') {
          setTimeout(efficiencyTick, timerInterval);
        }
      };
      
      setTimeout(efficiencyTick, timerInterval);
    } else {
      clearEfficiencyTimer();
    }

    return () => clearEfficiencyTimer();
  }, [state.gameState, state.currentPhase, clearEfficiencyTimer]);

  // Timer effect for phase 3: starts only when currentPhase === 2 and gameState === 'playing'
  useEffect(() => {
    if (state.currentPhase === 2 && state.gameState === 'playing') {
      dispatch({ type: 'SET_TIME_UP', payload: false });
      clearCountdownTimer();
      
      const countdownTick = () => {
        dispatch({ type: 'SET_COUNTDOWN', payload: state.countdown - 1 });
        if (state.countdown <= 1) {
          dispatch({ type: 'SET_TIME_UP', payload: true });
          const totalPairs = Math.floor(state.cards.length / 2);
          // only game over if still missing pairs
          if (state.matchedPairs < totalPairs) {
            dispatch({ type: 'SET_GAME_STATE', payload: 'gameOver' });
            toast({
              title: "Tempo esgotado!",
              description: "Você não encontrou todos os pares a tempo.",
            });
          }
        } else if (state.gameState === 'playing') {
          setTimeout(countdownTick, 1000);
        }
      };
      
      setTimeout(countdownTick, 1000);
    } else {
      clearCountdownTimer();
    }

    return () => clearCountdownTimer();
  }, [state.currentPhase, state.gameState, state.matchedPairs, state.cards.length, clearCountdownTimer]);

  // When all pairs are found -> advance to phaseCompleted
  useEffect(() => {
    if (state.gameState === 'playing' && state.cards.length > 0) {
      const totalPairs = Math.floor(state.cards.length / 2);
      if (state.matchedPairs === totalPairs) {
        clearCountdownTimer();
        // small delay to show last match
        setTimeout(() => {
          dispatch({ type: 'SET_GAME_STATE', payload: 'phaseCompleted' });
        }, 800);
      }
    }
  }, [state.matchedPairs, state.cards.length, state.gameState, clearCountdownTimer]);

  // Game over by many moves
  useEffect(() => {
    if (state.gameState === 'playing' && state.moves > Math.floor(state.cards.length / 2) + 2) {
      const totalPairs = Math.floor(state.cards.length / 2);
      // Verificar se o usuário completou todos os pares na última tentativa
      if (state.matchedPairs === totalPairs) {
        // Jogador ganhou na última tentativa - não é game over
        return;
      }
      dispatch({ type: 'SET_GAME_STATE', payload: 'gameOver' });
      toast({
        title: "Fim de jogo 😢",
        description: `Muitas tentativas! Pontuação: ${state.totalScore + state.score}`,
      });
    }
  }, [state.moves, state.gameState, state.totalScore, state.score, state.cards.length, state.matchedPairs]);

  const handleCardClick = (cardId: number) => {
    // block clicks while not playing or while preview overlay is visible
    if (state.gameState !== 'playing' || state.showingPreview || state.showOverlay) return;
    if (state.flippedCards.includes(cardId)) return;

    const card = state.cards.find(c => c.id === cardId);
    if (!card || card.isMatched) return;

    // CORREÇÃO: Bloquear mais de 2 cliques simultâneos
    if (state.flippedCards.length >= 2) return;

    const newFlipped = [...state.flippedCards, cardId];
    dispatch({ type: 'SET_FLIPPED_CARDS', payload: newFlipped });

    // flip visually with red shadow for incorrect pairs
    dispatch({ type: 'SET_CARDS', payload: state.cards.map(c => 
      c.id === cardId ? { ...c, isFlipped: true } : c
    )});

    if (newFlipped.length === 2) {
      dispatch({ type: 'INCREMENT_MOVES' });
      const [firstId, secondId] = newFlipped;
      const firstCard = state.cards.find(c => c.id === firstId);
      const secondCard = state.cards.find(c => c.id === secondId);

      setTimeout(() => {
        if (firstCard && secondCard && firstCard.image === secondCard.image) {
          // match - add green glow effect
          dispatch({ type: 'SET_CARDS', payload: state.cards.map(c =>
            (c.id === firstId || c.id === secondId) ? { ...c, isMatched: true, isFlipped: true } : c
          )});
          dispatch({ type: 'INCREMENT_MATCHED_PAIRS' });
          dispatch({ type: 'ADD_SCORE', payload: 100 });
          toast({ 
            title: "Par encontrado! 🎉", 
            description: "+100 pontos",
            className: "border-green-500 bg-green-50 text-green-900" 
          });
        } else {
          // error - deduct 50 points from score with red feedback
          dispatch({ type: 'ADD_SCORE', payload: -50 });
          // flip back
          dispatch({ type: 'SET_CARDS', payload: state.cards.map(c =>
            (c.id === firstId || c.id === secondId) ? { ...c, isFlipped: false } : c
          )});
          toast({ 
            title: "Tente novamente! ❌", 
            description: "-50 pontos",
            className: "border-red-500 bg-red-50 text-red-900" 
          });
        }
        dispatch({ type: 'SET_FLIPPED_CARDS', payload: [] });
      }, 1500);
    }
  };

  const resetGame = () => {
    clearCountdownTimer();
    clearEfficiencyTimer();
    dispatch({ type: 'RESET_GAME' });
  };

  const handlePlayerDataSubmit = (data: PlayerData) => {
    dispatch({ type: 'SET_PLAYER_DATA', payload: data });
    dispatch({ type: 'SET_GAME_STATE', payload: 'menu' });
  };

  const nextPhase = () => dispatch({ type: 'SET_GAME_STATE', payload: 'phaseCompleted' });

  const proceedToNextPhase = () => {
    const newTotalScore = state.totalScore + state.score + state.efficiencyBonus;
    dispatch({ type: 'SET_TOTAL_SCORE', payload: newTotalScore });

    const nextIndex = state.currentPhase + 1;
    if (nextIndex < GAME_PHASES.length) {
      // start next phase
      startPhase(nextIndex);
    } else {
      dispatch({ type: 'SET_GAME_STATE', payload: 'completed' });
    }
  };

  const phase = GAME_PHASES[state.currentPhase];

  // UI: data entry
  if (state.gameState === 'dataEntry') {
    return <PlayerDataForm onSubmit={handlePlayerDataSubmit} />;
  }

  // UI: menu
  if (state.gameState === 'menu') {
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
  if (state.gameState === 'completed') {
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
                Pontuação Final: {state.totalScore}
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
                  onClick={() => dispatch({ type: 'SET_GAME_STATE', payload: 'dataEntry' })}
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
  if (state.gameState === 'gameOver') {
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
                Pontuação Final: {state.totalScore + state.score}
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
                  onClick={() => dispatch({ type: 'SET_GAME_STATE', payload: 'dataEntry' })}
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
  if (state.gameState === 'phaseCompleted') {
    const isLastPhase = state.currentPhase === GAME_PHASES.length - 1;

    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center p-4 md:p-6">
        <Card className="w-full max-w-2xl mx-2 bg-card/90 backdrop-blur-sm border-success/20 shadow-glow">
          <CardContent className="p-6 md:p-12 text-center">
            <div className="animate-scale-in">
              <div className="text-8xl mb-6 animate-pulse">🎉</div>
              <h1 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-success bg-clip-text text-transparent">
                Fase {state.currentPhase + 1} Completada!
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-6">
                Excelente trabalho!
              </p>

              <div className="space-y-4 mb-8">
                <div className="text-lg md:text-2xl font-bold text-foreground">
                  Pontos da Fase: {state.score}
                </div>
                <div className="text-lg md:text-2xl font-bold text-success">
                  Bônus Eficiência: {state.efficiencyBonus}
                </div>
                <div className="text-xl md:text-3xl font-bold text-primary">
                  Total: {state.totalScore + state.score + state.efficiencyBonus}
                </div>
              </div>

              {!isLastPhase && (
                <div className="mb-8 p-4 md:p-6 bg-primary/10 rounded-xl border border-primary/20">
                  <h3 className="text-lg md:text-2xl font-bold text-primary mb-2">
                    Próxima Fase:
                  </h3>
                  <p className="text-base md:text-lg text-foreground">
                    {GAME_PHASES[state.currentPhase + 1].description}
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
                <span className="text-foreground">Pontos: {state.score}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-foreground">Tentativas: {state.moves}/{Math.floor(state.cards.length / 2) + 2}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-foreground">Pares: {state.matchedPairs}/{Math.floor(state.cards.length / 2)}</span>
              </div>
            </div>
          
          {/* Cronômetro visível apenas na fase 3 (index 2) enquanto jogando */}
          {state.currentPhase === 2 && state.gameState === 'playing' && (
            <div className="text-center mt-4">
              <div className="inline-block px-4 md:px-6 py-2 bg-black/70 rounded-xl border border-white/20">
                <p className="text-base md:text-lg text-white font-bold">
                  Tempo restante: <span className="text-red-500">{state.countdown}s</span>
                </p>
              </div>
            </div>
          )}

          {state.currentPhase === 2 && state.timeUp && (
            <div className="text-center mt-4">
              <p className="text-red-600 font-semibold text-base md:text-lg">Tempo esgotado!</p>
            </div>
          )}
        </div>

        {/* Preview Button */}
        {state.gameState === 'playing' && (
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
              ({state.previewUsesLeft})
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
          {state.cards.map((card) => (
            <GameCard
              key={card.id}
              id={card.id}
              image={card.image}
              isFlipped={card.isFlipped}
              isMatched={card.isMatched}
              showingPreview={state.showingPreview}
              showOverlay={state.showOverlay}
              gameState={state.gameState}
              onClick={handleCardClick}
            />
          ))}
        </div>

        {/* Preview Overlay */}
        {state.showOverlay && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          </div>
        )}

      </div>

      <div>
        {state.timeUp && (
          <div className="text-red-500 text-center font-bold text-xl mt-4">
            Tempo esgotado!
          </div>
        )}
      </div>
    </div>
  );
};

export default MemoryGame;
