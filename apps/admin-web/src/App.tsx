import { useMemo, useState } from 'react';
import { formatAttendeeCount, statusLabel, type EveningStatusType } from '@tecap/shared';

const statuses: Array<{ name: string; type: EveningStatusType; city: string; venue: string }> = [
  { name: 'Léa M.', type: 'concert', city: 'Saint-Brieuc', venue: 'Le Chaland' },
  { name: 'Tom R.', type: 'bar', city: 'Saint-Brieuc', venue: 'Centre-ville' },
  { name: 'Maya P.', type: 'chill', city: 'Lamballe', venue: 'Chez des amis' },
];
const passes = [
  { id: 'TC-0001', name: 'Léa M.', state: 'Validé', time: '22:14' },
  { id: 'TC-0002', name: 'Tom R.', state: 'En attente', time: '—' },
  { id: 'TC-0003', name: 'Maya P.', state: 'Refusé · déjà utilisé', time: '22:06' },
];

export function App() {
  const [city, setCity] = useState('Toutes les villes');
  const [tab, setTab] = useState('overview');
  const filteredStatuses = useMemo(
    () => (city === 'Toutes les villes' ? statuses : statuses.filter((item) => item.city === city)),
    [city],
  );
  return (
    <div className='shell'>
      <aside>
        <div className='brand'>
          <span className='brand-mark'>T</span>
          <div>
            <strong>TÉCAP</strong>
            <small>OPS CONSOLE</small>
          </div>
        </div>
        <nav>
          {[
            ['overview', 'Vue d’ensemble'],
            ['people', 'Utilisateurs'],
            ['events', 'Events'],
            ['passes', 'Pass & scans'],
            ['sources', 'Acquisition'],
          ].map(([id, label]) => (
            <button
              key={id}
              className={tab === id ? 'nav-item active' : 'nav-item'}
              onClick={() => setTab(id)}
            >
              <span>
                {
                  (
                    {
                      overview: '⌂',
                      people: '◎',
                      events: '✦',
                      passes: '▣',
                      sources: '◌',
                    } as Record<string, string>
                  )[id]
                }
              </span>
              {label}
            </button>
          ))}
        </nav>
        <div className='side-foot'>
          <span className='online' /> Système opérationnel
        </div>
      </aside>
      <main>
        <header>
          <div>
            <p className='eyebrow'>VENDREDI 25 OCTOBRE 2026</p>
            <h1>
              {tab === 'overview'
                ? 'Bonsoir, Noé.'
                : tab === 'passes'
                  ? 'Pass & scans'
                  : tab === 'events'
                    ? 'Événements'
                    : 'Vue d’ensemble'}
            </h1>
          </div>
          <div className='header-actions'>
            <select value={city} onChange={(event) => setCity(event.target.value)}>
              <option>Toutes les villes</option>
              <option>Saint-Brieuc</option>
              <option>Lamballe</option>
            </select>
            <div className='user'>NP</div>
          </div>
        </header>
        <section className='metrics'>
          <Metric label='Préinscrits' value='1 284' delta='+18,4%' tone='pink' />
          <Metric label='Actifs ce soir' value='247' delta='+12,1%' tone='purple' />
          <Metric label='Participants Night' value='128' delta='+32,8%' tone='blue' />
          <Metric label='Pass scannés' value='86' delta='67,2%' tone='green' />
        </section>
        <div className='grid'>
          <section className='panel chart-panel'>
            <div className='panel-head'>
              <div>
                <h2>Funnel de conversion</h2>
                <p>Préinscription → entrée validée · 30 derniers jours</p>
              </div>
              <button className='ghost'>30 jours⌄</button>
            </div>
            <div className='funnel'>
              <FunnelRow label='Préinscrits' value='1 284' width='100%' color='pink' />
              <FunnelRow label='Comptes créés' value='872' width='68%' color='purple' />
              <FunnelRow label='Inscrits Night' value='356' width='43%' color='blue' />
              <FunnelRow label='Pass générés' value='214' width='29%' color='violet' />
              <FunnelRow label='Pass utilisés' value='128' width='19%' color='green' />
            </div>
          </section>
          <section className='panel'>
            <div className='panel-head'>
              <div>
                <h2>Statuts en direct</h2>
                <p>{city === 'Toutes les villes' ? 'Toutes les villes' : city}</p>
              </div>
              <span className='live-badge'>
                <i /> LIVE
              </span>
            </div>
            <div className='status-list'>
              {filteredStatuses.map((item) => (
                <div className='status-row' key={item.name}>
                  <div className={`mini-avatar ${item.type}`} />{' '}
                  <div className='status-person'>
                    <strong>{item.name}</strong>
                    <span>
                      {statusLabel[item.type]} · {item.venue}
                    </span>
                  </div>
                  <span className='status-city'>{item.city}</span>
                </div>
              ))}
            </div>
            <button className='link-button'>Voir tous les statuts →</button>
          </section>
        </div>
        <section className='panel pass-panel'>
          <div className='panel-head'>
            <div>
              <h2>Derniers scans</h2>
              <p>Validation partenaire · TÉCAP Night #01 · {formatAttendeeCount(128)}</p>
            </div>
            <button className='ghost'>Exporter CSV</button>
          </div>
          <table>
            <thead>
              <tr>
                <th>Pass</th>
                <th>Participant</th>
                <th>État</th>
                <th>Heure</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {passes.map((pass) => (
                <tr key={pass.id}>
                  <td>
                    <b>{pass.id}</b>
                  </td>
                  <td>{pass.name}</td>
                  <td>
                    <span
                      className={`state ${pass.state.startsWith('Validé') ? 'ok' : pass.state.startsWith('Refusé') ? 'bad' : 'pending'}`}
                    >
                      <i />
                      {pass.state}
                    </span>
                  </td>
                  <td>{pass.time}</td>
                  <td className='dots'>•••</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}
function Metric({
  label,
  value,
  delta,
  tone,
}: {
  label: string;
  value: string;
  delta: string;
  tone: string;
}) {
  return (
    <div className={`metric ${tone}`}>
      <span className='metric-label'>{label}</span>
      <strong>{value}</strong>
      <span className='metric-delta'>↗ {delta}</span>
      <div className='spark'>
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
function FunnelRow({
  label,
  value,
  width,
  color,
}: {
  label: string;
  value: string;
  width: string;
  color: string;
}) {
  return (
    <div className='funnel-row'>
      <div className='funnel-meta'>
        <span>{label}</span>
        <b>{value}</b>
      </div>
      <div className='funnel-track'>
        <div className={`funnel-fill ${color}`} style={{ width }} />
      </div>
    </div>
  );
}
