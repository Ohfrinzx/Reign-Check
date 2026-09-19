import type { GameState, StatKey } from '../../game/types';
import { STAT_META, STAT_ORDER, band, bandTone, money } from '../../game/stats';

const TONE: Record<string, string> = {
  good: 'var(--good)', ok: 'var(--ok)', warn: 'var(--warn)', bad: 'var(--bad)',
};

export function StatBar({ s, flash }: { s: GameState; flash?: Partial<Record<StatKey, number>> }) {
  return (
    <div className="statbar">
      {STAT_ORDER.map((k) => {
        const meta = STAT_META[k];
        const v = s.stats[k];
        const pct = meta.money ? Math.max(0, Math.min(100, (v / 100) * 100)) : v;
        const tone = meta.money ? (v > 45 ? 'good' : v > 22 ? 'ok' : v > 6 ? 'warn' : 'bad') : bandTone(v);
        const d = flash?.[k];
        return (
          <div className="stat" key={k}>
            <div className="stat-head">
              <span className="stat-label">{meta.short}</span>
              <span className="stat-val" style={{ color: TONE[tone] }}>
                {meta.money ? money(v) : Math.round(v)}
              </span>
            </div>
            <div className="stat-track">
              <div
                className="stat-fill"
                style={{ width: `${Math.max(1.5, pct)}%`, background: TONE[tone] }}
              />
            </div>
            {d !== undefined && Math.abs(d) >= 0.05 && (
              <span key={`${k}-${d}-${s.stat.decisions}`} className={`stat-delta ${d > 0 ? 'up' : 'down'}`}>
                {d > 0 ? '+' : '−'}{Math.abs(d).toFixed(1)}
              </span>
            )}
            <div className="stat-tip">
              <b>{meta.label} — {meta.money ? money(v) : `${Math.round(v)} / 100 (${band(v)})`}</b>
              {meta.tip}
              <span className="danger">{meta.danger}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
