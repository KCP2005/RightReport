# ReportRight - School Data Collection Portal

A comprehensive MERN stack portal for hierarchical school data collection and reporting at District → Taluka → School levels with dynamic form creation, approval-based editing, and advanced analytics.

## Features

### User Features
- **School Identification**: Two methods to identify schools
  - UDISE Code entry with auto-population
  - Manual selection via District → Taluka → School hierarchy
- **Dynamic Form Filling**: Render and submit any form created by admins
- **View Submissions**: Track all submitted forms and their status
- **Edit Requests**: Request changes to submitted data with approval workflow

### Admin Features
- **Dashboard**: Overview with stats cards and district/taluka toggle views
- **Form Builder**: Create dynamic forms with various field types (coming soon)
- **School Management**: Import schools from Excel, view details
- **Edit Request Management**: Approve/reject edit requests
- **Analytics & Reports**: Generate reports with charts and export options
- **Hierarchical Navigation**: District → Taluka → School drill-down

## Tech Stack

### Frontend
- **React** with Vite
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **Axios** for API calls

### Backend (To be implemented)
- **Node.js** with Express.js
- **MongoDB** with Mongoose
- **JWT** for authentication
- **xlsx** for Excel import/export

## Getting Started

### Prerequisites
- Node.js v20+ or v22+
- npm or yarn

### Installation

1. Clone the repository
```bash
cd ReportRight
```

2. Install dependencies
```bash
npm install
```

3. Start development server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:5000/api
```

## Project Structure

```
src/
├── components/
│   ├── Admin/          # Admin-specific components
│   ├── User/           # User-facing components
│   └── Shared/         # Shared components
├── pages/
│   ├── UserHome.jsx
│   ├── AdminLogin.jsx
│   ├── AdminDashboard.jsx
│   └── SchoolDetailPage.jsx
├── utils/
│   └── api.js          # API configuration and endpoints
├── context/
│   └── AuthContext.jsx # Authentication state management
├── App.jsx
└── main.jsx
```

## Responsive Design

The application is fully responsive and works seamlessly on:
- 📱 Mobile devices (320px+)
- 📱 Tablets (768px+)
- 💻 Desktops (1024px+)
- 🖥️ Large screens (1280px+)

## Design System

Built with Tailwind CSS featuring:
- Modern gradient color scheme
- Smooth animations and transitions
- Glassmorphism effects
- Dark mode support (system preference)
- Accessible form controls

## Development Roadmap

- [x] Project setup with Vite and Tailwind
- [x] User interface for school identification and form submission
- [x] Admin login and dashboard
- [ ] Backend API implementation
- [ ] Dynamic form builder
- [ ] Excel import/export functionality
- [ ] Advanced analytics and charts
- [ ] Report generation system
- [ ] Email/SMS notifications

## License

© 2026 ReportRight. All rights reserved.
