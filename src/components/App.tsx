import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, AudioLines, Flashlight, Footprints, Heart, HelpCircle, MapPin, Menu, Pause, Play, RotateCcw, Sparkles, Volume2, VolumeX, X, Zap } from 'lucide-react';
import { RescueScene } from '../game/scene';
import { OBJECTIVES, readCheckpoint, SAVE_KEY } from '../game/progress';
import type { GameBridge, GameInput, HudState } from '../game/types';
import './App.css';

type Screen = 'menu' | 'story' | 'help' | 'playing' | 'paused' | 'failed' | 'won';

const emptyHud: HudState = { stage: 0, stamina: 100, hearts: 3, flashlight: true, distractions: 8, hidden: false, alert: false, dizzy: false, prompt: '' };

function storageGet(key: string) {
  try { return localStorage.getItem(key); } catch { return null; }
}

function storageSet(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch { return; }
}

function GameView({ bridge, paused }: { bridge: GameBridge; paused: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const game = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!host.current) return;
    const instance = new Phaser.Game({
      type: Phaser.AUTO,
      parent: host.current,
      width: 960,
      height: 640,
      backgroundColor: '#203b49',
      scale: { mode: Phaser.Scale.RESIZE },
      physics: { default: 'arcade', arcade: { debug: false } },
      scene: new RescueScene(bridge),
      render: { antialias: true },
    });
    game.current = instance;
    return () => { instance.destroy(true); game.current = null; };
  }, [bridge]);

  useEffect(() => {
    const scene = game.current?.scene;
    if (!scene) return;
    if (paused) scene.pause('rescue');
    else scene.resume('rescue');
  }, [paused]);

  return <div className="game-canvas" ref={host} aria-label="עולם המשחק: אורי מחפש את קרמבו ברחובות מודיעין" />;
}

function TouchControls({ input }: { input: GameInput }) {
  const hold = (key: string) => ({
    onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => { event.currentTarget.setPointerCapture(event.pointerId); input.held.add(key); },
    onPointerUp: () => input.held.delete(key),
    onPointerCancel: () => input.held.delete(key),
    onLostPointerCapture: () => input.held.delete(key),
  });
  return <div className="touch-controls" dir="ltr">
    <div className="dpad" aria-label="כפתורי תנועה">
      <button className="up" aria-label="למעלה" {...hold('arrowup')}><ArrowUp /></button>
      <button className="left" aria-label="שמאלה" {...hold('arrowleft')}><ArrowLeft /></button>
      <button className="down" aria-label="למטה" {...hold('arrowdown')}><ArrowDown /></button>
      <button className="right" aria-label="ימינה" {...hold('arrowright')}><ArrowRight /></button>
    </div>
    <div className="touch-actions">
      <button aria-label="ריצה" title="ריצה" {...hold('shift')}><Zap /></button>
      <button aria-label="פנס" title="פנס" onPointerDown={() => { input.flashlight = true; }}><Flashlight /></button>
      <button aria-label="זריקת חטיף" title="זריקת חטיף" onPointerDown={() => { input.distract = true; }}><AudioLines /></button>
      <button className="touch-interact" aria-label="פעולה" title="פעולה" onPointerDown={() => { input.interact = true; }}><Sparkles /></button>
    </div>
  </div>;
}

export const App = () => {
  const [screen, setScreen] = useState<Screen>('menu');
  const [returnScreen, setReturnScreen] = useState<Screen>('menu');
  const [hud, setHud] = useState<HudState>(emptyHud);
  const [dialogue, setDialogue] = useState({ speaker: '', text: '' });
  const [muted, setMuted] = useState(() => storageGet('find-krembo-muted') === 'true');
  const [checkpoint, setCheckpoint] = useState<number | null>(() => readCheckpoint(storageGet(SAVE_KEY)));
  const [session, setSession] = useState(0);
  const bridgeRef = useRef<GameBridge | null>(null);
  const dialogueTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const say = (speaker: string, text: string) => {
    setDialogue({ speaker, text });
    if (dialogueTimer.current) clearTimeout(dialogueTimer.current);
    dialogueTimer.current = setTimeout(() => setDialogue({ speaker: '', text: '' }), 5000);
  };

  const start = (stage: number) => {
    if (dialogueTimer.current) clearTimeout(dialogueTimer.current);
    setDialogue({ speaker: '', text: '' });
    if (stage === 0) { storageSet(SAVE_KEY, null); setCheckpoint(null); }
    const input: GameInput = { held: new Set(), interact: false, flashlight: false, distract: false };
    bridgeRef.current = {
      input, startStage: stage, muted,
      onHud: setHud,
      onDialogue: say,
      onCheckpoint: (nextStage) => { setCheckpoint(nextStage); storageSet(SAVE_KEY, JSON.stringify({ stage: nextStage })); },
      onVictory: () => { storageSet(SAVE_KEY, null); setCheckpoint(null); setScreen('won'); },
      onFailure: () => setScreen('failed'),
    };
    setHud({ ...emptyHud, stage });
    setSession((value) => value + 1);
    setScreen('playing');
  };

  useEffect(() => {
    storageSet('find-krembo-muted', String(muted));
    if (bridgeRef.current) bridgeRef.current.muted = muted;
  }, [muted]);

  useEffect(() => () => { if (dialogueTimer.current) clearTimeout(dialogueTimer.current); }, []);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (screen !== 'playing' && screen !== 'paused') return;
      const key = event.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'w', 'a', 's', 'd', 'shift', 'e', 'f', 'escape'].includes(key)) event.preventDefault();
      if (key === 'escape' && !event.repeat) {
        bridgeRef.current?.input.held.clear();
        setScreen(screen === 'playing' ? 'paused' : 'playing');
        return;
      }
      if (screen !== 'playing' || !bridgeRef.current) return;
      const input = bridgeRef.current.input;
      input.held.add(key);
      if (!event.repeat) {
        if (key === 'e') input.interact = true;
        if (key === 'f') input.flashlight = true;
        if (key === ' ') input.distract = true;
      }
    };
    const up = (event: KeyboardEvent) => bridgeRef.current?.input.held.delete(event.key.toLowerCase());
    const blur = () => { bridgeRef.current?.input.held.clear(); if (screen === 'playing') setScreen('paused'); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur); };
  }, [screen]);

  const gameVisible = ['playing', 'paused', 'failed', 'won'].includes(screen) || (screen === 'help' && returnScreen === 'paused');
  const showHelp = (from: Screen) => { bridgeRef.current?.input.held.clear(); setReturnScreen(from); setScreen('help'); };
  const toggleMute = () => setMuted((value) => !value);
  const objective = OBJECTIVES[hud.stage];

  return <main className="app-shell" dir="rtl">
    <header className="topbar">
      <div className="brand"><span className="brand-mark"><Footprints size={21} /></span><span>קרמבו <b>בלילה</b></span></div>
      <div className="topbar-center"><span className="status-dot" /> מודיעין, ישראל <span className="topbar-separator">/</span> 02:17 בלילה</div>
      <div className="top-actions">
        <button className="icon-button" onClick={toggleMute} aria-label={muted ? 'הפעלת קול' : 'השתקת קול'} title={muted ? 'הפעלת קול' : 'השתקת קול'}>{muted ? <VolumeX /> : <Volume2 />}</button>
        {screen === 'playing' && <button className="icon-button" onClick={() => { bridgeRef.current?.input.held.clear(); setScreen('paused'); }} aria-label="השהיה" title="השהיה"><Pause /></button>}
      </div>
    </header>

    {!gameVisible && screen !== 'help' && <section className="title-screen">
      <div className="title-art" />
      <div className="title-shade" />
      <div className="title-content">
        <div className="eyebrow"><span /> הרפתקה לילית מקורית <span /></div>
        {screen === 'menu' ? <>
          <div className="title-kicker">מבצע</div>
          <h1>מצא את <em>קרמבו</em><span className="title-exclamation">!</span></h1>
          <p className="tagline">מודיעין. לילה. צבועים.<br />אבא אחד שלא מוותר.</p>
          <div className="title-actions">
            <button className="primary-button" onClick={() => setScreen('story')}><Play size={19} fill="currentColor" /> התחל משחק</button>
            {checkpoint !== null && <button className="secondary-button" onClick={() => start(checkpoint)}><RotateCcw size={18} /> המשך משחק</button>}
            <button className="text-button" onClick={() => showHelp('menu')}><HelpCircle size={19} /> איך משחקים?</button>
          </div>
        </> : <>
          <div className="title-kicker">הסיפור עד כה</div>
          <h1 className="story-title">החתונה חיכתה.<br /><em>קרמבו לא.</em></h1>
          <p className="story-copy">המשפחה נסעה לחתונה ליד כפר סבא. קרמבו נשאר בבית בהשגחה, אבל היו לו תוכניות אחרות. עכשיו הוא מסתובב לבד במודיעין, ובחוץ יש צבועים רעבים.</p>
          <p className="story-copy story-punch">אורי שתה יין אדום למרות התרופות והאזהרה של הרופא. החלטה גרועה. עכשיו הוא בדרך ברגל, והפנס עובד. בערך.</p>
          <div className="title-actions"><button className="primary-button" onClick={() => start(0)}><Play size={19} fill="currentColor" /> יוצאים לחפש</button><button className="text-button" onClick={() => showHelp('story')}><HelpCircle size={19} /> איך משחקים?</button></div>
        </>}
      </div>
      <div className="title-footer"><span>סיפור על כלב, אבא ויציאה אחת קטנה משליטה.</span><span>01 — לילה במודיעין</span></div>
    </section>}

    {screen === 'help' && <section className="help-screen">
      <div className="help-inner"><button className="icon-button close-help" onClick={() => setScreen(returnScreen)} aria-label="סגירה" title="סגירה"><X /></button>
        <div className="eyebrow"><span /> המדריך לאבא המודאג <span /></div><h1>רגע לפני שיוצאים<span className="coral">.</span></h1>
        <p>קרמבו השאיר עקבות. אורי השאיר את החתונה. עכשיו רק צריך לחבר ביניהם.</p>
        <div className="help-grid">
          <div><kbd>W A S D</kbd><b>או חצים</b><span>תנועה ברחובות</span></div><div><kbd>SHIFT</kbd><b>ריצה</b><span>מהירה, רועשת ומעייפת</span></div>
          <div><kbd>E</kbd><b>פעולה</b><span>בדיקת רמזים ושיחה</span></div><div><kbd>F</kbd><b>פנס</b><span>מאיר, אבל גם מושך תשומת לב</span></div>
          <div><kbd>SPACE</kbd><b>זריקת חטיף</b><span>הצבועים רצים לבדוק אותו ומשאירים את הדרך פנויה</span></div><div><kbd>ESC</kbd><b>השהיה</b><span>כי גם לאבא מותר לנוח</span></div>
        </div>
        <div className="help-tip"><span>טיפ של אבא</span> שיחים מסתירים את אורי בהליכה. ריצה רועשת תסגיר אותו. כשמוצאים את קרמבו, מתקרבים בשקט ומלווים אותו לשער.</div>
        <button className="primary-button" onClick={() => setScreen(returnScreen)}><ArrowRight size={19} /> הבנתי, חזרה למשחק</button>
      </div>
    </section>}

    {gameVisible && bridgeRef.current && <section className="game-layout" style={screen === 'help' ? { position: 'fixed', left: '-10000px', top: 0, width: '100%', visibility: 'hidden' } : undefined}>
      <div className="game-heading"><div><div className="small-label">מבצע חילוץ לילי <span>/</span> {objective.area}</div><h2>{objective.title}</h2></div><div className="chapter"><MapPin size={16} /> {objective.area} <span>0{Math.min(hud.stage + 1, 4)} / 04</span></div></div>
      <div className="game-frame">
        <GameView key={session} bridge={bridgeRef.current} paused={screen !== 'playing'} />
        <div className="game-top-overlay"><div className="area-label"><span className="status-dot" /> {objective.area}</div>{hud.alert && <div className="alert-label">צבוע בעקבותיך!</div>}{hud.hidden && !hud.alert && <div className="hidden-label">מסתתר בשיחים</div>}{hud.dizzy && !hud.alert && <div className="dizzy-label">אורי קצת מסוחרר</div>}</div>
        {dialogue.text && <div className="dialogue" role="status"><span>{dialogue.speaker}</span><p>{dialogue.text}</p></div>}
        {hud.prompt && screen === 'playing' && <div className="interaction-prompt"><kbd>E</kbd> {hud.prompt}</div>}
        {screen === 'playing' && <TouchControls input={bridgeRef.current.input} />}
        {screen !== 'playing' && <div className="game-overlay"><div className="overlay-content">
          {screen === 'paused' && <><div className="overlay-icon"><Pause /></div><div className="eyebrow">רגע לנשום</div><h2>המשחק בהשהיה</h2><p>קרמבו עדיין שם בחוץ. אבל גם לאבא מותר רגע.</p><div className="overlay-actions"><button className="primary-button" onClick={() => setScreen('playing')}><Play size={18} fill="currentColor" /> ממשיכים</button><button className="secondary-button" onClick={() => showHelp('paused')}><HelpCircle size={18} /> איך משחקים?</button><button className="text-button" onClick={() => start(0)}><RotateCcw size={17} /> להתחיל מחדש</button><button className="text-button" onClick={() => setScreen('menu')}><Menu size={17} /> לתפריט הראשי</button></div></>}
          {screen === 'failed' && <><div className="overlay-icon danger"><Heart /></div><div className="eyebrow">כמעט הצלחנו</div><h2>הצבועים ניצחו בסיבוב הזה</h2><p>אורי לקח נשימה עמוקה. קרמבו עדיין מחכה, והסיפור הזה עוד לא נגמר.</p><div className="overlay-actions"><button className="primary-button" onClick={() => start(checkpoint ?? 0)}><RotateCcw size={18} /> נסו שוב מהמחסום</button><button className="text-button" onClick={() => setScreen('menu')}><Menu size={17} /> לתפריט הראשי</button></div></>}
          {screen === 'won' && <><div className="overlay-icon victory"><Footprints /></div><div className="eyebrow">המשימה הושלמה</div><h2>קרמבו נמצא!!!</h2><p>אחרי מרדף מטורף ברחבי מודיעין, אבא וקרמבו חוזרים הביתה. החתונה? כבר נגמרה. הבורקס? שווה לשאול.</p><div className="overlay-actions"><button className="primary-button" onClick={() => start(0)}><RotateCcw size={18} /> משחק חדש</button><button className="text-button" onClick={() => setScreen('menu')}><Menu size={17} /> לתפריט הראשי</button></div></>}
        </div></div>}
      </div>
      <div className="game-dashboard"><div className="mission"><div className="dashboard-icon"><MapPin size={19} /></div><div><span className="small-label">המשימה הנוכחית</span><strong>{objective.title}</strong><p>{objective.hint}</p></div></div>
        <div className="stats"><div className="stat"><span className="small-label">מצב רוח של אבא</span><div className="hearts" aria-label={`${hud.hearts} מתוך 3 לבבות`}>{[0, 1, 2].map((heart) => <Heart key={heart} size={19} fill={heart < hud.hearts ? 'currentColor' : 'none'} className={heart < hud.hearts ? '' : 'empty-heart'} />)}</div></div>
          <div className="stat stamina-stat"><span className="small-label">כוח לרוץ</span><div className="stamina-track"><span style={{ width: `${hud.stamina}%` }} /></div></div>
          <div className="stat compact-stat"><span className="small-label">רמזים</span><strong>{Math.min(hud.stage, 5)}<small> / 5</small></strong></div>
          <div className="stat compact-stat"><span className="small-label">חטיפים לזריקה</span><strong>{hud.distractions}<small> / 8</small></strong></div>
        </div>
      </div>
      <div className="control-strip"><span><kbd>WASD</kbd> תנועה</span><span><kbd>SHIFT</kbd> ריצה</span><span><kbd>E</kbd> פעולה</span><span><kbd>F</kbd> פנס {hud.flashlight ? 'דלוק' : 'כבוי'}</span><span><kbd>SPACE</kbd> זריקת חטיף</span><button onClick={() => showHelp('paused')}><HelpCircle size={16} /> עזרה</button></div>
    </section>}
    <footer className="app-footer"><span>משחק קטן על אהבה גדולה לכלב קטן</span><span>MADE IN MODI'IN (בערך)</span></footer>
  </main>;
};
