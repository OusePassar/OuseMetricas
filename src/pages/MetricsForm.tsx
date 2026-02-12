import { useState } from 'react';
import { db } from '../../src/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { Header } from '../../src/components/Header';
import type { WebinarMetrics } from '../../src/types/metrics';

export function MetricsForm() {
  const [formData, setFormData] = useState<Partial<WebinarMetrics>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const vendasTotais = Number(formData.vendasAula || 0) + Number(formData.vendasComercial || 0) + Number(formData.vendasReplay || 0);
    const faturamento = vendasTotais * Number(formData.pitchValor || 0);
    const investimentoReal = Number(formData.investimento || 0) + Number(formData.custoApi || 0);
    const roas = investimentoReal > 0 ? faturamento / investimentoReal : 0;

    await addDoc(collection(db, "webinar_metrics"), {
      ...formData,
      faturamentoTotal: faturamento,
      roas: Number(roas.toFixed(2)),
      createdAt: new Date()
    });
    alert("Dados salvos!");
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <Header />
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-8 grid grid-cols-2 gap-4">
        <input type="text" placeholder="Semana" className="bg-white/5 p-3 rounded" onChange={e => setFormData({...formData, semana: e.target.value})} />
        <input type="number" placeholder="Investimento Tráfego" className="bg-white/5 p-3 rounded" onChange={e => setFormData({...formData, investimento: Number(e.target.value)})} />
        <input type="number" placeholder="Custo API Oficial" className="bg-white/5 p-3 rounded" onChange={e => setFormData({...formData, custoApi: Number(e.target.value)})} />
        <input type="number" placeholder="Vendas Aula" className="bg-white/5 p-3 rounded" onChange={e => setFormData({...formData, vendasAula: Number(e.target.value)})} />
        <input type="number" placeholder="Valor do Pitch" className="bg-white/5 p-3 rounded" onChange={e => setFormData({...formData, pitchValor: Number(e.target.value)})} />
        <button className="col-span-2 bg-yellow-500 text-black font-bold p-4 rounded uppercase">Salvar Relatório</button>
      </form>
    </div>
  );
}