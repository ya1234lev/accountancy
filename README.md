# Bookkeeping Application

This is a full-stack bookkeeping application with separate frontend and backend.

## Project Structure

```
Bookkeeping/
├── frontend/          # Angular frontend application
├── backend/           # Node.js/Express backend server
└── README.md         # This file
```

## Frontend (Angular)

The frontend is located in the `frontend/` directory and uses Angular 20.1.0.

### Development server

To start the Angular development server:

```bash
cd frontend
npm install
npm start
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Backend (Node.js/Express)

The backend is located in the `backend/` directory and uses Express.js with MongoDB.

### Development server

To start the backend server:

```bash
cd backend
npm install
npm run dev
```

The API server will run on `http://localhost:3000/`.

## Prerequisites

- Node.js (version 18 or higher)
- MongoDB (for backend database)
- Angular CLI (for frontend development)

## Installation

1. Clone the repository
2. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```
3. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

## API Endpoints

The backend provides RESTful API endpoints:

- `GET /` - Server status
- `GET /api/health` - Health check

## Code scaffolding

For the Angular frontend, Angular CLI includes powerful code scaffolding tools. To generate a new component:

```bash
cd frontend
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the frontend project:

```bash
cd frontend
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running tests

To execute unit tests for the frontend with the [Karma](https://karma-runner.github.io) test runner:

```bash
cd frontend
ng test
```

## Development Tips

- Start the backend server first, then the frontend
- The frontend will proxy API calls to the backend
- Use `npm run dev` for the backend to enable auto-restart on file changes
- MongoDB should be running before starting the backend server

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
