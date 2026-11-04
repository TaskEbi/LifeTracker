/** Route → screen. Each feature module owns its screen; the shell only looks them up here. */
import type { ComponentType } from 'react';
import type { RouteName } from './router';
import '../features/home/QuickSheet';
import '../features/focus/FocusSheet';
import { ViolinChannel } from '../features/violin/ViolinChannel';
import { CalendarView } from '../features/calendar/CalendarView';
import { TasksView } from '../features/tasks/TasksView';
import { SleepChannel } from '../features/sleep/SleepChannel';
import { ScreenChannel } from '../features/screen/ScreenChannel';
import { GymChannel } from '../features/gym/GymChannel';
import { SportsChannel } from '../features/sports/SportsChannel';
import { StudyChannel } from '../features/study/StudyChannel';
import { ChessChannel } from '../features/chess/ChessChannel';
import { CodingChannel } from '../features/coding/CodingChannel';
import { ProgressView } from '../features/progress/ProgressView';
import { SettingsView } from '../features/settings/SettingsView';
import { ActivityView } from '../features/log/ActivityView';
import { BucketView } from '../features/bucket/BucketView';
import { FutureChannel } from '../features/future/FutureChannel';
import { ReadingChannel } from '../features/reading/ReadingChannel';
import { MathsChannel } from '../features/maths/MathsChannel';
import { HqView } from '../features/hq/HqView';
import { AlbumView } from '../features/album/AlbumView';

export const sectionViews: Partial<Record<RouteName, ComponentType>> = {
  violin: ViolinChannel,
  calendar: CalendarView,
  tasks: TasksView,
  coding: CodingChannel,
  sports: SportsChannel,
  gym: GymChannel,
  study: StudyChannel,
  chess: ChessChannel,
  sleep: SleepChannel,
  screen: ScreenChannel,
  progress: ProgressView,
  settings: SettingsView,
  log: ActivityView,
  bucket: BucketView,
  future: FutureChannel,
  reading: ReadingChannel,
  maths: MathsChannel,
  base: HqView,
  album: AlbumView,
};
