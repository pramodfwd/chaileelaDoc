import { RequestHandler } from "express";
import { ActivityLog } from "../models/ActivityLog";
import { Document } from "../models/Document";
import { Employee } from "../models/Employee";

export const handleLogActivity: RequestHandler<
  any,
  { success: boolean; error?: string },
  {
    userId: string;
    userName: string;
    action: string;
    documentId?: string;
    documentName?: string;
    details?: string;
  }
> = async (req, res) => {
  try {
    const { userId, userName, action, documentId, documentName, details } =
      req.body;

    if (!userId || !userName || !action) {
      res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
      return;
    }

    await ActivityLog.create({
      userId,
      userName,
      action,
      documentId,
      documentName,
      details,
      timestamp: new Date(),
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Log activity error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to log activity",
    });
  }
};

export const handleGetActivityLogs: RequestHandler = async (req, res) => {
  try {
    const { limit = "50" } = req.query;
    const logs = await ActivityLog.find()
      .sort({ timestamp: -1 })
      .limit(parseInt(String(limit)));

    res.json({ success: true, logs });
  } catch (error) {
    console.error("Get activity logs error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch activity logs",
    });
  }
};

export const handleGetDashboardStats: RequestHandler = async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalUploads = await ActivityLog.countDocuments({
      action: "upload",
    });

    const todayUploads = await ActivityLog.countDocuments({
      action: "upload",
      timestamp: { $gte: today },
    });

    const monthUploads = await ActivityLog.countDocuments({
      action: "upload",
      timestamp: { $gte: monthStart },
    });

    const documents = await Document.find();
    const totalSize = documents.reduce((sum, doc) => sum + doc.size, 0);

    const activeEmployees = await Employee.countDocuments({ isActive: true });

    res.json({
      success: true,
      stats: {
        totalUploads,
        todayUploads,
        monthUploads,
        totalSize,
        activeEmployees,
      },
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch dashboard stats",
    });
  }
};
