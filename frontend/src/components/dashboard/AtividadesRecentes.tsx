import type { AtividadeRecente } from '../../types/dashboard';

interface Props {
  atividades: AtividadeRecente[];
}

const iconePorTipo: Record<string, string> = {
  venda: '🛒',
  compra: '📦',
  estoque: '📊',
};

export default function AtividadesRecentes({ atividades }: Props) {
  return (
    <div className="glass-card rounded-2xl p-6">
      <p className="text-text-secondary text-sm font-sans mb-4">Atividades recentes</p>
      <div className="space-y-3">
        {atividades.map((a, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-lg">{iconePorTipo[a.tipo]}</span>
            <div>
              <p className="text-text-primary font-sans text-sm">{a.descricao}</p>
              <p className="text-text-secondary text-xs font-sans">
                {new Date(a.data).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}