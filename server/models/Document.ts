import mongoose from "mongoose";

const DocumentSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    uploadedByName: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      default: "general",
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileData: {
      type: String,
      required: false,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export const Document = mongoose.model("Document", DocumentSchema);
