# 🚀 Excel Import pro Zápasy

## 📋 Přehled
Funkce pro hromadný import zápasů z Excel souborů do systému. Ideální pro import rozvrhů zápasů z externích systémů nebo hromadné vytváření zápasů.

## 🎯 Jak používat

### 1. Přístup k funkci
- Přejděte do **Admin → Zápasy**
- Vyberte sezónu
- Klikněte na tlačítko **"Import z Excelu"**

### 2. Formát Excel souboru
Excel soubor musí obsahovat tyto sloupce:

| Sloupec | Název | Příklad |
|---------|-------|---------|
| A | Datum | 15.03.2024 |
| B | Čas | 14:30 |
| C | Číslo zápasu | 1 |
| D | Domácí tým | Baník Most |
| E | Hostující tým | Sparta Praha |
| F | Kategorie | Muži |

### 3. Požadavky
- ✅ První řádek = hlavičky sloupců
- ✅ Všechny týmy musí existovat v databázi
- ✅ Všechny kategorie musí existovat v databázi
- ✅ Čas ve formátu HH:MM (24h)
- ✅ Platné datum
- ✅ Vybrána sezóna

## 📁 Soubory

### Komponenty
- `src/app/admin/matches/components/ExcelImportModal.tsx` - Modal pro import
- `src/hooks/useExcelImport.ts` - Hook pro zpracování importu

### Dokumentace
- `docs/excel_import_instructions.md` - Detailní návod
- `scripts/create_excel_template.sql` - SQL dokumentace formátu
- `scripts/create_sample_excel.py` - Generátor vzorových souborů

### Vzory
- `public/templates/sample_matches_template.xlsx` - Jednoduchý vzor
- `public/templates/matches_import_template_with_instructions.xlsx` - Vzor s instrukcemi

## 🔧 Instalace

### 1. NPM balíčky
```bash
npm install xlsx
```

### 2. Generování vzorů (volitelné)
```bash
# Instalace Python závislostí
pip install pandas openpyxl

# Spuštění generátoru
python scripts/create_sample_excel.py
```

## ✨ Funkce

### Validace
- Automatická kontrola formátu dat
- Ověření existence týmů a kategorií
- Detekce duplicitních zápasů
- Kontrola platnosti data a času

### Import
- Hromadné zpracování
- Přeskočení nevalidních řádků
- Automatické nastavení výchozích hodnot
- Aktualizace seznamu zápasů

### UI/UX
- Drag & drop nahrávání
- Náhled dat před importem
- Status indikátory pro každý řádek
- Detailní chybové zprávy
- Shrnutí výsledků

## 🚫 Omezení

### Formát času
- **Pouze 24hodinový formát**
- Formát: HH:MM
- Příklady: 14:30, 09:00, 20:15

### Duplicity
- Systém automaticky odmítne duplicitní zápasy
- Stejné týmy ve stejný den a čas
- Stejné týmy ve stejné kategorii a sezóně

### Výchozí hodnoty
- Status: `upcoming`
- Místo: prázdný řetězec
- Typ soutěže: `league`
- Matchweek: z čísla zápasu

## 🛠️ Řešení problémů

### Časté chyby
1. **"Tým nebyl nalezen"** → Zkontrolujte název týmu v databázi
2. **"Kategorie nebyla nalezena"** → Zkontrolujte název kategorie v databázi
3. **"Neplatný čas"** → Použijte formát HH:MM
4. **"Neplatné datum"** → Zkontrolujte formát data

### Kontrola před importem
- [ ] Vybrána sezóna
- [ ] Správná struktura sloupců
- [ ] Existují všechny týmy
- [ ] Existují všechny kategorie
- [ ] Správný formát času
- [ ] Platná data

## 📊 Příklad použití

### 1. Připravte Excel soubor
```
Datum        | Čas  | Číslo zápasu | Domácí tým    | Hostující tým  | Kategorie
15.03.2024   | 14:30| 1             | Baník Most    | Sparta Praha   | Muži
16.03.2024   | 16:00| 2             | Slavia Praha  | Baník Most     | Muži
```

### 2. Importujte
- Otevřete Admin → Zápasy
- Vyberte sezónu
- Klikněte "Import z Excelu"
- Nahrajte soubor
- Zkontrolujte data
- Klikněte "Importovat"

### 3. Výsledek
- ✅ Zápasy se přidají do systému
- ✅ Aktualizuje se seznam
- ✅ Přepočítá se tabulka

## 🔗 Související funkce

- **Admin → Zápasy** - Správa zápasů
- **Admin → Týmy** - Správa týmů
- **Admin → Kategorie** - Správa kategorií
- **Admin → Sezóny** - Správa sezón

---

**Tip**: Pro testování použijte malý soubor s několika řádky před importem velkého množství dat.
