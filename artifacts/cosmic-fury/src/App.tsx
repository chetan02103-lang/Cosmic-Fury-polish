import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import {
  ChevronRight,
  Crosshair,
  Gauge,
  Lock,
  Medal,
  Radio,
  Shield,
  Sparkles,
  Target,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';

type Screen =
  | 'home'
  | 'game'
  | 'garage'
  | 'missions'
  | 'achievements'
  | 'leaderboard'
  | 'settings'
  | 'results';
type SaveData = {
  credits: number;
  highScore: number;
  runs: number;
  kills: number;
  bestCombo: number;
  ship: string;
  level: number;
  xp: number;
  upgrades: Record<string, number>;
  unlocked: string[];
  shipsUnlocked: string[];
};
type ShipSpec = {
  name: string;
  role: string;
  ability: string;
  hull: number;
  damage: number;
  speed: number;
  energy: number;
  cost: number;
  unlockAt: number;
};

const queryClient = new QueryClient();
const SAVE_KEY = 'cosmic-fury-save-v1';
const defaultSave: SaveData = {
  credits: 1240,
  highScore: 18240,
  runs: 7,
  kills: 284,
  bestCombo: 14,
  ship: 'VANGUARD',
  level: 2,
  xp: 680,
  upgrades: { hull: 2, cannons: 1, reactor: 2 },
  unlocked: ['first-blood', 'deep-run'],
  shipsUnlocked: ['VANGUARD'],
};
const shipSpecs: ShipSpec[] = [
  { name: 'VANGUARD', role: 'Balanced interceptor', ability: 'Pulse dash', hull: 78, damage: 72, speed: 76, energy: 68, cost: 0, unlockAt: 0 },
  { name: 'LANCER', role: 'Aggressive striker', ability: 'Double shot', hull: 58, damage: 92, speed: 84, energy: 62, cost: 900, unlockAt: 2 },
  { name: 'WRAITH', role: 'High-speed scout', ability: 'Cloak field', hull: 46, damage: 68, speed: 99, energy: 88, cost: 1600, unlockAt: 4 },
  { name: 'BULWARK', role: 'Heavy shield platform', ability: 'Impact barrier', hull: 100, damage: 64, speed: 42, energy: 74, cost: 2400, unlockAt: 6 },
  { name: 'NOVA', role: 'Experimental destroyer', ability: 'Nova burst', hull: 82, damage: 100, speed: 72, energy: 100, cost: 4200, unlockAt: 10 },
];

function loadSave(): SaveData {
  try {
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}') as Partial<SaveData>;
    return {
      ...defaultSave,
      ...raw,
      upgrades: { ...defaultSave.upgrades, ...(raw.upgrades || {}) },
      unlocked: raw.unlocked || defaultSave.unlocked,
      shipsUnlocked: raw.shipsUnlocked || defaultSave.shipsUnlocked,
    };
  } catch {
    return defaultSave;
  }
}
function saveGame(data: SaveData) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}
function xpForNextLevel(level: number) {
  return 850 + level * 550;
}
function getShip(name: string) {
  return shipSpecs.find((ship) => ship.name === name) || shipSpecs[0];
}

const navItems: { id: Exclude<Screen, 'game' | 'results'>; label: string }[] = [
  { id: 'home', label: 'Command' },
  { id: 'garage', label: 'Garage' },
  { id: 'missions', label: 'Missions' },
  { id: 'achievements', label: 'Records' },
  { id: 'leaderboard', label: 'Ranks' },
  { id: 'settings', label: 'Settings' },
];

function Logo({ onClick }: { onClick: () => void }) {
  return (
    <button className="cf-logo" onClick={onClick} data-testid="button-logo-home" aria-label="Return to command deck">
      <span className="cf-logo-mark" />
      <span className="cf-logo-word">COSMIC FURY</span>
    </button>
  );
}

function Shell({
  screen,
  setScreen,
  save,
  children,
}: {
  screen: Screen;
  setScreen: (screen: Screen) => void;
  save: SaveData;
  children: ReactNode;
}) {
  const xpProgress = Math.min(100, (save.xp / xpForNextLevel(save.level)) * 100);
  return (
    <div className="cf-app">
      <div className="cf-topline" />
      <div className="cf-shell">
        <nav className="cf-nav">
          <Logo onClick={() => setScreen('home')} />
          <div className="cf-nav-links">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`cf-nav-btn ${screen === item.id ? 'active' : ''}`}
                onClick={() => setScreen(item.id)}
                data-testid={`button-nav-${item.id}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="cf-player">
            <div>
              <div className="cf-label">Pilot / R-07</div>
              <div className="cf-mono cf-amber" style={{ fontSize: 11 }}>
                {save.credits.toLocaleString()} CR
              </div>
            </div>
            <span className="cf-avatar">R7</span>
          </div>
        </nav>
        <div className="cf-level-strip">
          <span className="cf-label cf-amber">Level {String(save.level).padStart(2, '0')}</span>
          <div className="cf-progress"><span style={{ width: `${xpProgress}%` }} /></div>
          <span className="cf-mono">{save.xp} / {xpForNextLevel(save.level)} XP</span>
          <span className="cf-label">Next unlock: {save.level < 4 ? 'WRAITH' : 'BULWARK'}</span>
        </div>
        {children}
      </div>
    </div>
  );
}

function Home({ save, setScreen }: { save: SaveData; setScreen: (screen: Screen) => void }) {
  const ship = getShip(save.ship);
  const missionProgress = Math.min(100, ((save.kills % 35) / 35) * 100);
  return (
    <main className="cf-main-grid">
      <section>
        <div className="cf-kicker">Sector 09 / threat level rising</div>
        <h1 className="cf-title">COSMIC<span>FURY</span></h1>
        <p className="cf-subtitle">The frontier is collapsing. Burn through the swarm, chain your kills, and take the night back one run at a time.</p>
        <div className="cf-actions">
          <button className="cf-btn primary" onClick={() => setScreen('game')} data-testid="button-launch-sortie">
            <Crosshair size={15} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            Launch sortie
          </button>
          <button className="cf-btn" onClick={() => setScreen('garage')} data-testid="button-open-garage">
            Configure vessel
          </button>
        </div>
        <div className="cf-stat-strip">
          <div className="cf-stat"><div className="cf-label">Best run</div><div className="cf-stat-value">{save.highScore.toLocaleString()}</div></div>
          <div className="cf-stat"><div className="cf-label">Confirmed kills</div><div className="cf-stat-value">{save.kills}</div></div>
          <div className="cf-stat"><div className="cf-label">Best chain</div><div className="cf-stat-value">{save.bestCombo}x</div></div>
        </div>
        <div className="cf-home-directive">
          <div className="cf-label cf-amber">Next directive / live</div>
          <div className="cf-directive-row">
            <div>
              <h3>Break the line</h3>
              <p>Destroy 35 hostiles in a single sortie.</p>
              <div className="cf-progress"><span style={{ width: `${missionProgress}%` }} /></div>
            </div>
            <strong className="cf-mono cf-cyan">{save.kills % 35}/35</strong>
          </div>
          <button className="cf-text-link" onClick={() => setScreen('missions')}>View all directives <ChevronRight size={14} /></button>
        </div>
      </section>
      <section className="cf-hero-radar" aria-label="Live tactical radar">
        <div className="cf-radar">
          <div className="cf-radar-sweep" /><div className="cf-radar-cross" /><div className="cf-radar-cross vertical" /><div className="cf-radar-core" />
          <i className="cf-orbit-dot one" /><i className="cf-orbit-dot two" /><i className="cf-orbit-dot three" />
          <span className="cf-radar-tag a">SCN / 04</span><span className="cf-radar-tag b">ION FIELD // LIVE</span><span className="cf-radar-tag c">SIGNAL LOCKED</span>
        </div>
        <div className="cf-radar-caption"><Radio size={14} /><span>Telemetry stable / {ship.name} ready</span></div>
      </section>
    </main>
  );
}

function Dashboard({ save, setScreen }: { save: SaveData; setScreen: (screen: Screen) => void }) {
  const ship = getShip(save.ship);
  return (
    <section className="cf-dashboard">
      <div className="cf-section-title"><div><div className="cf-label cf-cyan">Command deck / 01</div><h2>Ready room</h2></div><p className="cf-label">Local telemetry / synced</p></div>
      <div className="cf-dash-grid">
        <div className="cf-card"><div className="cf-label cf-amber">Active directive</div><div className="cf-mission-card" style={{ marginTop: 18 }}><div className="cf-mission-copy"><h3>Break the line</h3><p style={{ color: 'hsl(var(--muted-foreground))', margin: 0 }}>Destroy 35 hostiles in a single sortie.</p><div className="cf-progress"><span style={{ width: `${Math.min(100, (save.kills % 35) / 35 * 100)}%` }} /></div></div><strong className="cf-mono cf-cyan">{save.kills % 35}/35</strong></div><button className="cf-btn amber" style={{ marginTop: 25 }} onClick={() => setScreen('game')} data-testid="button-resume-directive">Continue directive</button></div>
        <div className="cf-card"><div className="cf-label cf-cyan">Vessel status</div><h3 style={{ marginTop: 15 }}>{ship.name}</h3><div className="cf-list" style={{ marginTop: 12 }}><div className="cf-list-row"><span>Hull integrity</span><strong className="cf-cyan">{ship.hull}%</strong></div><div className="cf-list-row"><span>Ion cannons</span><strong className="cf-amber">MK-{save.upgrades.cannons}</strong></div><div className="cf-list-row"><span>Flight hours</span><strong>{(save.runs * 1.7).toFixed(1)}H</strong></div></div><button className="cf-btn" style={{ marginTop: 15 }} onClick={() => setScreen('garage')} data-testid="button-status-garage">Open garage</button></div>
      </div>
      <div className="cf-section-title" style={{ marginTop: 48 }}><div><div className="cf-label cf-amber">Systems overview</div><h2>What waits beyond</h2></div></div>
      <div className="cf-feature-grid">
        {[['01', 'Live combat loop', 'Move, shoot, survive. Every second adds pressure.'], ['02', 'Escalating sectors', 'Push toward the boss breach before the swarm closes.'], ['03', 'Build your legend', 'Upgrades, records, and new hulls persist between runs.'], ['04', 'No two sorties', 'Power-ups shift the tempo. Adapt or disappear.']].map(([num, title, text]) => <div className="cf-feature" key={num}><div className="cf-feature-mark">{num}</div><div><h4>{title}</h4><p>{text}</p></div></div>)}
      </div>
    </section>
  );
}

function StatBar({ label, value, tone = 'cyan' }: { label: string; value: number; tone?: 'cyan' | 'amber' }) {
  return <div className="cf-statbar"><div><span>{label}</span><strong>{value}</strong></div><div className={`cf-progress ${tone === 'amber' ? 'amber' : ''}`}><span style={{ width: `${value}%` }} /></div></div>;
}

function Garage({ save, setSave }: { save: SaveData; setSave: (save: SaveData) => void }) {
  const [previewShip, setPreviewShip] = useState(save.ship);
  const active = getShip(previewShip);
  const upgradeData = [
    { key: 'hull', name: 'Reinforced hull', description: 'Adds one hit point to the run.', stat: 'Hull integrity', max: 5, base: 360, icon: <Shield size={17} /> },
    { key: 'cannons', name: 'Ion cannons', description: 'Tightens fire cadence and impact.', stat: 'Fire cadence', max: 5, base: 480, icon: <Target size={17} /> },
    { key: 'reactor', name: 'Flux reactor', description: 'Extends power-up duration.', stat: 'Energy reserve', max: 5, base: 540, icon: <Zap size={17} /> },
  ];
  const equipOrUnlock = (ship: ShipSpec) => {
    if (save.shipsUnlocked.includes(ship.name)) {
      const next = { ...save, ship: ship.name };
      setSave(next); saveGame(next); setPreviewShip(ship.name); return;
    }
    if (save.level < ship.unlockAt || save.credits < ship.cost) return;
    const next = { ...save, credits: save.credits - ship.cost, ship: ship.name, shipsUnlocked: [...save.shipsUnlocked, ship.name] };
    setSave(next); saveGame(next); setPreviewShip(ship.name);
  };
  const upgrade = (key: string, base: number) => {
    const level = save.upgrades[key] || 0;
    const cost = base * (level + 1);
    if (level >= 5 || save.credits < cost) return;
    const next = { ...save, credits: save.credits - cost, upgrades: { ...save.upgrades, [key]: level + 1 } };
    setSave(next); saveGame(next);
  };
  return <section>
    <div className="cf-page-title"><span>Ship</span><br />systems</div>
    <div className="cf-label cf-amber" style={{ marginBottom: 12 }}>Select active hull / hangar 04</div>
    <div className="cf-garage-layout">
      <div className="cf-ship-grid">{shipSpecs.map((ship) => {
        const unlocked = save.shipsUnlocked.includes(ship.name);
        const canUnlock = save.level >= ship.unlockAt && save.credits >= ship.cost;
        return <button className={`cf-card cf-ship ${previewShip === ship.name ? 'active' : ''} ${!unlocked ? 'locked' : ''}`} key={ship.name} onClick={() => setPreviewShip(ship.name)} data-testid={`button-preview-${ship.name.toLowerCase()}`}>
          <div className="cf-ship-art" /><div className="cf-ship-footer"><div><h3>{ship.name}</h3><p>{ship.role}</p></div>{unlocked ? <span className="cf-badge">{save.ship === ship.name ? 'ACTIVE' : 'EQUIP'}</span> : <span className="cf-badge"><Lock size={10} /> {ship.cost.toLocaleString()} CR</span>}</div>
          {!unlocked && <div className="cf-ship-lock">{ship.unlockAt > save.level ? `LEVEL ${ship.unlockAt} REQUIRED` : canUnlock ? 'READY TO UNLOCK' : 'CREDITS REQUIRED'}</div>}
        </button>;
      })}</div>
      <aside className="cf-card cf-ship-inspector"><div className="cf-label cf-cyan">Vessel preview / {active.name}</div><div className="cf-inspector-art"><div className="cf-ship-art large" /></div><h2>{active.name}</h2><p className="cf-muted">{active.role}</p><div className="cf-ability"><Sparkles size={14} className="cf-amber" /><span>Special system</span><strong>{active.ability}</strong></div><div className="cf-statbars"><StatBar label="Hull" value={active.hull} /><StatBar label="Damage" value={active.damage} tone="amber" /><StatBar label="Speed" value={active.speed} /><StatBar label="Energy" value={active.energy} tone="amber" /></div><button className="cf-btn primary full" onClick={() => equipOrUnlock(active)} disabled={active.name === save.ship || (!save.shipsUnlocked.includes(active.name) && (save.level < active.unlockAt || save.credits < active.cost))}>{active.name === save.ship ? 'Active vessel' : save.shipsUnlocked.includes(active.name) ? 'Equip vessel' : `Unlock for ${active.cost.toLocaleString()} CR`}</button></aside>
    </div>
    <div className="cf-section-title" style={{ marginTop: 48 }}><div><div className="cf-label cf-cyan">Workshop / persistent modules</div><h2>Upgrade bay</h2></div><p className="cf-mono cf-amber">{save.credits.toLocaleString()} CR available</p></div>
    <div className="cf-list cf-card">{upgradeData.map((item) => { const level = save.upgrades[item.key] || 0; const cost = item.base * (level + 1); return <div className="cf-upgrade" key={item.key}><div className="cf-upgrade-copy"><div className="cf-upgrade-title">{item.icon}<h3>{item.name}</h3><span className="cf-mono cf-cyan">MK-{level}</span></div><p>{item.description}</p><div className="cf-label">{item.stat} / {level >= item.max ? 'MAX OUTPUT' : `+${level * 8}% → +${(level + 1) * 8}%`}</div><div className="cf-progress amber" style={{ width: 220 }}><span style={{ width: `${level / item.max * 100}%` }} /></div></div><button className="cf-btn amber" disabled={level >= item.max || save.credits < cost} onClick={() => upgrade(item.key, item.base)} data-testid={`button-upgrade-${item.key}`}>{level >= item.max ? 'Maxed' : `${cost.toLocaleString()} CR`}</button></div>; })}</div>
  </section>;
}

function Missions({ setScreen }: { setScreen: (screen: Screen) => void }) {
  const missions = [['Break the line', 'Destroy 35 hostiles in one sortie.', '18 / 35', '52%'], ['No wasted motion', 'Finish a sector without taking hull damage.', 'In progress', '32%'], ['Storm warning', 'Survive the first boss phase.', 'Locked until signal', '0%']];
  return <section><div className="cf-page-title"><span>Active</span><br />directives</div><div className="cf-panel-grid">{missions.map(([title, desc, progress, width], i) => <div className="cf-card" key={title}><div className="cf-label cf-amber">Mission {String(i + 1).padStart(2, '0')}</div><h3 style={{ marginTop: 20 }}>{title}</h3><p style={{ color: 'hsl(var(--muted-foreground))', minHeight: 40 }}>{desc}</p><div className="cf-progress"><span style={{ width }} /></div><div className="cf-list-row" style={{ marginTop: 14 }}><small>{progress}</small><span className="cf-badge">{i === 2 ? 'REDACTED' : '+250 CR'}</span></div></div>)}</div><div className="cf-card" style={{ marginTop: 30, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20 }}><div><div className="cf-label cf-cyan">The fastest way forward</div><h3 style={{ marginTop: 8 }}>Take a live sortie</h3><p style={{ color: 'hsl(var(--muted-foreground))', margin: 0 }}>Directives track in real time while you fly.</p></div><button className="cf-btn primary" onClick={() => setScreen('game')} data-testid="button-mission-sortie">Launch now</button></div></section>;
}

function Records({ kind }: { kind: 'achievements' | 'leaderboard' }) {
  if (kind === 'leaderboard') return <section><div className="cf-page-title"><span>Sector</span><br />rankings</div><div className="cf-card"><div className="cf-list">{[['01', 'NOVA / Aster-9', '84,620', 'VETERAN'], ['02', 'R-07 / You', '18,240', 'PILOT'], ['03', 'KITE / Blackbird', '16,905', 'PILOT'], ['04', 'MOTH / Solace', '12,480', 'ROOKIE'], ['05', 'ION / Meridian', '9,775', 'ROOKIE']].map(([rank, name, score, tier]) => <div className="cf-list-row" key={rank}><span className="cf-mono cf-amber" style={{ width: 30 }}>{rank}</span><strong style={{ flex: 1 }}>{name}</strong><span className="cf-mono cf-cyan">{score}</span><small style={{ width: 65, textAlign: 'right' }}>{tier}</small></div>)}</div></div><p className="cf-label" style={{ marginTop: 14 }}>Local simulation board / all pilots are ghosts from your best runs</p></section>;
  return <section><div className="cf-page-title"><span>Flight</span><br />records</div><div className="cf-panel-grid">{[['first-blood', 'First blood', 'Destroy your first hostile', 'UNLOCKED'], ['deep-run', 'Deep run', 'Reach sector 03', 'UNLOCKED'], ['chain-reactor', 'Chain reactor', 'Build a 25x combo', 'LOCKED'], ['colossus', 'Colossus fall', 'Defeat the sector boss', 'LOCKED'], ['untouchable', 'Untouchable', 'Clear a sector at full hull', 'LOCKED'], ['collector', 'Signal collector', 'Grab three power-ups in one run', 'LOCKED']].map(([id, title, desc, status]) => <div className={`cf-card ${status === 'UNLOCKED' ? 'active' : ''}`} key={id}><div style={{ display: 'flex', justifyContent: 'space-between' }}><Medal size={19} className={status === 'UNLOCKED' ? 'cf-amber' : ''} /><span className="cf-label">{status}</span></div><h3 style={{ marginTop: 25 }}>{title}</h3><p style={{ color: 'hsl(var(--muted-foreground))' }}>{desc}</p></div>)}</div></section>;
}

function SettingsPage({ muted, setMuted, reduced, setReduced }: { muted: boolean; setMuted: (v: boolean) => void; reduced: boolean; setReduced: (v: boolean) => void }) {
  const settings: { title: string; desc: string; value: boolean; toggle: () => void; icon: ReactNode }[] = [
    { title: 'Audio telemetry', desc: 'SFX and launch feedback', value: muted, toggle: () => setMuted(!muted), icon: muted ? <VolumeX size={18} /> : <Volume2 size={18} /> },
    { title: 'Reduced motion', desc: 'Minimize non-essential animation', value: reduced, toggle: () => setReduced(!reduced), icon: <Gauge size={18} /> },
  ];
  return <section><div className="cf-page-title"><span>System</span><br />settings</div><div className="cf-card cf-settings">{settings.map((setting) => <div className="cf-setting" key={setting.title}><div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>{setting.icon}<div><h3>{setting.title}</h3><p>{setting.desc}</p></div></div><button className={`cf-toggle ${setting.value ? 'on' : ''}`} onClick={setting.toggle} data-testid={`button-toggle-${setting.title.toLowerCase().replace(' ', '-')}`} aria-label={`Toggle ${setting.title}`}><span /></button></div>)}</div></section>;
}

type Entity = { x: number; y: number; vx: number; vy: number; r: number; type: string; hp: number; maxHp: number };
type PowerType = 'shield' | 'overdrive' | 'health' | 'bomb' | 'slow';
function Game({ save, finish }: { save: SaveData; finish: (summary: { score: number; kills: number; combo: number }) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hud, setHud] = useState({ score: 0, kills: 0, combo: 0, health: 100, shield: 0, boss: false, bossPhase: 1, paused: false, callout: '', sector: 1, power: '' });
  const keys = useRef(new Set<string>());
  const fireRef = useRef(false);
  const touchRef = useRef({ left: false, right: false });
  const hudRef = useRef(hud); hudRef.current = hud;
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    let width = 0; let height = 0; let raf = 0; let last = performance.now(); let spawnTick = 0; let fireTick = 0; let hudTick = 0; let elapsed = 0; let ended = false; let bossSpawned = false; let bossPhase = 1; let powerType: PowerType | '' = ''; let powerUntil = 0; let shieldUntil = 0;
    const player = { x: 0, y: 0, r: 14, health: 100, shield: 0 }; const enemies: Entity[] = []; const bullets: Entity[] = []; const enemyBullets: Entity[] = []; const particles: Entity[] = []; const powerups: (Entity & { powerType: PowerType })[] = []; let score = 0; let kills = 0; let combo = 0; let comboTimer = 0; let boss: Entity | null = null;
    const resize = () => { width = canvas.width = window.innerWidth * devicePixelRatio; height = canvas.height = window.innerHeight * devicePixelRatio; canvas.style.width = `${window.innerWidth}px`; canvas.style.height = `${window.innerHeight}px`; ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); player.x = width / devicePixelRatio / 2; player.y = height / devicePixelRatio - 115; width /= devicePixelRatio; height /= devicePixelRatio; };
    resize(); window.addEventListener('resize', resize);
    const keyDown = (event: KeyboardEvent) => { keys.current.add(event.key.toLowerCase()); if (event.key === ' ') { event.preventDefault(); fireRef.current = true; } if (event.key.toLowerCase() === 'p') setHud((v) => ({ ...v, paused: !v.paused })); };
    const keyUp = (event: KeyboardEvent) => { keys.current.delete(event.key.toLowerCase()); if (event.key === ' ') fireRef.current = false; };
    window.addEventListener('keydown', keyDown); window.addEventListener('keyup', keyUp);
    const burst = (x: number, y: number, color: string, amount = 13) => { for (let i = 0; i < amount; i++) particles.push({ x, y, vx: (Math.random() - .5) * 150, vy: (Math.random() - .5) * 150, r: Math.random() * 3 + 1, type: color, hp: 1, maxHp: 1 }); };
    const spawn = () => {
      const roll = Math.random(); const difficulty = Math.min(1.7, 1 + elapsed / 48000);
      let type = 'drone'; if (elapsed > 9000 && roll > .78) type = 'fast'; if (elapsed > 15000 && roll > .86) type = 'shooter'; if (elapsed > 22000 && roll > .90) type = 'tank'; if (elapsed > 30000 && roll > .94) type = 'kamikaze'; if (elapsed > 36000 && roll > .96) type = 'shielded';
      const stats: Record<string, [number, number, number]> = { drone: [12, 1, 50], fast: [10, 1, 105], shooter: [15, 2, 42], tank: [23, 5, 30], kamikaze: [13, 1, 150], shielded: [18, 3, 45] };
      const [r, hp, speed] = stats[type]; enemies.push({ x: Math.random() * (width - 50) + 25, y: -30, vx: (Math.random() - .5) * 45, vy: speed * difficulty, r, type, hp, maxHp: hp });
    };
    const dropPower = (x: number, y: number) => { const types: PowerType[] = ['shield', 'overdrive', 'health', 'bomb', 'slow']; const powerType = types[Math.floor(Math.random() * types.length)]; powerups.push({ x, y, vx: 0, vy: 42, r: 10, type: 'powerup', powerType, hp: 1, maxHp: 1 }); };
    const takeDamage = (amount: number) => { if (shieldUntil > elapsed) { burst(player.x, player.y, '#33d4f3', 8); return; } player.health -= amount; burst(player.x, player.y, '#ff5375', 13); };
    const frame = (now: number) => {
      const dt = Math.min(.033, (now - last) / 1000); last = now; elapsed += dt * 1000; const sector = Math.floor(elapsed / 12000) + 1;
      ctx.clearRect(0, 0, width, height); ctx.fillStyle = '#03060c'; ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = 'rgba(59, 172, 204, .045)'; ctx.lineWidth = 1; const grid = 45; for (let x = 0; x < width; x += grid) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); } for (let y = 0; y < height; y += grid) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
      if (!hudRef.current.paused) {
        const move = (keys.current.has('arrowleft') || keys.current.has('a') || touchRef.current.left ? -1 : 0) + (keys.current.has('arrowright') || keys.current.has('d') || touchRef.current.right ? 1 : 0);
        player.x = Math.max(24, Math.min(width - 24, player.x + move * (330 + getShip(save.ship).speed * 1.4) * dt)); if (keys.current.has('arrowup') || keys.current.has('w')) player.y = Math.max(height * .45, player.y - 260 * dt); if (keys.current.has('arrowdown') || keys.current.has('s')) player.y = Math.min(height - 55, player.y + 260 * dt);
        spawnTick += dt * 1000; fireTick += dt * 1000; hudTick += dt * 1000; comboTimer -= dt * 1000;
        const slowFactor = powerType === 'slow' && powerUntil > elapsed ? .58 : 1;
        if (spawnTick > Math.max(210, (720 - elapsed / 105) * slowFactor)) { spawn(); spawnTick = 0; }
        const fireRate = powerType === 'overdrive' && powerUntil > elapsed ? 82 : Math.max(92, 220 - (save.upgrades.cannons || 0) * 20);
        if ((fireRef.current || keys.current.has('enter')) && fireTick > fireRate) { bullets.push({ x: player.x, y: player.y - 24, vx: 0, vy: -580, r: 3, type: 'shot', hp: 1, maxHp: 1 }); fireTick = 0; }
        if (elapsed > 18000 && !bossSpawned) { bossSpawned = true; boss = { x: width / 2, y: -100, vx: 0, vy: 28, r: 52, type: 'boss', hp: 52, maxHp: 52 }; setHud((v) => ({ ...v, boss: true, callout: 'BOSS APPROACHING' })); setTimeout(() => setHud((v) => ({ ...v, callout: '' })), 2400); }
        bullets.forEach((b) => { b.x += b.vx * dt; b.y += b.vy * dt; }); enemies.forEach((e) => { e.x += e.vx * dt; e.y += e.vy * dt; if (e.type === 'kamikaze') e.vy += 5 * dt; if (e.x < e.r || e.x > width - e.r) e.vx *= -1; if (e.type === 'shooter' && Math.random() < .008) enemyBullets.push({ x: e.x, y: e.y + e.r, vx: (player.x - e.x) * .18, vy: 140, r: 5, type: 'orb', hp: 1, maxHp: 1 }); }); enemyBullets.forEach((b) => { b.x += b.vx * dt; b.y += b.vy * dt; }); particles.forEach((p) => { p.x += p.vx * dt; p.y += p.vy * dt; p.hp -= dt * 2; }); powerups.forEach((p) => { p.y += p.vy * dt; });
        if (boss) { boss.y = Math.min(125, boss.y + boss.vy * dt); boss.x = width / 2 + Math.sin(elapsed / 800) * Math.min(220, width / 4); const nextPhase = boss.hp < boss.maxHp * .66 ? boss.hp < boss.maxHp * .33 ? 3 : 2 : 1; if (nextPhase !== bossPhase) { bossPhase = nextPhase; setHud((v) => ({ ...v, bossPhase, callout: `BOSS PHASE ${bossPhase}` })); setTimeout(() => setHud((v) => ({ ...v, callout: '' })), 1300); } if (Math.random() < .018 * bossPhase) enemyBullets.push({ x: boss.x, y: boss.y + boss.r, vx: (player.x - boss.x) * .2, vy: 140 + bossPhase * 25, r: 6, type: 'orb', hp: 1, maxHp: 1 }); if (bossPhase === 3 && Math.random() < .006) spawn(); }
        for (let i = bullets.length - 1; i >= 0; i--) { const b = bullets[i]; let hit = false; const targets = boss ? [...enemies, boss] : enemies; for (const e of targets) { if (Math.hypot(b.x - e.x, b.y - e.y) < b.r + e.r) { e.hp -= 1; hit = true; burst(b.x, b.y, '#ffbd48', 4); if (e.hp <= 0) { score += e.type === 'boss' ? 5000 : e.type === 'elite' ? 600 : e.type === 'tank' ? 420 : 150; kills += 1; combo = comboTimer > 0 ? combo + 1 : 1; comboTimer = 1800; burst(e.x, e.y, e.type === 'boss' ? '#ff5375' : '#33d4f3', e.type === 'boss' ? 45 : 16); if (e.type === 'boss') { boss = null; setHud((v) => ({ ...v, boss: false, callout: 'SECTOR CLEARED' })); setTimeout(() => setHud((v) => ({ ...v, callout: '' })), 2300); } else if (Math.random() > .76) dropPower(e.x, e.y); } break; } } if (hit) bullets.splice(i, 1); }
        for (let i = enemies.length - 1; i >= 0; i--) { const e = enemies[i]; if (e.y > height + 40) { enemies.splice(i, 1); continue; } if (Math.hypot(player.x - e.x, player.y - e.y) < player.r + e.r) { takeDamage(e.type === 'tank' ? 22 : e.type === 'kamikaze' ? 28 : 10); enemies.splice(i, 1); } }
        for (let i = enemyBullets.length - 1; i >= 0; i--) { const b = enemyBullets[i]; if (Math.hypot(player.x - b.x, player.y - b.y) < player.r + b.r) { takeDamage(9); enemyBullets.splice(i, 1); } else if (b.y > height) enemyBullets.splice(i, 1); }
        for (let i = powerups.length - 1; i >= 0; i--) { const p = powerups[i]; if (Math.hypot(player.x - p.x, player.y - p.y) < player.r + p.r) { score += 350; burst(p.x, p.y, '#ffbd48', 18); powerups.splice(i, 1); powerType = p.powerType; powerUntil = elapsed + (p.powerType === 'bomb' ? 1 : 9000); if (p.powerType === 'shield') shieldUntil = elapsed + 7000; if (p.powerType === 'health') player.health = Math.min(100, player.health + 28); if (p.powerType === 'bomb') { enemies.splice(0, enemies.length); burst(player.x, player.y, '#ffbd48', 42); } setHud((v) => ({ ...v, callout: p.powerType.toUpperCase(), power: p.powerType.toUpperCase() })); setTimeout(() => setHud((v) => ({ ...v, callout: '' })), 900); } else if (p.y > height + 30) powerups.splice(i, 1); }
        if (comboTimer <= 0) combo = 0; if (player.health <= 0 && !ended) { ended = true; finish({ score, kills, combo }); return; } if (hudTick > 80) { hudTick = 0; setHud((v) => ({ ...v, score, kills, combo, health: Math.max(0, player.health), shield: shieldUntil > elapsed ? Math.round((shieldUntil - elapsed) / 70) : 0, sector, power: powerUntil > elapsed ? powerType.toUpperCase() : '' })); }
      }
      ctx.fillStyle = 'rgba(129, 213, 238, .55)'; for (let i = 0; i < 65; i++) { const sx = (i * 137) % width; const sy = (i * 71 + elapsed * (i % 3 + 1) * .03) % height; ctx.fillRect(sx, sy, i % 4 === 0 ? 2 : 1, i % 4 === 0 ? 2 : 1); }
      const drawShip = () => { ctx.save(); ctx.translate(player.x, player.y); ctx.fillStyle = '#33d4f3'; ctx.shadowColor = '#33d4f3'; ctx.shadowBlur = 18; ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(18, 16); ctx.lineTo(0, 10); ctx.lineTo(-18, 16); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#ffbd48'; ctx.shadowBlur = 12; ctx.fillRect(-4, 9, 8, 12); if (shieldUntil > elapsed) { ctx.strokeStyle = '#33d4f3'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 28, 0, Math.PI * 2); ctx.stroke(); } ctx.restore(); }; drawShip();
      const drawEntity = (e: Entity, color: string) => { ctx.save(); ctx.translate(e.x, e.y); ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = e.type === 'boss' ? 25 : 12; ctx.beginPath(); if (e.type === 'boss') { ctx.moveTo(0, -e.r); ctx.lineTo(e.r, -10); ctx.lineTo(e.r * .65, e.r); ctx.lineTo(-e.r * .65, e.r); ctx.lineTo(-e.r, -10); } else if (e.type === 'tank') { ctx.rect(-e.r, -e.r, e.r * 2, e.r * 2); } else if (e.type === 'kamikaze') { ctx.moveTo(0, e.r); ctx.lineTo(e.r, -e.r); ctx.lineTo(0, -e.r * .45); ctx.lineTo(-e.r, -e.r); } else { ctx.moveTo(0, e.r); ctx.lineTo(e.r, -e.r); ctx.lineTo(0, -e.r * .45); ctx.lineTo(-e.r, -e.r); } ctx.closePath(); ctx.fill(); if (e.type === 'shielded') { ctx.strokeStyle = '#33d4f3'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, e.r + 5, 0, Math.PI * 2); ctx.stroke(); } ctx.restore(); };
      bullets.forEach((b) => { ctx.fillStyle = '#ffbd48'; ctx.fillRect(b.x - 2, b.y - 10, 4, 13); }); enemies.forEach((e) => drawEntity(e, e.type === 'tank' ? '#b771ff' : e.type === 'shielded' ? '#33d4f3' : e.type === 'fast' ? '#ffbd48' : '#ff5375')); enemyBullets.forEach((b) => drawEntity(b, '#ff5375')); if (boss) { drawEntity(boss, '#ff5375'); ctx.fillStyle = '#29141b'; ctx.fillRect(boss.x - 90, boss.y - 72, 180, 5); ctx.fillStyle = '#ff5375'; ctx.fillRect(boss.x - 90, boss.y - 72, 180 * boss.hp / boss.maxHp, 5); } powerups.forEach((p) => { ctx.strokeStyle = p.powerType === 'health' ? '#7bf5b6' : p.powerType === 'bomb' ? '#ff5375' : '#ffbd48'; ctx.lineWidth = 2; ctx.strokeRect(p.x - 10, p.y - 10, 20, 20); ctx.fillStyle = ctx.strokeStyle; ctx.font = 'bold 9px Space Mono'; ctx.textAlign = 'center'; ctx.fillText(p.powerType[0].toUpperCase(), p.x, p.y + 3); }); particles.forEach((p) => { ctx.globalAlpha = Math.max(0, p.hp); ctx.fillStyle = p.type; ctx.fillRect(p.x, p.y, p.r, p.r); ctx.globalAlpha = 1; });
      raf = requestAnimationFrame(frame);
    }; raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); window.removeEventListener('keydown', keyDown); window.removeEventListener('keyup', keyUp); };
  }, [finish, save.ship, save.upgrades.cannons]);
  const touch = (direction: 'left' | 'right', down: boolean) => { touchRef.current[direction] = down; };
  return <div className="cf-game"><canvas ref={canvasRef} /><div className="cf-game-ui"><div className="cf-game-top"><div className="cf-game-stat"><div className="name">SECTOR</div><div className="value cf-amber">{String(hud.sector).padStart(2, '0')}</div></div><div className="cf-game-stat"><div className="name">SCORE</div><div className="value">{hud.score.toLocaleString()}</div></div><div className="cf-game-stat"><div className="name">CHAIN</div><div className="value cf-amber">{hud.combo ? `${hud.combo}X` : '—'}</div></div><div className="cf-game-stat"><div className="name">HOSTILES</div><div className="value">{String(hud.kills).padStart(2, '0')}</div></div><button className="cf-btn" style={{ pointerEvents: 'auto' }} onClick={() => setHud((v) => ({ ...v, paused: !v.paused }))} data-testid="button-pause-game">Pause</button></div>{hud.boss && <div className="cf-boss-hud"><div className="cf-label cf-accent">Heavy contact / phase {hud.bossPhase}</div><div className="cf-health-bar"><span style={{ width: `${Math.max(0, 100 - (hud.bossPhase - 1) * 30)}%` }} /></div></div>}<div className="cf-game-center">{hud.callout && <div className="cf-callout"><h2>{hud.callout}</h2><p>{hud.callout === 'BOSS APPROACHING' ? 'HEAVY CONTACT / EVASIVE ACTION' : 'SECTOR TELEMETRY UPDATED'}</p></div>}{hud.combo > 1 && !hud.callout && <div className="cf-callout"><h2 style={{ color: 'hsl(var(--primary))', fontSize: 34 }}>{hud.combo}X CHAIN</h2></div>}</div><div className="cf-game-bottom"><div className="cf-health"><div className="cf-label">Hull integrity {hud.health}%</div><div className="cf-health-bar"><span style={{ width: `${hud.health}%` }} /></div><div className="cf-label cf-cyan" style={{ marginTop: 8 }}>{hud.shield ? `Shield ${hud.shield}s` : hud.power ? `Power-up / ${hud.power}` : 'No active power-up'}</div><div className="cf-touch"><button onPointerDown={() => touch('left', true)} onPointerUp={() => touch('left', false)} onPointerLeave={() => touch('left', false)} data-testid="button-touch-left">←</button><button onPointerDown={() => touch('right', true)} onPointerUp={() => touch('right', false)} onPointerLeave={() => touch('right', false)} data-testid="button-touch-right">→</button><button className="fire" onPointerDown={() => { fireRef.current = true; }} onPointerUp={() => { fireRef.current = false; }} onPointerLeave={() => { fireRef.current = false; }} data-testid="button-touch-fire">FIRE</button></div></div><div className="cf-controls-hint">WASD / ARROWS TO PILOT<br />SPACE TO FIRE&nbsp;&nbsp; P TO PAUSE</div></div></div>{hud.paused && <div className="cf-pause"><div className="cf-pause-box"><div className="cf-label cf-amber">Sortie suspended</div><h2>PAUSED</h2><button className="cf-btn primary" onClick={() => setHud((v) => ({ ...v, paused: false }))} data-testid="button-resume-game">Resume sortie</button></div></div>}</div>;
}

function Results({ summary, save, setScreen, setSave }: { summary: { score: number; kills: number; combo: number }; save: SaveData; setScreen: (screen: Screen) => void; setSave: (save: SaveData) => void }) {
  const claim = () => { const earnedXp = Math.max(160, Math.floor(summary.score / 6)); let level = save.level; let xp = save.xp + earnedXp; while (xp >= xpForNextLevel(level)) { xp -= xpForNextLevel(level); level += 1; } const next = { ...save, level, xp, runs: save.runs + 1, kills: save.kills + summary.kills, credits: save.credits + Math.max(120, Math.floor(summary.score / 9)), highScore: Math.max(save.highScore, summary.score), bestCombo: Math.max(save.bestCombo, summary.combo) }; setSave(next); saveGame(next); setScreen('home'); };
  return <section style={{ maxWidth: 900, margin: '0 auto', paddingTop: 60 }}><div className="cf-label cf-amber">Sortie complete / debriefing</div><h1 className="cf-page-title" style={{ marginTop: 15 }}>Run <span>report</span></h1><div className="cf-panel-grid"><div className="cf-card"><div className="cf-label">Final score</div><div className="cf-stat-value" style={{ fontSize: 39, marginTop: 20 }}>{summary.score.toLocaleString()}</div></div><div className="cf-card"><div className="cf-label">Hostiles cleared</div><div className="cf-stat-value" style={{ fontSize: 39, marginTop: 20 }}>{summary.kills}</div></div><div className="cf-card"><div className="cf-label">Peak chain</div><div className="cf-stat-value cf-amber" style={{ fontSize: 39, marginTop: 20 }}>{summary.combo}X</div></div></div><div className="cf-card" style={{ marginTop: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}><div><div className="cf-label cf-cyan">Recovered from the field</div><h3 style={{ marginTop: 9 }}>+{Math.max(120, Math.floor(summary.score / 9))} credits</h3><p style={{ color: 'hsl(var(--muted-foreground))', margin: 0 }}>Claim your reward and tune the vessel for another run.</p></div><button className="cf-btn primary" onClick={claim} data-testid="button-claim-rewards">Claim rewards</button></div></section>;
}

function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [save, setSave] = useState<SaveData>(() => loadSave());
  const [summary, setSummary] = useState({ score: 0, kills: 0, combo: 0 });
  const [muted, setMuted] = useState(false); const [reduced, setReduced] = useState(false);
  useEffect(() => { document.documentElement.classList.toggle('reduced-motion', reduced); }, [reduced]);
  const finish = (result: { score: number; kills: number; combo: number }) => { setSummary(result); setScreen('results'); };
  const content = useMemo(() => {
    if (screen === 'home') return <><Home save={save} setScreen={setScreen} /><Dashboard save={save} setScreen={setScreen} /></>;
    if (screen === 'garage') return <Garage save={save} setSave={setSave} />;
    if (screen === 'missions') return <Missions setScreen={setScreen} />;
    if (screen === 'achievements' || screen === 'leaderboard') return <Records kind={screen} />;
    if (screen === 'settings') return <SettingsPage muted={muted} setMuted={setMuted} reduced={reduced} setReduced={setReduced} />;
    if (screen === 'results') return <Results summary={summary} save={save} setScreen={setScreen} setSave={setSave} />;
    return null;
  }, [screen, save, summary, muted, reduced]);
  if (screen === 'game') return <Game save={save} finish={finish} />;
  return <Shell screen={screen} setScreen={setScreen} save={save}>{content}</Shell>;
}

export default function AppRoot() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><App /><Toaster /></TooltipProvider></QueryClientProvider>;
}