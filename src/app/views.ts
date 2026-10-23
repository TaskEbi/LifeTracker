/** Route → screen. Each feature module owns its screen; the shell only looks them up here. */
import { createElement, type ComponentType } from 'react';
import type { RouteName } from './router';
import { Pending } from '../ui/i/Pending';
import '../features/home/QuickSheet';

const pending = (id: Parameters<typeof Pending>[0]['id'], note: string): ComponentType => () => createElement(Pending, { id, note });

export const sectionViews: Partial<Record<RouteName, ComponentType>> = {
  violin: pending('violin', 'Violin logging is being built next.'),
  coding: pending('coding', 'Competitive coding and Road to IOI come in a later milestone.'),
  sports: pending('sports', 'Sports logging comes in a later milestone.'),
  gym: pending('gym', 'The workout sheet comes in a later milestone.'),
  study: pending('study', 'School studies come in a later milestone.'),
  chess: pending('chess', 'Chess comes in a later milestone.'),
  sleep: pending('sleep', 'Sleep comes in a later milestone.'),
  screen: pending('screen', 'Screen time comes in a later milestone.'),
};
