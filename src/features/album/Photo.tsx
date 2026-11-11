import { useImagePath } from '../../lib/photos';
import { clipLength, type Shot } from '../../domain/album/album';

/**
 * A shot: the inline thumbnail at once, the full photo once it has loaded (from this device, or a
 * signed URL from the bucket). `small` keeps to the thumbnail, for grids. A video shows its still
 * with a play mark and its length, and plays (with controls) only where `play` is set.
 */
export function Photo({ shot, small = false, play = false, alt = '', className }: { shot: Shot; small?: boolean; play?: boolean; alt?: string; className?: string }) {
  const full = useImagePath(shot.video ? (play ? shot.path : null) : small && shot.thumb ? null : shot.path);
  if (shot.video) {
    if (play && full) {
      return <video className={`al-photo al-video ${className ?? ''}`} src={full} poster={shot.thumb ?? undefined} controls playsInline preload="metadata" aria-label={alt || 'Video'} />;
    }
    const waiting = play ? (shot.path.startsWith('local:') ? 'On another device, not uploaded yet' : 'Loading…') : '';
    return (
      <span className={`al-photo al-clip ${className ?? ''}`} role={alt ? 'img' : undefined} aria-label={alt || undefined}>
        {shot.thumb && <img src={shot.thumb} alt="" draggable={false} decoding="async" />}
        <span className="al-clip__badge" aria-hidden="true">
          ▶{shot.dur ? ` ${clipLength(shot.dur)}` : ''}
        </span>
        {waiting && <small className="al-clip__wait">{waiting}</small>}
      </span>
    );
  }
  const src = full ?? shot.thumb;
  if (!src) {
    return (
      <span className={`al-photo al-photo--missing ${className ?? ''}`} role={alt ? 'img' : undefined} aria-label={alt || undefined}>
        <small>{shot.path.startsWith('local:') ? 'On another device, not uploaded yet' : 'Loading…'}</small>
      </span>
    );
  }
  return <img className={`al-photo ${className ?? ''}`} src={src} alt={alt} draggable={false} decoding="async" />;
}
