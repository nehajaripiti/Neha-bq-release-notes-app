# BigQuery Release Notes Web Application

## Overview

The BigQuery Release Notes Web Application is a web-based dashboard built using Python Flask, HTML, CSS, and JavaScript. It fetches the latest BigQuery release notes from the official Google Cloud RSS feed and presents them in a clean, user-friendly interface.

The application allows users to:

* View the latest BigQuery updates and announcements.
* Refresh release notes on demand.
* Browse release note details in an organized dashboard.
* Share selected updates on X (Twitter).

---

## Features

### Release Notes Dashboard

* Fetches the latest BigQuery release notes from the official Google Cloud RSS feed.
* Displays updates in a clean card-based layout.

### Refresh Functionality

* Refresh button to retrieve the latest release notes.
* Loading spinner while fetching data.

### Social Sharing

* Share individual release notes directly on X (Twitter).

### Modern UI

* Responsive design.
* Clean dashboard layout.
* Easy navigation and readability.

---

## Tech Stack

### Backend

* Python 3
* Flask
* Requests
* BeautifulSoup4

### Frontend

* HTML5
* CSS3
* Vanilla JavaScript

### Version Control

* Git
* GitHub

---

## Project Structure

```text
bq-release-notes/
│
├── app.py
├── requirements.txt
├── .gitignore
│
├── index.html
├── style.css
├── app.js
│
└── .venv/
```

### File Descriptions

| File             | Description               |
| ---------------- | ------------------------- |
| app.py           | Flask backend application |
| requirements.txt | Python dependencies       |
| index.html       | Main user interface       |
| style.css        | Application styling       |
| app.js           | Client-side functionality |
| .gitignore       | Git ignore rules          |

---

## Installation

### Clone Repository

```bash
git clone https://github.com/nehajaripiti/Neha-bq-release-notes-app.git
cd Neha-bq-release-notes-app
```

### Create Virtual Environment

```bash
python -m venv .venv
```

### Activate Virtual Environment

Windows:

```bash
.venv\Scripts\activate
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

---

## Running the Application

Start the Flask server:

```bash
python app.py
```

Open your browser and visit:

```text
http://127.0.0.1:5000
```

---

## API Endpoint

The backend exposes the following endpoint:

```text
/api/release-notes
```

This endpoint fetches and returns the latest BigQuery release notes.

Example:

```text
http://127.0.0.1:5000/api/release-notes
```

---

## Data Source

Official Google Cloud BigQuery Release Notes Feed:

https://docs.cloud.google.com/feeds/bigquery-release-notes.xml

---

## Learning Outcomes

This project demonstrates:

* Flask web application development
* RSS/XML feed parsing
* REST API creation
* Frontend-backend integration
* Git and GitHub workflow
* AI-assisted development using Antigravity CLI

---

## Future Improvements

Potential enhancements include:

* Search functionality
* Release note filtering
* Dark/Light mode toggle
* Export to CSV
* Copy-to-clipboard support
* User bookmarks
* Deployment to cloud platforms

---

## Author

**Neha Jaripiti**

Computer Science Engineering (AI & ML) Student

Built as part of the Google Kaggle Antigravity CLI learning program.
