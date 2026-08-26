import type { ReactNode } from 'react';

interface CardResumoProps {
  titulo: string;
  valor: string;
  variacao?: string;
  destaque?: 'positivo' | 'negativo' | 'neutro';
  icone?: ReactNode;
}

export default function CardResumo({ titulo, valor, variacao, destaque = 'neutro', icone }: CardResumoProps) {
  const corVariacao =
    destaque === 'positivo' ? 'text-secondary' :
    destaque === 'negativo' ? 'text-danger' :
    'text-text-secondary';

  return (
    <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
      <div>
        <p className="text-text-secondary text-sm font-sans">{titulo}</p>
        <p className="text-text-primary text-xl font-bold font-sans mt-1">
          {valor}
          {variacao && <span className={`${corVariacao} text-sm font-semibold ml-2`}>{variacao}</span>}
        </p>
      </div>
      {icone && <div className="icon-badge w-11 h-11 text-white">{icone}</div>}
    </div>
  );
}