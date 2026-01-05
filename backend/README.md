# ReportRight Backend API

Node.js/Express backend for the ReportRight School Data Collection Portal.

## Features

- **Authentication**: JWT-based admin authentication
- **School Management**: UDISE lookup, Excel import, district/taluka hierarchy
- **Dynamic Forms**: Create and manage forms with various field types
- **Form Responses**: Submit and retrieve form data
- **Edit Requests**: Approval workflow for data modifications
- **Analytics**: Dashboard stats and district/taluka-wise analytics

## Setup

### Prerequisites
- Node.js v18+
- MongoDB running locally or connection string

### Installation

```bash
cd backend
npm install
```

### Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/reportright
JWT_SECRET=your_secret_key_here
NODE_ENV=development
```

### Running the Server

Development mode with auto-reload:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/admin/login` - Admin login
- `POST /api/admin/logout` - Admin logout
- `POST /api/admin/create` - Create admin (initial setup)

### Schools
- `GET /api/schools/by-udise/:udiseCode` - Get school by UDISE
- `GET /api/schools/by-location?district=&taluka=` - Get schools by location
- `GET /api/schools/search?q=` - Search schools
- `GET /api/districts` - Get all districts
- `GET /api/talukas/:districtName` - Get talukas in district
- `POST /api/admin/schools/import` - Import schools from Excel (Admin)

### Forms
- `GET /api/forms/active` - Get active forms
- `GET /api/forms/:formId` - Get form by ID
- `POST /api/admin/forms/create` - Create form (Admin)
- `GET /api/admin/forms/list` - List all forms (Admin)
- `PUT /api/admin/forms/:formId` - Update form (Admin)
- `DELETE /api/admin/forms/:formId` - Delete form (Admin)

### Responses
- `POST /api/responses/submit` - Submit form response
- `GET /api/responses/by-school/:udiseCode` - Get school responses
- `GET /api/admin/responses/list` - List all responses with filters (Admin)
- `GET /api/admin/responses/:responseId` - Get response by ID (Admin)

### Edit Requests
- `POST /api/edit-requests/create` - Create edit request
- `GET /api/edit-requests/by-school/:udiseCode` - Get school edit requests
- `GET /api/admin/edit-requests/pending` - Get pending requests (Admin)
- `PUT /api/admin/edit-requests/:requestId/approve` - Approve request (Admin)
- `PUT /api/admin/edit-requests/:requestId/reject` - Reject request (Admin)

### Analytics
- `GET /api/admin/dashboard/stats` - Dashboard statistics (Admin)
- `GET /api/admin/analytics/district-wise` - District analytics (Admin)
- `GET /api/admin/analytics/taluka-wise` - Taluka analytics (Admin)

## Database Models

- **School**: UDISE code, name, district, taluka, HOD details
- **Form**: Dynamic form structure with fields
- **Response**: Form submissions with school data
- **EditRequest**: Edit approval workflow
- **Admin**: Admin users with roles and permissions

## Initial Setup

### Create First Admin

```bash
curl -X POST http://localhost:5000/api/admin/create \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123","role":"super_admin"}'
```

### Import Schools from Excel

Excel file should have columns:
- UDISE Code
- School Name
- District Name
- Taluka Name
- HOD Name
- HOD Phone

Use the `/api/admin/schools/import` endpoint with multipart/form-data.

## Security

- Passwords are hashed using bcrypt
- JWT tokens expire in 7 days
- Admin routes protected with authentication middleware
- Role-based access control for different admin levels

## License

© 2026 ReportRight
