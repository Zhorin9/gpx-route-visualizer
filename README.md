# GPX Route Visualizer

Zamienia ślad GPX w grafikę na Instagram Story, post lub kwadrat: trasa w stylu neon/schemat, nagłówek ze
statystykami (dystans, przewyższenie, czas), własne teksty i etykiety miejscowości. Eksport do PNG
(przezroczysty) lub JPG ze zdjęciem tła.

## Uruchomienie

```bash
npm install
npm run dev        # serwer deweloperski
npm test           # testy (Vitest)
npm run typecheck
npm run lint
npm run build
```

## Architektura

- `src/store/` — Zustand podzielony na slices (`ui`, `media`, `route`, `stats`, `elements`) i `history.ts`
  (undo/redo całego dokumentu). `DocumentState` w `types.ts` definiuje, co obejmuje historia.
- `src/store/derived.ts` — memoizowane obliczenia (projekcja, statystyki, podział postępu), `selectors.ts` — hooki.
- `src/utils/` — czyste funkcje domenowe (parser GPX, geometria, schemat, formatowanie) z testami `*.test.ts`.
- `src/components/` — scena Konva (`CanvasStage`, `NeonRouteGroup`, `StatsHeaderGroup`…), `panel/` — zakładki,
  `fields/` i `ui/` — wspólne kontrolki.

Zasady:

- Etykiety miejsc są zakotwiczone jako pozycja na śladzie (`trackPos`), nie piksele.
- Elementy tylko do edycji mają nazwę `ui-only` i są ukrywane przy eksporcie.
- Fonty są hostowane lokalnie (`@fontsource`) i ładowane dopiero, gdy są użyte.
- W `localStorage` zapisywane są tylko preferencje wyglądu (`partialize` + `version`/`migrate`).

## Skróty

| Skrót | Akcja |
| --- | --- |
| Ctrl+Z / Ctrl+Shift+Z, Ctrl+Y | cofnij / ponów |
| Delete | usuń zaznaczony tekst lub miejsce |
| Strzałki (+Shift) | przesuń zaznaczony element o 1 px (10 px) |
| Esc | anuluj dodawanie miejsca / zakończ edycję trasy / odznacz |
| Dwuklik na tekście | edycja w miejscu (Enter zatwierdza, Esc anuluje) |
