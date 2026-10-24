/** Coding's header scene: a green-phosphor terminal booting, with the road up to IOI in ASCII. */
const ROAD = String.raw`
                   |>
                  /\    IOI
             /\  /  \
        /\  /  \/  . \
       /  \/    .'    \
  ____/   . ''         \____
 / JOI .''  2nd   final     \
`;

export function CodingArt() {
  return (
    <div className="i-chhead__art cd-crt" aria-hidden="true">
      <span className="cd-boot">
        LIFETRACKER BIOS v2.7 · MEM 640K OK
        <br />
        LOADING ROAD.EXE ........ DONE
      </span>
      <pre className="cd-ascii">{ROAD}</pre>
    </div>
  );
}
