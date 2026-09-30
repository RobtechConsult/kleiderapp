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
    item/[id]/edit.tsx   # Modal: Artikel bearbeiten (gleiches Formular wie Hinzufügen)
    profile.tsx          # Profil & Einstellungen
  components/            # UI-Bausteine (Tab-Leiste mit +-Menü, Header, Icon, Screen, …)
  constants/theme.ts     # Farben (hell/dunkel), Abstände, Fonts
  data/                  # Demo-Daten (Entdecken-Feed)
  lib/                   # Speicherung (persistence.ts / .web.ts), Dialoge, Datums-Helfer,
                         # background-removal/ (Freistellen)
  store/                 # Zustand (Kleiderschrank & Outfits, React Context)
  types/wardrobe.ts      # Datenmodell: ClothingItem, Outfit, Calendar, Kategorien
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
- [x] Lokale Speicherung: JSON + Fotos im App-Dokumentenordner (`expo-file-system`), im Web `localStorage`
- [x] Artikel löschen (lange drücken)
- [ ] Sortierung, Filter, Wunschliste, Artikel importieren

### Phase 2: Outfits und Planung
- [x] Outfit-Buch: Artikel zu Outfits kombinieren, speichern, löschen (lange drücken)
- [ ] Packliste
- [x] Kalender: ein Outfit pro Tag planen, "Als getragen markieren" (zählt alle Artikel hoch), heute geplantes Outfit auf Start
- [ ] Wetter am Standort für Outfitvorschläge (`expo-location` + Wetter-API)
- [ ] Stil-Statistiken (Tragezähler ist schon da)

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

Nach dem Aufnehmen oder Auswählen eines Fotos wird der Hintergrund automatisch entfernt; im Formular lässt sich zwischen "Freigestellt" und "Original" wechseln, bei bestehenden Fotos per "Hintergrund entfernen".

- Eigener Algorithmus in TypeScript (`src/lib/background-removal/segment.ts`), läuft identisch auf iOS, Android und Web, ohne Server und ohne native Zusatzmodule (funktioniert auch in Expo Go).
- Funktionsweise: Hintergrundfarbe am Bildrand schätzen, vom Rand aus füllen (inkl. weicher Schatten), Silhouette schließen und Löcher füllen, Kanten glätten, zuschneiden.
- Am besten: ein Kleidungsstück auf einer einfarbigen Fläche (Bett, Boden, Wand). Bei unruhigem Hintergrund wird das Originalfoto verwendet.
- Native: Foto mit `expo-image-manipulator` auf 640 px verkleinern, PNG in JS dekodieren/kodieren (`png.ts`, basiert auf `fflate`). Web: Canvas, 768 px, Ergebnis als WebP.
- Bewusst nicht verwendet: `@imgly/background-removal` (AGPL-Lizenz). Später möglich: KI-Freistellen über Apple Vision / Google ML Kit (braucht Development Build) oder über ein eigenes Backend.

## Konfiguration

- App-Name und Bundle-IDs (`com.robtechconsult.kleiderapp`) stehen in `app.json`. Vor dem ersten Store-Release prüfen.
- Die Ordner `ios/` und `android/` werden generiert (Continuous Native Generation) und nicht eingecheckt.
