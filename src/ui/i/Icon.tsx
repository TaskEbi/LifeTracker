const P: Record<string, string> = {
  home: 'M4 10.5 12 4l8 6.5V20h-5v-6H9v6H4z',
  cal: 'M3.5 5h17v15.5h-17zM3.5 10h17M8 3v4M16 3v4',
  tasks: 'M4 6.5h2M4 12h2M4 17.5h2M9 6.5h11M9 12h11M9 17.5h11',
  progress: 'M12 3l2.3 5.8 6.2.4-4.8 4 1.5 6.1L12 16l-5.2 3.3 1.5-6.1-4.8-4 6.2-.4z',
  settings: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1',
  log: 'M5 4h14v16H5zM8 8h8M8 12h8M8 16h5',
  violin: 'M9 18V5l11-2v13M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM17 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  coding: 'M8 7l-5 5 5 5M16 7l5 5-5 5',
  sports: 'M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zM3.5 12h17M12 3.5c2.6 2.3 3.8 5.2 3.8 8.5s-1.2 6.2-3.8 8.5M12 3.5c-2.6 2.3-3.8 5.2-3.8 8.5s1.2 6.2 3.8 8.5',
  gym: 'M6.5 7v10M3.5 9.5v5M17.5 7v10M20.5 9.5v5M6.5 12h11',
  study: 'M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5zM12 6.5v13',
  chess: 'M8 20h8M9 20l1.2-7h3.6L15 20M9.5 13h5M10 9.5 9 5l2 1.2L12 4l1 2.2L15 5l-1 4.5z',
  sleep: 'M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z',
  screen: 'M7 2.5h10a1.5 1.5 0 0 1 1.5 1.5v16a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 20V4A1.5 1.5 0 0 1 7 2.5zM10.5 18.5h3',
  cabinet: 'M4 4h16v16H4zM4 12h16M10 8h4M10 16h4',
  plus: 'M12 5v14M5 12h14',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  ext: 'M14 4h6v6M20 4l-9 9M18 14v5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 19V7.5A1.5 1.5 0 0 1 5.5 6H10',
  left: 'M15 5l-7 7 7 7',
  right: 'M9 5l7 7-7 7',
  edit: 'M4 20l3.5-1 11-11a2.1 2.1 0 0 0-3-3l-11 11zM14 6.5l3 3',
  trash: 'M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13',
  warn: 'M12 4 2.8 19.5h18.4zM12 10v4.5M12 17.2v.3',
};

export function Icon({ name, size = 20 }: { name: keyof typeof P | string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={P[name] ?? P.home} />
    </svg>
  );
}
