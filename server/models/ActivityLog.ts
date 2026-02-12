import mongoose from "mongoose";

const ActivityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
    },
    documentName: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    details: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const ActivityLog = mongoose.model("ActivityLog", ActivityLogSchema);
