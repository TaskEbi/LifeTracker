/**
 * Today's face. The front camera fills the screen with a ghost of the last face over it, so each day
 * lines up with the one before and the year's timelapse holds still. Without a camera (or permission)
 * it falls back to the phone's own picker. The picture is saved as seen: mirrored, 3:4.
 */
import { useEffect, useRef, useState } from 'react';
import { stamp } from '../../domain/album/album';
import { photoUrl } from '../../lib/photos';

interface Props {
  date: string;
  /** The last face before this day, for the ghost. */
  ghost: { path: string; thumb: string | null } | null;
  onShot: (blob: Blob) => Promise<void>;
  onClose: () => void;
}

const W = 1080;
const H = 1440;

export function FaceCamera({ date, ghost, onShot, onClose }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const library = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<'starting' | 'live' | 'none'>('starting');
  const [why, setWhy] = useState<string | null>(null);
  const [ghostSrc, setGhostSrc] = useState<string | null>(ghost?.thumb ?? null);
  const [ghostOn, setGhostOn] = useState(true);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // the full-size ghost replaces the thumbnail once it has loaded
  useEffect(() => {
    if (!ghost) return;
    let live = true;
    void photoUrl(ghost.path).then((u) => live && u && setGhostSrc(u));
    return () => {
      live = false;
    };
  }, [ghost]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let live = true;
    if (!navigator.mediaDevices?.getUserMedia) {
      setState('none');
      setWhy('This browser has no camera here. Use the phone’s camera instead.');
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user', width: { ideal: 1920 }, height: { ideal: 1440 } }, audio: false })
      .then((s) => {
        if (!live) return s.getTracks().forEach((t) => t.stop());
        stream = s;
        const v = video.current!;
        v.srcObject = s;
        void v.play().then(
          () => live && setState('live'),
          () => live && setState('live'),
        );
      })
      .catch((e: DOMException) => {
        if (!live) return;
        setState('none');
        setWhy(e?.name === 'NotAllowedError' ? 'Camera permission was refused. You can allow it in the browser’s settings, or use the phone’s camera instead.' : 'The camera didn’t start. Use the phone’s camera instead.');
      });
    return () => {
      live = false;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, []);

  const save = async (blob: Blob | null) => {
    if (!blob) return setError('The photo couldn’t be read.');
    setBusy(true);
    setError(null);
    try {
      await onShot(blob);
    } catch (e) {
      setError(`Not saved: ${(e as Error).message || 'something went wrong'}`);
      setBusy(false);
    }
  };

  const snap = () => {
    const v = video.current;
    if (!v || !v.videoWidth || busy) return;
    // centre crop to 3:4 portrait, mirrored as it was on screen
    const vw = v.videoWidth;
    const vh = v.videoHeight;
    const target = W / H;
    const sw = vw / vh > target ? vh * target : vw;
    const sh = vw / vh > target ? vh : vw / target;
    const scale = Math.min(1, H / sh);
    const c = document.createElement('canvas');
    c.width = Math.round(sw * scale);
    c.height = Math.round(sh * scale);
    const ctx = c.getContext('2d')!;
    ctx.translate(c.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(v, (vw - sw) / 2, (vh - sh) / 2, sw, sh, 0, 0, c.width, c.height);
    setFlash(true);
    window.setTimeout(() => setFlash(false), 220);
    c.toBlob((b) => void save(b), 'image/jpeg', 0.92);
  };

  return (
    <div className="al-cam" role="dialog" aria-modal="true" aria-label="Today’s face">
      <div className="al-cam__frame">
        <video ref={video} className="al-cam__video" playsInline muted aria-hidden="true" hidden={state === 'none'} />
        {ghostSrc && ghostOn && state === 'live' && <img className="al-cam__ghost" src={ghostSrc} alt="" />}
        {state === 'live' && (
          <svg className="al-cam__guide" viewBox="0 0 300 400" aria-hidden="true" preserveAspectRatio="none">
            <ellipse cx="150" cy="175" rx="88" ry="118" />
            <line x1="90" y1="160" x2="210" y2="160" />
          </svg>
        )}
        {state === 'starting' && <p className="al-cam__msg">Starting the camera…</p>}
        {state === 'none' && <p className="al-cam__msg">{why}</p>}
        <span className="al-cam__stamp" aria-hidden="true">
          {stamp(date)}
        </span>
        {flash && <i className="al-cam__flash" aria-hidden="true" />}
      </div>
      {state === 'live' && <p className="al-cam__tip">{ghostSrc ? 'Line your eyes up with yesterday’s, on the line.' : 'Eyes on the line, face in the oval. Tomorrow you’ll line up with this one.'}</p>}
      {error && (
        <p className="al-cam__tip al-cam__tip--warn" role="alert">
          {error}
        </p>
      )}
      <div className="al-cam__bar">
        <button type="button" className="al-cam__side" onClick={onClose}>
          Cancel
        </button>
        {state === 'live' ? (
          <button type="button" className="al-cam__shutter" onClick={snap} disabled={busy} aria-label={busy ? 'Saving' : 'Take the photo'}>
            <i />
          </button>
        ) : (
          <button type="button" className="al-cam__side al-cam__side--main" onClick={() => file.current?.click()} disabled={busy}>
            {busy ? 'Saving…' : 'Use the phone’s camera'}
          </button>
        )}
        {state === 'live' && ghostSrc ? (
          <button type="button" className="al-cam__side" aria-pressed={ghostOn} onClick={() => setGhostOn(!ghostOn)}>
            Ghost {ghostOn ? 'on' : 'off'}
          </button>
        ) : (
          <button type="button" className="al-cam__side" onClick={() => library.current?.click()} disabled={busy}>
            From photos
          </button>
        )}
      </div>
      {[file, library].map((ref, i) => (
        <input
          key={i}
          ref={ref}
          type="file"
          accept="image/*"
          capture={i === 0 ? 'user' : undefined}
          hidden
          aria-label={i === 0 ? 'Take today’s face with the phone’s camera' : 'Choose today’s face from your photos'}
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) void save(f);
          }}
        />
      ))}
    </div>
  );
}
