import { useId, type CSSProperties } from 'react';
import type { Item, Room } from '../../../../data/types';
import { artworkFor, type ArtworkTheme } from '../../../../lib/linkArtwork';
import { useItemImage } from '../../../../lib/media';
import { CardImage } from './parts';
import './link-artwork.css';

const PALETTES: Record<ArtworkTheme, [string, string, string]> = {
  orbit: ['#172b46', '#edb86b', '#a6cbd3'],
  network: ['#233d38', '#c9e88d', '#74b7a8'],
  sound: ['#382a52', '#f6ac86', '#b8a5e0'],
  landscape: ['#244b49', '#edce94', '#96b8a0'],
  books: ['#54303b', '#f3c590', '#ce8c92'],
  design: ['#b74f37', '#ffe0a4', '#edac7d'],
  abstract: ['#244f69', '#f6c46b', '#9ccacc'],
};

function Illustration({ theme }: { theme: ArtworkTheme }) {
  switch (theme) {
    case 'orbit': return <>
      <circle cx="247" cy="151" r="62" fill="var(--art-accent)" />
      <path d="M216 98c38 28 65 73 63 112M194 122c42 6 86 41 104 64" fill="none" stroke="var(--art-bg)" strokeWidth="2" opacity=".25" />
      <g fill="none" stroke="var(--art-paper)" transform="rotate(-24 240 150)">
        <ellipse cx="240" cy="150" rx="170" ry="36" strokeWidth="1.5" />
        <ellipse cx="240" cy="150" rx="144" ry="87" opacity=".35" />
        <circle cx="389" cy="168" r="8" fill="var(--art-paper)" />
      </g>
      <path d="M100 77v14m-7-7h14m252 124v12m-6-6h12M354 66v8m-4-4h8" stroke="var(--art-paper)" strokeWidth="1.5" />
      <circle cx="134" cy="215" r="2" fill="var(--art-paper)" /><circle cx="329" cy="109" r="2" fill="var(--art-paper)" />
    </>;
    case 'network': return <>
      <g fill="none" stroke="var(--art-paper)" strokeWidth="1.2" opacity=".4">
        <path d="M111 151 200 83 276 142 370 82M111 151l86 66 79-75 95 76M200 83l-3 134M276 142l94-60M200 83l171 135M111 151h260M197 217 370 82" />
        <circle cx="240" cy="150" r="101" strokeDasharray="3 7" />
      </g>
      {[[111,151,14],[200,83,22],[197,217,17],[276,142,32],[370,82,12],[371,218,20]].map(([x,y,r],i) => <g key={i}>
        <circle cx={x} cy={y} r={r + 6} fill="var(--art-bg)" />
        <circle cx={x} cy={y} r={r} fill={i % 2 ? 'var(--art-accent)' : 'var(--art-paper)'} />
        <circle cx={x} cy={y} r="3" fill="var(--art-bg)" />
      </g>)}
    </>;
    case 'sound': return <>
      <circle cx="240" cy="150" r="96" fill="none" stroke="var(--art-paper)" opacity=".16" />
      <circle cx="240" cy="150" r="76" fill="none" stroke="var(--art-paper)" opacity=".3" />
      {Array.from({ length: 27 }, (_, i) => {
        const height = 18 + (Math.sin(i * .71) * .5 + .5) * 106 + Math.sin(i * 1.7) * 12;
        return <rect key={i} x={80 + i * 12} y={150 - height / 2} width="5" height={height} rx="2.5" fill={i % 3 ? 'var(--art-paper)' : 'var(--art-accent)'} />;
      })}
      <path d="M78 224h324" stroke="var(--art-paper)" opacity=".35" />
    </>;
    case 'landscape': return <>
      <circle cx="306" cy="110" r="41" fill="var(--art-paper)" />
      <path d="m47 222 113-134 84 103 58-64 131 95Z" fill="var(--art-accent)" />
      <path d="m127 127 33-39 29 36-26-9-13 17Z" fill="var(--art-paper)" />
      <path d="M47 224c82-82 149-63 205-25s117 21 181-29v66H47Z" fill="var(--art-paper)" />
      <path d="M47 239h386M59 250h362" stroke="var(--art-accent)" opacity=".5" />
      <path d="m86 88 8-4 8 4m12-17 8-4 8 4" fill="none" stroke="var(--art-paper)" />
    </>;
    case 'books': return <>
      <g transform="rotate(-8 240 150)">
        <path d="M89 87q76-17 151 15 75-32 151-15v132q-76-17-151 15-75-32-151-15Z" fill="var(--art-paper)" />
        <path d="M240 102v132m-140-16q66-12 127 12m26 0q64-24 126-12" fill="none" stroke="var(--art-bg)" strokeWidth="2" opacity=".5" />
        {[0,1,2,3,4].map((i) => <path key={i} d={`M112 ${114+i*17}q49-5 104 13m48 0q55-18 104-13`} fill="none" stroke="var(--art-bg)" opacity=".25" strokeWidth="2" />)}
        <path d="M330 88v68l15-10 15 8V85" fill="var(--art-bg)" />
      </g>
    </>;
    case 'design': return <>
      <path d="M76 229V87h142v142Z" fill="var(--art-paper)" />
      <circle cx="218" cy="158" r="71" fill="var(--art-bg)" />
      <circle cx="218" cy="158" r="48" fill="var(--art-accent)" />
      <path d="m295 87 106 142H259Z" fill="var(--art-paper)" />
      <path d="M61 246h355M61 70h355" stroke="var(--art-paper)" opacity=".4" />
      <circle cx="355" cy="98" r="18" fill="var(--art-accent)" />
    </>;
    default: return <>
      <circle cx="168" cy="143" r="76" fill="var(--art-paper)" />
      <path d="M232 67a76 76 0 0 1 0 152Z" fill="var(--art-accent)" />
      <path d="M232 143a76 76 0 0 1 0 152Z" fill="var(--art-paper)" transform="rotate(-90 232 143)" />
      <g stroke="var(--art-bg)" opacity=".4">{Array.from({ length: 9 }, (_, i) => <path key={i} d={`M${106+i*15} 67v152`} />)}</g>
      <circle cx="359" cy="203" r="20" fill="var(--art-accent)" />
      <path d="M83 242h314" stroke="var(--art-paper)" opacity=".4" />
    </>;
  }
}

/** Small editorial prints for links whose source has no usable artwork. */
export function LinkArtwork({ item, room }: { item: Item; room?: Room }) {
  const id = useId();
  const art = artworkFor(item, room?.name);
  if (!art) return null;
  const [bg, paper, accent] = PALETTES[art.theme];
  const style = { '--art-bg': bg, '--art-paper': paper, '--art-accent': accent } as CSSProperties;
  return <svg className="link-artwork" data-artwork={art.theme} viewBox="0 0 480 300" aria-hidden="true" focusable="false" style={style}>
    <defs>
      <pattern id={id} width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".6" fill={paper} opacity=".12" /></pattern>
    </defs>
    <path fill={bg} d="M0 0h480v300H0z" />
    <path fill={`url(#${id})`} d="M0 0h480v300H0z" />
    <path d="M18 51V18h444v33M18 249v33h444v-33" fill="none" stroke={paper} opacity=".35" />
    <text x="32" y="40" fill={paper} fontSize="13" letterSpacing="2.2" fontFamily="monospace">{art.label.toUpperCase()}</text>
    <g transform={`translate(240 150) rotate(${(art.variant - 1) * 4}) translate(-240 -150)`}><Illustration theme={art.theme} /></g>
    <text x="32" y="271" fill={paper} fontSize="12" letterSpacing="1" fontFamily="monospace">{art.domain.length > 36 ? `${art.domain.slice(0, 33)}…` : art.domain}</text>
    <path d="M428 270l16-16m-12 0h12v12" fill="none" stroke={paper} strokeWidth="1.5" />
  </svg>;
}

/** Source artwork wins; missing or broken images reveal the same stable illustration. */
export function LinkPreview({ item, room, className = '' }: { item: Item; room?: Room; className?: string }) {
  const src = useItemImage(item);
  if (!src && !artworkFor(item, room?.name)) return null;
  return <div className={`link-preview ${className}`}>
    <CardImage src={src} className="link-preview__image" fallback={<LinkArtwork item={item} room={room} />} />
  </div>;
}
