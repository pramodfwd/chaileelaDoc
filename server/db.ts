import mongoose from "mongoose";

export async function connectDB() {
  try {
    if (mongoose.connection.readyState === 1) {
      console.log("Already connected to MongoDB");
      return;
    }

    let MONGODB_URI = process.env.MONGODB_URI;

    if (!MONGODB_URI) {
      console.error("MONGODB_URI environment variable is not set");
      throw new Error("MONGODB_URI is required");
    }

    // Ensure SSL is enabled for MongoDB Atlas
    if (MONGODB_URI.includes("mongodb+srv")) {
      // Add SSL parameter if not present
      if (!MONGODB_URI.includes("ssl=") && !MONGODB_URI.includes("tls=")) {
        MONGODB_URI += (MONGODB_URI.includes("?") ? "&" : "?") + "tls=true";
      }
    }

    console.log("Connecting to MongoDB...");

    // Connection options with retry logic
    const mongooseOptions = {
      retryWrites: true,
      w: "majority",
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 5,
    };

    await mongoose.connect(MONGODB_URI, mongooseOptions);
    console.log("✅ Connected to MongoDB successfully!");

    // Create default admin user if not exists
    const { User } = await import("./models/User");
    const { Employee } = await import("./models/Employee");

    let adminUser = await User.findOne({ email: "admin@cafe.com" });
    if (!adminUser) {
      adminUser = await User.create({
        email: "admin@cafe.com",
        password: "admin123",
        name: "Admin User",
        role: "admin",
      });
      console.log("✅ Default admin user created in User model");
    } else {
      console.log("✅ Admin user already exists in User model");
    }

    // Also create admin in Employee model if not exists
    const adminEmployee = await Employee.findOne({ email: "admin@cafe.com" });
    if (!adminEmployee) {
      await Employee.create({
        email: "admin@cafe.com",
        name: "Admin User",
        userId: adminUser._id,
        role: "admin",
        isActive: true,
        documentsCount: 0,
      });
      console.log("✅ Admin user added to Employee model");
    } else {
      console.log("✅ Admin user already exists in Employee model");
    }
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error instanceof Error ? error.message : error);
    console.error("\n⚠️ MongoDB Connection Troubleshooting Steps:");
    console.error("1. ✓ Check that your IP address is whitelisted in MongoDB Atlas:");
    console.error("   - Go to: Dashboard → Network Access");
    console.error("   - Add your IP address (or use 0.0.0.0/0 for development)");
    console.error("2. ✓ Verify the connection string has correct credentials");
    console.error("3. ✓ Ensure the MongoDB cluster is running and accessible");
    console.error("4. ✓ Check network connectivity to MongoDB Atlas");
    console.error("\n📝 For now, the app will continue to run but MongoDB features may not work.");
    console.error("   Please fix the connection and restart the server.\n");

    // Don't throw - let the app continue to run in development mode
    // This allows frontend development to continue while fixing MongoDB issues
  }
}

export async function disconnectDB() {
  try {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error("Failed to disconnect from MongoDB:", error);
    throw error;
  }
}
