# CodeCraftHub

Personal learning goal tracker API built with Node.js and Express.

CodeCraftHub allows developers to create, view, update, and delete courses they want to learn. Course data is stored in a simple `courses.json` file instead of a database.

## Features

- Create learning courses
- View all courses
- View a specific course by ID
- Update an existing course
- Delete a course
- Automatically generate numeric course IDs
- Track target completion dates
- Track course progress status
- Automatically create `courses.json` if it does not exist
- Validate required fields
- Validate dates using the `YYYY-MM-DD` format
- Validate course status values
- Return helpful error messages

## Technologies

- Node.js
- Express
- JSON file storage
- REST API

## Project Structure

```text
codecrafthub/
├── app.js
├── package.json
└── courses.json
```

The `courses.json` file is created automatically when the application starts if it does not already exist.

## Requirements

Install the following before running the project:

- Node.js 14 or later
- npm

Check whether Node.js and npm are installed:

```bash
node --version
npm --version
```

## Installation

### 1. Clone or download the project

```bash
git clone <your-repository-url>
cd codecrafthub
```

If you are creating the project manually, create a project folder:

```bash
mkdir codecrafthub
cd codecrafthub
```

### 2. Initialize the project

If `package.json` does not already exist:

```bash
npm init -y
```

### 3. Install dependencies

```bash
npm install express
```

## How to Run the Application

Start the server with:

```bash
npm start
```

Alternatively, run the application directly:

```bash
node app.js
```

The API will be available at:

```text
http://localhost:5000
```

When the application starts, it automatically creates `courses.json` if the file does not exist.

## Running the Tests

The tests use Node's built-in test runner (Node.js 18+), so no extra packages are needed. With the server running in one terminal, run in another:

```bash
npm test
```

## Course Data Format

Each course has the following properties:

```json
{
  "id": 1,
  "name": "Learn Express",
  "description": "Build REST APIs using Node.js and Express.",
  "target_date": "2026-12-31",
  "status": "Not Started",
  "created_at": "2026-10-15T12:00:00.000Z"
}
```

### Allowed Status Values

The `status` field must contain one of these values:

- `Not Started`
- `In Progress`
- `Completed`

### Date Format

The `target_date` field must use this format: `YYYY-MM-DD` (for example, `2026-12-31`).

## API Documentation

Base URL:

```text
http://localhost:5000/api
```

All request bodies must use JSON and include this header:

```text
Content-Type: application/json
```

### Create a Course

Creates a new course.

**Request:** `POST /api/courses`

Example using cURL:

```bash
curl -X POST http://localhost:5000/api/courses \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Learn Express",
    "description": "Build REST APIs using Node.js and Express.",
    "target_date": "2026-12-31",
    "status": "Not Started"
  }'
```

Example response:

```json
{
  "id": 1,
  "name": "Learn Express",
  "description": "Build REST APIs using Node.js and Express.",
  "target_date": "2026-12-31",
  "status": "Not Started",
  "created_at": "2026-10-15T12:00:00.000Z"
}
```

Success status: `201 Created`

### Get All Courses

Returns all courses.

**Request:** `GET /api/courses`

Example using cURL:

```bash
curl http://localhost:5000/api/courses
```

Example response:

```json
[
  {
    "id": 1,
    "name": "Learn Express",
    "description": "Build REST APIs using Node.js and Express.",
    "target_date": "2026-12-31",
    "status": "Not Started",
    "created_at": "2026-10-15T12:00:00.000Z"
  }
]
```

Success status: `200 OK`

### Get a Specific Course

Returns one course using its ID.

**Request:** `GET /api/courses/:id`

Example using cURL:

```bash
curl http://localhost:5000/api/courses/1
```

Example response:

```json
{
  "id": 1,
  "name": "Learn Express",
  "description": "Build REST APIs using Node.js and Express.",
  "target_date": "2026-12-31",
  "status": "Not Started",
  "created_at": "2026-10-15T12:00:00.000Z"
}
```

Success status: `200 OK`

Course not found response (`404 Not Found`):

```json
{
  "error": "Course not found"
}
```

### Update a Course

Updates an existing course. Send all fields, or only the ones you want to change (for example `{"status": "In Progress"}`); omitted fields keep their current values. The `id` and `created_at` values are preserved automatically.

**Request:** `PUT /api/courses/:id`

Example using cURL:

```bash
curl -X PUT http://localhost:5000/api/courses/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Advanced Express",
    "description": "Build and maintain production-ready REST APIs.",
    "target_date": "2027-01-31",
    "status": "In Progress"
  }'
```

Example response:

```json
{
  "id": 1,
  "name": "Advanced Express",
  "description": "Build and maintain production-ready REST APIs.",
  "target_date": "2027-01-31",
  "status": "In Progress",
  "created_at": "2026-10-15T12:00:00.000Z"
}
```

Success status: `200 OK`

### Delete a Course

Deletes an existing course.

**Request:** `DELETE /api/courses/:id`

Example using cURL:

```bash
curl -X DELETE http://localhost:5000/api/courses/1
```

Success status: `204 No Content`

A successful delete request does not return a response body.

Course not found response (`404 Not Found`):

```json
{
  "error": "Course not found"
}
```

### Get Course Statistics (bonus)

Returns the total number of courses and the number of courses in each status.

**Request:** `GET /api/courses/stats`

```bash
curl http://localhost:5000/api/courses/stats
```

Example response:

```json
{
  "total": 3,
  "by_status": {
    "Not Started": 1,
    "In Progress": 1,
    "Completed": 1
  }
}
```

## Error Responses

### Missing required fields

The following fields are required: `name`, `description`, `target_date`, `status`.

```json
{
  "error": "The following fields are required: name, description, target_date, and status"
}
```

### Invalid status

Example request:

```json
{
  "name": "Learn JavaScript",
  "description": "Learn JavaScript fundamentals.",
  "target_date": "2026-12-31",
  "status": "Started"
}
```

Example response:

```json
{
  "error": "status must be one of: Not Started, In Progress, Completed"
}
```

### Invalid date

```json
{
  "error": "target_date must use the valid YYYY-MM-DD format"
}
```

### Invalid course ID

Course IDs must be positive integers.

```json
{
  "error": "Course ID must be a positive integer"
}
```

## Troubleshooting

### `npm: command not found`

Node.js and npm may not be installed. Install Node.js from https://nodejs.org/, then verify the installation:

```bash
node --version
npm --version
```

### `Cannot find module 'express'`

Install the project dependencies:

```bash
npm install
```

If Express is still missing, install it directly:

```bash
npm install express
```

### The server does not start

Make sure you are running the command from the directory containing `app.js`:

```bash
ls
```

You should see files such as `app.js` and `package.json`. Then start the application:

```bash
npm start
```

### Port 5000 is already in use

Another application may already be using port 5000.

On macOS or Linux, find the process using the port:

```bash
lsof -i :5000
```

On Windows, use:

```bash
netstat -ano | findstr :5000
```

Stop the process using the port, then start CodeCraftHub again.

### `courses.json` is not created

Make sure the application has permission to write files in the project directory. On macOS or Linux, you can check the directory permissions:

```bash
ls -la
```

Start the application from the project directory:

```bash
cd codecrafthub
npm start
```

### `courses.json` contains invalid JSON

The data file may have been edited incorrectly. The file should contain a valid JSON array. If you do not need the existing course data, replace the contents of `courses.json` with:

```json
[]
```

### API returns `Route not found`

Check the URL and HTTP method. For example, to retrieve all courses, use:

```text
GET http://localhost:5000/api/courses
```

Make sure:

- The server is running
- The port is `5000`
- The path is `/api/courses`
- The HTTP method is correct

## License

This project is intended for learning and demonstration purposes.
