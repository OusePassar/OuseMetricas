export interface WebinarMetrics {
  id?: string;
  semana: string;
  dataInicio: string;
  dataFim: string;
  leads: number;
  leadsGrupo: number;
  picoAoVivo: number;
  pitchValor: number;
  vendasAula: number;
  vendasComercial: number;
  vendasReplay: number;
  investimento: number;
  custoApi: number; 
  faturamentoTotal: number;
  roas: number;
  createdAt: Date;
}