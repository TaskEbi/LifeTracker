import { useImagePath } from '../../lib/photos';
import type { Shot } from '../../domain/album/album';

/**
 * A shot: the inline thumbnail at once, the full photo once it has loaded (from this device, or a
 * signed URL from the bucket). `small` keeps to the thumbnail, for grids.
 */
export function Photo({ shot, small = false, alt = '', className }: { shot: Shot; small?: boolean; alt?: string; className?: string }) {
  const full = useImagePath(small && shot.thumb ? null : shot.path);
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
