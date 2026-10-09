import { useId, useState } from 'react';
import { Shuffle } from 'lucide-react';

const coats = ['#F4D8AC', '#D2C3B4', '#F5F0E6', '#B4B8B4', '#E7BCA3', '#8B776B'];
const accents = ['#B7CBBB', '#E8A88D', '#C8BDDC', '#E9CB7D'];
function hash(seed: string) {
 let n = 2166136261;
 for (const char of seed) n = Math.imul(n ^ char.charCodeAt(0), 16777619);
 return n >>> 0;
}

/** Original LULISO vector artwork. No third-party maker assets are used. */
export function PetIllustration({ species, seed, decorative = false, className = '' }: {
 species: 'cat' | 'dog'; seed: string; decorative?: boolean; className?: string;
}) {
 const id = useId();
 const n = hash(seed), coat = coats[n % coats.length], accent = accents[(n >>> 4) % accents.length];
 const cat = species === 'cat', patch = (n >>> 8) % 3, happy = (n >>> 12) % 2 === 0;
 return <svg className={`pet-illustration ${className}`} viewBox="0 0 160 160"
  role={decorative ? undefined : 'img'} aria-hidden={decorative || undefined} aria-labelledby={decorative ? undefined : id}>
  {!decorative ? <title id={id}>{cat ? '貓咪' : '狗狗'}小夥伴插畫</title> : null}
  <defs><linearGradient id={`${id}-coat`} x1="0" y1="0" x2=".6" y2="1"><stop stopColor="#FFF8ED"/><stop offset=".35" stopColor={coat}/><stop offset="1" stopColor={coat}/></linearGradient></defs>
  <ellipse cx="81" cy="145" rx="48" ry="6" fill="#51483F" opacity=".08" />
  <g stroke="#66564B" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
   {cat ? <path d="M112 119C147 118 146 86 136 91C128 94 142 110 112 110" fill={`url(#${id}-coat)`} /> : <path d="M112 122Q145 114 130 100Q124 99 122 113" fill={`url(#${id}-coat)`} />}
   <path d="M49 104Q40 125 48 137Q57 146 80 143Q103 146 113 137Q120 121 109 102Z" fill={`url(#${id}-coat)`} />
   {cat ? <path d="M39 61L38 27Q38 23 43 27L65 42Q81 36 98 42L119 27Q124 23 124 29L122 65Q129 88 114 102Q99 116 80 112Q58 117 43 101Q28 85 39 61Z" fill={`url(#${id}-coat)`} /> : <>
    <path d="M43 48Q24 47 23 75Q24 98 39 96L54 65M114 48Q136 45 139 75Q141 99 125 98L108 65" fill={n % 2 ? '#A38A77' : coat} />
    <path d="M42 57Q49 37 80 39Q112 36 121 59L121 84Q119 112 82 114Q45 115 39 91Z" fill={`url(#${id}-coat)`} />
   </>}
   {cat ? <g stroke="none" fill="#E8B8A7"><path d="M44 35L45 56L58 47Z" /><path d="M115 35L104 46L116 56Z" /></g> : null}
   <g fill="#FFFDF9" opacity=".45" stroke="none"><ellipse cx="58" cy="58" rx="8" ry="4" transform="rotate(-25 58 58)"/><ellipse cx="102" cy="56" rx="5" ry="3"/></g>
   {patch === 1 ? <path d="M60 48Q81 41 96 47L88 65L81 71L72 64Z" fill="#FFFDF9" stroke="none" /> : null}
   {patch === 2 ? <g fill="none" stroke="#8B776B" opacity=".65"><path d="M68 43L71 56M81 42L81 54M94 43L91 56" />{cat ? <path d="M40 72L51 75M39 84L51 83M121 72L110 75M123 84L111 83" /> : null}</g> : null}
   <ellipse cx="81" cy="93" rx="22" ry="15" fill="#FFFDF9" stroke="none" opacity=".85" />
   {happy ? <g fill="none"><path d="M57 78Q62 71 67 78M96 78Q101 71 106 78" /></g> : <g fill="#51483F" stroke="none"><ellipse cx="62" cy="77" rx="3" ry="4" /><ellipse cx="101" cy="77" rx="3" ry="4" /></g>}
   <g fill="#E8A88D" stroke="none" opacity=".55"><ellipse cx="52" cy="90" rx="7" ry="4" /><ellipse cx="111" cy="90" rx="7" ry="4" /></g>
   <path d="M77 87Q82 83 86 87L82 91Z" fill="#66564B" stroke="none" />
   <path d="M82 91V95M73 96Q77 101 82 95Q87 101 91 96" fill="none" strokeWidth="1.8" />
   {cat ? <g strokeWidth="1.4" opacity=".65"><path d="M36 93L52 95M36 103L51 100M111 95L128 92M112 101L129 103" /></g> : null}
   {(n >>> 16) % 2 ? <><path d="M55 108Q81 119 108 108L107 116Q80 126 55 117Z" fill={accent} /><path d="M99 115L111 132L96 135L89 120" fill={accent} /></> : <><path d="M80 116Q57 102 61 121Q65 135 80 119Q104 104 100 123Q95 132 80 119Z" fill={accent} /><circle cx="80" cy="118" r="4" fill={accent} /></>}
   <path d="M63 129V139M99 129V139" fill="none" /><path d="M52 138L54 142M60 139L61 143M102 140L103 143M110 137L111 141" strokeWidth="1.4" />
  </g>
 </svg>;
}

const storageKey = 'luliso-companion-look-v1';
function initialSeed() {
 try { return localStorage.getItem(storageKey) || 'luliso-welcome'; } catch { return 'luliso-welcome'; }
}
export function PetCompanions() {
 const [seed, setSeed] = useState(initialSeed);
 function shuffle() {
  const next = crypto.randomUUID();
  setSeed(next);
  try { localStorage.setItem(storageKey, next); } catch { /* The current selection still works without storage. */ }
 }
 return <section className="companion-strip" aria-labelledby="companion-title">
  <div className="companion-copy"><span className="eyebrow">LITTLE PAWS, LITTLE JOYS</span><h2 id="companion-title">今天，也有可愛陪著你。</h2><p>毛色、花紋和小領巾，換一組好心情。</p><button className="button secondary companion-shuffle" onClick={shuffle}><Shuffle size={16} />隨機換一組</button></div>
  <div className="companion-friends" aria-live="polite" aria-atomic="true">
   <div className="companion-friend"><PetIllustration species="cat" seed={`${seed}-1`} /><span>慢慢靠近的喵</span></div>
   <div className="companion-friend"><PetIllustration species="dog" seed={`${seed}-2`} /><span>陪你散步的汪</span></div>
   <div className="companion-friend"><PetIllustration species="cat" seed={`${seed}-3`} /><span>收藏陽光的喵</span></div>
  </div>
  <p className="companion-footnote">LULISO 原創陪伴插畫 · 圖案不代表毛孩的實際外貌或個性</p>
 </section>;
}
