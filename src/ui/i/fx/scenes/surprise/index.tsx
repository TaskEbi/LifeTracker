/** The forty surprise scenes, in their own chunk (loaded early by the celebration layer). */
import type { ComponentType } from 'react';
import type { SurpriseId } from '../../../../../domain/fun/surprise';
import type { SurpriseProps } from './kit';
import { Bento, Cranes, DragonRide, EkiStamp, Forge, Gacha, HighScore, Matcha, Mochi, Onsen, PaperPlane, RocketS, Sakura, Taiko, Thunder } from './play';
import { CatPost, DarumaS, Fuji, Hanabi, Iai, KaijuS, Kendama, Koi, Maneki_, Ninja, Ramen, Sumo, WishStar } from './world';
import { Accepted, Checkmate, Concert, Deadlift, DreamSheep, Ekiden, Hanamaru_, Qed, Shinkansen, Storybook, Treasure, Unplug } from './sections';

export const SURPRISE_SCENES: Record<SurpriseId, ComponentType<SurpriseProps>> = {
  concert: Concert,
  accepted: Accepted,
  ekiden: Ekiden,
  deadlift: Deadlift,
  hanamaru: Hanamaru_,
  checkmate: Checkmate,
  dreamsheep: DreamSheep,
  unplug: Unplug,
  treasure: Treasure,
  shinkansen: Shinkansen,
  storybook: Storybook,
  qed: Qed,
  ramen: Ramen,
  catpost: CatPost,
  wishstar: WishStar,
  sumo: Sumo,
  ninja: Ninja,
  iai: Iai,
  kaiju: KaijuS,
  hanabi: Hanabi,
  fuji: Fuji,
  koi: Koi,
  manekineko: Maneki_,
  daruma: DarumaS,
  kendama: Kendama,
  rocket: RocketS,
  thunder: Thunder,
  cranes: Cranes,
  taiko: Taiko,
  bento: Bento,
  ekistamp: EkiStamp,
  gacha: Gacha,
  sakura: Sakura,
  onsen: Onsen,
  highscore: HighScore,
  paperplane: PaperPlane,
  dragon: DragonRide,
  forge: Forge,
  matcha: Matcha,
  mochi: Mochi,
};

export default function SurpriseScene({ id, ...p }: SurpriseProps & { id: SurpriseId }) {
  const S = SURPRISE_SCENES[id];
  return S ? <S {...p} /> : null;
}
