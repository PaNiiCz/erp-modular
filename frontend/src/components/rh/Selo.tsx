import type { Cor } from './utilidades';

const classes: Record<Cor, string> = {
  verde: 'bg-secondary/20 text-secondary',
  vermelho: 'bg-danger/20 text-danger',
  azul: 'bg-accent-blue/20 text-accent-blue',
  amarelo: 'bg-warning/20 text-warning',
  cinza: 'bg-white/10 text-text-secondary',
};

export default function Selo({ texto, cor }: { texto: string; cor: Cor }) {
  return <span className={`px-2 py-1 rounded-full text-xs ${classes[cor]}`}>{texto}</span>;
}