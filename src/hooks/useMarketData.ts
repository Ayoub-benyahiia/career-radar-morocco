import { useCallback, useEffect, useState } from 'react';
import type {
  City,
  JobTitle,
  MarketAggregates,
  MarketDataset,
  MarketMeta,
  OfferLite,
  Skill,
  SkillPairingsMap,
} from '../types/career';

interface UseMarketDataResult {
  dataset: MarketDataset | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Impossible de charger ${url} (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export function useMarketData(): UseMarketDataResult {
  const [dataset, setDataset] = useState<MarketDataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [skills, cities, offers, titles, pairings, aggregates, meta] = await Promise.all([
        fetchJson<Skill[]>('/data/skills.json'),
        fetchJson<City[]>('/data/cities.json'),
        fetchJson<OfferLite[]>('/data/offers-lite.json'),
        fetchJson<JobTitle[]>('/data/titles.json'),
        fetchJson<SkillPairingsMap>('/data/pairings.json'),
        fetchJson<MarketAggregates>('/data/aggregates.json'),
        fetchJson<MarketMeta>('/data/meta.json'),
      ]);

      setDataset({
        skills,
        cities,
        offers,
        titles,
        pairings,
        aggregates,
        meta,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erreur lors du chargement des données du marché IT.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { dataset, loading, error, reload: load };
}
