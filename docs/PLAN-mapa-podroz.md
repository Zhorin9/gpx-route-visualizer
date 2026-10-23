# Mapa i podróż z punktów: wymagania, architektura i plan implementacji

Dokument do przeglądu. Opisuje dwie funkcje, które dzielą fundament (MapLibre, rzut Web Mercator):

- **Podróż z punktów**: trasa bez pliku GPX. Użytkownik dodaje przystanki (np. Gdańsk → Stambuł), wybiera środek transportu dla każdego odcinka, a aplikacja wyznacza linię: łuk lotu dla samolotu, drogę dla auta, ścieżki dla roweru i pieszo.
- **Mapa jako tło**: podkład mapowy pod trasą w obrazie i w filmie, ze stylem dopasowanym do szablonu.

Do tego dochodzi to, czego potrzebuje film „przelot od A do B”: **kamera** prowadząca widok za linią i **znacznik pojazdu** (samolot, auto, rower) na czole animacji.

Format 16:9 jest osobnym planem: [PLAN-16x9.md](PLAN-16x9.md). Ten plan go nie wymaga, ale korzysta z jego rejestru formatów (strefy bezpieczne), jeśli będzie już gotowy.

## Spis treści

- [Zasady wspólne](#zasady-wspólne)
- [Przykłady użycia](#przykłady-użycia)
- [Wymagania](#wymagania)
  - [P1 Przystanki](#p1-przystanki)
  - [P2 Środki transportu](#p2-środki-transportu)
  - [P3 Trasa z punktów w reszcie aplikacji](#p3-trasa-z-punktów-w-reszcie-aplikacji)
  - [M1 Mapa jako tło](#m1-mapa-jako-tło)
  - [M2 Źródła i style map](#m2-źródła-i-style-map)
  - [M3 Mapa w filmie](#m3-mapa-w-filmie)
  - [K1 Kamera](#k1-kamera)
  - [K2 Znacznik pojazdu](#k2-znacznik-pojazdu)
- [Architektura](#architektura)
  - [Stan obecny i problemy](#stan-obecny-i-problemy)
  - [Model: przystanki i odcinki](#model-przystanki-i-odcinki)
  - [Strategia środka transportu](#strategia-środka-transportu)
  - [Dostawcy tras i wyszukiwania miejsc](#dostawcy-tras-i-wyszukiwania-miejsc)
  - [Rzut Web Mercator](#rzut-web-mercator)
  - [Dostawcy i style map](#dostawcy-i-style-map)
  - [Świat i nakładka](#świat-i-nakładka)
  - [Renderowanie mapy](#renderowanie-mapy)
  - [Strategia kamery](#strategia-kamery)
  - [Kamera na mapie](#kamera-na-mapie)
  - [Znaczniki pojazdu](#znaczniki-pojazdu)
- [Źródła map: porównanie](#źródła-map-porównanie)
- [Serwisy tras: porównanie](#serwisy-tras-porównanie)
- [Plan implementacji](#plan-implementacji)
- [Testy](#testy)
- [Ryzyka](#ryzyka)
- [Otwarte decyzje](#otwarte-decyzje)

---

## Zasady wspólne

1. **Trasa z punktów to zwykła trasa.** Każdy środek transportu zamienia przystanki w listę `GpxPoint[]`. Statystyki, profil, kolor wg danych, animacja, miejsca, znaczniki km i eksport nie wiedzą, skąd pochodzą punkty.
2. **Strategie i rejestry**, jak w [PLAN-6-7.md](PLAN-6-7.md#zasady-wspólne). Nowy środek transportu, serwis tras albo dostawca mapy to nowy plik i rejestracja, bez gałęzi `if` w istniejącym kodzie.
3. **Bez własnego serwera.** Aplikacja woła publiczne API bezpośrednio z przeglądarki (CORS). Klucze API, jeśli są potrzebne, podaje użytkownik albo konfiguracja budowania. Zdjęcia nadal nie opuszczają przeglądarki. Do serwisów trafiają tylko współrzędne przystanków i obszar mapy.
4. **Brak sieci nie psuje edytora.** Trasa z GPX działa offline jak dziś. Planer i mapa pokazują stan błędu z istniejących komponentów (`StatusCard`, `Toast`) i proponują linię prostą albo tło bez mapy.
5. **Licencje map są szanowane.** Eksport zawiera wymagane oznaczenie źródła mapy. Nie korzystamy z serwerów, których zasady zabraniają takiego użycia.
6. **Teksty interfejsu po polsku**, komentarze w kodzie po angielsku.

---

## Przykłady użycia

| Scenariusz | Przystanki | Środek | Wynik |
|---|---|---|---|
| Lot na wakacje | Gdańsk, Stambuł | samolot | łuk po kole wielkim, linia przerywana, znacznik samolotu leci od A do B, mapa Europy w tle |
| Wyjazd autem | Gdańsk, Szczecin, Berlin | auto | linia po drogach przez punkt pośredni, czas przejazdu szacowany przez serwis tras |
| Wyprawa rowerowa bez GPX | Hel, Gdańsk, Malbork | rower | linia po drogach rowerowych, profil wysokości z serwisu tras |
| Podróż mieszana | Gdańsk → Stambuł (samolot), Stambuł → Kapadocja (auto) | różne na odcinkach | dwie części trasy, każda z własnym kolorem, linią i pojazdem |
| GPX + dojazd | GPX z wyprawy + dolot samolotem na start | GPX i samolot | części trasy z pliku i z planera łączą się jak kolejne dni |

---

## Wymagania

### P1 Przystanki

| # | Wymaganie |
|---|---|
| P1.1 | Nowa zakładka panelu „Podróż” (albo sekcja zakładki trasy) z listą przystanków. Trasa z punktów i z GPX mogą współistnieć jako części jednej trasy. |
| P1.2 | Przystanek dodaje się przez wyszukiwarkę miejsc (wpisz „Gdańsk”, wybierz z podpowiedzi) albo kliknięciem na mapie planera. |
| P1.3 | Przystanki można przeciągać na mapie, zmieniać kolejność na liście i usuwać. Linia przelicza się po zmianie (z opóźnieniem ~400 ms i anulowaniem poprzedniego zapytania). |
| P1.4 | Między dwoma przystankami można dodać punkt pośredni, przeciągając linię na mapie planera (jak w Google Maps). Punkt pośredni nie jest nazwanym miejscem. |
| P1.5 | Przystanek może od razu stać się nazwanym miejscem na trasie (obecne `Waypoint`): domyślnie start, cel i przystanki mają podpis z nazwą miejscowości. |
| P1.6 | Cofanie i ponawianie obejmuje dodanie, przesunięcie i usunięcie przystanku oraz zmianę środka transportu. |
| P1.7 | Trasę z punktów można pobrać jako plik GPX. |

### P2 Środki transportu

| # | Wymaganie |
|---|---|
| P2.1 | Środek transportu wybiera się dla odcinka (pary kolejnych przystanków). Domyślnie nowy odcinek dziedziczy środek poprzedniego. |
| P2.2 | Na start: **samolot**, **auto**, **rower**, **pieszo**, **linia prosta**. Pociąg i prom mają być możliwe do dodania jako nowa strategia bez zmian w reszcie kodu. |
| P2.3 | **Samolot**: łuk po kole wielkim (ortodroma), bez sieci. Domyślnie linia przerywana i znacznik samolotu. Wysokość: profil wznoszenie, przelot, zniżanie albo brak (profil wysokości wyłączony z podpowiedzią). |
| P2.4 | **Auto, rower, pieszo**: linia po drogach i ścieżkach z serwisu tras, z wysokościami. Rower ma wariant szosa / trekking / MTB (profil serwisu). |
| P2.5 | **Linia prosta**: odcinek bez sieci. Zapasowe wyjście, gdy serwis tras nie odpowiada. |
| P2.6 | Brak drogi (np. przez morze dla auta) daje czytelny komunikat i propozycję innego środka dla tego odcinka. |
| P2.7 | Każdy środek ma domyślny pojazd animacji ([K2](#k2-znacznik-pojazdu)) i domyślny wygląd linii. Użytkownik może je zmienić. |

### P3 Trasa z punktów w reszcie aplikacji

| # | Wymaganie |
|---|---|
| P3.1 | Każdy odcinek staje się częścią trasy (`TrackPart`), jak kolejny plik GPX: kolor, linia przerywana, widoczność, nazwa „Gdańsk → Stambuł”. |
| P3.2 | **Czas**: punkty dostają szacowane znaczniki czasu (z serwisu tras albo z prędkości średniej środka). Statystyka czasu pokazuje „~” i dopisek „szacowany”. Tempo animacji „wg prędkości” działa. |
| P3.3 | **Dystans**: dla samolotu długość łuku. Statystyki mogą pokazać dystans osobno dla każdego środka (np. „1 820 km lotu, 410 km autem”). |
| P3.4 | **Przewyższenie**: liczone tylko dla odcinków z wysokościami z terenu. Lot nie dolicza 11 km wznoszenia. |
| P3.5 | Obecne funkcje dla części trasy (usuwanie dnia, kolory dni, zakres) działają bez zmian. |

### M1 Mapa jako tło

| # | Wymaganie |
|---|---|
| M1.1 | Nowy rodzaj tła „Mapa” obok koloru, gradientu i przezroczystego. Mapa leży pod trasą i zgadza się z nią co do metra przy każdym formacie i powiększeniu. |
| M1.2 | Mapa podąża za przesunięciem, obrotem i skalą trasy (`routeTransform`). Obrót trasy obraca mapę (północ przestaje być u góry). |
| M1.3 | Ustawienia mapy: styl, przyciemnienie lub rozjaśnienie, nasycenie, rozmycie, widoczność etykiet (nazwy miast, drogi), cieniowanie terenu. Kolor trasy ma automatyczny kontrast wobec mapy (jak kontrast tekstu wobec tła). |
| M1.4 | Szablon stylu wybiera styl mapy i jej paletę (np. Noc → ciemna, Pocztówka → ciepłe pastele, Kartograf → cieniowanie terenu, Linia → minimalna). Własny szablon zapisuje wybrany styl. |
| M1.5 | Karuzela: jedna mapa przez całą wstęgę slajdów, tak jak trasa. |
| M1.6 | Eksport PNG/JPG w 1× i 2× z ostrą mapą (mapa renderowana w rozdzielczości eksportu, nie skalowana z podglądu). |
| M1.7 | **Oznaczenie źródła** (np. „© OpenStreetMap, © OpenFreeMap”) jest elementem kadru: można je przesunąć, zmniejszyć i dopasować kolor, ale nie usunąć, gdy licencja go wymaga. |
| M1.8 | Mapa się wczytuje: podgląd pokazuje tło zastępcze i stan ładowania. Eksport czeka na wczytanie całej mapy. Błąd sieci: komunikat i eksport bez mapy dopiero po potwierdzeniu. |

### M2 Źródła i style map

| # | Wymaganie |
|---|---|
| M2.1 | Jedynym źródłem w pierwszej wersji jest **OpenFreeMap**: bez klucza, bez rejestracji, dozwolone także komercyjnie. Cieniowanie terenu z danych Terrarium (AWS), też bez klucza. |
| M2.2 | Później: dodatkowe źródła (MapTiler, Stadia, satelita) po wpisaniu klucza API przez użytkownika. Klucz trzymany lokalnie w przeglądarce, nigdy w eksporcie ani w szablonie. |
| M2.3 | Styl mapy można dostroić do presetu: kolory wody, lądu, dróg, lasów i etykiet pochodzą z palety szablonu (style wektorowe). |
| M2.4 | Lista źródeł to rejestr: nowy dostawca to nowy plik. |

### M3 Mapa w filmie

| # | Wymaganie |
|---|---|
| M3.1 | Kamera ([K1](#k1-kamera)) steruje mapą: przy przybliżeniu mapa pokazuje więcej szczegółów (wyższy poziom kafelków), a nie rozmyte powiększenie. |
| M3.2 | Przelot samolotem: start z widokiem obu miast, lot wzdłuż łuku, przybliżenie przy lądowaniu. |
| M3.3 | Eksport filmu z mapą jest deterministyczny: każda klatka czeka na wczytanie kafelków. Podgląd może pokazywać niedoczytane kafelki. |
| M3.4 | Szacowany czas eksportu uwzględnia wczytywanie mapy. Kafelki wczytane raz nie są pobierane ponownie w tym samym eksporcie. |

### K1 Kamera

Dziś kadr pokazuje całą trasę przez cały film. Przy trasie na 300 km albo locie przez pół Europy linia na końcu jest cienka, a ruch słabo widoczny. Kamera przybliża fragment trasy, po którym idzie animacja. Działa z mapą i bez niej (na kolorze, gradiencie, wzorze).

| # | Wymaganie |
|---|---|
| K1.1 | Tryby kamery: **Statyczna** (jak dziś), **Śledzenie** (stałe przybliżenie, środek kadru płynnie podąża za czołem linii), **Przelot** (start z całą trasą, przybliżenie, śledzenie, oddalenie do całej trasy na końcu). |
| K1.2 | Ustawienia w panelu animacji: przybliżenie (np. 1,5–8×), płynność (bezwładność), dla przelotu długość wejścia i wyjścia. |
| K1.3 | Kamera porusza **świat** (mapa, trasa, miejsca, znaczniki km, zdjęcia przy miejscach, pojazd). Tło bez mapy, tytuł, teksty, statystyki, profil wysokości, legenda i zdjęcia kolażu stoją w miejscu. |
| K1.4 | Grubość linii, napisy miejsc i znacznik pojazdu nie rosną przy przybliżeniu (stała wielkość na ekranie). |
| K1.5 | Mapa w tle wypełnia cały kadr przy każdym widoku kamery (MapLibre dociąga kafelki poza trasą). |
| K1.6 | Podgląd, przewijanie osi czasu i eksport dają ten sam obraz dla tej samej chwili. |
| K1.7 | W karuzeli kamera jest wyłączona (trasa przechodzi przez granice slajdów). |

### K2 Znacznik pojazdu

| # | Wymaganie |
|---|---|
| K2.1 | Czoło linii może być: kropką (jak dziś), samolotem, autem, rowerem, piechurem, statkiem. |
| K2.2 | Znacznik obraca się zgodnie z kierunkiem ruchu, wygładzonym, żeby nie drgał na zakrętach GPS. Auto i rower nie stają do góry nogami przy jeździe na zachód (odbicie lustrzane zamiast obrotu o >90°). |
| K2.3 | Kolor znacznika domyślnie z koloru części trasy, rozmiar z obecnego `headSize`. |
| K2.4 | Ikony jako wektorowe ścieżki (ostre w 2×), w stylu pasującym do presetów. |
| K2.5 | Każda część trasy może mieć inny pojazd. Dla odcinka z planera domyślnie pojazd jego środka transportu, dla GPX pojazd ustawiony w animacji. |

---

## Architektura

### Stan obecny i problemy

| Miejsce | Problem | Skutek |
|---|---|---|
| `routeSourceSlice.ts` `loadGpxFile` | Jedyna droga do trasy to plik. Logika dołączania części (kolor, nazwa, zakres) siedzi w tej funkcji. | Planer musiałby ją powielić. |
| `TrackPart` | Nie wie, skąd ma punkty. | Nie da się przeliczyć odcinka po zmianie przystanku. |
| `gpx.ts:195` `projectPointsToCanvas` | Rzut równoodległościowy z poprawką na środkową szerokość. | Nie zgadza się z kafelkami Web Mercator przy długich trasach północ–południe (Gdańsk → Stambuł to ~13° szerokości). |
| `BackgroundLayer.tsx` | Rodzaje tła jako gałęzie `if` w komponencie. | Mapa byłaby kolejną gałęzią z asynchronicznym ładowaniem. |
| `computeRangeStats`, `movingDurationMs` | Zakładają ruch z GPS: punkty z czasem, wysokość z barometru. | Lot dałby absurdalne przewyższenie i tempo. |

### Model: przystanki i odcinki

```ts
// src/types.ts
export interface Stop {
  id: number
  name: string
  lat: number
  lon: number
  // A via point shapes the line but is not a named place.
  via: boolean
}

export type PartOrigin =
  | { kind: 'gpx' }
  | { kind: 'plan'; mode: TravelModeId; profile?: string; stops: Stop[] }

export interface TrackPart {
  // ...as today
  origin: PartOrigin
  vehicle?: VehicleId            // animation marker for this part
}
```

- Odcinek z planera to `TrackPart` z `origin.kind === 'plan'`. Pierwszy i ostatni przystanek odcinka to końce, reszta to przystanki pośrednie. Kolejny odcinek zaczyna się od ostatniego przystanku poprzedniego, więc lista przystanków w panelu powstaje ze złożenia odcinków.
- Punkty trafiają do `trackCache` pod nowym kluczem, jak dziś. Przystanki są w dokumencie, więc cofanie przywraca odcinek, a jego punkty są wciąż w pamięci podręcznej (klucze nie są używane ponownie).
- Wspólna funkcja `appendPart(points, meta)` w `routeSourceSlice` przejmuje logikę dołączania z `loadGpxFile`. Plik GPX i planer z niej korzystają. To zmniejsza `loadGpxFile`.
- Przeliczenie odcinka (`replanPart(id, stops, mode)`) zapisuje nowe punkty pod nowym kluczem i podmienia `sourceKey` jednym commitem. Zakres trasy i miejsca (`trackPos`) przenoszą się proporcjonalnie do dystansu.

### Strategia środka transportu

```ts
// src/features/travel/model/modes.ts
export interface TravelMode {
  id: TravelModeId                       // 'plane' | 'car' | 'bike' | 'foot' | 'straight'
  label: string
  icon: ComponentType
  vehicle: VehicleId                     // default animation marker
  line: { dashed: boolean }
  avgSpeedKmh: number                    // for estimated time when the provider gives none
  // Elevation in the points comes from the ground, so climbing counts.
  groundElevation: boolean
  profiles?: { id: string; label: string }[]   // bike: road / trekking / mtb
  build: (stops: Stop[], ctx: BuildContext) => Promise<GpxPoint[]>
}

interface BuildContext {
  profile?: string
  signal: AbortSignal
  router: RoutingProvider                // the user's chosen provider
}

export function registerTravelMode(mode: TravelMode): void
export function travelModes(): readonly TravelMode[]
```

| Środek | `build` | Sieć |
|---|---|---|
| `plane` | ortodroma (interpolacja sferyczna) zagęszczona co ~10 km, łączy kolejne przystanki | nie |
| `straight` | odcinki proste zagęszczone co ~1 km (żeby kamera i tempo działały płynnie) | nie |
| `car` | `router.route(stops, 'car')` | tak |
| `bike` | `router.route(stops, profile ?? 'trekking')` | tak |
| `foot` | `router.route(stops, 'hiking')` | tak |

- Szacowany czas (P3.2) dokłada wspólna funkcja po `build`: jeśli punkty nie mają czasu, czas = dystans / `avgSpeedKmh` od chwili startu. Serwis tras, który zwraca czas, go ustawia.
- `groundElevation: false` (samolot) mówi statystykom, żeby nie liczyły przewyższenia tej części. Statystyki dostają flagę z części trasy, nie typ środka.
- Pociąg i prom później: pociąg przez serwis tras z profilem kolejowym albo linię prostą, prom jako `straight` z pojazdem `boat`. Nowy plik, rejestracja, nic więcej.

### Dostawcy tras i wyszukiwania miejsc

```ts
// src/features/travel/providers/routing.ts
export interface RoutingProvider {
  id: string                             // 'brouter' | 'ors' | 'graphhopper'
  label: string
  needsKey: boolean
  // Provider profile for each generic one; a missing entry means "not supported".
  profiles: Partial<Record<'car' | 'trekking' | 'road' | 'mtb' | 'hiking', string>>
  route: (stops: Stop[], profile: string, signal: AbortSignal) => Promise<RouteResult>
}

export interface RouteResult {
  points: GpxPoint[]                     // with elevation, time when the provider has it
  // Error a person can act on, e.g. "no road between these places".
}

// src/features/travel/providers/geocoding.ts
export interface GeocodingProvider {
  id: string                             // 'photon' | 'nominatim'
  search: (query: string, near: LatLon | null, signal: AbortSignal) => Promise<Place[]>
  reverse: (at: LatLon, signal: AbortSignal) => Promise<Place | null>
}
```

- Domyślnie **BRouter** (trasy) i **Photon** (wyszukiwanie). Oba bez klucza.
- Odpowiedzi serwisów są w pamięci podręcznej na czas sesji (klucz: przystanki + profil), więc cofnij/ponów nie pyta sieci ponownie.
- Zapytania przez kolejkę z limitem (np. 1 na sekundę dla publicznych instancji), żeby nie łamać zasad użycia.
- Testy: każdy dostawca ma test na zapisanej odpowiedzi (fixture), bez sieci.

### Rzut Web Mercator

- `projectPointsToCanvas` przechodzi na Web Mercator: `x = lon`, `y = ln(tan(π/4 + lat/2))`, skalowane do kadru jak dziś.
- Dla krótkich tras (do ~100 km) różnica jest niewidoczna. Dla długich zmienia proporcje w pionie, więc migawki testów geometrii trzeba zaktualizować świadomie (jeden commit, tylko rzut).
- Rzut zwraca też **przekształcenie świata**: środek i skalę w metrach Mercatora na piksel. Tego potrzebuje mapa, żeby trafić w trasę, i kamera, żeby przełożyć widok na `center` / `zoom` MapLibre.

### Dostawcy i style map

```ts
// src/features/map/providers.ts
export interface MapStyleDef {
  id: string                             // 'ofm-positron', 'stadia-watercolor'
  label: string
  provider: MapProviderId
  kind: 'vector' | 'raster'
  // Style URL or a style built from the preset palette.
  style: (ctx: { key?: string; palette?: MapPalette }) => StyleSpecification | string
  attribution: string                    // text that must stay in the export
  maxZoom: number
  needsKey: boolean
}
registerMapStyle(def)
```

- Szablon stylu ma pole `map?: { styleId: string; palette?: MapPalette; dim: number; labels: boolean; hillshade: boolean }`.
- Style wektorowe przyjmują paletę presetu: funkcja podmienia kolory warstw `water`, `landcover`, `road`, `place` w specyfikacji stylu. Rastrowe (satelita, później) dostają tylko przyciemnienie i nasycenie.
- Podmiana palety jest pisana pod układ danych **OpenMapTiles**, którego używa OpenFreeMap. Ten sam układ ma MapTiler i własny hosting kafelków OpenFreeMap, więc zmiana serwera to zmiana adresu w jednym pliku. Protomaps ma inne nazwy warstw i wymagałby osobnego mapowania palety.

### Świat i nakładka

Scena nie wymaga przebudowy warstw. Wszystko, co należy do „świata”, już dziś liczy położenie z jednego przekształcenia trasy (`routeTransform`):

| Element | Jak dziś dostaje położenie |
|---|---|
| Linia trasy i dekoracje czoła (pojazd) | grupa z `routeTransform` ([RouteGroup.tsx:82](../src/components/RouteGroup.tsx:82)) |
| Miejsca i zdjęcia przy miejscach | `applyTransform(pointAt(…), routeTransform)` ([RouteGroup.tsx:121](../src/components/RouteGroup.tsx:121)) |
| Znaczniki km | `applyTransform(pointAt(…), routeTransform)` ([KmMarkers.tsx:56](../src/components/KmMarkers.tsx:56)) |

Tytuł, teksty, statystyki, profil i legenda są w osobnej warstwie i nie korzystają z `routeTransform`, więc kamera ich nie rusza.

Zmiana:

- Jedna funkcja `useViewTransform()` zwraca **`routeTransform` złożone z widokiem kamery**. Bez kamery zwraca samo `routeTransform`, więc scena wygląda dokładnie jak dziś. Trzy miejsca z tabeli używają jej zamiast `routeTransform`.
- Napisy miejsc i znaczniki km mają przesunięcia w pikselach ekranu (`dx`, `dy`), więc przy przybliżeniu nie rosną same z siebie (K1.4).
- Linia trasy: grupa jest skalowana, więc grubość linii i kropki czoła dzielimy przez skalę kamery (albo `strokeScaleEnabled={false}` w malarzu trasy).
- Mapa używa tego samego złożonego przekształcenia (`worldToMapView`).
- Wzór tła (siatka, poziomice) zostaje nieruchomy jak kolor i gradient. Ruch daje mapa i trasa.
- Przeciąganie i obracanie trasy zapisuje `routeTransform`, więc działa tylko, gdy kamera stoi w widoku statycznym (edycja, pauza na początku osi). W trakcie odtwarzania trasa nie jest edytowalna, jak dziś.

### Renderowanie mapy

**MapLibre GL JS** w obu rolach:

1. **Planer**: interaktywna mapa w panelu (albo w oknie na całą szerokość) do klikania i przeciągania przystanków. Zwykły komponent React z MapLibre, bez Konvy.
2. **Tło kadru**: MapLibre poza ekranem (ukryty kontener o rozmiarze kadru × skala eksportu, `preserveDrawingBuffer: true`). Ustawiamy widok z przekształcenia świata (`jumpTo`), czekamy na zdarzenie `idle`, kopiujemy płótno do `ImageBitmap` i rysujemy w Konvie w warstwie tła, pod zdjęciami i trasą.

Szczegóły:

- Rozmiar podglądu jest mały, więc w edytorze mapa renderuje się w rozdzielczości podglądu. Eksport renderuje ponownie w pełnej rozdzielczości (M1.6). Limit płótna WebGL (zwykle 8192 lub 16384 px) dzieli wstęgę karuzeli 4K na kafle renderowane osobno.
- Obrót trasy → `bearing` mapy. Skala trasy → `zoom`. Przesunięcie → `center`. Jedna funkcja `worldToMapView(worldTransform, routeTransform, camera)` i test na niej.
- Mapa jest nowym rodzajem tła w rejestrze tła. Przy okazji `BackgroundLayer` dzieli się na rejestr rodzajów (kolor, gradient, mapa), co usuwa gałęzie `if` z komponentu.
- Kafelki tylko od dostawców z CORS. Inaczej płótno jest „skażone” i eksport się nie uda. Sprawdzane testem integracyjnym dla każdego wbudowanego stylu.
- Oznaczenie źródła to element kadru w rejestrze elementów, z tekstem z `MapStyleDef.attribution`.

### Strategia kamery

Ten sam wzór co `PacingStrategy`:

```ts
// src/features/camera/model/camera.ts
export interface CameraView {
  // Centre in world coordinates and zoom relative to the whole-route view.
  x: number
  y: number
  zoom: number
}

export interface CameraContext {
  geometry: RouteGeometry        // projected route
  head: number                   // fractional track index the line has reached
  progress: number               // 0-1 of the route clip
  settings: CameraSettings
  frame: { w: number; h: number }
}

export interface CameraStrategy {
  id: CameraId                   // 'static' | 'follow' | 'flyover'
  label: string
  viewAt: (ctx: CameraContext) => CameraView
}
```

- `viewAt` jest czystą funkcją czasu, bez stanu. Bezwładność śledzenia to wygładzenie po torze (średnia pozycji czoła w oknie czasu), a nie filtr zależny od poprzedniej klatki. Dzięki temu podgląd, przewijanie osi i eksport klatka po klatce dają ten sam obraz (K1.6).
- Kamera podłącza się przez nowy punkt rozszerzenia w [providers.ts](../src/core/route/providers.ts) (`provideWorldView`), tak jak `provideRouteHead`. Trasa nie importuje kamery.
- Widok jest w układzie świata, a nie w pikselach kadru, więc ta sama strategia steruje trasą w Konvie (przez `useViewTransform`) i mapą MapLibre.

### Kamera na mapie

- `worldToMapView` przekłada `CameraView` na `center`, `zoom` i `bearing` MapLibre.
- Eksport filmu: dla każdej klatki `jumpTo`, czekanie na `idle`, kopia płótna. Przed eksportem przejście „na sucho” po klatkach w niskiej rozdzielczości wczytuje kafelki do pamięci podręcznej przeglądarki (M3.4).
- Przy przybliżeniu mapa daje więcej szczegółów, bo MapLibre sam wybiera poziom kafelków.

### Znaczniki pojazdu

```ts
// src/features/animation/vehicles.ts
export interface VehicleDef {
  id: VehicleId                  // 'dot' | 'plane' | 'car' | 'bike' | 'walker' | 'boat'
  label: string
  path: string                   // SVG path, pointing east, centred on (0, 0)
  // Cars and bikes flip instead of turning upside down when heading west.
  flipWhenWest: boolean
}
registerVehicle(def)
```

- Rysowany przez obecną dekorację czoła animacji (`addRouteDecoration`). Kropka to pierwszy wpis rejestru, więc dzisiejsze zachowanie zostaje.
- Kierunek: kąt między punktami czoła oddalonymi o stały dystans na torze (np. 150 m w skali kadru), nie między sąsiednimi punktami GPS.
- Pojazd na część trasy z pola `TrackPart.vehicle`, z domyślnym pojazdem animacji.

---

## Źródła map: porównanie

Limity i warunki trzeba sprawdzić przed wyborem. Podane orientacyjnie.

| Źródło | Typ | Klucz | Darmowo | Uwagi |
|---|---|---|---|---|
| **OpenFreeMap** | wektor | nie | tak, bez limitu, także komercyjnie | Liberty, Positron, Bright. **Wybrane: jedyne źródło w pierwszej wersji.** Kolory do podmiany z presetu. Pozostałe wiersze to opcje na później. |
| **MapTiler** | wektor + raster | tak | ~100 tys. zapytań/mies. | Outdoor, Topo, Winter, satelita, cieniowanie, poziomice. Najlepsze w góry. |
| **Stadia Maps** | raster + wektor | tak (localhost bez) | niekomercyjnie | Stamen Watercolor, Toner, Terrain. Akwarela pod „Pocztówkę”. |
| **Thunderforest** | raster | tak | plan hobby | OpenCycleMap, Outdoors. |
| **CARTO** | raster + wektor | nie | z limitem, niekomercyjnie | Positron, Dark Matter. Pod „Linię” i „Noc”. |
| **Esri World Imagery** | raster | tak | wg warunków Esri | Satelita. |
| **Protomaps (PMTiles)** | wektor | nie | własny hosting | Jeden plik (np. Polska) na statycznym hostingu. Bez limitów. |
| **Geoportal (ortofoto, topo)** | WMTS | nie | tak | Do sprawdzenia: CORS i układ współrzędnych. |
| tile.openstreetmap.org | raster | nie | tylko testy | Zasady użycia zabraniają intensywnego korzystania. Nie używamy. |
| Terrarium (AWS) | wysokości | nie | tak | Cieniowanie terenu we własnych kolorach i wysokości dla linii prostej. |

## Serwisy tras: porównanie

| Serwis | Klucz | Profile | Wysokości | Uwagi |
|---|---|---|---|---|
| **BRouter** | nie | auto, rower (szosa, trekking, MTB), pieszo | tak | **Domyślny.** Publiczna instancja z umiarkowanym limitem. |
| OpenRouteService | tak (darmowy) | auto, rower (kilka), pieszo, wędrówka | tak | ~2000 tras/dzień. |
| GraphHopper | tak | auto, rower, pieszo | tak | Darmowy plan z dziennym limitem. |
| OSRM demo | nie | praktycznie auto | nie | Tylko do testów. |
| Valhalla (Stadia) | tak | auto, rower, pieszo | tak | Z kluczem Stadia, jeśli już jest dla mapy. |

Wyszukiwanie miejsc: **Photon** (komoot, bez klucza, podpowiedzi podczas pisania). Nominatim jako zapasowy (limit 1 zapytanie/s, nie do podpowiedzi przy każdym znaku).

---

## Plan implementacji

| Krok | Zakres | Zależy od |
|---|---|---|
| **1. Model i samolot** | `Stop`, `PartOrigin`, `appendPart` wydzielone z `loadGpxFile`, rejestr `TravelMode`, samolot i linia prosta, szacowany czas, flaga `groundElevation` w statystykach. Lista przystanków w panelu, przystanki wpisywane współrzędnymi lub z wyszukiwarki. | – |
| **2. Wyszukiwarka miejsc** | `GeocodingProvider`, Photon, podpowiedzi, przystanki jako nazwane miejsca. | 1 |
| **3. Serwis tras** | `RoutingProvider`, BRouter, auto, rower (3 profile), pieszo, kolejka zapytań, pamięć podręczna, błędy, eksport GPX, `replanPart`. | 1 |
| **4. Znaczniki pojazdu** | Rejestr pojazdów, kierunek, odbicie, pojazd na część trasy i ze środka transportu. | 1 |
| **5. Rzut Web Mercator** | Nowy rzut, przekształcenie świata, aktualizacja migawek. | – |
| **6. Przekształcenie widoku** | `useViewTransform` w trasie, miejscach i znacznikach km, stała grubość linii przy skali. Bez kamery zwraca `routeTransform`, więc bez zmiany wyglądu. | – |
| **7. Kamera** | `CameraStrategy`, tryby statyczna, śledzenie, przelot, ustawienia w panelu animacji, `provideWorldView` podpięte do `useViewTransform`. | 6 |
| **8. Planer na mapie** | MapLibre w panelu planera, OpenFreeMap, klikanie, przeciąganie, punkty pośrednie przez przeciąganie linii. | 3, 5 |
| **9. Mapa jako tło** | Rejestr tła, MapLibre poza ekranem, `worldToMapView`, ustawienia mapy, oznaczenie źródła, eksport w pełnej rozdzielczości, karuzela. | 5, 6 |
| **10. Style i presety** | Rejestr stylów, paleta presetu w stylu OpenFreeMap (układ OpenMapTiles), cieniowanie terenu z Terrarium, przypisanie stylów do 8 presetów. Dostawcy z kluczem poza tym planem. | 9 |
| **11. Mapa w filmie** | Kamera na mapie, eksport klatka po klatce z czekaniem na kafelki, wstępne wczytanie. | 7, 9 |

Kroki 1–4 działają na obecnym tle z obecną animacją: lot Gdańsk → Stambuł jako łuk z samolotem na gradiencie da się zrobić od razu. Po kroku 7 kamera prowadzi ten lot także bez mapy.

---

## Testy

- **Ortodroma**: Gdańsk → Stambuł ma długość zgodną z wzorem haversine (±0,5%). Łuk przechodzi przez punkt środkowy koła wielkiego. Przypadek przez antypołudnik (np. Tokio → Los Angeles) nie robi linii przez cały świat.
- **Model**: dodanie odcinka, przeliczenie, cofnięcie. `trackPos` miejsc przenosi się proporcjonalnie. Usunięcie przystanku środkowego łączy dwa odcinki.
- **Kamera**: `viewAt` czysta i deterministyczna (ten sam czas, ten sam widok). Przelot zaczyna i kończy na widoku całej trasy. Śledzenie trzyma czoło w środkowej części kadru.
- **Przekształcenie widoku**: bez kamery `useViewTransform` zwraca `routeTransform`. Z kamerą miejsce na trasie i jego napis trafiają w ten sam piksel co punkt linii.
- **Pojazdy**: kąt na prostych odcinkach w czterech kierunkach, odbicie przy jeździe na zachód.
- **Statystyki**: lot nie dolicza przewyższenia, czas szacowany oznaczony jako szacowany.
- **Dostawcy**: parsowanie zapisanych odpowiedzi BRouter i Photon, błędy „brak drogi” i limit zapytań.
- **Rzut**: punkt trasy i ten sam punkt na mapie w tym samym pikselu (±1 px) dla Gdańska, Stambułu i Tromsø, przy obrocie i skali trasy.
- **Eksport**: płótno nie jest skażone dla każdego wbudowanego stylu (test w przeglądarce).

---

## Ryzyka

| Ryzyko | Skutek | Ograniczenie |
|---|---|---|
| Publiczne serwisy zmieniają warunki albo limity | Planer przestaje działać | Dostawcy za interfejsem. Linia prosta zawsze dostępna. Własna instancja BRouter jako opcja. |
| Kafelki bez CORS albo zmiana nagłówków | Eksport się nie udaje | Test każdego stylu. Czytelny błąd i eksport bez mapy. |
| Eksport filmu z mapą jest wolny | Minuty na film 1080p, dłużej w 4K | Wstępne wczytanie kafelków i szacunek czasu przed startem. |
| Kamera przy dużym powiększeniu na rzadkich punktach GPS | Poszarpana linia | Istniejące wygładzanie trasy. Limit przybliżenia zależny od gęstości punktów. |
| Limit rozmiaru płótna WebGL | Brak mapy w eksporcie 2× karuzeli | Renderowanie mapy w kafelkach. |
| OpenFreeMap utrzymuje jedna osoba z darowizn | Mapa przestaje się wczytywać | Układ OpenMapTiles: przejście na własny hosting kafelków OpenFreeMap albo MapTiler to zmiana adresu. Eksport bez mapy po potwierdzeniu (M1.8). |
| Rozmiar MapLibre (~250 kB gz) | Wolniejszy start | Ładowanie dynamiczne dopiero przy otwarciu planera albo wyborze tła „Mapa”. |

---

## Otwarte decyzje

1. **Gdzie jest planer**: sekcja w zakładce trasy, osobna zakładka „Podróż” (propozycja) czy okno na całą szerokość ekranu?
2. **Klucze API**: mapa ich nie potrzebuje (OpenFreeMap). Pytanie zostaje dla serwisów tras i wyszukiwarki, jeśli publiczne BRouter i Photon przestaną wystarczać.
3. **Wysokość lotu**: profil wznoszenie–przelot–zniżanie w profilu wysokości czy brak profilu dla lotu (propozycja)?
4. ~~**Użycie komercyjne**~~ **Rozstrzygnięte:** na razie aplikacja jest darmowa i niekomercyjna. Dozwolone są źródła z darmowym planem niekomercyjnym (Stadia, CARTO, Thunderforest hobby) i publiczne instancje BRouter i Photon w granicach ich zasad. Każde źródło i serwis mają w rejestrze opis warunków, żeby przejście na model komercyjny oznaczało przegląd listy, a nie zmiany w kodzie.
5. **Pociąg i prom**: w pierwszej wersji czy później?
