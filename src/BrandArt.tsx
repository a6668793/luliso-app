import { useId } from 'react';
import { PetIllustration } from './PetIllustration';

export function PawDoodle({ className = '' }: { className?: string }) {
 return <svg className={className} viewBox="0 0 40 40" aria-hidden="true"><g fill="currentColor"><ellipse cx="11" cy="12" rx="4" ry="6" transform="rotate(-24 11 12)"/><ellipse cx="21" cy="9" rx="4" ry="6"/><ellipse cx="30" cy="14" rx="4" ry="6" transform="rotate(26 30 14)"/><ellipse cx="5" cy="23" rx="3" ry="5" transform="rotate(-35 5 23)"/><path d="M11 28Q18 15 26 24Q38 35 27 36Q22 32 17 35Q5 38 11 28Z"/></g></svg>;
}

export function BrandPetMark() {
 return <span className="brand-pet-mark" aria-hidden="true"><PetIllustration species="dog" seed="luliso-brand-dog-6" decorative/><PetIllustration species="cat" seed="luliso-brand-cat-8" decorative/></span>;
}

export function PetScene({ small = false }: { small?: boolean }) {
 const id = useId().replace(/:/g, '');
 return <svg className={`pet-scene ${small ? 'small' : ''}`} viewBox="0 0 430 330" role="img" aria-labelledby={`${id}-title`}>
  <title id={`${id}-title`}>小貓與狗狗靠在一起，陪你收藏溫柔日常</title>
  <defs><radialGradient id={`${id}-glow`}><stop stopColor="#FFFDF9"/><stop offset="1" stopColor="#FFFDF9" stopOpacity="0"/></radialGradient><linearGradient id={`${id}-blanket`} x2="1" y2="1"><stop stopColor="#FCE6DF"/><stop offset="1" stopColor="#EDC4B6"/></linearGradient></defs>
  <ellipse cx="242" cy="177" rx="177" ry="139" fill={`url(#${id}-glow)`}/>
  <g stroke="#A6B596" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".65"><path d="M388 245V158M388 213Q354 188 366 175Q387 180 388 207M389 189Q414 167 409 151Q392 155 389 185"/></g>
  <path d="M44 283Q87 246 226 253Q360 248 409 285Q386 320 232 321Q99 322 44 283Z" fill={`url(#${id}-blanket)`}/>
  <g stroke="#FFFDF9" strokeWidth="7" opacity=".48"><path d="M61 281Q211 312 390 279M110 264L144 310M191 257L215 320M273 257L292 315M345 270L357 302"/></g>
  <svg x="150" y="63" width="245" height="245" viewBox="0 0 160 160" style={{transform:'rotate(7deg)',transformOrigin:'270px 205px'}}><PetIllustration species="dog" seed="luliso-hug-dog-202" decorative/></svg>
  <svg x="51" y="134" width="208" height="190" viewBox="0 0 160 160" style={{transform:'rotate(-8deg)',transformOrigin:'160px 235px'}}><PetIllustration species="cat" seed="luliso-hug-cat-12" decorative/></svg>
  <g fill="#E9938F"><path d="M225 53C205 34 193 57 225 72C257 47 239 33 225 53Z"/><path d="M80 127C69 115 58 130 79 141C100 126 89 117 80 127Z"/><path d="M357 109C346 96 335 112 356 124C377 107 367 99 357 109Z"/></g>
  <g stroke="#E8A88D" strokeWidth="5" fill="none" strokeLinecap="round"><path d="M83 80L74 66M96 74L95 59M360 62L368 49M372 72L387 67"/></g>
  <g fill="#E9C47F"><path d="M116 37L120 49L131 53L120 57L116 69L112 57L101 53L112 49Z"/><circle cx="41" cy="180" r="4"/><circle cx="392" cy="108" r="4"/></g>
 </svg>;
}

export function FeatureArt({ index }: { index: number }) {
 return <span className={`feature-art feature-art-${index}`} aria-hidden="true">
  <PetIllustration species={index % 2 ? 'dog' : 'cat'} seed={`luliso-feature-${index + 17}`} decorative/>
  <span className="feature-art-symbol">{['✧','?','♪','♡','…','♡'][index]}</span>
 </span>;
}
