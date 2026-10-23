/** Route → screen. Each feature module owns its screen; the shell only looks them up here. */
import type { ComponentType } from 'react';
import type { RouteName } from './router';
import '../features/home/QuickSheet';
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
};
