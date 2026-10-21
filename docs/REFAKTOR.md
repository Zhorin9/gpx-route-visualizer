# Refaktor: uproszczenie istniejącego kodu

Zasada: refaktor dotyczy tego, co jest, nie tego, co może będzie. Bez szkieletów pod funkcje, których jeszcze nie ma (tło mapy, przystanki, ikona pojazdu, ciemny motyw), i bez psucia działającego zachowania.

## Co zostało zrobione

**Naprawy cofania (trasa jako część dokumentu)**
- Pliki GPX, z których składa się trasa (`routeSource`), są częścią dokumentu. Ich punkty leżą w `trackCache` poza historią, tak jak biblioteka zdjęć.
- Połączony ślad i dni są wyliczane (`selectTrack`, `selectRouteDays` w `store/derived.ts`).
- Da się cofnąć: wczytanie pliku, dodanie i usunięcie dnia oraz zmianę koloru, stylu linii i widoczności dnia. Wcześniej:
  - cofnięcie dodania dnia zostawiało dłuższą trasę ze starym zakresem,
  - wczytanie pliku czyściło całą historię.
- Akcje trasy przeszły z `mediaSlice` do `routeSourceSlice`. `RouteDay` nazywa się teraz `RoutePart`.

**Mniej powtórzeń**
- Klucze dokumentu w jednym miejscu (`store/document.ts`): cofanie, eksport i podgląd biorą je z `INITIAL_DOCUMENT`, a nie z ręcznie przepisanej listy.
- Jedno `nextId` zamiast trzech.
- Jeden hook `useManualFlags` zamiast tych samych odczytów w dwóch komponentach.
- Jedno `frameStyleFor` zamiast dwóch kopii.
- `isPanorama` zamiast warunku wpisanego dwa razy.
- Jedna stała `CHROME_ACCENT` zamiast pięciu kopii `#b68235`.

**Martwy kod**
- `useHtmlImage` (to on dawał jedyne ostrzeżenie lintera), `IconSliders`, `IconFilm`, `timeAtRouteProgress`, `POINT_FADE_S`, `invertTransform` i nakładka `decimate`.
- Obrazki z szablonu Vite.

**Kolory w CSS**
- `App.css` używa wyłącznie tokenów semantycznych z `index.css`, bez kroków palety i bez kolorów wpisanych na sztywno. Pilnuje tego test `theme.test.ts`.
- Wygląd się nie zmienił: wyliczone style panelu są identyczne jak przed zmianą.
- Ciemny motyw będzie wymagał tylko nowych wartości tych tokenów.

**Porządek w stylach**
- Reguły o identycznych deklaracjach zapisane raz (styl zaznaczonego elementu był powtórzony pięć razy), nieużywana `.file-summary` usunięta, wartości równe tokenom zapisane tokenami, a blok dla małych ekranów przeniesiony na koniec.
- Style jednej funkcji leżą obok jej komponentu, np. `features/animation/panel/TimelineEditor.css`, `components/panel/ExportTab.css`. W `App.css` zostały style wspólne (układ, pola, przyciski, zaznaczenie). `main.tsx` ładuje go przed komponentami, więc reguły komponentu wygrywają tak jak wcześniej.
- Wyliczone style każdego widoku panelu są identyczne przed zmianą i po niej, na szerokim i wąskim ekranie.

**Testy istniejącego kodu**
- Cofanie przy plikach GPX.
- Migawka dokumentu.
- Przełączanie formatów (`reflow`).
- Pętla eksportu wideo z atrapą kodera: czasy klatek, powtórzenia, przerwanie.

## Co zostało wycofane jako przedwczesne

Kod pisany pod mapę i przystanki: rzut Web Mercator, kamera mapy, jedna skala trasy, lista uczestników klatki eksportu, podkład pod sceną, przenoszenie kotwic, przełącznik motywu i odczyt kolorów Konvy z CSS. Wróci razem z funkcją, która go potrzebuje.
