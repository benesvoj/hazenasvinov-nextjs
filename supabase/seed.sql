-- ============================================
-- Vývojový seed pro lokální Supabase
-- ============================================
-- Syntetická data, žádná produkční. Slouží k tomu, aby na lokále nebyly
-- tabulky prázdné a daly se proklikat stránky, které na datech závisí.
--
-- Spuštění:
--   docker exec -i supabase_db_hazenasvinov_nextjs psql -U postgres < supabase/seed.sql
--
-- Skript je idempotentní — nejdřív smaže, co sám vytvořil (podle pevných UUID),
-- takže se dá pouštět opakovaně. Ostatních dat se nedotýká.
-- ============================================

begin;

-- ---------- úklid po předchozím běhu ----------
delete from public.match_referees where match_id in (select id from public.matches where competition = 'SEED');
delete from public.matches           where competition = 'SEED';
delete from public.point_deductions  where season_id  = '5eed0000-0000-4000-8000-000000000001';
delete from public.standings         where season_id  = '5eed0000-0000-4000-8000-000000000001';
delete from public.tournament_teams  where tournament_id in ('5eed0000-0000-4000-8000-0000000cc001'::uuid);
delete from public.tournaments       where id in ('5eed0000-0000-4000-8000-0000000cc001'::uuid);
delete from public.photos            where album_id in ('5eed0000-0000-4000-8000-0000000000a1'::uuid,'5eed0000-0000-4000-8000-0000000000a2'::uuid);
delete from public.photo_albums      where id in ('5eed0000-0000-4000-8000-0000000000a1'::uuid,'5eed0000-0000-4000-8000-0000000000a2'::uuid);
delete from public.blog_posts        where slug like 'seed-%';
delete from public.members           where registration_number like 'SEED%';
delete from public.referees          where surname like 'Seedovsk%';
delete from public.club_category_teams where club_category_id in (select id from public.club_categories where season_id = '5eed0000-0000-4000-8000-000000000001');
delete from public.club_categories   where season_id = '5eed0000-0000-4000-8000-000000000001';
delete from public.clubs             where name like 'SEED %';
delete from public.categories        where slug like 'seed-%';
delete from public.seasons           where id = '5eed0000-0000-4000-8000-000000000001';
delete from public.club_config       where id = '5eed0000-0000-4000-8000-000000000002';

-- ---------- konfigurace klubu ----------
-- /api/club-config používá .single(); bez řádku vrací 500 při každém načtení stránky
insert into public.club_config
  (id, club_name, hero_title, hero_subtitle, hero_button_text, hero_button_link,
   contact_email, contact_phone, address, founded_year, description, is_active)
values
  ('5eed0000-0000-4000-8000-000000000002', 'TJ Sokol Svinov',
   'Národní házená ve Svinově', 'Oddíl s tradicí od roku 1921',
   'Přidej se k nám', '/contact',
   'info@example.test', '+420 000 000 000', 'Bílovecká 1, Ostrava-Svinov',
   1921, 'Vývojová data — nejde o skutečné kontakty klubu.', true);

-- ---------- sezóna ----------
insert into public.seasons (id, name, start_date, end_date, is_active, is_closed) values
  ('5eed0000-0000-4000-8000-000000000001', '2026/2027', '2026-09-01', '2027-06-30', true, false);

-- ---------- kategorie ----------
-- slug je to, na čem stojí /categories/[slug] a oprava code -> slug
insert into public.categories (id, name, description, age_group, gender, slug, sort_order, is_active) values
  ('5eed0000-0000-4000-8000-0000000000c1', 'Muži',      'Mužský A-tým',        'dospělí', 'male',   'seed-muzi',   1, true),
  ('5eed0000-0000-4000-8000-0000000000c2', 'Ženy',      'Ženský A-tým',        'dospělí', 'female', 'seed-zeny',   2, true),
  ('5eed0000-0000-4000-8000-0000000000c3', 'Dorostenci','Dorostenecká liga',   'dorost',  'male',   'seed-dorost', 3, true);

-- ---------- kluby ----------
insert into public.clubs (id, name, short_name, city, is_own_club, is_active, venue, founded_year) values
  ('5eed0000-0000-4000-8000-0000000000b1', 'SEED TJ Sokol Svinov',  'Svinov',  'Ostrava',  true,  true, 'Hala Svinov',  1921),
  ('5eed0000-0000-4000-8000-0000000000b2', 'SEED TJ Přerov',        'Přerov',  'Přerov',   false, true, 'Hala Přerov',  1930),
  ('5eed0000-0000-4000-8000-0000000000b3', 'SEED Sokol Vracov',     'Vracov',  'Vracov',   false, true, 'Hala Vracov',  1935);

-- ---------- klub x kategorie x sezóna ----------
insert into public.club_categories (id, club_id, category_id, season_id, max_teams, is_active) values
  ('5eed0000-0000-4000-8000-0000000000d1','5eed0000-0000-4000-8000-0000000000b1','5eed0000-0000-4000-8000-0000000000c1','5eed0000-0000-4000-8000-000000000001',2,true),
  ('5eed0000-0000-4000-8000-0000000000d2','5eed0000-0000-4000-8000-0000000000b2','5eed0000-0000-4000-8000-0000000000c1','5eed0000-0000-4000-8000-000000000001',1,true),
  ('5eed0000-0000-4000-8000-0000000000d3','5eed0000-0000-4000-8000-0000000000b3','5eed0000-0000-4000-8000-0000000000c1','5eed0000-0000-4000-8000-000000000001',1,true),
  ('5eed0000-0000-4000-8000-0000000000d4','5eed0000-0000-4000-8000-0000000000b1','5eed0000-0000-4000-8000-0000000000c2','5eed0000-0000-4000-8000-000000000001',1,true);

-- ---------- týmy ----------
-- Svinov má v mužích dva týmy, aby se projevila logika s team_suffix
insert into public.club_category_teams (id, club_category_id, team_suffix, is_active) values
  ('5eed0000-0000-4000-8000-0000000000e1','5eed0000-0000-4000-8000-0000000000d1','A',true),
  ('5eed0000-0000-4000-8000-0000000000e2','5eed0000-0000-4000-8000-0000000000d1','B',true),
  ('5eed0000-0000-4000-8000-0000000000e3','5eed0000-0000-4000-8000-0000000000d2','A',true),
  ('5eed0000-0000-4000-8000-0000000000e4','5eed0000-0000-4000-8000-0000000000d3','A',true),
  ('5eed0000-0000-4000-8000-0000000000e5','5eed0000-0000-4000-8000-0000000000d4','A',true);

-- ---------- členové ----------
-- created_by / updated_by jsou sloupce, o kterých kód donedávna nevěděl
insert into public.members (name, surname, sex, registration_number, date_of_birth, category_id, functions, is_active) values
  ('Jan',    'Novotný',  'male',   'SEED001', '1998-03-14', '5eed0000-0000-4000-8000-0000000000c1', array['player'],          true),
  ('Petr',   'Dvořák',   'male',   'SEED002', '1999-07-02', '5eed0000-0000-4000-8000-0000000000c1', array['player'],          true),
  ('Tomáš',  'Svoboda',  'male',   'SEED003', '2001-11-23', '5eed0000-0000-4000-8000-0000000000c1', array['player','coach'],  true),
  ('Marek',  'Černý',    'male',   'SEED004', '1995-01-30', '5eed0000-0000-4000-8000-0000000000c1', array['coach'],           true),
  ('Eva',    'Horáková', 'female', 'SEED005', '2000-05-19', '5eed0000-0000-4000-8000-0000000000c2', array['player'],          true),
  ('Lucie',  'Marková',  'female', 'SEED006', '2002-09-08', '5eed0000-0000-4000-8000-0000000000c2', array['player'],          true),
  ('Adam',   'Pokorný',  'male',   'SEED007', '2008-04-11', '5eed0000-0000-4000-8000-0000000000c3', array['player'],          true),
  ('Filip',  'Veselý',   'male',   'SEED008', '2009-02-27', '5eed0000-0000-4000-8000-0000000000c3', array['player'],          false);

-- ---------- rozhodčí ----------
insert into public.referees (id, name, surname) values
  ('5eed0000-0000-4000-8000-0000000000f1', 'Karel', 'Seedovský'),
  ('5eed0000-0000-4000-8000-0000000000f2', 'Milan', 'Seedovský');

-- ---------- zápasy ----------
-- competition = 'SEED' slouží jako značka pro úklid výše.
-- Mix odehraných a nadcházejících, včetně playoff fáze a zápasu bez skóre.
insert into public.matches
  (id, date, time, venue, competition, category_id, season_id,
   home_team_id, away_team_id, home_score, away_score, status, match_phase, matchweek, match_number)
values
  ('5eed0000-0000-4000-8000-0000000aa001','2026-09-13','10:30','Hala Svinov','SEED',
   '5eed0000-0000-4000-8000-0000000000c1','5eed0000-0000-4000-8000-000000000001',
   '5eed0000-0000-4000-8000-0000000000e1','5eed0000-0000-4000-8000-0000000000e3', 24, 19, 'completed','regular',1,'1'),
  ('5eed0000-0000-4000-8000-0000000aa002','2026-09-20','14:00','Hala Přerov','SEED',
   '5eed0000-0000-4000-8000-0000000000c1','5eed0000-0000-4000-8000-000000000001',
   '5eed0000-0000-4000-8000-0000000000e3','5eed0000-0000-4000-8000-0000000000e4', 17, 22, 'completed','regular',2,'2'),
  ('5eed0000-0000-4000-8000-0000000aa003','2026-09-27','10:30','Hala Svinov','SEED',
   '5eed0000-0000-4000-8000-0000000000c1','5eed0000-0000-4000-8000-000000000001',
   '5eed0000-0000-4000-8000-0000000000e1','5eed0000-0000-4000-8000-0000000000e4', 30, 28, 'completed','regular',3,'3'),
  -- nadcházející: skóre je NULL, což je přesně případ, na kterém se lámaly typy
  ('5eed0000-0000-4000-8000-0000000aa004','2027-05-16','11:00','Hala Vracov','SEED',
   '5eed0000-0000-4000-8000-0000000000c1','5eed0000-0000-4000-8000-000000000001',
   '5eed0000-0000-4000-8000-0000000000e4','5eed0000-0000-4000-8000-0000000000e1', null, null, 'upcoming','regular',4,'4'),
  -- playoff: testuje pojistku v autoStandingsRecalculation
  ('5eed0000-0000-4000-8000-0000000aa005','2027-06-06','16:00','Hala Svinov','SEED',
   '5eed0000-0000-4000-8000-0000000000c1','5eed0000-0000-4000-8000-000000000001',
   '5eed0000-0000-4000-8000-0000000000e1','5eed0000-0000-4000-8000-0000000000e3', null, null, 'upcoming','semifinal',null,null),
  -- ženy
  ('5eed0000-0000-4000-8000-0000000aa006','2026-10-04','12:00','Hala Svinov','SEED',
   '5eed0000-0000-4000-8000-0000000000c2','5eed0000-0000-4000-8000-000000000001',
   '5eed0000-0000-4000-8000-0000000000e5', null, null, null, 'upcoming','regular',1,null);

-- "order" je rezervované slovo a je NOT NULL bez defaultu
insert into public.match_referees (match_id, referee_id, "order") values
  ('5eed0000-0000-4000-8000-0000000aa001','5eed0000-0000-4000-8000-0000000000f1', 1),
  ('5eed0000-0000-4000-8000-0000000aa001','5eed0000-0000-4000-8000-0000000000f2', 2);

-- ---------- odečty bodů ----------
-- tabulka, která chyběla v zakomitovaných typech
insert into public.point_deductions (team_id, category_id, season_id, points, reason) values
  ('5eed0000-0000-4000-8000-0000000000e4','5eed0000-0000-4000-8000-0000000000c1','5eed0000-0000-4000-8000-000000000001', -2, 'Nedostavení se k utkání');

-- ---------- články ----------
-- publikované i rozepsané, s vazbou na kategorii i na zápas
insert into public.blog_posts (id, title, slug, content, status, category_id, match_id, published_at) values
  ('5eed0000-0000-4000-8000-0000000bb001','Vítězný vstup do sezóny','seed-vitezny-vstup-do-sezony',
   '<p>Muži zahájili sezónu domácí výhrou 24:19. Zápas rozhodla druhá půle, ve které domácí odskočili na rozdíl pěti branek.</p>',
   'published','5eed0000-0000-4000-8000-0000000000c1','5eed0000-0000-4000-8000-0000000aa001', now() - interval '10 days'),
  ('5eed0000-0000-4000-8000-0000000bb002','Derby na půdě soupeře','seed-derby-na-pude-soupere',
   '<p>Druhé kolo přineslo těsnou porážku 17:22. Sestava se obešla bez dvou opor.</p>',
   'published','5eed0000-0000-4000-8000-0000000000c1','5eed0000-0000-4000-8000-0000000aa002', now() - interval '6 days'),
  ('5eed0000-0000-4000-8000-0000000bb003','Ženy zahajují v říjnu','seed-zeny-zahajuji-v-rijnu',
   '<p>Ženský tým vstoupí do soutěže domácím zápasem.</p>',
   'published','5eed0000-0000-4000-8000-0000000000c2', null, now() - interval '2 days'),
  ('5eed0000-0000-4000-8000-0000000bb004','Rozepsaný koncept','seed-rozepsany-koncept',
   '<p>Tenhle článek nemá být veřejně vidět.</p>',
   'draft','5eed0000-0000-4000-8000-0000000000c1', null, null);

-- ---------- turnaj ----------
insert into public.tournaments (id, name, slug, start_date, end_date, category_id, season_id, status, description) values
  ('5eed0000-0000-4000-8000-0000000cc001','Zimní pohár Svinov','seed-zimni-pohar','2027-01-16','2027-01-17',
   '5eed0000-0000-4000-8000-0000000000c1','5eed0000-0000-4000-8000-000000000001','published',
   'Tradiční halový turnaj pro mužské týmy.');

insert into public.tournament_teams (tournament_id, team_id) values
  ('5eed0000-0000-4000-8000-0000000cc001','5eed0000-0000-4000-8000-0000000000e1'),
  ('5eed0000-0000-4000-8000-0000000cc001','5eed0000-0000-4000-8000-0000000000e3'),
  ('5eed0000-0000-4000-8000-0000000cc001','5eed0000-0000-4000-8000-0000000000e4');

-- ---------- fotogalerie ----------
-- title/description/cover_photo_url schválně místy NULL — přesně ta nullability,
-- kterou doménové typy dřív popíraly
insert into public.photo_albums (id, title, description, is_public, sort_order, cover_photo_url) values
  ('5eed0000-0000-4000-8000-0000000000a1','Zahájení sezóny 2026','Fotky z prvního domácího zápasu', true, 1,
   'https://placehold.co/800x600/1e3a5f/ffffff/png?text=Zahajeni'),
  ('5eed0000-0000-4000-8000-0000000000a2','Trénink mládeže', null, true, 2, null);

insert into public.photos (album_id, title, description, file_path, file_url, sort_order, is_featured) values
  ('5eed0000-0000-4000-8000-0000000000a1','Nástup týmů','Před výkopem','seed/a1-01.jpg',
   'https://placehold.co/1200x800/1e3a5f/ffffff/png?text=Nastup', 1, true),
  ('5eed0000-0000-4000-8000-0000000000a1', null, null, 'seed/a1-02.jpg',
   'https://placehold.co/1200x800/2f5686/ffffff/png?text=Utkani', 2, false),
  ('5eed0000-0000-4000-8000-0000000000a2','Rozcvička', null,'seed/a2-01.jpg',
   'https://placehold.co/1200x800/16a34a/ffffff/png?text=Trenink', 1, false);

-- ---------- tabulka ----------
insert into public.standings
  (team_id, category_id, season_id, position, matches, wins, draws, losses, goals_for, goals_against, points)
values
  ('5eed0000-0000-4000-8000-0000000000e1','5eed0000-0000-4000-8000-0000000000c1','5eed0000-0000-4000-8000-000000000001',1,2,2,0,0,54,47,4),
  ('5eed0000-0000-4000-8000-0000000000e4','5eed0000-0000-4000-8000-0000000000c1','5eed0000-0000-4000-8000-000000000001',2,2,1,0,1,50,47,2),
  ('5eed0000-0000-4000-8000-0000000000e3','5eed0000-0000-4000-8000-0000000000c1','5eed0000-0000-4000-8000-000000000001',3,2,0,0,2,36,46,0);

commit;

-- shrnutí
select 'club_config' as tabulka, count(*) from public.club_config
union all select 'seasons',            count(*) from public.seasons
union all select 'categories',        count(*) from public.categories
union all select 'clubs',             count(*) from public.clubs
union all select 'club_category_teams', count(*) from public.club_category_teams
union all select 'members',           count(*) from public.members
union all select 'matches',           count(*) from public.matches
union all select 'blog_posts',        count(*) from public.blog_posts
union all select 'tournaments',       count(*) from public.tournaments
union all select 'photo_albums',      count(*) from public.photo_albums
union all select 'photos',            count(*) from public.photos
union all select 'standings',         count(*) from public.standings
union all select 'point_deductions',  count(*) from public.point_deductions
union all select 'referees',          count(*) from public.referees;
