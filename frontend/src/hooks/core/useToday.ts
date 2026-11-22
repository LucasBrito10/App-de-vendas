import { useEffect, useState } from 'react';
import { todayIso } from '../../lib/date';

/**
 * "Hoje" no fuso do aparelho, atualizando à meia-noite (o app pode ficar aberto de um dia
 * para o outro, e o que está atrasado muda com a data).
 */
export function useToday(): string {
  const [today, setToday] = useState(todayIso);

  useEffect(() => {
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
    const timer = setTimeout(() => setToday(todayIso()), midnight.getTime() - now.getTime());
    return () => clearTimeout(timer);
  }, [today]);

  return today;
}
