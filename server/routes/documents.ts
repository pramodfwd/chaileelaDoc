import { RequestHandler } from "express";
import { Document } from "../models/Document";

export const handleUploadDocument: RequestHandler<
  any,
  { success: boolean; document?: any; error?: string },
  {
    filename: string;
    fileType: string;
    size: number;
    category: string;
    userId: string;
    userName: string;
    title: string;
    description: string;
  }
> = async (req, res) => {
  try {
    const { filename, fileType, size, category, userId, userName, title, description } = req.body;

    // Validation
    if (!filename || !userId || !userName || !title) {
      res.status(400).json({
        success: false,
        error: "Missing required fields: filename, userId, userName, title",
      });
      return;
    }

    // Validate file size (500 MB max)
    const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB
    if (size > MAX_FILE_SIZE) {
      res.status(413).json({
        success: false,
        error: `File too large. Maximum size is 500 MB. Your file is ${(size / 1024 / 1024).toFixed(2)} MB`,
      });
      return;
    }

    // Log file upload
    console.log(`File uploaded: "${title}" by ${userName} on ${new Date().toLocaleDateString()}`);

    const newDocument = await Document.create({
      filename,
      fileType: fileType || "unknown",
      size: size || 0,
      uploadDate: new Date(),
      uploadedBy: userId,
      uploadedByName: userName,
      category: category || "general",
      fileUrl: `/uploads/${Date.now()}-${filename}`,
      title: title || "Untitled",
      description: description || "",
    });

    // Convert MongoDB response to expected format
    const docObj = newDocument.toObject();
    const responseDocument = {
      id: docObj._id.toString(),
      filename: docObj.filename,
      fileType: docObj.fileType,
      size: docObj.size,
      uploadDate: docObj.uploadDate,
      uploadedBy: docObj.uploadedBy?.toString() || docObj.uploadedBy,
      uploadedByName: docObj.uploadedByName,
      category: docObj.category,
      fileUrl: docObj.fileUrl,
      title: docObj.title,
      description: docObj.description,
    };

    res.json({ success: true, document: responseDocument });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to upload document",
    });
  }
};

// Batch upload multiple documents
export const handleBatchUploadDocuments: RequestHandler<
  any,
  { success: boolean; documents?: any[]; error?: string },
  {
    documents: Array<{
      filename: string;
      fileType: string;
      size: number;
      title: string;
      description?: string;
      fileData?: string;
    }>;
    userId: string;
    userName: string;
    category?: string;
  }
> = async (req, res) => {
  try {
    const { documents: filesToUpload, userId, userName, category } = req.body;

    // Validation
    if (!filesToUpload || !Array.isArray(filesToUpload) || filesToUpload.length === 0) {
      res.status(400).json({
        success: false,
        error: "No documents provided",
      });
      return;
    }

    if (!userId || !userName) {
      res.status(400).json({
        success: false,
        error: "Missing userId or userName",
      });
      return;
    }

    const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB
    const uploadedDocuments = [];
    const errors = [];

    // Validate and upload each file
    for (const file of filesToUpload) {
      try {
        if (!file.filename || !file.title) {
          errors.push(`${file.filename || "Unknown"}: Missing title or filename`);
          continue;
        }

        if (file.size > MAX_FILE_SIZE) {
          errors.push(
            `${file.filename}: File too large (${(file.size / 1024 / 1024).toFixed(2)} MB)`
          );
          continue;
        }

        // Validate fileData is provided
        if (!file.fileData || file.fileData.trim() === "") {
          console.warn(`Warning: File "${file.filename}" uploaded without fileData by ${userName}`);
        }

        const newDocument = await Document.create({
          filename: file.filename,
          fileType: file.fileType || "unknown",
          size: file.size || 0,
          uploadDate: new Date(),
          uploadedBy: userId,
          uploadedByName: userName,
          category: category || "general",
          fileUrl: `/api/documents/download/${Date.now()}-${file.filename.replace(/[^a-zA-Z0-9.-]/g, "-")}`,
          fileData: file.fileData || "",
          title: file.title,
          description: file.description || "",
        });

        const docObj = newDocument.toObject();
        uploadedDocuments.push({
          id: docObj._id.toString(),
          filename: docObj.filename,
          fileType: docObj.fileType,
          size: docObj.size,
          uploadDate: docObj.uploadDate,
          uploadedBy: docObj.uploadedBy?.toString() || docObj.uploadedBy,
          uploadedByName: docObj.uploadedByName,
          category: docObj.category,
          fileUrl: docObj.fileUrl,
          title: docObj.title,
          description: docObj.description,
        });

        console.log(`File uploaded: "${file.title}" by ${userName}` + (file.fileData ? " (with fileData)" : " (WARNING: no fileData)"));
      } catch (err) {
        errors.push(`${file.filename}: Upload failed`);
        console.error(`Error uploading ${file.filename}:`, err);
      }
    }

    if (uploadedDocuments.length === 0) {
      res.status(400).json({
        success: false,
        error: `Failed to upload documents: ${errors.join(", ")}`,
      });
      return;
    }

    res.json({
      success: true,
      documents: uploadedDocuments,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Batch upload error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to batch upload documents",
    });
  }
};

export const handleGetDocuments: RequestHandler = async (req, res) => {
  try {
    const { userId, role } = req.query;

    let query: any = {};

    // Employees can only see their own documents
    if (role === "employee") {
      query.uploadedBy = userId;
    }

    const documents = await Document.find(query).sort({ uploadDate: -1 });

    // Convert MongoDB response format
    const formattedDocuments = documents.map(doc => {
      const docObj = doc.toObject();
      return {
        id: docObj._id.toString(),
        filename: docObj.filename,
        fileType: docObj.fileType,
        size: docObj.size,
        uploadDate: docObj.uploadDate,
        uploadedBy: docObj.uploadedBy?.toString() || docObj.uploadedBy,
        uploadedByName: docObj.uploadedByName,
        category: docObj.category,
        fileUrl: docObj.fileUrl,
        title: docObj.title,
        description: docObj.description,
      };
    });

    res.json({ success: true, documents: formattedDocuments });
  } catch (error) {
    console.error("Get documents error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch documents",
    });
  }
};

export const handleGetDocument: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await Document.findById(id);

    if (!document) {
      res.status(404).json({ success: false, error: "Document not found" });
      return;
    }

    // Convert MongoDB response to expected format
    const docObj = document.toObject();
    const responseDocument = {
      id: docObj._id.toString(),
      filename: docObj.filename,
      fileType: docObj.fileType,
      size: docObj.size,
      uploadDate: docObj.uploadDate,
      uploadedBy: docObj.uploadedBy?.toString() || docObj.uploadedBy,
      uploadedByName: docObj.uploadedByName,
      category: docObj.category,
      fileUrl: docObj.fileUrl,
      title: docObj.title,
      description: docObj.description,
    };

    res.json({ success: true, document: responseDocument });
  } catch (error) {
    console.error("Get document error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch document",
    });
  }
};

export const handleDeleteDocument: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.query;

    // Only admin can delete
    if (role !== "admin") {
      res.status(403).json({ success: false, error: "Unauthorized" });
      return;
    }

    const document = await Document.findByIdAndDelete(id);

    if (!document) {
      res.status(404).json({ success: false, error: "Document not found" });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Delete document error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete document",
    });
  }
};

export const handleSearchDocuments: RequestHandler = async (req, res) => {
  try {
    const { query, category, startDate, endDate, userId, role } = req.query;

    let filter: any = {};

    // Role-based filtering
    if (role === "employee") {
      filter.uploadedBy = userId;
    }

    // Search query
    if (query) {
      const q = String(query).toLowerCase();
      filter.$or = [
        { filename: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
        { title: { $regex: q, $options: "i" } },
      ];
    }

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.uploadDate = {};
      if (startDate) {
        filter.uploadDate.$gte = new Date(String(startDate));
      }
      if (endDate) {
        filter.uploadDate.$lte = new Date(String(endDate));
      }
    }

    const documents = await Document.find(filter).sort({ uploadDate: -1 });

    // Convert MongoDB response format
    const formattedDocuments = documents.map(doc => {
      const docObj = doc.toObject();
      return {
        id: docObj._id.toString(),
        filename: docObj.filename,
        fileType: docObj.fileType,
        size: docObj.size,
        uploadDate: docObj.uploadDate,
        uploadedBy: docObj.uploadedBy?.toString() || docObj.uploadedBy,
        uploadedByName: docObj.uploadedByName,
        category: docObj.category,
        fileUrl: docObj.fileUrl,
        title: docObj.title,
        description: docObj.description,
      };
    });

    res.json({ success: true, documents: formattedDocuments });
  } catch (error) {
    console.error("Search documents error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to search documents",
    });
  }
};

export const handleViewDocument: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const document = await Document.findById(id);

    if (!document) {
      res.status(404).json({ success: false, error: "Document not found" });
      return;
    }

    // Check if fileData exists and is not empty
    if (!document.fileData || document.fileData.trim() === "") {
      res.status(400).json({
        success: false,
        error: "File data not available"
      });
      return;
    }

    // If fileData is a data URL, extract the base64 part
    let base64Data = document.fileData;
    if (base64Data.startsWith("data:")) {
      base64Data = base64Data.split(",")[1];
    }

    // Validate base64 data exists
    if (!base64Data || base64Data.trim() === "") {
      res.status(400).json({
        success: false,
        error: "Invalid file data"
      });
      return;
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, "base64");

    // Set response headers for inline display (not download)
    res.setHeader("Content-Type", document.fileType || "application/octet-stream");
    res.setHeader("Content-Length", buffer.length);
    res.setHeader("Cache-Control", "public, max-age=3600");

    // Send file
    res.send(buffer);
  } catch (error) {
    console.error("View document error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to view document",
    });
  }
};

export const handleDownloadDocument: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const document = await Document.findById(id);

    if (!document) {
      res.status(404).json({ success: false, error: "Document not found" });
      return;
    }

    // Check if fileData exists and is not empty
    if (!document.fileData || document.fileData.trim() === "") {
      console.error(`Document ${id} has no fileData. Document:`, {
        filename: document.filename,
        title: document.title,
        uploadDate: document.uploadDate,
      });
      res.status(400).json({
        success: false,
        error: "File data not available. This document may have been uploaded before file storage was enabled. Please re-upload the document."
      });
      return;
    }

    // If fileData is a data URL, extract the base64 part
    let base64Data = document.fileData;
    if (base64Data.startsWith("data:")) {
      base64Data = base64Data.split(",")[1];
    }

    // Validate base64 data exists
    if (!base64Data || base64Data.trim() === "") {
      res.status(400).json({
        success: false,
        error: "Invalid file data. Please re-upload the document."
      });
      return;
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, "base64");

    // Set response headers
    res.setHeader("Content-Type", document.fileType || "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${document.filename}"`
    );
    res.setHeader("Content-Length", buffer.length);

    // Send file
    res.send(buffer);
  } catch (error) {
    console.error("Download document error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to download document",
    });
  }
};
