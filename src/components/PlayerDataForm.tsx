import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserCheck, Star, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface PlayerData {
  name: string;
  number: string;
  timestamp: string;
}

interface PlayerDataFormProps {
  onSubmit: (data: PlayerData) => void;
}

const PlayerDataForm: React.FC<PlayerDataFormProps> = ({ onSubmit }) => {
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const savePlayerData = (playerData: PlayerData) => {
    try {
      // Get existing data from localStorage or create new array
      const existingDataStr = localStorage.getItem('gamePlayerData');
      const existingData: PlayerData[] = existingDataStr ? JSON.parse(existingDataStr) : [];
      
      // Add new player data
      const updatedData = [...existingData, playerData];
      
      // Save back to localStorage
      localStorage.setItem('gamePlayerData', JSON.stringify(updatedData));
      
      toast({
        title: "Dados salvos!",
        description: `Jogador cadastrado! Total de ${updatedData.length} jogadores registrados.`,
      });
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar os dados.",
        variant: "destructive",
      });
    }
  };

  const exportToExcel = () => {
    try {
      const existingDataStr = localStorage.getItem('gamePlayerData');
      const existingData: PlayerData[] = existingDataStr ? JSON.parse(existingDataStr) : [];
      
      if (existingData.length === 0) {
        toast({
          title: "Nenhum dado encontrado",
          description: "Não há dados de jogadores para exportar.",
          variant: "destructive",
        });
        return;
      }

      // Create Excel workbook
      const ws = XLSX.utils.json_to_sheet(existingData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Jogadores');
      
      // Download Excel file
      XLSX.writeFile(wb, 'dados_jogadores_memoria.xlsx');
      
      toast({
        title: "Arquivo exportado!",
        description: `${existingData.length} registros exportados com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível exportar os dados.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !number.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o nome e o número.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    const playerData: PlayerData = {
      name: name.trim(),
      number: number.trim(),
      timestamp: new Date().toLocaleString('pt-BR')
    };

    // Save player data
    savePlayerData(playerData);
    
    // Simulate processing time for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setIsSubmitting(false);
    onSubmit(playerData);
  };

  return (
    <div className="min-h-screen bg-gradient-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md bg-card/90 backdrop-blur-sm border-primary/20 shadow-glow">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <UserCheck className="w-16 h-16 mx-auto mb-4 text-primary animate-pulse-glow" />
            <h1 className="text-3xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
              Dados do Jogador
            </h1>
            <p className="text-muted-foreground">
              Preencha seus dados para começar o jogo
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground font-medium">
                Nome Completo
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Digite seu nome completo"
                className="bg-background/50 border-primary/20 focus:border-primary"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="number" className="text-foreground font-medium">
                Número/Telefone
              </Label>
              <Input
                id="number"
                type="tel"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="Digite seu número ou telefone"
                className="bg-background/50 border-primary/20 focus:border-primary"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full text-lg py-6 bg-gradient-primary hover:scale-105 transition-transform shadow-button"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Salvando...
                </div>
              ) : (
                <>
                  <Star className="w-5 h-5 mr-2" />
                  Começar Jogo
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 space-y-4">
            <Button
              onClick={exportToExcel}
              variant="outline"
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar Dados para Excel
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              <p>Seus dados são salvos automaticamente. Use o botão acima para exportar.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlayerDataForm;