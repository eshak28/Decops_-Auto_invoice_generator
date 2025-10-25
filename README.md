# Auto Invoice Generator

A full-stack application for generating professional PDF invoices with a modern web interface.

## Features

- Beautiful, responsive frontend built with React, TypeScript, and Tailwind CSS
- Dynamic item management (add/remove multiple invoice items)
- Real-time calculation of subtotal, tax (18%), and total
- Professional PDF invoice generation with PDFKit
- Company header, customer info, itemized table, and footer
- Downloadable PDF invoices
- Docker support for easy deployment

## Tech Stack

**Frontend:**
- React 18 with TypeScript
- Tailwind CSS for styling
- Lucide React for icons
- Vite for build tooling

**Backend:**
- Node.js with Express
- PDFKit for PDF generation
- CORS enabled for cross-origin requests

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the backend server:**
   ```bash
   node server.js
   ```
   The backend API will run on `http://localhost:3001`

3. **Start the frontend (in a new terminal):**
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`

4. **Open your browser and navigate to:**
   ```
   http://localhost:5173
   ```

### Using the Application

1. Enter the customer name
2. Add invoice items with name, description, quantity, and price
3. Click "Add Item" to add more items
4. Review the invoice summary (subtotal, tax, total)
5. Click "Generate & Download Invoice" to create and download the PDF

## Docker Deployment

### Using Docker Compose (Recommended)

1. **Build and run the containers:**
   ```bash
   docker-compose up --build
   ```

2. **Access the application:**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:3001`

3. **Stop the containers:**
   ```bash
   docker-compose down
   ```

### Using Docker Directly

1. **Build the Docker image:**
   ```bash
   docker build -t invoice-generator .
   ```

2. **Run the container:**
   ```bash
   docker run -p 5173:5173 -p 3001:3001 invoice-generator
   ```

3. **Access the application:**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:3001`

## API Documentation

### Generate Invoice

**Endpoint:** `POST /generate`

**Request Body:**
```json
{
  "customerName": "John Doe",
  "items": [
    {
      "name": "Web Development",
      "description": "Frontend development services",
      "quantity": 10,
      "price": 150.00
    },
    {
      "name": "Consulting",
      "description": "Technical consulting",
      "quantity": 5,
      "price": 200.00
    }
  ]
}
```

**Response:**
- Content-Type: `application/pdf`
- Returns a downloadable PDF invoice

## Project Structure

```
.
├── src/
│   ├── App.tsx          # Main React component
│   ├── main.tsx         # React entry point
│   └── index.css        # Global styles
├── server.js            # Express backend server
├── Dockerfile           # Docker configuration
├── docker-compose.yml   # Docker Compose configuration
├── package.json         # Dependencies and scripts
└── README.md           # This file
```

## Invoice Features

The generated PDF invoice includes:

- **Company Header** with branding and contact information
- **Invoice Number** and date
- **Customer Information**
- **Itemized Table** with:
  - Item name and description
  - Quantity
  - Unit price
  - Line amount
- **Financial Summary:**
  - Subtotal
  - Tax (18%)
  - Total amount
- **Professional Footer** with payment terms and contact info

## Customization

### Modify Company Information

Edit `server.js` (lines 14-19) to update company details:
```javascript
doc.fontSize(10)
  .fillColor('#e0e7ff')
  .text('Your Company Name', 400, 45, { align: 'right', width: 150 })
  .text('Your Address', 400, 60, { align: 'right', width: 150 })
  .text('Phone: Your Phone', 400, 75, { align: 'right', width: 150 })
  .text('Email: Your Email', 400, 90, { align: 'right', width: 150 });
```

### Change Tax Rate

Edit `server.js` (line 73) and `src/App.tsx` (line 42) to modify the tax percentage:
```javascript
const tax = subtotal * 0.18; // Change 0.18 to your desired rate
```

### Customize Invoice Styling

The PDF styling can be modified in the `generateInvoice` function in `server.js`. Colors, fonts, and layout are fully customizable.

## License

MIT

## Support

For issues or questions, please open an issue on the project repository.
