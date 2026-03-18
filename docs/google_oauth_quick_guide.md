# Google OAuth Setup (Quick Guide)

This guide explains how to configure Google OAuth for the app.

---

## 1. Create Google Cloud Project

1. Go to https://console.cloud.google.com
2. Create a new project (e.g. `finance-explorer`)

---

## 2. Enable Google Sheets API

1. Go to **APIs & Services → Library**
2. Search for **Google Sheets API**
3. Click **Enable**

---

## 3. Configure OAuth Consent Screen

1. Go to **APIs & Services → OAuth consent screen**
2. Choose **External**
3. Fill required fields (app name, email)
4. Add scope:

```
https://www.googleapis.com/auth/spreadsheets.readonly
```

---

## 4. Create OAuth Client

1. Go to **APIs & Services → Credentials**
2. Click **Create Credentials → OAuth Client ID**
3. Choose **Web application**

### Authorized origins

Add:

```
http://localhost:3000
```

(Add production URL later)

---

## 5. Save Client ID

Copy the Client ID and add to `.env` or to the deployed environment:

```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id
NEXT_PUBLIC_SPREADSHEET_ID=your_spreadsheet_id
GOOGLE_CLIENT_SECRET="GOOGLE_OAUTH_CLIENT_SECRET"
```
where the spreadsheet ID is just from the URL:
```
https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
```

