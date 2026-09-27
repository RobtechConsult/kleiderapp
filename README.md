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
  app/                 # Screens (jede Datei = Route)
    _layout.tsx        # Root-Layout: Theme, WardrobeProvider, Tabs
    index.tsx          # Stylist: KI-Funktionen, Outfit des Tages
    wardrobe.tsx       # Kleiderschrank: Statistik, Kategorie-Filter, Raster
    outfits.tsx        # Gespeicherte Outfits
    profile.tsx        # Stil-Statistiken, Einstellungen
  components/          # UI-Bausteine (Screen, ItemTile, Tabs, Themed*)
  constants/theme.ts   # Farben (hell/dunkel), Abstände, Fonts
  data/                # Beispieldaten
  store/               # Zustand (Kleiderschrank & Outfits, React Context)
  types/wardrobe.ts    # Datenmodell: ClothingItem, Outfit, Kategorien
```

## Roadmap

### Phase 1: Digitaler Kleiderschrank
- [x] Grundgerüst mit Tabs (Stylist, Kleiderschrank, Outfits, Profil)
- [x] Datenmodell und Beispieldaten
- [ ] Teile per Kamera oder Galerie hinzufügen (`expo-image-picker` / `expo-camera`)
- [ ] Hintergrund automatisch freistellen
- [ ] Detailansicht und Bearbeiten (Kategorie, Farbe, Saison, Marke)
- [ ] Lokale Speicherung (z. B. `expo-sqlite`)

### Phase 2: Outfits und Planung
- [ ] Outfit-Editor: Teile kombinieren und speichern
- [ ] Kalender und Outfit-Planer
- [ ] Wetter am Standort für Outfitvorschläge (`expo-location` + Wetter-API)
- [ ] Tragezähler und Stil-Statistiken

### Phase 3: KI-Stylist
- [ ] Backend mit Konto und Sync (z. B. Supabase)
- [ ] Automatisches Tagging der Fotos (Kategorie, Farbe, Material) per Vision-Modell
- [ ] Outfitvorschläge nach Wetter und Anlass
- [ ] Stil-Chat
- [ ] Farbanalyse ("Finde meine Farben"), Fit-Beratung, Stil bewerten
- [ ] Wunschliste
- [ ] Virtuelle Anprobe (später)

> **Wichtig:** API-Schlüssel für KI-Dienste gehören nie in die App, denn alles unter `EXPO_PUBLIC_*` landet im App-Bundle. KI-Aufrufe laufen über ein eigenes Backend.

## Konfiguration

- App-Name und Bundle-IDs (`com.robtechconsult.kleiderapp`) stehen in `app.json`. Vor dem ersten Store-Release prüfen.
- Die Ordner `ios/` und `android/` werden generiert (Continuous Native Generation) und nicht eingecheckt.
