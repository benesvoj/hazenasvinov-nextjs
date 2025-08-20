# Excel Import pro Zápasy - Návod k použití

## 📋 Přehled
Funkce Excel import umožňuje hromadně importovat zápasy z Excel souboru do systému. Tato funkce je ideální pro import rozvrhů zápasů z externích systémů nebo pro hromadné vytváření zápasů.

## 🎯 Kde najít
Excel import je dostupný v administraci zápasů:
1. Přejděte do **Admin → Zápasy**
2. Vyberte sezónu
3. Klikněte na tlačítko **"Import z Excelu"**

## 📊 Požadovaný formát Excel souboru

### Struktura sloupců
Excel soubor musí obsahovat následující sloupce v tomto pořadí:

| Sloupec | Název | Popis | Příklad | Povinné |
|---------|-------|-------|---------|---------|
| A | **Datum** | Datum zápasu | 15.03.2024 | ✅ |
| B | **Čas** | Čas zápasu (24h) | 14:30 | ✅ |
| C | **Číslo zápasu** | Identifikátor zápasu | 1, "Finále" | ✅ |
| D | **Domácí tým** | Název domácího týmu | "Baník Most" | ✅ |
| E | **Hostující tým** | Název hostujícího týmu | "Sparta Praha" | ✅ |
| F | **Kategorie** | Kategorie zápasu | "Muži", "U16" | ✅ |

### Důležité rozlišení: Matchweek vs. Match Number

#### **Match Number (Číslo zápasu) - Sloupec C**
- **Co to je**: Konkrétní identifikátor zápasu
- **Příklady**: "1", "2", "3", "Finále", "Semifinále", "Čtvrtfinále"
- **Účel**: Identifikuje konkrétní zápas v rámci týdne/kola
- **Formát**: Text nebo číslo (flexibilní)

#### **Matchweek (Týden zápasu) - Automaticky vypočítáno**
- **Co to je**: Číslo týdne v sezóně
- **Výpočet**: Automaticky se vypočítá z data zápasu a začátku sezóny
- **Příklady**: 1 (1. týden), 2 (2. týden), 5 (5. týden)
- **Účel**: Organizuje zápasy do týdnů/kol

#### **Příklad kombinace**
```
Datum        | Čas  | Číslo zápasu | Domácí tým    | Hostující tým  | Kategorie | Matchweek (auto)
15.03.2024   | 14:30| 1             | Baník Most    | Sparta Praha   | Muži      | 1
15.03.2024   | 16:00| 2             | Slavia Praha  | Baník Most     | Muži      | 1
22.03.2024   | 14:30| 1             | Baník Most    | Slavia Praha   | Muži      | 2
22.03.2024   | 16:00| 2             | Sparta Praha  | Baník Most     | Muži      | 2
```

**Vysvětlení**: 
- **15.03.2024** = 1. týden sezóny → Matchweek = 1
- **22.03.2024** = 2. týden sezóny → Matchweek = 2
- **Číslo zápasu** = "1" nebo "2" v rámci každého týdne

## ⚠️ Důležité požadavky

### 1. Hlavička
- **První řádek** musí obsahovat názvy sloupců
- Názvy sloupců mohou být v češtině nebo angličtině
- Systém automaticky rozpozná správné sloupce

### 2. Datum
- Podporuje všechny běžné formáty data
- Excel automaticky rozpozná formát
- Příklady: 15.03.2024, 2024-03-15, 15/03/2024

### 3. Čas
- **Pouze 24hodinový formát**
- Formát: HH:MM
- Příklady: 14:30, 09:00, 20:15

### 4. Týmy
- Názvy týmů musí **existovat v databázi**
- Podporuje jak plné názvy, tak zkratky
- Systém automaticky najde odpovídající tým

### 5. Kategorie
- Názvy kategorií musí **existovat v databázi**
- Podporuje jak názvy, tak kódy kategorií
- Systém automaticky najde odpovídající kategorii

## 🔍 Validace dat

### Automatická kontrola
Systém automaticky kontroluje:
- ✅ Existenci týmů v databázi
- ✅ Existenci kategorií v databázi
- ✅ Platnost data a času
- ✅ Duplicitní zápasy
- ✅ Stejné domácí a hostující týmy

### Chybové zprávy
Pro každý nevalidní řádek se zobrazí:
- 🔴 **Červená ikona** - Nevalidní data
- 📝 **Seznam chyb** - Konkrétní problémy
- ❌ **Blokování importu** - Pouze validní řádky se importují

## 📥 Proces importu

### 1. Výběr souboru
- Klikněte na oblast pro nahrání souboru
- Vyberte Excel soubor (.xlsx nebo .xls)
- Systém automaticky zpracuje data

### 2. Kontrola dat
- Zobrazí se náhled všech řádků
- Každý řádek má status (Validní/Nevalidní)
- Chybové zprávy pro nevalidní řádky

### 3. Shrnutí
- Celkový počet řádků
- Počet validních řádků
- Počet nevalidních řádků

### 4. Import
- Klikněte na "Importovat"
- Systém importuje pouze validní řádky
- Zobrazí se výsledek importu

## 🚫 Omezení a pravidla

### Duplicitní zápasy
Systém automaticky odmítne:
- Stejné týmy ve stejný den a čas
- Stejné týmy ve stejné kategorii a sezóně

### Výchozí hodnoty
Pro importované zápasy se nastaví:
- **Status**: `upcoming` (nadcházející)
- **Místo**: prázdný řetězec
- **Typ soutěže**: `league`
- **Matchweek**: z čísla zápasu (pokud je číslo)

### Sezóna
- **Povinné** vybrat sezónu před importem
- Všechny zápasy se importují do vybrané sezóny

## 🛠️ Řešení problémů

### Časté chyby

#### 1. "Tým nebyl nalezen"
**Příčina**: Tým neexistuje v databázi
**Řešení**: 
- Zkontrolujte název týmu
- Použijte přesný název z databáze
- Nebo vytvořte tým v Admin → Týmy

#### 2. "Kategorie nebyla nalezena"
**Příčina**: Kategorie neexistuje v databázi
**Řešení**:
- Zkontrolujte název kategorie
- Použijte přesný název z databáze
- Nebo vytvořte kategorii v Admin → Kategorie

#### 3. "Neplatný čas"
**Příčina**: Nesprávný formát času
**Řešení**:
- Použijte 24hodinový formát (HH:MM)
- Příklady: 14:30, 09:00, 20:15

#### 4. "Neplatné datum"
**Příčina**: Nesprávný formát data
**Řešení**:
- Použijte standardní formát data
- Excel automaticky rozpozná formát

### Kontrola dat
Před importem zkontrolujte:
- ✅ Existují všechny týmy v databázi
- ✅ Existují všechny kategorie v databázi
- ✅ Formát času je HH:MM
- ✅ Data jsou platná

## 📋 Kontrolní seznam před importem

- [ ] Vybrána sezóna v administraci
- [ ] Excel soubor má správnou strukturu sloupců
- [ ] První řádek obsahuje hlavičky
- [ ] Všechny týmy existují v databázi
- [ ] Všechny kategorie existují v databázi
- [ ] Časy jsou ve formátu HH:MM
- [ ] Data jsou platná
- [ ] Žádné duplicitní zápasy

## 🎉 Po úspěšném importu

Po importu se automaticky:
- ✅ Aktualizuje seznam zápasů
- ✅ Přepočítá tabulka
- ✅ Zobrazí se zpráva o úspěchu
- ✅ Zavře se import modal

## 📞 Podpora

Pokud narazíte na problémy:
1. Zkontrolujte chybové zprávy v konzoli
2. Ověřte formát Excel souboru
3. Zkontrolujte existenci týmů a kategorií
4. Kontaktujte administrátora systému

---

**Tip**: Pro testování použijte malý soubor s několika řádky před importem velkého množství dat.
