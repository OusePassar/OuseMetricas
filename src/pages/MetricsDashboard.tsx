import { useEffect, useState } from 'react';
import { db } from '../../src/lib/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import type { WebinarMetrics } from '../../src/types/metrics';
import { Header } from '../../src/components/Header';

export function MetricsDashboard() {
  const [reports, setReports] = useState<WebinarMetrics[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const q = query(collection(db, "webinar_metrics"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setReports(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as WebinarMetrics)));
    };
    fetch();
  }, []);

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <Header />
      <main className="p-8">
        <table className="w-full bg-white/5 rounded-lg overflow-hidden">
          <thead className="text-[10px] uppercase opacity-50">
            <tr>
              <th className="p-4">Semana</th>
              <th className="p-4">Investimento (Tráfego + API)</th>
              <th className="p-4 text-yellow-500">ROAS</th>
            </tr>
          </thead>
          <tbody>
            {reports.map(r => (
              <tr key={r.id} className="border-t border-white/5">
                <td className="p-4 text-center">{r.semana}</td>
                <td className="p-4 text-center">R$ {(Number(r.investimento) + Number(r.custoApi)).toLocaleString()}</td>
                <td className="p-4 text-center font-black text-yellow-500">{r.roas}x</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}