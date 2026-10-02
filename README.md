# Kleiderapp

App, um den eigenen Kleiderschrank digital zu speichern und sich mit KI Outfits vorschlagen zu lassen. Die Funktionen orientieren sich an Apps wie *Acloset*.

## Tech-Stack

- **Expo SDK 57** / React Native 0.86 / React 19 mit TypeScript
- **Expo Router** für die Navigation, mit nativen Tabs auf iOS und Android und einer eigenen Tab-Leiste im Web
- Eine Codebasis für iOS, Android und Web
- Build und Release über **EAS** (`npx eas-cli@latest build`), ohne lokales Xcode oder Android Studio

## Loslegen

```bash
npm install
npm start          # Dev-Server; QR-Code mit Expo Go scannen
npm run ios        # bzw. android / web
```

Checks vor jedem Commit:

```bash
npm run lint
npm run typecheck
```

Neue Pakete immer mit `npx expo install <paket>` hinzufügen, damit die Versionen zum SDK passen.

## Projektstruktur

```
src/
  app/                   # Screens (jede Datei = Route)
    _layout.tsx          # Root-Stack: Theme, WardrobeProvider
    (tabs)/_layout.tsx   # Tab-Leiste: Start · Kleiderschrank · (+) · Outfit · Entdecken
    (tabs)/index.tsx     # Start: Onboarding "Erstelle deinen Kleiderschrank", Fortschritt 0/5
    (tabs)/wardrobe.tsx  # Kleiderschrank: Schnellaktionen, Filter, Kategorie-Tabs, Artikel-Raster
    (tabs)/outfits.tsx   # Outfit: Outfit / Packliste / Kalender
    (tabs)/discover.tsx  # Entdecken: Outfits zu einem Artikel finden (Demo-Feed)
    add-item.tsx         # Modal: Artikel per Kamera/Galerie hinzufügen
    create-outfit.tsx    # Modal: Outfit aus Artikeln zusammenstellen
    item/[id]/index.tsx  # Artikel-Detailansicht
    calendar.tsx         # Kalender (auch als Reiter im Outfit-Tab)
    plan-outfit.tsx      # Modal: Outfit für einen Tag wählen oder neu erstellen
    trip/new.tsx         # Modal: neue Packliste (Name, Zeitraum)
    trip/[id]/index.tsx  # Packliste abhaken, eigene Einträge
    trip/[id]/items.tsx  # Modal: Artikel für die Packliste wählen
    item/[id]/edit.tsx   # Modal: Artikel bearbeiten (gleiches Formular wie Hinzufügen)
    import-items.tsx     # Modal: bis zu 15 Fotos auf einmal importieren
    wishlist.tsx         # Wunschliste
    stats.tsx            # Stil-Statistiken
    location.tsx         # Modal: Standort für das Wetter
    profile.tsx          # Profil & Einstellungen
  components/            # UI-Bausteine (Tab-Leiste mit +-Menü, Header, Icon, Screen, …)
  constants/theme.ts     # Farben (hell/dunkel), Abstände, Fonts
  data/                  # Demo-Daten (Entdecken-Feed)
  lib/                   # Speicherung (persistence.ts / .web.ts), Sicherung (backup*.ts), Dialoge, Datums-Helfer,
                         # item-filters.ts (Sortieren/Filtern), stats.ts (Statistiken),
                         # background-removal/ (Freistellen)
  store/                 # Zustand (Kleiderschrank & Outfits, React Context)
  types/wardrobe.ts      # Datenmodell: ClothingItem, Outfit, Calendar, Trip, Kategorien
```

Die Oberfläche orientiert sich an Acloset: Tab-Leiste mit rundem **+** in der Mitte, das ein Menü öffnet (Artikel, Wunschliste, Outfit-Buch, Kalender, Beitrag). Noch nicht umgesetzte Funktionen zeigen "Kommt bald".

## Roadmap

### Phase 1: Digitaler Kleiderschrank
- [x] Navigation wie Acloset: Start, Kleiderschrank, +-Menü, Outfit, Entdecken
- [x] Datenmodell
- [x] Artikel per Kamera oder Galerie hinzufügen (`expo-image-picker`), mit Kategorie, Marke, Farbe
- [x] Onboarding-Fortschritt (5 Artikel)
- [x] Hintergrund automatisch freistellen (eigener Algorithmus, siehe unten)
- [x] Detailansicht: Favorit, "Heute getragen"-Zähler, Outfits mit diesem Artikel, Löschen
- [x] Bearbeiten (Foto, Kategorie, Marke, Farbe, Saison)
- [x] Lokale Speicherung (siehe unten), Sicherung exportieren/importieren im Profil
- [x] Artikel löschen (lange drücken)
- [x] Sortierung (6 Varianten) und Filter (Favoriten, nie getragen, Farbe, Saison, Marke) im Kleiderschrank
- [x] Wunschliste mit Preis und Shop-Link, "Gekauft" verschiebt in den Kleiderschrank
- [x] Artikel importieren: bis zu 15 Fotos auf einmal aus der Galerie, automatisch freigestellt

### Phase 2: Outfits und Planung
- [x] Outfit-Buch: Artikel zu Outfits kombinieren, speichern, löschen (lange drücken)
- [x] Packliste: Reisen mit Zeitraum, Artikel aus geplanten Outfits übernehmen, abhaken, eigene Einträge
- [x] Kalender: ein Outfit pro Tag planen, "Als getragen markieren" (zählt alle Artikel hoch), heute geplantes Outfit auf Start
- [x] Wetter am Standort (GPS oder Ortssuche) mit täglichem Outfitvorschlag aus dem eigenen Kleiderschrank; Vorhersage im Kalender
- [x] Stil-Statistiken: Kennzahlen, meistgetragen, nach Kategorie/Farbe/Saison, nie und lange nicht getragen, Kosten pro Tragen

### Phase 3: KI-Stylist
- [ ] Backend mit Konto und Sync (z. B. Supabase)
- [ ] Automatisches Tagging der Fotos (Kategorie, Farbe, Material) per Vision-Modell
- [ ] Outfitvorschläge nach Wetter und Anlass
- [ ] Stil-Chat
- [ ] Farbanalyse ("Finde meine Farben"), Fit-Beratung, Stil bewerten
- [ ] Entdecken mit echten Beiträgen (Upload, Folgen, Suche nach Artikel/Foto)
- [ ] Virtuelle Anprobe (später)

> **Wichtig:** API-Schlüssel für KI-Dienste gehören nie in die App, denn alles unter `EXPO_PUBLIC_*` landet im App-Bundle. KI-Aufrufe laufen über ein eigenes Backend.

## Freistellen

Nach dem Aufnehmen oder Auswählen eines Fotos wird der Hintergrund automatisch entfernt; im Formular lässt sich zwischen "Freigestellt" und "Original" wechseln, bei bestehenden Fotos per "Hintergrund entfernen". Über "Artikel importieren" lassen sich bis zu 15 Fotos auf einmal übernehmen und freistellen.

- **Web (GitHub Pages):** KI-Segmentierung mit dem Modell U²-Net-P (Apache-2.0, 4,6 MB, `public/models/u2netp.onnx`) über `onnxruntime-web` (MIT), komplett im Browser. Modell und Runtime (~11 MB, beim `npm install` nach `public/ort` kopiert) liegen auf der eigenen Seite und werden beim ersten Freistellen geladen und dann vom Browser gecacht. Funktioniert auch bei unruhigem Hintergrund. Nachbearbeitung in `mask.ts`: Hauptobjekt behalten, lose Reste entfernen, weiche Kanten, zuschneiden.
- **iOS/Android (Expo Go):** Hier kann kein KI-Modell laufen; es bleibt der farbbasierte Algorithmus (`segment.ts`), der nur bei einfarbigem Untergrund gut funktioniert. Nächster Schritt dafür: Apple Vision (iOS 17+) bzw. Google ML Kit Subject Segmentation in einem eigenen Development Build.
- Fällt das Modell aus (z. B. offline beim ersten Mal), nutzt auch die Web-Version den farbbasierten Algorithmus.
- Modellwahl: Auf einem Testset mit Kleidung auf Ziegel, Kies, Gras, Holz und Stoff erreichte U²-Net-P im Schnitt 96 % Übereinstimmung (IoU) – genauso gut wie das 40× größere IS-Net, aber etwa 6× schneller.
- Bewusst nicht verwendet: `@imgly/background-removal` (AGPL) und RMBG (nicht-kommerzielle Lizenz).

## Speicherung

Alles bleibt auf dem Gerät, ein Konto braucht es nicht.

- **iOS/Android:** JSON und Fotos im App-Dokumentenordner (`expo-file-system`); das System löscht hier nichts.
- **Web:** IndexedDB (`persistence.web.ts`), Fotos als eigene Einträge. Die App bittet den Browser per `navigator.storage.persist()`, die Daten nicht zu löschen. Ältere Daten aus `localStorage` werden beim ersten Start übernommen.
- Fotos werden beim Speichern verkleinert (Web 1200 px, App 1600 px; JPEG), freigestellte Bilder behalten ihre Transparenz.
- Schlägt das Speichern fehl (z. B. Speicher voll), erscheint unten ein roter Hinweis.
- **Sicherung** (Profil → Daten & Sicherung): eine JSON-Datei mit allen Artikeln, Fotos, Outfits, Kalender und Packlisten. Im Web als Download, in der App über das Teilen-Menü. Beim Import wird nach Rückfrage alles ersetzt. So lassen sich die Daten auch zwischen Geräten (Web ↔ App) umziehen.
- **iPhone im Browser:** Safari löscht Website-Daten nach 7 Tagen ohne Besuch. Als App auf dem Home-Bildschirm gilt das nicht – die App zeigt dazu einen Hinweis.

## Wetter

- Daten von [Open-Meteo](https://open-meteo.com) (kein API-Schlüssel, Daten CC BY 4.0). **Kostenlos nur für nicht-kommerzielle Nutzung** – für eine kommerzielle Veröffentlichung braucht es einen Open-Meteo-API-Tarif (oder einen anderen Anbieter, `src/lib/weather.ts` ist die einzige Stelle).
- Standort per GPS (`expo-location`) oder Ortssuche (Open-Meteo Geocoding); gespeichert mit den übrigen Daten.
- Outfitvorschlag (`src/lib/outfit-suggestion.ts`): Tagestemperatur → passende Saisons, Jacke unter 18 °C oder bei Regen (ab 50 %), bevorzugt länger nicht getragene Teile; "Neu mischen" wechselt zwischen den Kandidaten, "Für heute planen" legt ein Outfit an und plant es im Kalender.

## Konfiguration

- App-Name und Bundle-IDs (`com.robtechconsult.kleiderapp`) stehen in `app.json`. Vor dem ersten Store-Release prüfen.
- Web-Version: Single-Page-App (`web.output: "single"`); auf GitHub Pages ist `404.html` eine Kopie von `index.html`, damit direkte Links (z. B. `/item/<id>`) funktionieren.
- Die Ordner `ios/` und `android/` werden generiert (Continuous Native Generation) und nicht eingecheckt.
