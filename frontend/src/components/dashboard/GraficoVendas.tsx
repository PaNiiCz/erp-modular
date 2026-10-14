import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { VendaPorDia } from '../../types/dashboard';

interface Props {
  dados: VendaPorDia[];
}

export default function GraficoVendas({ dados }: Props) {
  const dadosFormatados = useMemo(
    () =>
      dados.map((d) => ({
        dia: d.dia.slice(8, 10),
        faturamento: parseFloat(d.faturamento),
      })),
    [dados]
  );

  return (
    <div className="glass-card glass-sem-hover rounded-2xl p-6">
      <p className="text-text-secondary text-sm font-sans mb-4">Faturamento (últimos dias)</p>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={dadosFormatados}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2d4d" />
          <XAxis dataKey="dia" stroke="#a0a3c4" fontSize={12} />
          <YAxis stroke="#a0a3c4" fontSize={12} />
          <Tooltip
            contentStyle={{ background: '#1a1d3a', border: 'none', borderRadius: '8px' }}
            labelStyle={{ color: '#a0a3c4' }}
          />
          <Line
            type="monotone"
            dataKey="faturamento"
            stroke="#7c5cff"
            strokeWidth={3}
            dot={{ fill: '#2dd4ff' }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}