/** Route → screen. Each feature module owns its screen; the shell only looks them up here. */
import { createElement, type ComponentType } from 'react';
import type { RouteName } from './router';
import { Pending } from '../ui/i/Pending';
import '../features/home/QuickSheet';
import { ViolinChannel } from '../features/violin/ViolinChannel';
import { CalendarView } from '../features/calendar/CalendarView';
import { TasksView } from '../features/tasks/TasksView';
import { SleepChannel } from '../features/sleep/SleepChannel';
import { ScreenChannel } from '../features/screen/ScreenChannel';
import { GymChannel } from '../features/gym/GymChannel';

const pending = (id: Parameters<typeof Pending>[0]['id'], note: string): ComponentType => () => createElement(Pending, { id, note });

export const sectionViews: Partial<Record<RouteName, ComponentType>> = {
  violin: ViolinChannel,
  calendar: CalendarView,
  tasks: TasksView,
  coding: pending('coding', 'Competitive coding and Road to IOI come in a later milestone.'),
  sports: pending('sports', 'Sports logging comes in a later milestone.'),
  gym: GymChannel,
  study: pending('study', 'School studies come in a later milestone.'),
  chess: pending('chess', 'Chess comes in a later milestone.'),
  sleep: SleepChannel,
  screen: ScreenChannel,
};
