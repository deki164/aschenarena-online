# Aschenarena Online (1 gegen 1)

## Lokal testen

Node.js 20 oder neuer installieren. In diesem Ordner ausführen:

```bash
npm install
npm start
```

Im Browser `http://localhost:3000` öffnen. Zweites Browserfenster zum Testen verwenden. Einer klickt **Raum erstellen**, der andere verwendet den Raumcode und klickt **Raum beitreten**.

## Mit Menschen außerhalb deines LAN spielen

Das Spiel samt Server muss auf einem **öffentlich erreichbaren Node.js-Hosting** betrieben werden, das WebSocket-Verbindungen erlaubt (beispielsweise Render, Railway oder ein eigener VPS). Projekt-Ordner/Repository hochladen, als Startbefehl `npm start` einstellen und eine öffentliche HTTPS-Adresse einrichten. Das Hosting stellt meist automatisch die Umgebungsvariable `PORT` bereit. Beide Mitspieler öffnen **dieselbe** HTTPS-Adresse. Der Host klickt **Raum erstellen** und schickt dem Gast den angezeigten Link. Der Gast klickt **Raum beitreten**.

**Wichtig:** Das Öffnen der HTML-Datei mit `file://` ermöglicht kein Internet-Multiplayer. Der Server muss laufen und über das Internet erreichbar sein. Eine lokale `localhost`-Adresse ist von außerhalb des LAN nicht erreichbar.

## Architektur und Grenzen

- 2 Spieler pro privatem Raum, mehrere Räume parallel.
- Host-Browser ist für Physik, Schaden, Buffs und Siegbedingungen verantwortlich; der Server leitet WebSocket-Nachrichten weiter.
- Gast übermittelt Eingaben, empfängt etwa 15 Zustands-Snapshots pro Sekunde und rendert die Arena selbst. Bei schlechter Verbindung kommt es zu Verzögerungen. Keine serverseitige Anti-Cheat-Validierung, kein Matchmaking und keine Accounts.
- Bei Host-Abbruch endet die Sitzung.
- Bei Gast-Abbruch kann der Host einen neuen Gast aufnehmen; bei neuem Match wird der Kampf zurückgesetzt.
