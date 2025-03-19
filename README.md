# 📌 Zielmanagement-Webapp

Ein webbasiertes Tool zur Verwaltung von Lernzielen, das Lernenden ermöglicht, ihre Fortschritte zu verfolgen, Nachweise hochzuladen und Feedback von Berufsbildnern zu erhalten. Ein Leaderboard motiviert zusätzlich durch Gamification.

## 🚀 Features

✅ **Benutzerverwaltung**: Anmeldung & Authentifizierung mit firmeneigener E-Mail  
✅ **Zielverwaltung**: Ziele setzen, kategorisieren & Fortschritt dokumentieren  
✅ **Dateiupload**: Nachweise als Dateien oder Zertifikate hochladen  
✅ **Bewertungssystem**: Berufsbildner können Ziele mit 1–5 Sternen bewerten  
✅ **Benachrichtigungen**: Automatische E-Mails über Statusänderungen  
✅ **Leaderboard**: Kürt den "Lernenden des Jahres" basierend auf Bewertungen  

## 🛠️ Tech-Stack

### **Frontend**  
- [React](https://react.dev/) – Komponentenbasierte UI  
- [MUI](https://mui.com/) – UI-Komponentenbibliothek  

### **Backend & Datenbank**  
- [Firebase](https://firebase.google.com/) – Authentifizierung & Firestore-Datenbank  

### **Weitere Tools**  
- [GitHub](https://github.com/) – Code-Versionierung  
- [Docker](https://www.docker.com/) (optional) – Lokale Entwicklung  
- [Notion](https://www.notion.so/) – Dokumentation & Planung  

## 📂 Projektstruktur

```
/projekt-root
│── /frontend         # React-App
│── /backend          # API-Services (Firebase)
│── /docs             # Dokumentation & Planung
│── .gitignore        # Ignorierte Dateien
│── README.md         # Projektbeschreibung
│── package.json      # Abhängigkeiten
```

## 🏗️ Installation & Setup

1️⃣ **Repository klonen**  
```bash
git clone https://github.com/JosuelCastro/M321_OrRoJoJoDa.git
cd M321_OrRoJoJoDa
```

2️⃣ **Frontend starten**  
```bash
cd zielmanagementtool2
npm install
npm run dev
```

3️⃣ **Backend (Firebase) konfigurieren**  
- Firebase-Projekt erstellen  
- `.env`-Datei mit API-Schlüsseln anlegen  
- Verbindung in `firebaseConfig.js` anpassen  

4️⃣ **E-Mail Server starten**  
```bash
cd zielmanagementtool2
cd email-server
npm install
npm start
```

## 📧 Kontakt & Support

Bei Fragen oder Vorschlägen gerne ein Issue erstellen oder mich direkt kontaktieren:  
📩 **E-Mail:** [josuelcastro@icloud.com](mailto:josuelcastro@icloud.com)  
🔗 **GitHub:** [@JosuelCastro](https://github.com/JosuelCastro)  

---

⭐ **Ich wünsche mir selber Hals und Beinbruch! :)**
