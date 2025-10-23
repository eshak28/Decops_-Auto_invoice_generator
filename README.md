# Auto Invoice Generator

Generate beautiful PDF invoices from a simple web form. Backend is Node.js + Express with PDFKit for PDF generation, and a lightweight HTML/CSS/JS frontend. Includes Docker support.

## Features
- Company-styled PDF with header, customer info, items table, subtotal, tax (18%), total, and footer
- Dynamic form to add/remove multiple items
- Single-click PDF download via the browser
- REST API `POST /generate` that returns a PDF
- CORS enabled, static frontend served from the same server
- Dockerfile included for containerized runs

## Tech Stack
- Backend: Node.js, Express, PDFKit
- Frontend: HTML, CSS, vanilla JavaScript
- Container: Docker (Node 20 Alpine)

## Project Structure
```
.
├─ public/
│  ├─ index.html       # Frontend form
│  ├─ styles.css       # Styling
│  └─ app.js           # Dynamic items + API call
├─ server.js           # Express server + PDF generation
├─ package.json
├─ Dockerfile
└─ .dockerignore
```

## Getting Started (Local)
Prerequisites: Node.js 18+ and npm

1) Install dependencies
```bash
npm install
```

2) Run the server
```bash
npm start
```

3) Open the app
- Navigate to `http://localhost:3000`
- Fill in customer name and add one or more items
- Click "Generate PDF" to download the invoice

Optional: choose a custom port using `PORT`
```bash
PORT=4000 npm start
# Visit http://localhost:4000
```

## Run with Docker
1) Build the image
```bash
docker build -t auto-invoice-generator .
```

2) Run the container (port 3000)
```bash
docker run --rm -p 3000:3000 auto-invoice-generator
# Open http://localhost:3000
```

Use a custom port (example: 8080)
```bash
docker run --rm -e PORT=8080 -p 8080:8080 auto-invoice-generator
```

## API
### POST /generate
Generates and returns a PDF invoice.

- Request body (JSON):
```json
{
  "customerName": "John Doe",
  "invoiceNumber": "INV-1001",
  "date": "2025-10-23",
  "currency": "USD",
  "locale": "en-US",
  "items": [
    { "description": "Design work", "amount": 500 },
    { "description": "Development", "amount": 1200 }
  ]
}
```
- Notes:
  - `customerName` is required
  - `items` must contain at least one `{ description, amount>0 }`
  - `currency` and `locale` default to `USD` and `en-US`
  - Tax is fixed at 18%

- Response: `application/pdf` as an attachment

Example cURL:
```bash
curl -X POST http://localhost:3000/generate \
  -H 'Content-Type: application/json' \
  -d '{
    "customerName": "John Doe",
    "invoiceNumber": "INV-1001",
    "date": "2025-10-23",
    "items": [
      { "description": "Design work", "amount": 500 },
      { "description": "Development", "amount": 1200 }
    ]
  }' \
  --output invoice.pdf
```

## Customization
- Change header/branding in `server.js` (company block)
- Adjust tax rate at the bottom of the items section in `server.js`
- Modify styling in `public/styles.css`

## License
MIT
