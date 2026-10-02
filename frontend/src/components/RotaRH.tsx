import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { verificarAcessoRH } from '../services/rh';

export default function RotaRH({ children }: { children: ReactNode }) {
  const [acesso, setAcesso] = useState<boolean | null>(null);

  useEffect(() => {
    let ativo = true;
    verificarAcessoRH().then((ok) => {
      if (ativo) setAcesso(ok);
    });
    return () => {
      ativo = false;
    };
  }, []);

  if (acesso === null) return <div className="app-bg min-h-screen" />;
  if (!acesso) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}