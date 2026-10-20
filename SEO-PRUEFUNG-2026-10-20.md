# Website-Prüfung vom 20. Oktober 2026

Geprüfter Stand: lokale Website in **firma_neues Layout**. Keine Veröffentlichung durchgeführt.

## Referenzen und Bedienung

- Neuburger aus Startseite, Projektübersicht, Hairdesign-Verweis und Sitemap entfernt.
- Original der unfertigen Neuburger-Seite außerhalb der Website gesichert. Die bisherige HTML-Adresse zeigt lokal einen neutralen Hinweis und ist auf noindex gesetzt. Nach dem Deployment leitet Vercel diese Adresse vorübergehend zur Projektübersicht um.
- Nur Hairdesign wird als abgeschlossenes Projekt vorgestellt. Die Karte dreht sich durch Klick, Tippen oder Tastatur um; erst der Link auf der Rückseite öffnet die externe Website. Zurück-Schaltfläche und Escape führen zur Vorderseite zurück. Auch ohne JavaScript bleiben Informationen und Links erreichbar.
- Emoji-fähige Pfeilzeichen durch SVG-Symbole ersetzt; Copyright-Zeichen mit expliziter Textdarstellung.
- Ansprechpartner bleibt im Über-mich-Hero ungeteilt. Mobile Leistungsmarkierungen erhalten getrennte Flächen und Abstände.
- Projekt-CTA: weißer Text auf dunklem Hintergrund. Die bisherige graue Farbe wurde durch eine spezifischere CSS-Regel tatsächlich überschrieben.

## Technisches SEO

- 11 indexierbare Seiten: eindeutiger Titel, eigene Beschreibung, genau eine Hauptüberschrift und passender Canonical auf https://leinaro.at/.
- Alle 11 Canonicals stehen in der Sitemap. Neuburger gehört nicht mehr dazu.
- Dankeseite, Datenschutz und Impressum bleiben noindex; die vorübergehend entfernte Projektseite ist ebenfalls noindex.
- Bild-Alttexte und feste Bildabmessungen geprüft. Interne Links, Fragmente, CSS-Dateien und Bilddateien geprüft.
- Open-Graph-Angaben für Titel, Beschreibung, URL, Sprache und Website-Namen ergänzt, wo sie fehlten.
- Vorhandene Unternehmensdaten und Domain-Weiterleitungen beibehalten. Die vorübergehende Neuburger-Weiterleitung wird erst nach Deployment wirksam.

## Bilder und Ladegeschwindigkeit

Sieben noch als PNG eingebundene Motive auf responsive WebP-Dateien umgestellt. Vorhandene optimierte Varianten wiederverwendet; weitere Varianten für kleine und große Bildschirme erzeugt. Originaldateien bleiben als Arbeitsmaterial erhalten.

| Messgröße | Vorher | Nachher |
| --- | ---: | ---: |
| Summe dieser sieben Motive in jeweils größter Auflösung | 13.728.091 Byte | 752.582 Byte |
| Einsparung | | **94,5 %** |

Diese Dateigrößen sind direkt gemessen. Sie beschreiben weder die gesamte Website noch eine gemessene Verbesserung der Ladezeit. Je nach Bildschirm, Pixeldichte und Bildposition lädt der Browser passende Varianten. Bestehendes Lazy Loading, lokale Schriften mit font-display: swap und verzögert geladene Skripte bleiben erhalten.

## Validierung und Grenzen

- 15 HTML-Seiten bei 12 Breiten von 320 bis 1920 Pixeln geprüft: 180 Kombinationen ohne horizontalen Seitenüberlauf, abgeschnittene Überschriften oder fehlende bereits geladene Bilder.
- Mobile Bedienung mit Touch- und iPhone-Browserprofil in Chrome emuliert; außerdem Tastaturbedienung und JavaScript-freier Fallback geprüft. Das ist kein Test auf einem physischen iPhone oder in Safari.
- Projektkarte öffnet beim ersten Klick kein neues Fenster. Externer Link gesondert mit einer abgefangenen Testseite geprüft.
- Kontaktformular-Logik und Datenschutzhinweis-Tests erfolgreich; keine echten Formularanfragen versendet.
- Keine belastbare Live-Ladezeit, kein Lighthouse-Score und keine echten Core Web Vitals ermittelt. Dafür muss der veröffentlichte Stand über HTTPS gemessen werden; lokale Dateiaufrufe bilden Mobilfunk und Hosting nicht ab.

Maßstab für die technische Prüfung: [Google zu Seitenerfahrung](https://developers.google.com/search/docs/appearance/page-experience) und [Google zu Bildoptimierung](https://developers.google.com/search/docs/appearance/google-images).
