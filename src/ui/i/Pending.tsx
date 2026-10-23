import type { SectionId } from '../../data/types';
import { ChannelHead } from './ChannelHead';

/** Placeholder for a channel that is not built yet: says so plainly, shows no made-up data. */
export function Pending({ id, note }: { id: SectionId; note: string }) {
  return (
    <>
      <ChannelHead id={id} />
      <div className="i-pnl i-empty">
        <b className="i-lab">Not built yet</b>
        <span>{note}</span>
      </div>
    </>
  );
}
