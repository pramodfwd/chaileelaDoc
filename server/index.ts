import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./db";
import { handleDemo } from "./routes/demo";
import {
  handleLogin,
  handleLogout,
  handleRegister,
  handleVerify,
  handleResetPassword,
} from "./routes/auth";
import {
  handleUploadDocument,
  handleBatchUploadDocuments,
  handleGetDocuments,
  handleGetDocument,
  handleDeleteDocument,
  handleSearchDocuments,
  handleDownloadDocument,
  handleViewDocument,
} from "./routes/documents";
import {
  handleGetEmployees,
  handleAddEmployee,
  handleUpdateEmployee,
  handleDeleteEmployee,
  handleBlockEmployee,
  handleUnblockEmployee,
} from "./routes/employees";
import {
  handleLogActivity,
  handleGetActivityLogs,
  handleGetDashboardStats,
} from "./routes/logs";

export async function createServer() {
  await connectDB();

  const app = express();

  // Middleware
  app.use(cors());
  // Increase limit to 500MB to handle large base64-encoded files
  app.use(express.json({ limit: "500mb" }));
  app.use(express.urlencoded({ extended: true, limit: "500mb" }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Authentication routes
  app.post("/api/auth/login", handleLogin);
  app.post("/api/auth/logout", handleLogout);
  app.post("/api/auth/register", handleRegister);
  app.get("/api/auth/verify", handleVerify);
  app.post("/api/auth/reset-password", handleResetPassword);

  // Document routes
  app.post("/api/documents/upload", handleUploadDocument);
  app.post("/api/documents/batch-upload", handleBatchUploadDocuments);
  app.get("/api/documents", handleGetDocuments);
  app.get("/api/documents/search/query", handleSearchDocuments);
  app.get("/api/documents/view/:id", handleViewDocument);
  app.get("/api/documents/download/:id", handleDownloadDocument);
  app.get("/api/documents/:id", handleGetDocument);
  app.delete("/api/documents/:id", handleDeleteDocument);

  // Employee routes
  app.get("/api/employees", handleGetEmployees);
  app.post("/api/employees", handleAddEmployee);
  app.put("/api/employees", handleUpdateEmployee);
  app.delete("/api/employees/:id", handleDeleteEmployee);
  app.patch("/api/employees/:id/block", handleBlockEmployee);
  app.patch("/api/employees/:id/unblock", handleUnblockEmployee);

  // Activity & Dashboard routes
  app.post("/api/logs/activity", handleLogActivity);
  app.get("/api/logs/activity", handleGetActivityLogs);
  app.get("/api/dashboard/stats", handleGetDashboardStats);

  return app;
}
