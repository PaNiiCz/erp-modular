import type { ProdutoMaisVendido } from '../../types/dashboard';

interface Props {
  produtos: ProdutoMaisVendido[];
}

export default function ProdutosMaisVendidos({ produtos }: Props) {
  return (
    <div className="glass-card rounded-2xl p-6">
      <p className="text-text-secondary text-sm font-sans mb-4">Produtos mais vendidos</p>
      <div className="space-y-3">
        {produtos.map((p) => (
          <div key={p.produto_id} className="flex justify-between items-center">
            <div>
              <p className="text-text-primary font-sans text-sm">{p.nome}</p>
              <p className="text-text-secondary text-xs font-sans">{p.sku}</p>
            </div>
            <div className="text-right">
              <p className="text-secondary font-sans text-sm font-bold">{p.quantidade_vendida}x</p>
              <p className="text-text-secondary text-xs font-sans">R$ {p.valor_total_vendido}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}