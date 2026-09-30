import { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import { ChevronDown } from 'lucide-react';

interface Opcao {
  valor: string;
  label: string;
}

interface Props {
  value: string;
  onChange: (valor: string) => void;
  opcoes: Opcao[];
  className?: string;
}

export default function Select({ value, onChange, opcoes, className = '' }: Props) {
  const [aberto, setAberto] = useState(false);
  const [destacado, setDestacado] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const listaRef = useRef<HTMLDivElement>(null);

  const indiceSelecionado = Math.max(
    0,
    opcoes.findIndex((o) => o.valor === value)
  );
  const selecionado = opcoes.find((o) => o.valor === value);

  const abrir = () => {
    setDestacado(indiceSelecionado);
    setAberto(true);
  };

  const fechar = () => setAberto(false);

  const escolher = (indice: number) => {
    onChange(opcoes[indice].valor);
    fechar();
  };

  // Fecha ao clicar fora
  useEffect(() => {
    function handleClickFora(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAberto(false);
      }
    }
    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, []);

  // Mantém a opção destacada visível quando a lista tem rolagem
  useEffect(() => {
    if (!aberto) return;
    const el = listaRef.current?.children[destacado] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [destacado, aberto]);

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (!aberto) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        abrir();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setDestacado((i) => Math.min(i + 1, opcoes.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setDestacado((i) => Math.max(i - 1, 0));
        break;
      case 'Home':
        e.preventDefault();
        setDestacado(0);
        break;
      case 'End':
        e.preventDefault();
        setDestacado(opcoes.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        escolher(destacado);
        break;
      case 'Escape':
        e.preventDefault();
        fechar();
        break;
      case 'Tab':
        fechar();
        break;
    }
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={aberto}
        onClick={() => (aberto ? fechar() : abrir())}
        onKeyDown={handleKeyDown}
        onKeyUp={(e) => {
          // Evita o clique "fantasma" do Espaço no Firefox
          if (e.key === ' ') e.preventDefault();
        }}
        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-text-primary text-sm font-sans outline-none focus:border-primary flex items-center justify-between"
      >
        <span>{selecionado?.label ?? 'Selecione'}</span>
        <ChevronDown size={14} className={`text-text-secondary transition-transform ${aberto ? 'rotate-180' : ''}`} />
      </button>

      {aberto && (
        <div
          ref={listaRef}
          role="listbox"
          className="absolute z-50 mt-1 w-full rounded-lg border border-white/10 bg-[#1a1d3a] shadow-lg overflow-hidden max-h-60 overflow-y-auto"
        >
          {opcoes.map((op, i) => {
            const ehSelecionado = op.valor === value;
            const ehDestacado = i === destacado;
            return (
              <button
                key={op.valor}
                type="button"
                role="option"
                aria-selected={ehSelecionado}
                tabIndex={-1}
                onMouseEnter={() => setDestacado(i)}
                onClick={() => escolher(i)}
                className={`w-full text-left px-3 py-2 text-sm font-sans ${
                  ehSelecionado
                    ? 'bg-primary text-white'
                    : ehDestacado
                    ? 'bg-white/10 text-text-primary'
                    : 'text-text-primary'
                }`}
              >
                {op.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}