# Etapy 6 i 7: wymagania, architektura i plan implementacji

Dokument do przeglądu. Opisuje nowe funkcje edytora (profil wysokości, statystyki, animacja, eksport wideo, kolor według danych) i ich wymagania. Pokazuje też, jak rozbudować kod w sposób komponentowy, zgodnie z zasadami SOLID, oraz w jakiej kolejności to zrobić.

> **Poza zakresem:** 6c Prywatność (strefy wokół startu i mety) jest odłożona. Architektura zostawia na nią miejsce (zob. [Rozszerzalność na później](#rozszerzalność-na-później)).

## Spis treści

- [Zasady wspólne](#zasady-wspólne)
- [Architektura](#architektura)
  - [Stan obecny i problemy](#stan-obecny-i-problemy)
  - [Struktura katalogów](#struktura-katalogów)
  - [Rejestr elementów kadru](#rejestr-elementów-kadru)
  - [Trasa: geometria, malowanie, interakcja](#trasa-geometria-malowanie-interakcja)
  - [Źródła danych i palety](#źródła-danych-i-palety)
  - [Statystyki: definicje i układy](#statystyki-definicje-i-układy)
  - [Animacja: oś czasu jako model](#animacja-oś-czasu-jako-model)
  - [Eksport: źródło klatek i kodery](#eksport-źródło-klatek-i-kodery)
  - [Serwis kodowania wideo i GIF](#serwis-kodowania-wideo-i-gif-warstwa-abstrakcji-nad-paczkami)
  - [Stan aplikacji](#stan-aplikacji)
  - [SOLID: podsumowanie](#solid-podsumowanie)
- [Etap 6](#etap-6)
  - [6a Profil wysokości](#6a-profil-wysokości)
  - [6b Statystyki](#6b-statystyki)
- [Etap 7](#etap-7)
  - [7a Animacja](#7a-animacja)
  - [7b Eksport wideo](#7b-eksport-wideo)
  - [7c Kolor według danych](#7c-kolor-według-danych)
- [Plan implementacji](#plan-implementacji)
- [Ryzyka](#ryzyka)
- [Rozszerzalność na później](#rozszerzalność-na-później)
- [Otwarte decyzje](#otwarte-decyzje)

---

## Zasady wspólne

1. **Wygląd trasy zostaje taki jak teraz.** Wszystkie nowe tryby rysowania (częściowe rysowanie w animacji, kolor wg nachylenia, kolor wg danych) korzystają z jednego malarza trasy z rdzeniem, poświatą, grubością, kreskowaniem, kropkowaniem i duchem pozostałej trasy. Ustawienia z szablonów stylu działają bez zmian. Makiety z designera służą jako wzór układu paneli i kontrolek, a nie wyglądu linii.
2. **Komponentowo i zgodnie z SOLID** (szczegóły w sekcji [Architektura](#architektura)). Nową funkcję dodaje się przez dopisanie modułu i rejestrację, a nie przez dopisywanie gałęzi `if` w istniejących komponentach.
3. **Logika domenowa oddzielona od UI.** Obliczenia (wygładzanie, podjazdy, serie danych, oś czasu, kodowanie) to czyste funkcje i klasy bez Reacta i Konvy, testowane jednostkowo.
4. **Wszystko działa w przeglądarce, bez serwera** (dotyczy także renderowania wideo).
5. **Nowe elementy kadru zachowują się jak istniejące.** Można je zaznaczyć, przeciągnąć i zapisać położenie osobno dla każdego formatu. Działa dla nich cofanie i szablony stylu.
6. **Dane, których brakuje w GPX, nie psują widoku.** Bez czasu nie ma czasu w ruchu ani tempa „wg prędkości”, bez tętna nie ma koloru wg tętna. Opcja jest wtedy wyszarzona z podpowiedzią.
7. **Teksty interfejsu po polsku**, komentarze w kodzie po angielsku (jak dotychczas).

---

## Architektura

### Stan obecny i problemy

Kod jest czytelny, ale kilka miejsc wymagałoby edycji przy każdej nowej funkcji. To przeszkoda dla zasady otwarte/zamknięte (OCP).

| Miejsce | Problem | Skutek dla nowych funkcji |
|---|---|---|
| `CanvasStage.tsx` | Elementy kadru wpisane na sztywno (`NeonRouteGroup`, `StatsHeaderGroup`, teksty). | Profil i legenda wymagałyby edycji sceny. |
| `Selection` + `ElementsTab.tsx` | Unia rodzajów zaznaczenia i łańcuch `selection?.kind === ...` w panelu. | Każdy nowy element to nowe gałęzie w kilku plikach. |
| `NeonRouteGroup.tsx` | Jeden komponent robi trzy rzeczy: wybiera punkty (zakres, dni, schemat), maluje (rdzeń, poświata, duch) i obsługuje interakcję (przeciąganie, `Transformer`, dodawanie punktów). | Kolor wg danych i animacja dokładałyby kolejne gałęzie w tym samym pliku (narusza SRP). |
| `useStatsChips` | Lista bloków statystyk wpisana na sztywno, a formatowanie zmieszane z wyborem. | Nowe bloki (czas w ruchu, prędkość) i jednostki to edycja jednej dużej funkcji. |
| `StatsHeaderGroup.tsx` | Układy `row` / `columns` jako gałęzie w komponencie. | Siatka i „duża liczba” to kolejne gałęzie. |
| `exportImage.ts` | Renderowanie sceny i zapis do pliku w jednej funkcji. | Wideo potrzebuje tego samego renderowania, ale innego zapisu. |

Dlatego plan zaczyna się od **kroku 0: refaktoryzacji bez zmiany zachowania**. Po nim nowe funkcje to w większości nowe pliki.

### Struktura katalogów

Nowe funkcje trafiają do `src/features/<nazwa>/`. Każdy folder ma tę samą budowę, a na zewnątrz udostępnia tylko to, co eksportuje `index.ts`.

```
src/
  core/                       wspólne kontrakty i rejestry (bez logiki konkretnych funkcji)
    canvas/registry.ts        rejestr elementów kadru
    route/                    geometria i malarz trasy
    data/                     źródła danych, palety
    export/                   źródło klatek
  features/
    elevation-profile/
      model/                  czyste obliczenia + testy (smoothing, climbs)
      canvas/                 komponent Konva elementu
      panel/                  edytor w panelu bocznym
      store.ts                slice stanu
      index.ts                rejestracja w rejestrach core
    stats/                    definicje bloków, układy
    data-color/               kolor wg danych + legenda
    animation/                oś czasu, odtwarzanie
    video-export/             pętla eksportu wideo, plansza
  services/
    video-encoding/           wymienny serwis kodowania MP4/WebM/GIF (jedyne miejsce z paczkami)
  components/, store/, utils/ dotychczasowy kod (przenoszony stopniowo, tylko gdy jest dotykany)
```

Istniejących plików nie przenosimy masowo. Przenosimy je tylko wtedy, gdy refaktoryzacja i tak ich dotyka.

### Rejestr elementów kadru

Jeden kontrakt dla każdego elementu, który leży na kadrze i można go zaznaczyć: blok statystyk, profil wysokości, legenda, a w przyszłości dalsze.

```ts
// core/canvas/registry.ts
export interface CanvasElementDefinition<Id = void> {
  kind: string                    // 'stats' | 'elevationProfile' | 'colorLegend' | ...
  label: string                   // na liście „Elementy” w panelu
  icon: ReactNode
  layer: 'route' | 'overlay'      // na której warstwie Konva się rysuje
  order: number                   // kolejność rysowania w warstwie
  useIsVisible(): boolean         // czy element jest włączony
  Node: ComponentType             // komponent Konva
  Editor: ComponentType<{ id: Id }>  // edytor w panelu bocznym
  animationTrack?: AnimationTrackId  // ścieżka osi czasu, która nim steruje (7a)
}

export function registerCanvasElement(def: CanvasElementDefinition<any>): void
export function useCanvasElements(layer: 'route' | 'overlay'): CanvasElementDefinition<any>[]
```

- `CanvasStage` rysuje warstwy przez `useCanvasElements(...)`, bez listy importów konkretnych elementów.
- `Selection` staje się ogólne: `{ kind: string; id?: number }`. `ElementsTab` znajduje edytor w rejestrze zamiast łańcucha `if`.
- Pozycja per format: `FormatLayout` dostaje ogólną mapę `elements: Record<kind, { x; y }>` zamiast osobnych pól dla każdego elementu. Obecne `stats` jest migrowane do tej mapy.
- Wspólne zachowanie (przeciąganie, obrys zaznaczenia, zapis pozycji per format) daje komponent opakowujący `DraggableElement`. Konkretny element rysuje tylko swoją treść.

**Zasady:** OCP (nowy element = nowa rejestracja), SRP (element nie zajmuje się przeciąganiem), DIP (scena zależy od kontraktu, nie od konkretnych komponentów).

### Trasa: geometria, malowanie, interakcja

`NeonRouteGroup` zostaje podzielony na trzy role.

```
RouteGroup (interakcja: drag, Transformer, hitbox, dodawanie punktów)
 └─ RoutePainter (rdzeń + poświata + duch: obecny wygląd)
      ├─ geometria  ← useRouteGeometry(): odcinki do narysowania + pozycja głowicy
      └─ kolor      ← RouteColoring: skąd brać kolor każdego punktu
```

```ts
// core/route/geometry.ts
export interface RouteSegment {
  points: Float64Array | number[]   // płaska tablica x,y w układzie trasy
  trackFrom: number                 // ułamkowy indeks w śladzie (do kolorowania)
  trackTo: number
  role: 'completed' | 'remaining'
  dayId?: number                    // trasa wielodniowa
}

// core/route/coloring.ts
export interface RouteColoring {
  id: string
  // Stały kolor odcinka (jak teraz) albo kolor dla każdego punktu.
  kind: 'solid' | 'perPoint'
  solidColor?(segment: RouteSegment): string
  colorAt?(trackIndex: number): string
}
```

- **Geometria** wybiera, które punkty rysować: zakres, dni, kształt schematyczny, a w 7a głowicę animacji z ułamkowym końcem. Wynikiem jest lista `RouteSegment`. Prywatność (później) będzie tylko kolejnym filtrem tej listy.
- **Malarz** zna wyłącznie `RouteSegment[]` i `RouteColoring`. Ma dwie implementacje z identycznym wyglądem:
  - `SolidRoutePaint`: obecne `Line` z Konvy (szybkie, bez zmian w wyglądzie),
  - `GradientRoutePaint`: własny `Shape`, punkty grupowane w przebiegi tego samego koloru (32 koszyki), poświata osobnym przebiegiem pod rdzeniem, ciągłe przesunięcie kreskowania.
- **Kolorowanie:** `SolidColoring` (kolor stylu), `DayColoring` (kolor dnia, jak teraz), `DataColoring` (źródło danych + paleta, 6a.8 i 7c).
- Malarz wybiera implementację po `coloring.kind`. Wygląd poświaty, ducha i grubości jest wspólny, bo czyta te same `RouteStyle`.

**Zasady:** SRP (trzy role w trzech modułach), OCP (nowy sposób kolorowania nie zmienia malarza), LSP (każda implementacja `RouteColoring` jest wymienna).

### Źródła danych i palety

Jeden kontrakt dla wartości liczonych wzdłuż trasy. Używają go kolor wg danych (7c), kolor wg nachylenia (6a), profil wysokości (6a) i tempo animacji „wg prędkości” (7a).

```ts
// core/data/series.ts
export interface DataSource {
  id: 'speed' | 'heartRate' | 'grade' | 'elevation'
  label: string                    // 'Prędkość'
  unit(units: Units): string       // 'km/h' / 'mph'
  isAvailable(track: GpxTrack): boolean
  compute(track: GpxTrack, cumKm: Float64Array): Float32Array   // wartość na punkt, wygładzona
}

// core/data/palette.ts
export interface Palette {
  id: 'ember' | 'forest' | 'gold'  // Żar, Las, Złoto
  label: string
  stops: string[]
}
export function colorScale(palette: Palette, domain: [number, number], inverted: boolean): (v: number) => string
```

- Serie są liczone raz na ślad (memo w stylu `derived.ts`).
- Nowe źródło (np. kadencja, moc) to nowy plik w `core/data/sources/` i jedna linia rejestracji. UI panelu bierze listę z rejestru.

**Zasady:** OCP, ISP (konsument dostaje `Float32Array` i nie wie, jak liczone), DIP.

### Statystyki: definicje i układy

**Bloki** jako definicje zamiast listy wpisanej w `useStatsChips`:

```ts
// features/stats/model/definitions.ts
export interface StatDefinition {
  key: StatKey
  label: string                       // 'Dystans'
  requires?: ('time' | 'elevation')[] // brak danych → blok wyszarzony
  compute(ctx: StatsContext): number | null
  format(value: number, opts: FormatOptions): string   // jednostki, precyzja
}

// Tylko to, czego potrzebują definicje: bez dostępu do całego store.
export interface StatsContext {
  track: GpxTrack
  range: RouteRange
  cumKm: Float64Array
  breaks: readonly number[]
}
```

**Układy** jako strategie:

```ts
// features/stats/model/layouts.ts
export interface StatsLayoutStrategy {
  id: 'row' | 'columns' | 'grid' | 'hero'
  label: string
  // Czysta funkcja: bloki i styl → pozycje i rozmiary tekstów.
  arrange(chips: StatChip[], style: StatsStyle, frame: { w: number; h: number }, measure: MeasureText): ChipBox[]
}
```

- `StatsHeaderGroup` mierzy, pyta strategię o rozmieszczenie i rysuje pudełka. Sam nie zna układów.
- `arrange` jest czystą funkcją, więc testy układów nie potrzebują Konvy.

**Zasady:** OCP (nowy blok lub układ = nowa definicja), SRP (liczenie ≠ formatowanie ≠ rozmieszczanie ≠ rysowanie), ISP (`StatsContext`).

### Animacja: oś czasu jako model

Oś czasu to czysty model, niezależny od Reacta.

```ts
// features/animation/model/timeline.ts
export type AnimationTrackId = 'route' | 'header' | 'waypoints' | 'stats'

export interface TrackClip { start: number; duration: number; entrance: 'fade' | 'slide' }

export interface Timeline {
  duration: number
  clips: Record<AnimationTrackId, TrackClip>
  pacing: PacingStrategy
}

export interface PacingStrategy {
  id: 'constant' | 'eased' | 'bySpeed'
  // Postęp ścieżki trasy 0..1 → ułamkowy indeks w śladzie.
  headAt(progress: number): number
}

export interface LayerState { opacity: number; offsetY: number; progress: number }
export function evaluate(timeline: Timeline, t: number, track: AnimationTrackId): LayerState
```

- Komponenty nie znają osi czasu. Pytają hook `useLayerAnimation(trackId)`, który w trybie statycznym zwraca stan neutralny (`opacity 1`, `progress 1`). Dzięki temu edytor działa jak dotąd, gdy animacja jest wyłączona.
- Elementy kadru deklarują swoją ścieżkę w rejestrze (`animationTrack`), więc `DraggableElement` sam nakłada wygaszenie i wysunięcie. Konkretne elementy nie zawierają kodu animacji.
- Tempo to strategia: `ConstantPacing` (po dystansie), `EasedPacing`, `SpeedPacing` (po czasie z GPX bez postojów, korzysta z `DataSource` prędkości).
- Zegar odtwarzania (`t`, play/pauza) żyje poza dokumentem, w osobnym małym store bez historii.

**Zasady:** SRP (model ≠ zegar ≠ widok), OCP (nowe tempo lub nowa ścieżka bez zmian w komponentach), DIP (komponenty zależą od `useLayerAnimation`, nie od modelu).

### Eksport: źródło klatek i kodery

Obecny eksport obrazu i nowy eksport wideo dzielą jedno źródło klatek.

```ts
// core/export/frameSource.ts
export interface FrameSource {
  prepare(format: AspectKey): Promise<void>   // reflow, ukrycie UI_ONLY
  renderAt(t: number, target: HTMLCanvasElement): void
  restore(): void
}
```

- `exportVideo(source, session, opts, onProgress, signal)` to krótka pętla: renderuje klatkę przez `FrameSource` i przekazuje ją do `EncodingSession` z serwisu kodowania (niżej). Nie zna formatów ani paczek.
- Obecny `renderStageFiles` zostaje przepisany na `FrameSource.renderAt(0, ...)` i zapis PNG/JPG, z tym samym zachowaniem.

**Zasady:** SRP (renderowanie ≠ kodowanie ≠ pobieranie), DIP (pętla zależy od interfejsów).

### Serwis kodowania wideo i GIF: warstwa abstrakcji nad paczkami

Kodowanie wideo i GIF-a to **osobny, wymienny serwis**. Reszta aplikacji nie importuje żadnej paczki do kodowania (`mediabunny`, `gifenc` ani API WebCodecs) i nie zna ich typów. Zmiana paczki dotyczy jednego katalogu i nie wymaga zmian w UI, pętli eksportu ani testach funkcji.

Abstrakcja ma dwa poziomy, bo paczki zmienia się na dwa sposoby:

```
UI (VideoExportPanel)
 └─ VideoEncodingService            ← poziom 1: cały serwis (np. zamiana na ffmpeg.wasm)
     └─ adapter formatu (mp4 / webm / gif)
          ├─ FrameEncoder            ← poziom 2: kodek (WebCodecs, gifenc, …)
          └─ ContainerMuxer          ← poziom 2: kontener (Mediabunny, …)
```

**Poziom 1: serwis.** Jedyny punkt wejścia dla aplikacji.

```ts
// services/video-encoding/VideoEncodingService.ts
export interface VideoEncodingService {
  // Co jest dostępne w tej przeglądarce: formaty, kodeki, fps, maks. rozdzielczość.
  capabilities(): Promise<EncodingCapabilities>
  estimateBytes(opts: EncodeOptions, sample?: HTMLCanvasElement): number
  // Sesja przyjmuje klatki i zwraca plik; nie zna sceny ani Konvy.
  createSession(opts: EncodeOptions): Promise<EncodingSession>
}

export interface EncodingSession {
  addFrame(frame: CanvasImageSource, timestampUs: number): Promise<void>
  finish(): Promise<Blob>
  abort(): void
}

// Typy własne aplikacji, bez typów z paczek.
export interface EncodeOptions {
  format: 'mp4' | 'webm' | 'gif'
  width: number
  height: number
  fps: number
  loop: number              // 0 = w nieskończoność (GIF)
  quality: 'low' | 'medium' | 'high'
}
```

**Poziom 2: kodek i kontener.** Wewnątrz serwisu każdy format składa się z dwóch wymiennych części. Dzięki temu np. zamiana Mediabunny na inną bibliotekę MP4/WebM dotyczy jednego pliku.

> **Zmiana względem pierwszej wersji planu:** paczki `mp4-muxer` i `webm-muxer` są oznaczone jako przestarzałe i zastąpione przez Mediabunny (tak podają ich strony w npm). Kontener MP4 i WebM obsługuje więc jeden adapter `MediabunnyMuxer`. Wersja jest przypięta dokładnie (`1.61.3`).

```ts
// services/video-encoding/ports.ts
export interface FrameEncoder {          // obraz → zakodowane próbki
  configure(opts: EncodeOptions): Promise<void>
  encode(frame: CanvasImageSource, timestampUs: number): Promise<void>
  flush(): Promise<void>
  onChunk(cb: (chunk: EncodedChunk) => void): void
}

export interface ContainerMuxer {        // próbki → plik
  begin(opts: EncodeOptions, codecInfo: CodecInfo): void
  addChunk(chunk: EncodedChunk): void
  finalize(): Blob
}
```

GIF nie ma podziału na kodek i kontener, więc jego adapter implementuje bezpośrednio `EncodingSession` (bez sztucznego rozbijania).

**Struktura i reguły:**

```
src/services/video-encoding/
  VideoEncodingService.ts    interfejsy publiczne + typy własne
  ports.ts                   FrameEncoder, ContainerMuxer
  createService.ts           createVideoEncodingService(): jedyne miejsce wyboru implementacji
  context.ts                 useVideoEncoding() (domyślnie: createVideoEncodingService())
  VideoEncodingProvider.tsx  podstawienie innej implementacji (testy, inna wersja)
  index.ts                   publiczny eksport serwisu
  default/                   implementacja domyślna
    DefaultVideoEncodingService.ts  składa kodek + kontener, GIF osobno
    CodecContainerSession.ts        dowolna para kodek + kontener
    WebCodecsFrameEncoder.ts        ← jedyny plik z WebCodecs
    MediabunnyMuxer.ts              ← jedyny plik z `mediabunny` (MP4 i WebM)
    GifencSession.ts                ← jedyny plik z `gifenc`
    gifenc.d.ts                     typy paczki (paczka ich nie ma)
  testing/
    FakeVideoEncodingService.ts    do testów UI i pętli eksportu
    contract.ts                    wspólne testy dla każdej implementacji
    contract.test.ts               kontrakt w vitest (podróbka); domyślna implementacja przechodzi go w przeglądarce
```

- **Paczka tylko w swoim adapterze.** Reguła lintera (`no-restricted-imports` w `.oxlintrc.json`) blokuje import `mediabunny` i `gifenc` poza `services/video-encoding/default/`.
- **Wybór implementacji w jednym miejscu.** `createVideoEncodingService()` w `createService.ts` wybiera implementację, a `DefaultVideoEncodingService` składa adaptery. Aplikacja dostaje serwis przez kontekst Reacta (`VideoEncodingProvider`), a nie przez bezpośredni import, więc w testach i przy zmianie paczki wystarczy podstawić inną implementację.
- **Dynamiczne ładowanie.** Adaptery ładują paczki przez `import()` dopiero przy pierwszym eksporcie wideo, więc nie zwiększają startowego rozmiaru aplikacji.
- **Testy kontraktowe.** `contract.test.ts` uruchamia ten sam zestaw dla każdej implementacji: sesja przyjmuje klatki, zwraca niepusty `Blob` właściwego typu MIME, `abort()` nie rzuca wyjątku, `capabilities()` nie obiecuje formatu, którego `createSession` nie obsłuży. Nowa paczka jest gotowa, gdy przechodzi ten zestaw.
- **Błędy przetłumaczone na własne typy** (`EncodingUnsupportedError`, `EncodingFailedError`). UI nie zależy od komunikatów konkretnej biblioteki.

**Przykłady zmian i ich zasięg:**

| Zmiana | Co się zmienia |
|---|---|
| Inna biblioteka MP4/WebM zamiast Mediabunny | Nowy `ContainerMuxer` w `default/`, jedna linia w `DefaultVideoEncodingService.ts`. |
| Inny koder GIF zamiast `gifenc` | Nowa `EncodingSession` dla GIF, jedna linia w `DefaultVideoEncodingService.ts`. |
| Cały serwis na `ffmpeg.wasm` albo kodowanie na serwerze | Nowa implementacja `VideoEncodingService` obok `default/`, przełączenie w `createService.ts`. UI, pętla i `FrameSource` bez zmian. |

**Zasady:** DIP (aplikacja zależy od `VideoEncodingService`, nie od paczek), OCP i LSP (implementacje wymienne, pilnowane testami kontraktowymi), ISP (osobne porty dla kodeka i kontenera), SRP (każdy adapter opakowuje dokładnie jedną paczkę).

### Stan aplikacji

- Każda funkcja ma swój slice w `features/<nazwa>/store.ts`: `profileSlice`, `dataColorSlice`, `animationSlice` (ustawienia osi czasu są częścią dokumentu, więc wchodzą do historii i szablonów).
- Zegar odtwarzania i postęp renderowania są w osobnym store (`playbackStore`), nie w dokumencie.
- Komponenty czytają stan przez wąskie selektory/hooki funkcji (`useProfileSettings()`, `useDataColoring()`), a nie przez cały `AppState` (ISP).
- Migracje utrwalonych ustawień dostają brakujące pola z wartości domyślnych, a `STORE_VERSION` rośnie.

### SOLID: podsumowanie

| Zasada | Jak jest stosowana |
|---|---|
| **S**: jedna odpowiedzialność | Trasa podzielona na geometrię, kolorowanie, malowanie i interakcję. Statystyki na liczenie, formatowanie, rozmieszczanie i rysowanie. Eksport na źródło klatek, serwis kodowania (kodek, kontener) i pobieranie. |
| **O**: otwarte/zamknięte | Rejestry: elementy kadru, źródła danych, palety, bloki statystyk, układy, tempa. Implementacje serwisu kodowania. Nowa funkcja to nowy wpis, a nie edycja istniejącego `if`. |
| **L**: podstawianie Liskov | Każda implementacja `RouteColoring`, `StatsLayoutStrategy`, `PacingStrategy`, `VideoEncodingService`, `FrameEncoder` i `ContainerMuxer` spełnia ten sam kontrakt i jest testowana tym samym zestawem testów kontraktowych. |
| **I**: segregacja interfejsów | Wąskie konteksty (`StatsContext`, `LayerState`, `Float32Array` serii) i hooki per funkcja zamiast całego store. |
| **D**: odwrócenie zależności | Scena, panel, pętla eksportu i komponenty zależą od kontraktów w `core/` i `services/`. Paczki do kodowania są schowane za `VideoEncodingService`. Konkretne implementacje rejestrują się w `features/*/index.ts`. |

Granica, której pilnujemy: **nie budujemy abstrakcji na zapas.** Interfejs powstaje dopiero wtedy, gdy ma co najmniej dwie implementacje w tym planie (np. dwa malarze, cztery źródła danych, trzy formaty wideo). Wyjątek to serwis kodowania: warstwa abstrakcji nad paczkami jest wymaganiem, bo zakładamy możliwą zmianę bibliotek.

---

## Etap 6

### 6a Profil wysokości

**Cel:** wykres wysokości na kadrze z podświetlonymi podjazdami i sumą przewyższeń.

#### Wymagania

| # | Wymaganie |
|---|---|
| 6a.1 | Nowy element kadru „Profil wysokości”, który można włączać i wyłączać, przeciągać oraz zmieniać jego szerokość i wysokość. |
| 6a.2 | Wykres obejmuje aktualny zakres trasy (`range`) i pomija dni ukryte w trasie wielodniowej. |
| 6a.3 | Style wykresu: **wypełniony** (obszar z gradientem do przezroczystości), **linia**, **słupki**. Kolor domyślnie bierze się z koloru trasy. |
| 6a.4 | Położenie: presety **dół kadru**, **góra kadru** i **swobodne** (po przeciągnięciu). |
| 6a.5 | Podświetlanie podjazdów: odcinki spełniające próg (domyślnie ≥ 30 m przewyższenia i ≥ 3% średniego nachylenia) mają mocniejszy kolor. Opcjonalnie pokazujemy etykietę „+NNN m” nad podjazdem. |
| 6a.6 | Suma przewyższeń przy wykresie, przez to samo `elevationGain` co w statystykach, żeby liczby się zgadzały. |
| 6a.7 | Opcjonalne etykiety: wysokość min/max, dystans na osi X. |
| 6a.8 | **Kolorowanie trasy według nachylenia.** Przełącznik w panelu przekolorowuje trasę na kadrze skalą nachylenia (`DataColoring` ze źródłem `grade`). |
| 6a.9 | **Znacznik na trasie.** Punkt na trasie i pionowa kreska na wykresie wskazują to samo miejsce. Położenie ustawia się suwakiem w panelu, a w etapie 7 podąża za głowicą animacji. |

#### Moduły

- `features/elevation-profile/model/`: `smoothElevation` (średnia krocząca po dystansie), `detectClimbs` (histereza + progi), decymacja do szerokości wykresu (min/max na kolumnę pikseli). Wszystko z testami.
- `core/data/sources/grade.ts`, `elevation.ts`: źródła danych (używane też przez 7c).
- `features/elevation-profile/canvas/ElevationProfileNode.tsx`: rysowanie wykresu. Style wykresu (wypełniony, linia, słupki) jako małe funkcje rysujące wybierane z mapy.
- `features/elevation-profile/panel/ElevationProfileEditor.tsx`
- `features/elevation-profile/index.ts`: `registerCanvasElement({ kind: 'elevationProfile', ... })`.

### 6b Statystyki

**Cel:** więcej kontroli nad blokiem statystyk.

#### Wymagania

| # | Wymaganie |
|---|---|
| 6b.1 | Wybór bloków: dzień, dystans, przewyższenie, **czas całkowity**, **czas w ruchu**, **średnia prędkość**, **max wysokość**. Kolejność zmienia się przeciąganiem na liście w panelu. |
| 6b.2 | Układy: **rząd** (jest), **kolumny** (jest), **siatka** (2 kolumny, zawijanie), **jedna duża liczba** (jeden wybrany blok bardzo duży, pozostałe drobne pod nim lub ukryte). |
| 6b.3 | Przełącznik **km / mi**. Wpływa na dystans, prędkość (km/h / mph) i przewyższenie (m / ft), a także na profil wysokości, legendę koloru i znaczniki km. |
| 6b.4 | **Czas w ruchu**: suma odcinków między punktami pokonanych z prędkością ≥ 1,5 km/h. Postoje i pauzy wypadają, a rzadki zapis (punkt co kilka minut) nadal się liczy. Liczony tylko wewnątrz dni, tak jak `durationMs`. |
| 6b.5 | Ręczne nadpisanie wartości (`overrides`) zostaje i obejmuje nowe bloki. |
| 6b.6 | Szablony stylu mogą ustawiać układ statystyk. |

#### Moduły

- `features/stats/model/definitions/*.ts`: jedna definicja na blok (`StatDefinition`).
- `features/stats/model/layouts/*.ts`: `row`, `columns` (przeniesione z komponentu bez zmiany wyglądu), `grid`, `hero`.
- `features/stats/model/movingTime.ts` z testami.
- `core/units.ts`: `Units = 'metric' | 'imperial'` i konwersje. `format.ts` dostaje `formatDistance` / `formatSpeed` / `formatElevation(…, units)`.
- `StatsContent` dostaje `order: StatKey[]` i `units`, a `StatsStyle` dostaje `heroKey`. Migracja: brakujące pola biorą wartości domyślne.

---

## Etap 7

### 7a Animacja

**Cel:** trasa rysująca się w czasie, z możliwością podglądu i eksportu.

#### Wymagania

| # | Wymaganie |
|---|---|
| 7a.1 | Trasa rysuje się od początku zakresu do głowicy. Pozostała część jest widoczna jako **duch** (istniejące ustawienia `remaining*`). |
| 7a.2 | Na końcu rysowanej linii jest **świecący punkt** (kolor trasy, poświata; rozmiar i włączenie w panelu). |
| 7a.3 | Pod kadrem: **odtwórz / pauza**, **suwak czasu** (przewijanie) i **czas** `0:03.2 / 0:08.0`. Pętla podglądu domyślnie włączona. |
| 7a.4 | W panelu: **czas rysowania** (2–30 s, domyślnie 6 s), **pauza na końcu** (0–5 s) i **tempo**: *stałe* (równo po dystansie), *łagodne* (ease-in-out), *wg prędkości* (proporcjonalnie do czasu z GPX, bez postojów). |
| 7a.5 | **Oś czasu z czterema ścieżkami**: Trasa, Nagłówek (tytuł i teksty), Punkty (waypointy), Statystyki. Każda ścieżka to pasek z **początkiem** i **długością**, przeciągany myszą. Wejście elementu: wygaszenie lub wysunięcie. |
| 7a.6 | Punkty pojawiają się w chwili, gdy głowica trasy je mija (opcja „zsynchronizuj z trasą” na ścieżce Punkty). |
| 7a.7 | Statystyki mogą „liczyć się” razem z trasą (dystans rośnie od 0), co jest opcją na ścieżce Statystyki. |
| 7a.8 | Znacznik profilu wysokości (6a.9) podąża za głowicą. |
| 7a.9 | Po zatrzymaniu animacji edytor wraca do widoku statycznego (pełna trasa). Odtwarzanie nie zmienia dokumentu i nie zapisuje się w historii cofania. |
| 7a.11 | **Włączanie animacji**, domyślnie wyłączona. Wyłączona: brak paska odtwarzania pod kadrem, ustawienia w zakładce Animacja zablokowane, eksport wideo niedostępny (z odesłaniem do zakładki Animacja). |
| 7a.12 | Każda zmiana projektu (styl, szablon, przesunięcie elementu, cofnięcie) kończy podgląd i przywraca widok statyczny. Zmiany samej osi czasu podgląd zostawiają. |
| 7a.10 | Podgląd płynny (≥ 30 fps) dla śladu do ok. 50 tys. punktów na przeciętnym laptopie. |

#### Moduły

- `features/animation/model/`: `timeline.ts`, `pacing/*.ts` (trzy strategie), `evaluate.ts`. Wszystko z testami.
- `features/animation/playbackStore.ts`: zegar, play/pauza, pętla `requestAnimationFrame`.
- `features/animation/useLayerAnimation.ts`: jedyny punkt styku komponentów z animacją.
- `useRouteGeometry` czyta głowicę z `useLayerAnimation('route')`. Malarz trasy nie wie o animacji.
- `features/animation/canvas/RouteHeadDot.tsx`: świecący punkt.
- `features/animation/ui/PlaybackBar.tsx`, `features/animation/panel/TimelineEditor.tsx` (cztery paski, bez zewnętrznej biblioteki).
- Wydajność: podczas odtwarzania tło i zdjęcia są na osobnych warstwach Konva i nie są przerysowywane. Co klatkę przerysowuje się tylko warstwa trasy i nakładek.

### 7b Eksport wideo

**Cel:** zapis animacji jako plik wideo gotowy do Instagrama.

#### Wymagania

| # | Wymaganie |
|---|---|
| 7b.1 | Formaty: **MP4** (H.264), **WebM** (VP9) i **GIF**. Opcje niedostępne w danej przeglądarce są wyszarzone z wyjaśnieniem. |
| 7b.2 | Proporcje jak w eksporcie obrazu, w tym **Story/Reels 9:16** (1080×1920). Karuzela: jeden plik na slajd (zob. [Otwarte decyzje](#otwarte-decyzje)). |
| 7b.3 | Klatki na sekundę: **24 / 30 / 60** dla MP4/WebM, **10 / 15 / 20** dla GIF. |
| 7b.4 | **Zapętlenie**: GIF w nieskończoność. MP4/WebM: opcja „powtórz N razy” w pliku (Instagram sam zapętla krótkie filmy). |
| 7b.5 | Plansza eksportu: **miniatury klatek** (6 klatek z równych odstępów czasu), **szacowany rozmiar pliku**, **pasek renderowania** z procentem i czasem do końca, przycisk **Anuluj** i przycisk **Pobierz** po zakończeniu. |
| 7b.6 | Render jest deterministyczny: klatka po klatce, niezależnie od wydajności komputera. Brak zgubionych klatek. |
| 7b.7 | Edytor podczas renderowania jest zablokowany jak przy eksporcie obrazu, a po końcu lub anulowaniu dokument wraca do stanu sprzed eksportu. |
| 7b.8 | Limit długości: 60 s (limit Reels/Story, a do tego chroni pamięć). |

#### Moduły

- `core/export/frameSource.ts`: `StageFrameSource` (reflow, ukrycie `UI_ONLY`, ustawienie `t` w `playbackStore`, render do ponownie używanego canvasa).
- `services/video-encoding/`: serwis kodowania za warstwą abstrakcji (zob. [Serwis kodowania wideo i GIF](#serwis-kodowania-wideo-i-gif-warstwa-abstrakcji-nad-paczkami)). Paczki (`mediabunny`, `gifenc`) są używane wyłącznie w jego adapterach i ładowane dynamicznie.
- `features/video-export/exportVideo.ts`: pętla `FrameSource` → `EncodingSession` z postępem i `AbortSignal`. Nie zna formatów ani paczek.
- `features/video-export/panel/VideoExportPanel.tsx`: przełącznik Obraz / Wideo w zakładce Eksport. Dostępne opcje bierze z `capabilities()`.
- Testy pętli i planszy na `FakeVideoEncodingService`, testy kontraktowe dla implementacji domyślnej.

### 7c Kolor według danych

**Cel:** trasa pokolorowana wartością z danych zamiast jednym kolorem.

#### Wymagania

| # | Wymaganie |
|---|---|
| 7c.1 | Źródło koloru: **jeden kolor** (jak teraz), **prędkość**, **tętno**, **nachylenie**, **wysokość**. |
| 7c.2 | Trzy palety: **Żar** (ciemna czerwień → pomarańcz → żółty), **Las** (ciemna zieleń → seledyn), **Złoto** (brąz → złoto → kremowy). Wartości kolorów dobierzemy pod obecne szablony. |
| 7c.3 | **Odwróć kolory.** |
| 7c.4 | **Zakres wartości**: automatyczny (percentyle 5–95, odporny na skoki GPS) albo ręczny min/max. |
| 7c.5 | **Legenda na kadrze**: pasek gradientu z min/max i jednostką. Element przeciągalny, z włączaniem i wyłączaniem. Styl tekstu zgodny z blokiem statystyk. |
| 7c.6 | Poświata zachowana: przyjmuje kolor odcinka (domyślnie) albo jest jednolita (opcja). |
| 7c.7 | Działa z animacją (7a) i kształtem schematycznym (dla schematu kolor uśredniony na odcinek). |
| 7c.8 | Tętno dostępne tylko, gdy GPX je zawiera; prędkość tylko przy znacznikach czasu. |

#### Moduły

- Parser GPX: odczyt tętna z `<extensions>` (wyszukiwanie po nazwie lokalnej `hr` bez względu na przestrzeń nazw). `GpxPoint` dostaje `hr: number | null`.
- `core/data/sources/{speed,heartRate}.ts` (nachylenie i wysokość istnieją od 6a).
- `core/data/palettes.ts`: Żar, Las, Złoto.
- `features/data-color/`: slice ustawień, `DataColoring` (implementacja `RouteColoring`), panel i element kadru `colorLegend` w rejestrze.

---

## Plan implementacji

Każdy krok to osobny commit (lub kilka), z testami i działającą aplikacją po każdym kroku.

### Krok 0: refaktoryzacja (bez zmiany zachowania)

| Krok | Zakres | Szac. |
|---|---|---|
| 0.1 | **Rejestr elementów kadru** i `DraggableElement`. Blok statystyk przeniesiony do rejestru. Ogólne `Selection`, `ElementsTab` czyta edytory z rejestru, `FormatLayout.elements` z migracją. | 1 dzień |
| 0.2 | **Podział trasy**: `useRouteGeometry` → `RouteSegment[]`, `RoutePainter` + `SolidRoutePaint`, `SolidColoring` / `DayColoring`, `RouteGroup` (interakcja). | 1 dzień |
| 0.3 | **Statystyki**: `StatDefinition` dla obecnych bloków, `StatsLayoutStrategy` dla `row` i `columns`. | 0,5–1 dnia |
| 0.4 | **Eksport obrazu przez `FrameSource`.** | 0,5 dnia |

Kryterium akceptacji kroku 0: wszystkie obecne testy przechodzą, a eksport PNG kilku projektów testowych jest identyczny piksel w piksel z eksportem sprzed refaktoryzacji.

### Etap 6

| Krok | Zakres | Szac. |
|---|---|---|
| 6.1 | **6b Statystyki**: nowe definicje bloków, kolejność, układy siatka i duża liczba, jednostki km/mi, czas w ruchu, migracja | 1–1,5 dnia |
| 6.2 | **Źródła danych i palety** (`DataSource`, `grade`, `elevation`, wygładzanie), testy | 0,5–1 dnia |
| 6.3 | **6a Profil, obliczenia**: podjazdy, decymacja, testy | 0,5 dnia |
| 6.4 | **6a Profil, element kadru**: rysowanie, style, położenie, edytor, rejestracja, szablony | 1–1,5 dnia |
| 6.5 | **`GradientRoutePaint` + `DataColoring`** i kolorowanie wg nachylenia (6a.8) | 1 dzień |
| 6.6 | **6a Znacznik** na trasie i wykresie | 0,5 dnia |

### Etap 7

| Krok | Zakres | Szac. |
|---|---|---|
| 7.1 | **7c Kolor wg danych**: tętno w parserze, źródła prędkości i tętna, panel, element legendy | 1–1,5 dnia |
| 7.2 | **7a Model animacji**: oś czasu, trzy tempa, `useLayerAnimation`, `playbackStore`, głowica w geometrii, świecący punkt | 1–1,5 dnia |
| 7.3 | **7a Pasek odtwarzania** pod kadrem | 0,5 dnia |
| 7.4 | **7a Edytor osi czasu**: cztery ścieżki, przeciąganie, wejścia przez `DraggableElement`, synchronizacja punktów i statystyk | 1,5–2 dni |
| 7.5 | **7b Serwis kodowania** (interfejsy, porty, `FakeVideoEncodingService`, testy kontraktowe, reguła lintera) + adaptery WebCodecs, MP4 i WebM + pętla eksportu z anulowaniem | 1,5–2 dni |
| 7.6 | **7b Plansza eksportu**: miniatury, szacowany rozmiar, pasek, pobieranie | 1 dzień |
| 7.7 | **7b Adapter GIF** w serwisie kodowania | 0,5–1 dnia |

### Razem

| Część | Szacunek |
|---|---|
| Krok 0 (refaktoryzacja) | 3–3,5 dnia |
| Etap 6 | 4,5–6 dni |
| Etap 7 | 7–9,5 dnia |
| **Razem** | **ok. 14,5–19 dni** |

Krok 0 kosztuje około 3 dni na starcie. Część z tego wraca w etapach 6 i 7, bo kolejne funkcje to głównie nowe pliki zamiast zmian w istniejących.

### Kolejność i zależności

```
0.1 Rejestr elementów ─┬──────────────────────────────► 6.4 Profil ─► 6.6 Znacznik
0.2 Podział trasy ─────┼─► 6.5 Kolor wg nachylenia ──► 7.1 Kolor wg danych
0.3 Statystyki ────────┼─► 6.1 Statystyki                    │
0.4 FrameSource ───────┘                                      ▼
                         6.2 Źródła danych ─► 6.3 Podjazdy   7.2 Model animacji ─► 7.3 Pasek ─► 7.4 Oś czasu
                                                              │
                                                              ▼
                                                             7.5 WebM/MP4 ─► 7.6 Plansza ─► 7.7 GIF
```

Kroki 0.1–0.4 są od siebie niezależne. Po kroku 0 równolegle mogą iść 6.1 i 6.2.

### Gałęzie

- `feature/stats-elevation` dla kroku 0 i etapu 6, odgałęziona od `feature/collage-carousel-templates` (zob. [Otwarte decyzje](#otwarte-decyzje)).
- `feature/animation-video` dla etapu 7, odgałęziona od etapu 6 po jego zakończeniu.

---

## Ryzyka

| Ryzyko | Wpływ | Środki zaradcze |
|---|---|---|
| Refaktoryzacja zmieni wygląd lub zachowanie | Regresje w działających funkcjach | Krok 0 bez nowych funkcji, porównanie eksportu piksel w piksel, istniejące testy store. |
| Za dużo abstrakcji | Kod trudniejszy niż problem | Interfejs tylko przy ≥ 2 implementacjach w tym planie. Brak ogólnego „systemu wtyczek”. |
| Wydajność poświaty (`shadowBlur`) przy rysowaniu co klatkę | Podgląd < 30 fps, długi eksport | Osobne warstwy Konva, decymacja do rozdzielczości, przerysowanie tylko warstwy trasy. Dla eksportu postęp i anulowanie. |
| Brak kodowania H.264 w niektórych przeglądarkach (np. część wersji Firefoksa) | MP4 niedostępne | `capabilities()` serwisu kodowania, propozycja WebM, jasny komunikat. |
| GIF: pasy na gradientach i poświacie, duże pliki | Słaba jakość | Stała paleta z próbek, mniejsza rozdzielczość, niskie fps, uczciwy szacowany rozmiar przed renderem. |
| Szum GPS w nachyleniu i prędkości | „Migoczące” kolory, fałszywe podjazdy | Wygładzanie po dystansie i czasie, percentyle zamiast min/max, histereza. |
| Pamięć przy długim wideo w 1080×1920 | Zawieszenie karty | Strumieniowe muxowanie, limit 60 s, jeden ponownie używany canvas. |
| Zgodność starych ustawień i projektów | Błędy po aktualizacji | Wartości domyślne dla nowych pól, migracja `FormatLayout`, test migracji. |

---

## Rozszerzalność na później

Jak architektura przyjmie funkcje spoza tego planu:

| Funkcja | Gdzie się wpina |
|---|---|
| 6c Prywatność | Filtr listy `RouteSegment[]` w geometrii trasy + `DataSource`/statystyki liczone z tej samej maski. Malarz, animacja i eksport działają bez zmian. |
| Nowe dane (kadencja, moc, temperatura) | Nowe `DataSource`, od razu dostępne w kolorze wg danych i jako blok statystyk. |
| Nowe elementy kadru (mini-mapa, kompas, logo) | Nowa rejestracja `CanvasElementDefinition`, z gotowym przeciąganiem, zaznaczaniem i animacją wejścia. |
| Nowe formaty wideo, inna paczka, `ffmpeg.wasm` lub kodowanie na serwerze | Nowy adapter albo nowa implementacja `VideoEncodingService`, przełączenie w `services/video-encoding/createService.ts`. |

---

## Otwarte decyzje

Przy każdej decyzji podana jest propozycja domyślna, z którą ruszę, jeśli nie będzie innych ustaleń.

1. **Baza gałęzi.** `feature/collage-carousel-templates` ma 5 commitów, których nie ma w `main`. *Propozycja:* odgałęzić się od niej. Alternatywa: najpierw ją zmergować do `main`.
2. **Zakres refaktoryzacji.** *Propozycja:* tylko krok 0 opisany wyżej. Pozostały kod (zdjęcia, kolaż, teksty) przenosimy do nowej struktury dopiero przy kolejnych zmianach w nim.
3. **GIF.** *Propozycja:* zostaje, ale jako ostatni krok (7.7), który można pominąć.
4. **Wideo dla karuzeli.** *Propozycja:* przy wielu slajdach osobny plik na slajd (każdy z całą animacją). Panorama jako jedno szerokie wideo to wariant na później.
5. **Oś czasu.** *Propozycja:* uproszczona (początek i długość na ścieżkę, jeden rodzaj wejścia) zamiast edytora klatek kluczowych.
6. **Progi podjazdu i czasu w ruchu.** *Propozycja:* stałe w kodzie (podjazd ≥ 30 m i ≥ 3%, ruch ≥ 1,5 km/h). Edytowalne w panelu dopiero, jeśli okaże się to potrzebne.
