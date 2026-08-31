# Categories: one source of truth

Written 2026-08-30. Every number here was measured against production on that
date; the queries are given so they can be re-checked rather than trusted.

This is the working document for the branch of the same name. Step 1 shipped in
#92; steps 2 to 5 are the work this branch is for. Tick them off here as they
land, and delete the file when the last one does — a plan that outlives its work
becomes another thing that says something untrue about the code.

---

## What exists today

Six flags across five tables can plausibly answer "should this category show".
Here is what each actually does.

| Flag | Rows in production | Written by | Read by |
|---|---|---|---|
| `categories.is_active` | 10 rows, 3 false | admin → Kategorie → modal | **admin table and modal only** |
| `club_categories` row exists | 7 own club / 32 other clubs, active season | admin → Klubové kategorie, admin → Klub → Kategorie | `/api/categories/active` (added by #92), standings, matches |
| `club_categories.is_active` | 7 own-club rows, **all true** | same | same |
| `club_category_teams.is_active` | per A/B team | admin | team listings |
| `page_visibility.is_visible` | 10 category rows, 3 false | admin → Nastavení klubu → Stránky webu | public menu |
| `category_seasons.is_active` | 9 rows, all 2025/2026, **0 for the active season** | nothing | nothing — dropped by #92 |

Two of those never did what their name suggests:

**`categories.is_active`** is read by the admin category table and modal and by
nothing else. Turning it off has no effect on the public site — this is the
behaviour that started this analysis. It also has no season dimension, so it
cannot express "we are not entering Ženy this year" in the first place.

**`category_seasons`** was built for exactly that question and then abandoned.
Nine rows for 2025/2026, none since. #92 removes it.

---

## The actual problem

Three different questions are answered by overlapping flags:

**A. Does this category exist in the club's vocabulary?**
Muži, Ženy, Dorostenci. A taxonomy. Categories do not stop existing — a club
that skips a year still knows what Ženy are. → `categories`

**B. Is the club fielding it in a given season?**
Inherently per-season, changes every year, and is already recorded when someone
enters the category. → `club_categories(club, category, season)`

**C. Should its public page appear?**
Today `page_visibility`, holding a hand-written row per category with a title
and a route that duplicate `categories.name` and `categories.slug`.

C is not an independent question. It is B. Every category currently hidden from
the menu — Přípravka, Kuřátka — is hidden because the club does not field it,
which `club_categories` already knows. The `page_visibility` rows are a manual
restatement of a fact the database holds.

The cost of that restatement is visible in the repo: adding a category means
adding a `page_visibility` row by hand, and `ClubPagesCard` still points people
at `scripts/setup_page_visibility_manual.sql` to do it.

---

## Target model

> **`club_categories` for the own club decides what the public sees.
> `categories` is the vocabulary. Nothing else has a say.**

| Question | Answered by | Notes |
|---|---|---|
| Which categories exist | `categories` | name, slug, sort_order. No visibility flag. |
| Which we field this season | `club_categories` + `seasons.is_active` | already maintained, already correct |
| What the public sees | derived from the two above | no separate flag to keep in sync |
| Which pages are in the menu | `page_visibility` for **non-category** pages only | O nás, Kontakt, Blog… keep it |

The property worth having: **entering a category is the only action.** Enter
Ženy for 2027/2028 and the tab, the menu entry and the page appear. Do not enter
them and they are gone. Nobody has to remember a second switch.

---

## Plan

### Step 1 — public reads off `club_categories` — **done, #92**

Home page tabs and the menu's Kategorie section. `/api/categories/active` reads
own club + active season and returns the seven categories that have matches.

**Incomplete.** `useFetchCategories` — every row, unfiltered — is still read by
two more public surfaces:

- `src/app/(main)/matches/page.tsx`
- `src/app/(main)/matches/components/ClubSelector.tsx`

and by `src/contexts/AppDataContext.tsx`, which feeds 27 call sites across all
three portals. Those need separating: the admin lists genuinely want every
category, the public ones do not.

### Step 2 — finish the public surfaces

Point the two pages above at `useFetchActiveCategories`. Leave `AppDataContext`
alone for now: it is shared with admin and coach, where "all categories" is
correct. If a public page needs it later, it should take the active list
explicitly rather than have the context change meaning underneath the admin.

### Step 3 — derive the menu, retire the category rows

Build the Kategorie section from the active categories directly: title from
`categories.name`, route from `/categories/${slug}`, order from `sort_order`.
Then delete the ten `page_visibility` rows whose `category = 'categories'`.

`page_visibility` stays for everything else — that is what it is good at.

What is given up: hiding a category page for a reason unrelated to the season.
Nothing needs that today; both current uses are seasonal. If it comes back, it
belongs on `club_categories.is_active`, which already exists for it.

### Step 4 — retire `categories.is_active`

It has no reader outside the admin table that displays it. Two moves, in order:

1. Remove the switch from `CategoryModal` and the column from
   `CategoriesTable`, so nobody sets a flag that does nothing.
2. A migration dropping the column, once a release has passed with nothing
   writing it.

Doing 1 without 2 first is deliberate: a column is easy to drop and awkward to
restore.

### Step 5 — write down what `club_categories.is_active` means

All seven own-club rows are `true`, so it is currently untested. It should mean
*entered, then withdrawn* — the club registered and later pulled out — as
distinct from never entering, which is the absence of a row. Both hide the
category; keeping them apart is worth it for the history. Say so in `CLAUDE.md`
next to the other conventions.

---

## Risks

**A category entered but not yet drawn.** At the start of a season a
`club_categories` row exists before any matches. The tab appears with an empty
table. That is correct — the club *is* fielding it — and it is different from
today's Ženy, which is entered nowhere. Worth an "rozpis zatím není" message
rather than an empty table, which is the same gap the coach portal's lineup
warning covers.

**Historical seasons.** The public site does not offer a season switch; every
public read uses `seasons.is_active`. The query is already parameterised by
season, so a switch can be added without revisiting this.

**One flag fewer to hide something in a hurry.** After step 3 there is no manual
override on the public category list. That is the point — the override is what
drifted — but it means an urgent "take this page down" goes through
`club_categories.is_active` instead. Make sure it is reachable in the admin UI
before step 3 lands.

---

## What this does not cover

Tournaments carry their own `category_id` and are listed separately; they were
not examined here. If a tournament can exist in a category the club is not
fielding, its listing needs the same question asked of it.
