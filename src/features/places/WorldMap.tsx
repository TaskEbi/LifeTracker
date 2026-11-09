/**
 * A flat world map: countries you've been to filled in, places as dots (solid for been, rings for
 * want). The outlines (Natural Earth 1:110m via world-atlas) load on first use, in their own chunk.
 */
import { useEffect, useState } from 'react';
import type { FeatureCollection, Geometry } from 'geojson';
import { project, spotOf, type Place } from '../../domain/places/model';

const W = 720;
const TOP = 84;
const BOTTOM = -58;
const H = (TOP - BOTTOM) * 2;
const xy = (lat: number, lng: number) => {
  const p = project(lat, lng, W, 360);
  return { x: p.x, y: p.y - (90 - TOP) * 2 };
};

type Shape = { name: string; d: string };
let shapes: Promise<Shape[]> | null = null;

function ringPath(ring: number[][]): string {
  return `M${ring.map(([lng, lat]) => {
    const p = xy(lat, lng);
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }).join('L')}Z`;
}

function loadShapes(): Promise<Shape[]> {
  shapes ??= Promise.all([import('world-atlas/countries-110m.json'), import('topojson-client')]).then(([topo, tc]) => {
    const t = (topo as { default?: unknown }).default ?? topo;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fc = tc.feature(t as any, (t as any).objects.countries) as unknown as FeatureCollection<Geometry, { name: string }>;
    return fc.features.map((f) => {
      const g = f.geometry;
      const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
      return { name: f.properties.name, d: polys.map((p) => p.map((r) => ringPath(r as number[][])).join('')).join('') };
    });
  });
  // A failed load (offline, say) can be tried again next time.
  shapes.catch(() => {
    shapes = null;
  });
  return shapes;
}

export function WorldMap({ places, been }: { places: Place[]; been: Set<string> }) {
  const [list, setList] = useState<Shape[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    loadShapes().then(
      (s) => live && setList(s),
      () => live && setFailed(true),
    );
    return () => {
      live = false;
    };
  }, []);
  const dots = places.map((p) => ({ p, s: spotOf(p) })).filter((x) => x.s);
  return (
    <figure className="pl-map">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`World map: ${been.size} ${been.size === 1 ? 'country' : 'countries'} visited, ${places.filter((p) => p.state === 'Want').length} places you want to go`}>
        <rect width={W} height={H} className="pl-map__sea" />
        {list?.map((c) => <path key={c.name} d={c.d} className={been.has(c.name) ? 'pl-map__land is-been' : 'pl-map__land'} />)}
        {dots.map(({ p, s }) => {
          const { x, y } = xy(s!.lat, s!.lng);
          return <circle key={p.id} cx={x} cy={y} r={p.state === 'Been' ? 4 : 5} className={p.state === 'Been' ? 'pl-map__dot' : 'pl-map__want'} />;
        })}
      </svg>
      {!list && <figcaption className="i-note">{failed ? 'The map couldn’t load. Your places are listed below.' : 'Loading the map…'}</figcaption>}
    </figure>
  );
}
