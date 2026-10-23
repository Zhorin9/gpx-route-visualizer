# Format 16:9: wymagania, architektura i plan implementacji

Dokument do przeglądu. Opisuje dodanie formatu kadru 16:9 (1920×1080): wygląd w edytorze, układ elementów, szablony stylu i eksport. Nic poza formatem: kamera, mapa, trasy z punktów i funkcje filmu są w [PLAN-mapa-podroz.md](PLAN-mapa-podroz.md).

## Spis treści

- [Zasady wspólne](#zasady-wspólne)
- [Wymagania](#wymagania)
  - [F1 Format w edytorze](#f1-format-w-edytorze)
  - [F2 Układ elementów](#f2-układ-elementów)
  - [F3 Eksport](#f3-eksport)
- [Architektura](#architektura)
  - [Stan obecny i problemy](#stan-obecny-i-problemy)
  - [Rejestr formatów](#rejestr-formatów)
  - [Reflow między orientacjami](#reflow-między-orientacjami)
- [Plan implementacji](#plan-implementacji)
- [Testy](#testy)
- [Ryzyka](#ryzyka)
- [Otwarte decyzje](#otwarte-decyzje)

---

## Zasady wspólne

1. **Komponentowo i zgodnie z SOLID**, jak w [PLAN-6-7.md](PLAN-6-7.md#zasady-wspólne). Nowy format to nowy wpis w rejestrze, a nie nowa gałąź `if` w kilku plikach.
2. **Refaktor ma zmniejszać kod.** Rozproszone słowniki etykiet formatów i warunki `aspectKey === '9:16'` znikają na rzecz jednej definicji formatu. Bez rusztowań „na zapas”.
3. **Obecne formaty wyglądają i zachowują się jak dotąd.** 4:5, 9:16 i 1:1 dają te same pliki co przed zmianą.
4. **Elementy kadru w 16:9 zachowują się jak w innych formatach.** Można je przesunąć, zapamiętać położenie dla formatu, cofnąć. Działają szablony stylu.
5. **Teksty interfejsu po polsku**, komentarze w kodzie po angielsku.

---

## Wymagania

### F1 Format w edytorze

| # | Wymaganie |
|---|---|
| F1.1 | Nowy format „YouTube 16:9”, 1920×1080, w przełączniku formatu nad kadrem, w eksporcie obrazów i w eksporcie wideo. |
| F1.2 | Podgląd mieści się w obszarze roboczym bez przewijania. Szeroki kadr ma czytelny rozmiar także na laptopie 1366 px: panel boczny nie zabiera go więcej niż w formatach pionowych. |
| F1.3 | Karuzela: 16:9 to jeden kadr (YouTube nie ma karuzeli). Przy przejściu na 16:9 z karuzeli edytor pokazuje pierwszy slajd i informację, że pozostałe wrócą po powrocie do formatu Instagrama. Slajdy nie są usuwane. Pasek slajdów jest w 16:9 ukryty. |
| F1.4 | Strefy bezpieczne 16:9, włączane jak strefy story: margines 5% z każdej strony oraz dolny pas ~12% zasłaniany przez pasek odtwarzacza YouTube. Pokazywane tylko w edytorze, nigdy w eksporcie. |
| F1.5 | Układy kolażu: obecne działają (są w ułamkach kadru), ale dochodzą układy poziome, które w pionie nie mają sensu: 3 kolumny, 1 duże + 2 małe obok, panorama z pasem na tekst. Lista pokazuje tylko układy pasujące do orientacji formatu. |
| F1.6 | Kadrowanie zdjęć w slotach resetuje się przy zmianie formatu, jak dziś. |
| F1.7 | Szablony stylu (8 presetów) mają wygląd sprawdzony w 16:9. Podglądy szablonów pokazują bieżący format. |

### F2 Układ elementów

Obecny reflow zakłada **tę samą szerokość we wszystkich formatach** ([reflow.ts:34](../src/utils/reflow.ts:34)) i przelicza tylko pionowe położenie. W 16:9 szerokość rośnie z 1080 do 1920 px, a wysokość spada do 1080, więc ten model nie wystarcza.

| # | Wymaganie |
|---|---|
| F2.1 | Pierwsze przejście na 16:9 daje **gotową kompozycję poziomą**, a nie rozciągnięty pion: trasa wypełnia lewe ~60% kadru, tytuł i statystyki stoją w prawej kolumnie, profil wysokości idzie pasem przez całą szerokość na dole, nad strefą odtwarzacza. |
| F2.2 | Kompozycja jest częścią definicji formatu (strategia układu), więc inny format poziomy (np. 21:9) może mieć własną. |
| F2.3 | Elementy przesunięte ręcznie w 16:9 zostają zapamiętane jak w innych formatach (`layoutOverrides`). Ręczne zmiany w 4:5 nie przesuwają ręcznie ustawionych elementów w 16:9 i odwrotnie. |
| F2.4 | Statystyki w 16:9 domyślnie w układzie kolumnowym w prawej kolumnie. Profil wysokości ma szerokość pasa, nie kolumny. Legenda koloru wg danych stoi nad profilem. |
| F2.5 | Teksty użytkownika zachowują kolejność z formatu pionowego i trafiają do prawej kolumny pod statystyki. |
| F2.6 | Rozmiary czcionek w 16:9 liczone od wysokości kadru (1080), tak jak w kwadracie, żeby tytuł nie był za duży na niskim kadrze. |
| F2.7 | Elementy nie wchodzą na siebie w kompozycji domyślnej dla żadnego z 8 presetów. |

### F3 Eksport

| # | Wymaganie |
|---|---|
| F3.1 | Eksport obrazu 16:9: 1920×1080 i 3840×2160 (2×), PNG i JPG. Działa w ZIP z innymi formatami. |
| F3.2 | Eksport wideo 16:9 z obecnymi ustawieniami (MP4, WebM, GIF, te same kl./s, jakość i limit długości). Rozdzielczość 1920×1080, GIF w połowie rozmiaru jak dziś. |
| F3.3 | Nazwy plików i opisy w panelu eksportu dla 16:9 („YouTube / film 16:9”, „strefa odtwarzacza”). |

---

## Architektura

### Stan obecny i problemy

| Miejsce | Problem | Skutek dla 16:9 |
|---|---|---|
| `types.ts:318` `AspectKey` + `ASPECTS` | Formaty to unia trzech stałych. | Każdy nowy format zmienia typ i wymusza uzupełnienie kilku słowników. |
| `CanvasArea.tsx:27`, `ExportTab.tsx:21-22`, `VideoExportPanel.tsx:21` | Cztery osobne słowniki etykiet i opisów formatów. | Nowy format to edycja czterech plików. |
| `aspectKey === '9:16'` w `CanvasArea`, `CanvasStage`, `ExportTab`, `ColorLegendNode`, `ElevationProfileNode`, `reflow.ts`, `aspects.ts` | Strefy bezpieczne story wpisane jako warunek na konkretny format. | 16:9 ma inne strefy (dolny pasek odtwarzacza), więc doszłyby kolejne warunki. |
| `reflow.ts` `autoLayout` | Zakłada stałą szerokość i skaluje tylko `y`. | Nie da poziomej kompozycji. |
| `layouts.ts` `LAYOUTS` | Układy kolażu bez informacji o orientacji. | Nie da się ukryć układów, które nie pasują do szerokiego kadru. |

### Rejestr formatów

Jedna definicja formatu zastępuje `ASPECTS`, słowniki etykiet i warunki `=== '9:16'`:

```ts
// src/core/formats/registry.ts
export interface SafeZone { top: number; right: number; bottom: number; left: number }

export interface FormatDef {
  key: FormatKey                     // '4:5' | '9:16' | '1:1' | '16:9'
  w: number
  h: number
  label: string                      // 'YouTube 16:9'
  exportName: string                 // 'YouTube / film 16:9'
  note: string                       // 'strefa odtwarzacza'
  carousel: boolean                  // 16:9: false
  safeZone: SafeZone | null          // drawn in the editor, respected by auto layout
  layout: LayoutStrategy             // see the reflow section
}

export const FORMATS: Record<FormatKey, FormatDef>
export const FORMAT_ORDER: FormatKey[]
```

- `ColorLegendNode` i `ElevationProfileNode` pytają o `safeZone.bottom`, a nie o format.
- Strefy story i 16:9 rysuje jeden komponent na podstawie `safeZone`.
- Pasek slajdów i dodawanie slajdów sprawdzają `carousel`.
- `LayoutDef` dostaje `orientation: 'portrait' | 'landscape' | 'any'`, lista układów filtruje się po proporcjach formatu.

Ten krok **usuwa** kod: cztery słowniki i siedem warunków znikają, dochodzi jeden plik.

### Reflow między orientacjami

Obecny model (format źródłowy 4:5 i różnice dla pozostałych) zostaje, bo działa i ma testy. Zmienia się tylko funkcja, która z układu źródłowego robi układ formatu docelowego: staje się strategią formatu.

```ts
interface LayoutStrategy {
  // Placement of every element in this format, derived from the source (4:5) layout.
  fromSource: (base: FormatLayout, ctx: LayoutContext) => FormatLayout
  // Inverse, for remembering what the user moved in this format.
  toSource: (layout: FormatLayout, ctx: LayoutContext) => FormatLayout
}
```

- **Pionowe formaty** (4:5, 9:16, 1:1) używają obecnej logiki `autoLayout` / `toSource` bez zmian. Testy z [reflow.test.ts](../src/utils/reflow.test.ts) zostają.
- **16:9** używa strategii kolumnowej: element ma rolę (`title`, `stats`, `profile`, `legend`, `route`, `text`) i każda rola ma miejsce w kompozycji poziomej. `toSource` dla 16:9 nie odwraca kompozycji: zmiana ręczna w 16:9 zostaje tylko jako nadpisanie 16:9 (F2.3).
- Rola elementu pochodzi z rejestru elementów kadru ([core/canvas/registry.ts](../src/core/canvas/registry.ts)), więc nowy element określa swoje miejsce w 16:9 przy rejestracji.
- Trasa: `projectTrack` już rzutuje na prostokąt kadru, więc w 16:9 dostaje szeroki kadr. Strategia kolumnowa ustawia `routeTransform` tak, żeby trasa mieściła się w lewej części.

---

## Plan implementacji

Każdy krok kończy się działającą aplikacją, zielonymi testami i osobnym commitem.

| Krok | Zakres | Zależy od |
|---|---|---|
| **0. Rejestr formatów** | `FormatDef` zamiast `ASPECTS` i słowników etykiet. Strefy bezpieczne z `safeZone`. Bez zmiany zachowania. | – |
| **1. Wpis 16:9** | Format w przełączniku, podgląd, strefy odtwarzacza, karuzela wyłączona, eksport obrazów i wideo. Na tym etapie układ z obecnego reflow (rozciągnięty pion). | 0 |
| **2. Kompozycja pozioma** | `LayoutStrategy`, strategia kolumnowa, role elementów w rejestrze kadru, rozmiary czcionek od wysokości. | 1 |
| **3. Układy kolażu** | Orientacja w `LayoutDef`, filtrowanie listy, nowe układy poziome. | 1 |
| **4. Presety** | Przegląd 8 presetów w 16:9 i poprawki ich ustawień, podglądy szablonów w bieżącym formacie. | 2, 3 |

Kroki 2 i 3 mogą iść równolegle.

---

## Testy

- **Rejestr formatów**: migawki układu dla 4:5, 9:16 i 1:1 przed i po kroku 0 są identyczne.
- **Reflow**: przejście 4:5 → 16:9 → 4:5 nie zmienia układu 4:5. Ręczne przesunięcie w 16:9 przeżywa przejście przez inne formaty. Ręczne przesunięcie w 9:16 nie zmienia 16:9.
- **Kompozycja**: prostokąty tytułu, statystyk, profilu i legendy nie nachodzą na siebie i mieszczą się w strefie bezpiecznej, dla każdego presetu.
- **Karuzela**: przejście 4:5 (3 slajdy) → 16:9 → 4:5 zachowuje trzy slajdy z ich zdjęciami.
- **Eksport**: rozmiar plików 1920×1080 i 3840×2160.

---

## Ryzyka

| Ryzyko | Skutek | Ograniczenie |
|---|---|---|
| Kompozycja pozioma nie pasuje do wszystkich presetów | Elementy na siebie wchodzą | Przegląd każdego presetu w kroku 4. Test kolizji prostokątów. |
| Niski kadr przy dużym profilu wysokości | Trasa ma mało miejsca | Profil w 16:9 ma niższą domyślną wysokość. |
| Szeroki podgląd na małym ekranie | Kadr za mały do edycji | Zwijany panel boczny w 16:9. |

---

## Otwarte decyzje

1. **Karuzela w 16:9**: wyłączona (propozycja) czy szerokie slajdy jako kolejne obrazy?
2. **Kompozycja domyślna**: trasa po lewej i kolumna po prawej (propozycja) czy trasa na całym kadrze i tekst w rogach?
3. **Nazwa formatu**: „YouTube 16:9” czy ogólnie „Poziomy 16:9”?
