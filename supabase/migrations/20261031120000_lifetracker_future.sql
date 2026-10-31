-- LifeTracker: a tenth section, Future (university prep and plans).
--
-- Additive only: the section checks on LifeTracker's tables (and on the LifeTracker-only
-- todos.section column) also accept 'future'. Nothing is removed or renamed and every existing row
-- still passes; Curio Cabinet never reads or writes todos.section.

alter table public.lt_records drop constraint lt_records_section_check;
alter table public.lt_records add constraint lt_records_section_check
  check (section in ('violin', 'coding', 'sports', 'gym', 'study', 'chess', 'sleep', 'screen', 'cabinet', 'future'));

alter table public.lt_details drop constraint lt_details_section_check;
alter table public.lt_details add constraint lt_details_section_check
  check (section in ('violin', 'coding', 'sports', 'gym', 'study', 'chess', 'future'));

alter table public.lt_events drop constraint lt_events_section_check;
alter table public.lt_events add constraint lt_events_section_check
  check (section in ('violin', 'coding', 'sports', 'gym', 'study', 'chess', 'sleep', 'screen', 'cabinet', 'future'));

alter table public.todos drop constraint todos_section_check;
alter table public.todos add constraint todos_section_check
  check (section is null or section in ('violin', 'coding', 'sports', 'gym', 'study', 'chess', 'sleep', 'screen', 'cabinet', 'future'));
