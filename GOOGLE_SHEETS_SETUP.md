# Setup Google Sheets pentru testul FSGC

## 1. Creeaza Google Sheet-ul

1. In Google Drive, creeaza un fisier nou Google Sheets.
2. Recomandare nume: `FSGC - Test orientare - 2026`.
3. Nu trebuie sa creezi manual tab-urile. Scriptul le creeaza automat:
   - `Etapa 1 - Date candidati`
   - `Etapa 2 - Rezultate test`

## 2. Adauga Apps Script-ul

1. Din Google Sheet: `Extensions` -> `Apps Script`.
2. Sterge continutul initial din `Code.gs`.
3. Lipeste tot codul din `google-apps-script.gs`.
4. Salveaza proiectul.

Daca proiectul nu este creat direct din Google Sheet, completeaza in script:

```js
const SPREADSHEET_ID = 'ID-ul Google Sheet-ului tau';
```

ID-ul este partea dintre `/d/` si `/edit` din URL-ul Google Sheet-ului.

## 3. Configureaza expeditorul emailurilor

Ca emailurile sa plece de la `contact.fsgc@e-uvt.ro`, contul Google care publica scriptul trebuie sa poata trimite din acest alias.

1. In Gmail, mergi la `Settings` -> `See all settings` -> `Accounts`.
2. La `Send mail as`, adauga sau verifica aliasul `contact.fsgc@e-uvt.ro`.
3. Daca aliasul exista, scriptul il foloseste automat.
4. Daca aliasul nu exista, emailurile vor pleca din contul care a publicat scriptul, dar cu `reply-to` setat la `admitere.fsgc@e-uvt.ro`.

## 4. Publica Web App-ul

1. In Apps Script, apasa `Deploy` -> `New deployment`.
2. La tip, alege `Web app`.
3. Setari:
   - `Execute as`: `Me`
   - `Who has access`: `Anyone`
4. Apasa `Deploy`.
5. Accepta permisiunile cerute pentru Google Sheets si Gmail.
6. Copiaza URL-ul care se termina in `/exec`.

## 5. Pune URL-ul in site

In `index.html`, cauta:

```js
const GOOGLE_SCRIPT_URL = 'PASTE_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE';
```

Inlocuieste valoarea cu URL-ul Web App copiat din Apps Script:

```js
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/...../exec';
```

## 6. Test rapid

1. Deschide site-ul.
2. Completeaza Pasul 0 cu o adresa de email de test.
3. Apasa `Trimite si incepe testul`.
4. Verifica tab-ul `Etapa 1 - Date candidati`.
5. Finalizeaza testul.
6. Verifica tab-ul `Etapa 2 - Rezultate test`.
7. Verifica emailul automat primit.

## 7. Ce se trimite

Prima etapa trimite datele de contact si context:

- nume, prenume, email, telefon
- scoala, clasa/statut, varsta, profil liceu
- judet/tara, localitate, nivel de familiaritate FSGC, sursa
- acordurile GDPR/contact
- metadata tehnica minimala pentru debugging

A doua etapa trimite numai identificarea minima si rezultatul:

- participantId
- nume, prenume, email
- verdict, incredere, top 3 programe
- scorurile standardizate pentru cele 8 programe
- durata testului

Raspunsurile brute la intrebari nu sunt trimise.
