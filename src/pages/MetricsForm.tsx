import { useState, useRef } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { Header } from '../components/Header';
import type { WebinarMetrics } from '../types/metrics';
import * as XLSX from 'xlsx';
import { FileSpreadsheet, Loader2, Save } from 'lucide-react';

export function MetricsForm() {
  const [formData, setFormData] = useState<Partial<WebinarMetrics>>({});
  const [displayValues, setDisplayValues] = useState<Record<string, string>>({});
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- FUNÇÕES DE FORMATAÇÃO PARA O MANUAL ---
  const formatNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const formatCurrency = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (!digits) return "";
    const amount = (Number(digits) / 100).toFixed(2);
    const [int, dec] = amount.split('.');
    const formattedInt = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `R$ ${formattedInt},${dec}`;
  };

  const handleInputChange = (field: keyof WebinarMetrics, value: string, type: 'number' | 'currency' | 'text' | 'date') => {
    let formatted = value;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let rawValue: any = value;

    if (type === 'number') {
      formatted = formatNumber(value);
      rawValue = Number(value.replace(/\D/g, ''));
    } else if (type === 'currency') {
      formatted = formatCurrency(value);
      rawValue = Number(value.replace(/\D/g, '')) / 100;
    }

    setDisplayValues(prev => ({ ...prev, [field]: formatted }));
    setFormData(prev => ({ ...prev, [field]: rawValue }));
  };

  // --- LÓGICA DE IMPORTAÇÃO EM MASSA (EXCEL) ---
  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        setIsImporting(true);
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows = XLSX.utils.sheet_to_json(ws) as any[];

        if (rows.length === 0) return;

        const confirmImport = window.confirm(`Detectamos ${rows.length} linhas. Deseja importar tudo diretamente para o banco de dados?`);
        
        if (confirmImport) {
          // IMPORTAÇÃO EM MASSA
          for (const row of rows) {
            const leads = Number(row["Leads Totais"] || 0);
            const leadsGrupo = Number(row["Leads no Grupo"] || 0);
            const picoAoVivo = Number(row["Pico ao Vivo"] || 0);
            const pitchValor = Number(row["Valor Pitch"] || 0);
            const vAula = Number(row["Vendas Aula"] || 0);
            const vComercial = Number(row["Vendas Comercial"] || 0);
            const vReplay = Number(row["Vendas Replay"] || 0);
            const vFunil = Number(row["Vendas Funil"] || 0);
            const invest = Number(row["Investimento Tráfego"] || 0);
            const api = Number(row["Custo API"] || 0);

            const vendasTotal = vAula + vComercial + vReplay + vFunil;
            const faturamentoTotal = vendasTotal * pitchValor;
            const totalInvestido = invest + api;

            const metricsCalc = {
              semana: String(row["Semana"] || ""),
              dataInicio: row["Data Início"] || "",
              dataFim: row["Data Fim"] || "",
              leads, leadsGrupo, investimento: invest, custoApi: api, picoAoVivo, pitchValor,
              vendasAula: vAula, vendasComercial: vComercial, vendasReplay: vReplay, vendasFunil: vFunil,
              vendasTotal, faturamentoTotal, totalInvestido,
              faturamentoAula: vAula * pitchValor,
              txEntrada: leads > 0 ? (leadsGrupo / leads) * 100 : 0,
              percentComparecimento: leads > 0 ? (picoAoVivo / leads) * 100 : 0,
              percentVendasAula: picoAoVivo > 0 ? (vAula / picoAoVivo) * 100 : 0,
              roas: totalInvestido > 0 ? faturamentoTotal / totalInvestido : 0,
              observacoes: row["Observações"] || "",
              createdAt: new Date()
            };
            await addDoc(collection(db, "webinar_metrics"), metricsCalc);
          }
          alert("Importação concluída!");
        } else {
          // SE CANCELAR A MASSA, APENAS PREENCHE O FORMULÁRIO COM A PRIMEIRA LINHA
          const first = rows[0];
          handleInputChange('semana', first["Semana"] || "", 'text');
          handleInputChange('leads', String(first["Leads Totais"] || 0), 'number');
          // ... (pode adicionar os outros campos aqui se quiser que ele preencha o form)
        }
      } catch (err) {
        alert("Erro ao importar."+ err);
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  // --- SALVAR MANUAL ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const leads = Number(formData.leads || 0);
    const leadsGrupo = Number(formData.leadsGrupo || 0);
    const picoAoVivo = Number(formData.picoAoVivo || 0);
    const pitchValor = Number(formData.pitchValor || 0);
    const vAula = Number(formData.vendasAula || 0);
    const vComercial = Number(formData.vendasComercial || 0);
    const vReplay = Number(formData.vendasReplay || 0);
    const vFunil = Number(formData.vendasFunil || 0);
    const invest = Number(formData.investimento || 0);
    const api = Number(formData.custoApi || 0);

    const vendasTotal = vAula + vComercial + vReplay + vFunil;
    const faturamentoTotal = vendasTotal * pitchValor;
    const totalInvestido = invest + api;
    
    const metricsCalc = {
      txEntrada: leads > 0 ? (leadsGrupo / leads) * 100 : 0,
      percentComparecimento: leads > 0 ? (picoAoVivo / leads) * 100 : 0,
      percentVendasAula: picoAoVivo > 0 ? (vAula / picoAoVivo) * 100 : 0,
      faturamentoAula: vAula * pitchValor,
      vendasTotal, faturamentoTotal, totalInvestido,
      roas: totalInvestido > 0 ? faturamentoTotal / totalInvestido : 0,
      createdAt: new Date()
    };

    try {
      await addDoc(collection(db, "webinar_metrics"), { ...formData, ...metricsCalc });
      alert("Salvo com sucesso!");
      setFormData({});
      setDisplayValues({});
    } catch (error) {
      alert("Erro ao salvar." + error);
    }
  };

  const inputStyle = "bg-white/5 border border-white/10 p-3 rounded-lg focus:border-yellow-500 outline-none transition-all text-sm w-full text-white";
  const labelStyle = "text-[10px] uppercase font-bold opacity-50 mb-1 ml-1 text-gray-400";

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white antialiased pb-20 font-sans">
      <Header />
      
      <div className="max-w-4xl mx-auto px-8 pt-8 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-yellow-500 italic uppercase leading-tight">Métricas</h2>
          <p className="text-xs text-gray-500 uppercase tracking-[0.2em]">Entrada manual ou via planilha</p>
        </div>

        <div className="flex gap-3">
          <input type="file" ref={fileInputRef} onChange={handleExcelImport} accept=".xlsx, .xls" className="hidden" />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="flex items-center gap-2 bg-[#1A1A1A] hover:bg-white/10 border border-white/5 p-3 px-6 rounded-lg transition-all text-xs font-bold uppercase"
          >
            {isImporting ? <Loader2 className="animate-spin text-yellow-500" size={16}/> : <FileSpreadsheet className="text-green-500" size={16}/>}
            {isImporting ? "Importando..." : "Subir Planilha"}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="md:col-span-3 border-b border-white/5 pb-2 flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
          <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Configuração da Semana</h3>
        </div>
        
        <div className="flex flex-col">
          <label className={labelStyle}>Semana</label>
          <input type="text" placeholder="Ex: Semana 01" className={inputStyle} value={displayValues.semana || ''} onChange={e => handleInputChange('semana', e.target.value, 'text')} />
        </div>
        <div className="flex flex-col">
          <label className={labelStyle}>Data Início</label>
          <input type="date" className={inputStyle} value={formData.dataInicio || ''} onChange={e => setFormData({...formData, dataInicio: e.target.value})} />
        </div>
        <div className="flex flex-col">
          <label className={labelStyle}>Data Fim</label>
          <input type="date" className={inputStyle} value={formData.dataFim || ''} onChange={e => setFormData({...formData, dataFim: e.target.value})} />
        </div>

        <div className="md:col-span-3 border-b border-white/5 pb-2 mt-4 text-yellow-500 font-bold uppercase text-[10px] tracking-widest">Tráfego & Investimento</div>
        
        <div className="flex flex-col">
          <label className={labelStyle}>Leads Totais</label>
          <input type="text" placeholder="0" className={inputStyle} value={displayValues.leads || ''} onChange={e => handleInputChange('leads', e.target.value, 'number')} />
        </div>
        <div className="flex flex-col">
          <label className={labelStyle}>Leads no Grupo</label>
          <input type="text" placeholder="0" className={inputStyle} value={displayValues.leadsGrupo || ''} onChange={e => handleInputChange('leadsGrupo', e.target.value, 'number')} />
        </div>
        <div className="flex flex-col">
          <label className={labelStyle}>Investimento Tráfego</label>
          <input type="text" placeholder="R$ 0,00" className={inputStyle} value={displayValues.investimento || ''} onChange={e => handleInputChange('investimento', e.target.value, 'currency')} />
        </div>

        <div className="md:col-span-3 border-b border-white/5 pb-2 mt-4 text-yellow-500 font-bold uppercase text-[10px] tracking-widest">Performance de Vendas</div>
        
        <div className="flex flex-col">
          <label className={labelStyle}>Pico ao Vivo</label>
          <input type="text" placeholder="0" className={inputStyle} value={displayValues.picoAoVivo || ''} onChange={e => handleInputChange('picoAoVivo', e.target.value, 'number')} />
        </div>
        <div className="flex flex-col">
          <label className={labelStyle}>Valor Produto (Pitch)</label>
          <input type="text" placeholder="R$ 0,00" className={inputStyle} value={displayValues.pitchValor || ''} onChange={e => handleInputChange('pitchValor', e.target.value, 'currency')} />
        </div>
        <div className="flex flex-col">
          <label className={labelStyle}>Vendas na Aula</label>
          <input type="text" placeholder="0" className={inputStyle} value={displayValues.vendasAula || ''} onChange={e => handleInputChange('vendasAula', e.target.value, 'number')} />
        </div>
        <div className="flex flex-col">
          <label className={labelStyle}>Vendas Comercial</label>
          <input type="text" placeholder="0" className={inputStyle} value={displayValues.vendasComercial || ''} onChange={e => handleInputChange('vendasComercial', e.target.value, 'number')} />
        </div>
        <div className="flex flex-col">
          <label className={labelStyle}>Vendas Replay</label>
          <input type="text" placeholder="0" className={inputStyle} value={displayValues.vendasReplay || ''} onChange={e => handleInputChange('vendasReplay', e.target.value, 'number')} />
        </div>
        <div className="flex flex-col">
          <label className={labelStyle}>Vendas Funil</label>
          <input type="text" placeholder="0" className={inputStyle} value={displayValues.vendasFunil || ''} onChange={e => handleInputChange('vendasFunil', e.target.value, 'number')} />
        </div>

        <div className="md:col-span-3 flex flex-col mt-4">
          <label className={labelStyle}>Observações</label>
          <textarea 
            placeholder="..." 
            className={`${inputStyle} h-24 resize-none`} 
            value={formData.observacoes || ''}
            onChange={e => setFormData({...formData, observacoes: e.target.value})}
          ></textarea>
        </div>

        <button 
          type="submit"
          className="md:col-span-3 bg-yellow-500 text-black font-black p-4 rounded-xl uppercase hover:bg-yellow-400 transition-all mt-6 flex items-center justify-center gap-2"
        >
          <Save size={18} /> Salvar Relatório Individual
        </button>
      </form>
    </div>
  );
}