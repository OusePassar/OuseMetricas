import { useEffect, useState, useMemo } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import type { WebinarMetrics } from '../types/metrics';
import { Header } from '../components/Header';
import * as XLSX from 'xlsx';

// Ícones e Gráficos
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { 
  DollarSign, Users, TrendingUp, BarChart3, 
  Download, MousePointer2, Settings2, Check,
  ChevronLeft, ChevronRight, CalendarDays
} from 'lucide-react';

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const formatDateBR = (dateStr: string | undefined) => {
  if (!dateStr) return "N/A";
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
};

export function MetricsDashboard() {
  const [reports, setReports] = useState<WebinarMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros Globais (Dropdowns)
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

  // --- NOVOS FILTROS DE PERÍODO ESPECÍFICO (CALENDÁRIO) ---
  const [dateStart, setDateStart] = useState<string>('');
  const [dateEnd, setDateEnd] = useState<string>('');

  // Estados de Paginação e Colunas
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showColMenu, setShowColMenu] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    semana: true, mes: true, ano: true, dataInicio: false, 
    dataFim: false, leads: true, txEntrada: true,
    vendas: true, faturamento: true, roas: true
  });

  const toggleColumn = (key: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getColumnLabel = (key: string) => {
    switch(key) {
      case 'txEntrada': return 'Taxa Entrada';
      case 'dataInicio': return 'Data Início';
      case 'dataFim': return 'Data Fim';
      default: return key.charAt(0).toUpperCase() + key.slice(1);
    }
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        const q = query(collection(db, "webinar_metrics"), orderBy("createdAt", "asc"));
        const snap = await getDocs(q);
        setReports(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as WebinarMetrics)));
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  // --- LÓGICA DE FILTRO REFORMULADA ---
  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      if (!r.dataInicio) return false;
      
      const reportDate = new Date(r.dataInicio + "T00:00:00");
      const month = (reportDate.getMonth() + 1).toString();
      const year = reportDate.getFullYear().toString();

      // Filtro por Calendário (Dia a Dia) - Prioridade Máxima
      if (dateStart && r.dataInicio < dateStart) return false;
      if (dateEnd && r.dataInicio > dateEnd) return false;

      // Filtro por Dropdown (Mês/Ano) - Só aplica se o calendário estiver vazio
      if (!dateStart && !dateEnd) {
        const monthMatch = selectedMonth === 'all' || month === selectedMonth;
        const yearMatch = selectedYear === 'all' || year === selectedYear;
        if (!monthMatch || !yearMatch) return false;
      }

      return true;
    });
  }, [reports, selectedMonth, selectedYear, dateStart, dateEnd]);

  useEffect(() => { setCurrentPage(1); }, [selectedMonth, selectedYear, dateStart, dateEnd, itemsPerPage]);

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const reversed = [...filteredReports].reverse();
    const startIndex = (currentPage - 1) * itemsPerPage;
    return reversed.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredReports, currentPage, itemsPerPage]);

  const formatR$ = (val: number | undefined | null) => (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatNum = (val: number | undefined | null) => (val || 0).toLocaleString('pt-BR');

  const latestReport = filteredReports.length > 0 ? filteredReports[filteredReports.length - 1] : null;
  const totalFaturamento = filteredReports.reduce((acc, curr) => acc + (curr.faturamentoTotal || 0), 0);
  const totalLeads = filteredReports.reduce((acc, curr) => acc + (curr.leads || 0), 0);
  const totalInvestido = filteredReports.reduce((acc, curr) => acc + (curr.totalInvestido || 0), 0);
  const avgRoas = totalInvestido > 0 ? totalFaturamento / totalInvestido : 0;

  const exportToExcel = () => {
    if (filteredReports.length === 0) return alert("Sem dados.");
    const ws = XLSX.utils.json_to_sheet(filteredReports);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Métricas");
    XLSX.writeFile(wb, `OuseMetricas_Export.xlsx`);
  };

  if (loading) return <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center text-yellow-500 font-black italic uppercase tracking-widest animate-pulse font-sans">Carregando...</div>;

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-[#E0E0E0] antialiased pb-20 font-sans">
      <Header />
      
      <main className="p-4 md:p-8 max-w-[1800px] mx-auto space-y-8">
        
        {/* HEADER E FILTROS DROPDOWN */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-[#161616] p-6 rounded-xl border border-white/5 shadow-2xl">
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter uppercase">OUSE<span className="text-yellow-500 underline">MÉTRICAS</span></h1>
            <p className="text-[10px] text-gray-500 font-bold tracking-[0.3em] uppercase">Performance Dashboard</p>
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            <select value={selectedMonth} onChange={(e) => { setSelectedMonth(e.target.value); setDateStart(''); setDateEnd(''); }} className="bg-[#0F0F0F] border border-white/10 text-xs font-bold p-2.5 px-4 rounded-lg outline-none focus:border-yellow-500 transition-colors cursor-pointer">
              <option value="all">Todos os Meses</option>
              {MONTH_NAMES.map((m, i) => <option key={m} value={(i + 1).toString()}>{m}</option>)}
            </select>
            <select value={selectedYear} onChange={(e) => { setSelectedYear(e.target.value); setDateStart(''); setDateEnd(''); }} className="bg-[#0F0F0F] border border-white/10 text-xs font-bold p-2.5 px-4 rounded-lg outline-none focus:border-yellow-500 transition-colors cursor-pointer">
              <option value="all">Todos os Anos</option>
              {["2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026"].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button onClick={exportToExcel} className="flex items-center gap-2 bg-yellow-500 text-black text-[10px] font-black py-3 px-6 rounded-lg hover:bg-yellow-400 transition-all uppercase shadow-lg shadow-yellow-500/10"><Download size={14} /> Exportar</button>
          </div>
        </div>

        {/* CARDS KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="FATURAMENTO PERÍODO" value={formatR$(totalFaturamento)} icon={<DollarSign size={20} className="text-green-500" />} trend={latestReport ? `${(latestReport.roas || 0).toFixed(2)}x ROAS ÚLT.` : ""} color="bg-green-500/10" />
          <StatCard title="LEADS NO PERÍODO" value={formatNum(totalLeads)} icon={<Users size={20} className="text-blue-500" />} trend={latestReport ? `${(latestReport.txEntrada || 0).toFixed(1)}% CONV. GRUPO` : ""} color="bg-blue-500/10" />
          <StatCard title="ROAS MÉDIO" value={`${avgRoas.toFixed(2)}x`} icon={<TrendingUp size={20} className="text-yellow-500" />} color="bg-yellow-500/10" />
          <StatCard title="INVESTIMENTO TOTAL" value={formatR$(totalInvestido)} icon={<BarChart3 size={20} className="text-purple-500" />} color="bg-purple-500/10" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* GRÁFICO COM FILTRO DE DATA POR CALENDÁRIO */}
          <div className="lg:col-span-2 bg-[#161616] p-8 rounded-2xl border border-white/5 shadow-2xl overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">EVOLUÇÃO FINANCEIRA</h3>
              
              {/* INPUTS DE DATA (SUBSTITUI O BRUSH) */}
              <div className="flex items-center gap-3 bg-[#0F0F0F] p-2 rounded-xl border border-white/5">
                <CalendarDays size={14} className="text-yellow-500 ml-1" />
                <input 
                  type="date" 
                  value={dateStart} 
                  onChange={(e) => setDateStart(e.target.value)}
                  className="bg-transparent text-[10px] font-bold text-white outline-none border-r border-white/10 pr-2 cursor-pointer"
                />
                <span className="text-[10px] text-gray-600 font-bold uppercase">Até</span>
                <input 
                  type="date" 
                  value={dateEnd} 
                  onChange={(e) => setDateEnd(e.target.value)}
                  className="bg-transparent text-[10px] font-bold text-white outline-none cursor-pointer"
                />
              </div>
            </div>

            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filteredReports}>
                  <defs>
                    <linearGradient id="colorFat" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EAB308" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#EAB308" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                  <XAxis 
                    dataKey="dataInicio" 
                    stroke="#444" 
                    fontSize={9} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10} 
                    tickFormatter={(val) => formatDateBR(val).substring(0, 5)} 
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }} 
                    itemStyle={{ color: '#EAB308', fontSize: '12px', fontWeight: 'bold' }}
                    labelFormatter={(val) => formatDateBR(val)}
                    formatter={(v: any) => [formatR$(v), "Faturamento"]} 
                  />
                  <Area type="monotone" dataKey="faturamentoTotal" stroke="#EAB308" strokeWidth={3} fill="url(#colorFat)" animationDuration={1000} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* FUNIL */}
          <div className="bg-[#161616] p-8 rounded-2xl border border-white/5 shadow-2xl">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-10">QUEBRA DE VENDAS</h3>
            {latestReport ? (
              <div className="space-y-8">
                <FunnelRow label="Vendas Aula" value={latestReport.vendasAula || 0} total={latestReport.vendasTotal || 0} color="bg-green-500" />
                <FunnelRow label="Vendas Comercial" value={latestReport.vendasComercial || 0} total={latestReport.vendasTotal || 0} color="bg-blue-500" />
                <FunnelRow label="Vendas Replay" value={latestReport.vendasReplay || 0} total={latestReport.vendasTotal || 0} color="bg-yellow-500" />
                <FunnelRow label="Vendas Funil" value={latestReport.vendasFunil || 0} total={latestReport.vendasTotal || 0} color="bg-purple-500" />
                <div className="pt-10 mt-10 border-t border-white/5 grid grid-cols-2 gap-6">
                  <div className="bg-white/5 p-4 rounded-xl text-center border border-white/5">
                    <p className="text-[9px] text-gray-500 uppercase mb-1 font-bold tracking-widest">Total Unidades</p>
                    <p className="text-2xl font-mono font-bold text-white">{latestReport.vendasTotal || 0}</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl text-center border border-white/5">
                    <p className="text-[9px] text-gray-500 uppercase mb-1 font-bold tracking-widest">ROAS Semana</p>
                    <p className="text-2xl font-mono font-bold text-yellow-500">{(latestReport.roas || 0).toFixed(2)}x</p>
                  </div>
                </div>
              </div>
            ) : <div className="h-full flex items-center justify-center text-gray-600 text-xs italic uppercase tracking-widest font-bold">Sem dados</div>}
          </div>
        </div>

        {/* TABELA PAGINADA */}
        <div className="bg-[#161616] rounded-2xl border border-white/5 overflow-hidden shadow-2xl relative">
          <div className="p-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-center bg-white/[0.02] gap-4">
            <div className="flex items-center gap-3">
              <MousePointer2 size={16} className="text-yellow-500" />
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Histórico Detalhado ({filteredReports.length})</h3>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3 bg-[#0F0F0F] p-1 px-3 rounded-lg border border-white/10">
                <span className="text-[10px] font-bold text-gray-500 uppercase">Linhas:</span>
                <select 
                  value={itemsPerPage} 
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="bg-transparent text-[10px] font-black text-yellow-500 outline-none cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div className="relative">
                <button onClick={() => setShowColMenu(!showColMenu)} className="flex items-center gap-2 bg-[#0F0F0F] border border-white/10 px-4 py-2 rounded-lg text-[10px] font-bold uppercase hover:border-yellow-500 transition-all text-gray-400">
                  <Settings2 size={14} /> Colunas
                </button>
                {showColMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-2xl z-50 p-3">
                    {Object.keys(visibleColumns).map((col) => (
                      <button key={col} onClick={() => toggleColumn(col as keyof typeof visibleColumns)} className="w-full flex items-center justify-between p-2.5 hover:bg-white/5 rounded-lg text-[10px] font-bold uppercase transition-all">
                        <span className={visibleColumns[col as keyof typeof visibleColumns] ? "text-white" : "text-gray-600"}>{getColumnLabel(col)}</span>
                        {visibleColumns[col as keyof typeof visibleColumns] && <Check size={14} className="text-yellow-500" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] whitespace-nowrap">
              <thead className="bg-[#1C1C1C] text-gray-500 uppercase font-black tracking-widest border-b border-white/5">
                <tr>
                  {visibleColumns.semana && <th className="p-5 border-r border-white/5 text-center">Semana (Período)</th>}
                  {visibleColumns.mes && <th className="p-5 text-center">Mês</th>}
                  {visibleColumns.ano && <th className="p-5 text-center">Ano</th>}
                  {visibleColumns.dataInicio && <th className="p-5 text-center">Início</th>}
                  {visibleColumns.dataFim && <th className="p-5 text-center">Fim</th>}
                  {visibleColumns.leads && <th className="p-5 text-center">Leads</th>}
                  {visibleColumns.txEntrada && <th className="p-5 text-center">Tx. Entrada</th>}
                  {visibleColumns.vendas && <th className="p-5 text-center">Vendas</th>}
                  {visibleColumns.faturamento && <th className="p-5 text-center">Faturamento</th>}
                  {visibleColumns.roas && <th className="p-5 text-center">ROAS</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedData.map((r) => {
                  const date = new Date(r.dataInicio + "T00:00:00");
                  return (
                    <tr key={r.id} className="hover:bg-white/[0.03] transition-colors group text-center">
                      {visibleColumns.semana && (
                        <td className="p-5 font-bold text-white border-r border-white/5">
                          {r.semana} <span className="text-[10px] text-gray-500 font-normal block italic opacity-60">({formatDateBR(r.dataInicio)} — {formatDateBR(r.dataFim)})</span>
                        </td>
                      )}
                      {visibleColumns.mes && <td className="p-5 text-gray-400 uppercase font-bold tracking-tighter">{MONTH_NAMES[date.getMonth()]}</td>}
                      {visibleColumns.ano && <td className="p-5 text-gray-500 font-mono">{date.getFullYear()}</td>}
                      {visibleColumns.dataInicio && <td className="p-5 text-gray-400">{formatDateBR(r.dataInicio)}</td>}
                      {visibleColumns.dataFim && <td className="p-5 text-gray-400">{formatDateBR(r.dataFim)}</td>}
                      {visibleColumns.leads && <td className="p-5 text-gray-400 text-center">{formatNum(r.leads)}</td>}
                      {visibleColumns.txEntrada && <td className="p-5 text-blue-400 font-black text-center">{(r.txEntrada || 0).toFixed(1)}%</td>}
                      {visibleColumns.vendas && <td className="p-5 text-gray-300 font-mono text-center">{r.vendasTotal || 0}</td>}
                      {visibleColumns.faturamento && <td className="p-5 font-mono text-green-400 font-bold text-center">{formatR$(r.faturamentoTotal)}</td>}
                      {visibleColumns.roas && (
                        <td className="p-5 text-center">
                          <span className="bg-yellow-500/10 text-yellow-500 px-4 py-1.5 rounded-full font-black text-[10px] border border-yellow-500/20 shadow-sm">
                            {(r.roas || 0).toFixed(2)}x
                          </span>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="p-6 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                Página <span className="text-white">{currentPage}</span> de <span className="text-white">{totalPages}</span>
              </span>
              <div className="flex gap-3">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="p-2.5 bg-[#0F0F0F] border border-white/10 rounded-xl disabled:opacity-20 hover:border-yellow-500 transition-all shadow-xl"
                >
                  <ChevronLeft size={20} className="text-yellow-500" />
                </button>
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="p-2.5 bg-[#0F0F0F] border border-white/10 rounded-xl disabled:opacity-20 hover:border-yellow-500 transition-all shadow-xl"
                >
                  <ChevronRight size={20} className="text-yellow-500" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function StatCard({ title, value, icon, trend, color }: any) {
  return (
    <div className="bg-[#161616] p-6 rounded-2xl border border-white/5 relative group transition-all shadow-xl hover:border-white/10 hover:-translate-y-1">
      <div className="flex justify-between items-start">
        <div className="space-y-3">
          <p className="text-[9px] font-bold text-gray-500 tracking-[0.2em] uppercase">{title}</p>
          <h2 className="text-2xl font-mono font-bold text-white tracking-tighter">{value}</h2>
          {trend && (
            <div className="flex items-center gap-1.5 text-[10px] text-green-500 font-black uppercase tracking-tight bg-green-500/5 px-2.5 py-1 rounded-full border border-green-500/10">
              <TrendingUp size={12} /> {trend}
            </div>
          )}
        </div>
        <div className={`p-4 rounded-xl ${color} border border-white/5 shadow-inner group-hover:scale-110 transition-transform`}>{icon}</div>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FunnelRow({ label, value, total, color }: any) {
  const width = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="space-y-3">
      <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rotate-45 ${color} shadow-lg shadow-black/50`}></div>
          <span className="text-gray-400">{label}</span>
        </div>
        <span className="text-white font-mono">{value}</span>
      </div>
      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/[0.02]">
        <div 
          className={`h-full ${color} transition-all duration-1000 ease-out shadow-lg`} 
          style={{ width: `${Math.max(width, 2)}%` }}
        ></div>
      </div>
    </div>
  );
}