const express = require("express");
const fs = require("fs/promises");
const path = require("path");

// Create an Express application
const app = express();

// The server will run on port 5000
const PORT = 5000;

// Store courses.json in the same directory as this app.js file
const DATA_FILE = path.join(__dirname, "courses.json");

// Allowed course status values
const VALID_STATUSES = [
  "Not Started",
  "In Progress",
  "Completed"
];

/*
  Custom error class.

  This lets us attach an HTTP status code to errors so that
  the error-handling middleware can send a useful response.
*/
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

/*
  Middleware that allows Express to read JSON request bodies.

  For example, this allows the server to read:

  {
    "name": "Node.js",
    "description": "Learn Node.js",
    "target_date": "2026-12-31",
    "status": "Not Started"
  }
*/
app.use(express.json());

/*
  Check whether a date has the exact YYYY-MM-DD format
  and represents a real calendar date.
*/
function isValidDate(dateString) {
  // Make sure the value is a string in the correct basic format
  if (
    typeof dateString !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(dateString)
  ) {
    return false;
  }

  const [year, month, day] = dateString.split("-").map(Number);

  // Create a UTC date and compare its values with the original values.
  // This rejects invalid dates such as 2026-02-30.
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/*
  Check whether a course ID is a valid positive integer.

  IDs are automatically generated as numbers beginning with 1.
*/
function parseCourseId(id) {
  const numericId = Number(id);

  if (!Number.isInteger(numericId) || numericId < 1) {
    throw new AppError("Course ID must be a positive integer", 400);
  }

  return numericId;
}

/*
  Validate course data received from a POST or PUT request.

  All course fields are required.
*/
function validateCourseData(data) {
  const {
    name,
    description,
    target_date,
    status
  } = data;

  // Check for missing or empty required fields
  if (
    typeof name !== "string" ||
    name.trim() === "" ||
    typeof description !== "string" ||
    description.trim() === "" ||
    typeof target_date !== "string" ||
    target_date.trim() === "" ||
    typeof status !== "string" ||
    status.trim() === ""
  ) {
    throw new AppError(
      "The following fields are required: name, description, target_date, and status",
      400
    );
  }

  // Validate the date
  if (!isValidDate(target_date)) {
    throw new AppError(
      "target_date must use the valid YYYY-MM-DD format",
      400
    );
  }

  // Validate the status
  if (!VALID_STATUSES.includes(status)) {
    throw new AppError(
      `status must be one of: ${VALID_STATUSES.join(", ")}`,
      400
    );
  }

  return {
    name: name.trim(),
    description: description.trim(),
    target_date,
    status
  };
}

/*
  Read courses from courses.json.

  If courses.json does not exist, create it automatically
  with an empty array.
*/
async function readCourses() {
  try {
    const fileContents = await fs.readFile(DATA_FILE, "utf8");

    try {
      return JSON.parse(fileContents);
    } catch (error) {
      throw new AppError(
        "courses.json contains invalid JSON",
        500
      );
    }
  } catch (error) {
    // If the file does not exist, create it automatically
    if (error.code === "ENOENT") {
      try {
        await fs.writeFile(DATA_FILE, "[]", "utf8");
        return [];
      } catch (writeError) {
        throw new AppError(
          `Unable to create courses.json: ${writeError.message}`,
          500
        );
      }
    }

    // Pass through our own application errors
    if (error instanceof AppError) {
      throw error;
    }

    // Handle other file read errors
    throw new AppError(
      `Unable to read courses.json: ${error.message}`,
      500
    );
  }
}

/*
  Save an array of courses to courses.json.
*/
async function writeCourses(courses) {
  try {
    const jsonData = JSON.stringify(courses, null, 2);

    await fs.writeFile(DATA_FILE, jsonData, "utf8");
  } catch (error) {
    throw new AppError(
      `Unable to write to courses.json: ${error.message}`,
      500
    );
  }
}

/*
  Find the next available course ID.

  The first course gets ID 1.
  If courses with IDs 1, 2, and 3 exist, the next course gets ID 4.
*/
function getNextCourseId(courses) {
  if (courses.length === 0) {
    return 1;
  }

  const highestId = Math.max(
    ...courses.map(course => Number(course.id) || 0)
  );

  return highestId + 1;
}

/*
  POST /api/courses

  Add a new course.
*/
app.post("/api/courses", async (req, res, next) => {
  try {
    // Validate the request body
    const courseData = validateCourseData(req.body);

    // Read existing courses from the JSON file
    const courses = await readCourses();

    // Create a new course object
    const newCourse = {
      id: getNextCourseId(courses),
      name: courseData.name,
      description: courseData.description,
      target_date: courseData.target_date,
      status: courseData.status,
      created_at: new Date().toISOString()
    };

    // Add the new course to the array
    courses.push(newCourse);

    // Save the updated array
    await writeCourses(courses);

    // Return the newly created course
    res.status(201).json(newCourse);
  } catch (error) {
    next(error);
  }
});

/*
  GET /api/courses

  Return all courses.
*/
app.get("/api/courses", async (req, res, next) => {
  try {
    const courses = await readCourses();

    res.status(200).json(courses);
  } catch (error) {
    next(error);
  }
});

/*
  GET /api/courses/stats

  Return the total number of courses and the number
  of courses in each status category.

  NOTE: This route must be placed BEFORE GET /api/courses/:id,
  otherwise "stats" would be interpreted as a course ID.
*/
app.get("/api/courses/stats", async (req, res, next) => {
  try {
    const courses = await readCourses();

    const statistics = {
      total: courses.length,
      by_status: {
        "Not Started": 0,
        "In Progress": 0,
        "Completed": 0
      }
    };

    courses.forEach(course => {
      if (VALID_STATUSES.includes(course.status)) {
        statistics.by_status[course.status]++;
      }
    });

    res.status(200).json(statistics);
  } catch (error) {
    next(error);
  }
});

/*
  GET /api/courses/:id

  Return one specific course.
*/
app.get("/api/courses/:id", async (req, res, next) => {
  try {
    const courseId = parseCourseId(req.params.id);
    const courses = await readCourses();

    const course = courses.find(
      course => course.id === courseId
    );

    if (!course) {
      throw new AppError("Course not found", 404);
    }

    res.status(200).json(course);
  } catch (error) {
    next(error);
  }
});

/*
  PUT /api/courses/:id

  Update the details of an existing course.

  You can send all fields or only the ones you want to change,
  for example: { "status": "In Progress" }.
  Fields you leave out keep their current values.

  The ID and created_at timestamp are preserved.
*/
app.put("/api/courses/:id", async (req, res, next) => {
  try {
    const courseId = parseCourseId(req.params.id);

    const courses = await readCourses();

    const courseIndex = courses.findIndex(
      course => course.id === courseId
    );

    if (courseIndex === -1) {
      throw new AppError("Course not found", 404);
    }

    // Merge the incoming fields with the existing course,
    // then validate the combined result
    const existing = courses[courseIndex];
    const courseData = validateCourseData({
      name: existing.name,
      description: existing.description,
      target_date: existing.target_date,
      status: existing.status,
      ...req.body
    });

    // Keep the original ID and creation timestamp
    const updatedCourse = {
      id: courses[courseIndex].id,
      name: courseData.name,
      description: courseData.description,
      target_date: courseData.target_date,
      status: courseData.status,
      created_at: courses[courseIndex].created_at
    };

    // Replace the old course
    courses[courseIndex] = updatedCourse;

    // Save the updated courses
    await writeCourses(courses);

    res.status(200).json(updatedCourse);
  } catch (error) {
    next(error);
  }
});

/*
  DELETE /api/courses/:id

  Delete a course.
*/
app.delete("/api/courses/:id", async (req, res, next) => {
  try {
    const courseId = parseCourseId(req.params.id);
    const courses = await readCourses();

    const courseIndex = courses.findIndex(
      course => course.id === courseId
    );

    if (courseIndex === -1) {
      throw new AppError("Course not found", 404);
    }

    // Remove one course from the array
    courses.splice(courseIndex, 1);

    // Save the updated array
    await writeCourses(courses);

    // 204 means the deletion succeeded and there is no response body
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

/*
  Handle requests to routes that do not exist.
*/
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found"
  });
});

/*
  Global error-handling middleware.

  Express recognizes this as error-handling middleware
  because it has four parameters.
*/
app.use((error, req, res, next) => {
  console.error(error);

  // Handle invalid JSON sent in the request body
  if (error instanceof SyntaxError && error.status === 400) {
    return res.status(400).json({
      error: "Request body contains invalid JSON"
    });
  }

  const statusCode = error.statusCode || 500;

  res.status(statusCode).json({
    error: error.message || "Internal server error"
  });
});

/*
  Make sure courses.json exists before starting the server.
*/
async function startServer() {
  try {
    await readCourses();

    app.listen(PORT, () => {
      console.log(`CodeCraftHub API is running on port ${PORT}`);
      console.log(`http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Unable to start the server:", error.message);
    process.exit(1);
  }
}

// Start the application
startServer();
