import dotenv from "dotenv";
dotenv.config();
import { mongoose } from "mongoose";

const URI = process.env.MONGO_URI;

const connectDB = async () => {
    if(!URI){
        console.error("MongoURI is not defined.");
        process.exit(1);
        
    }

    try {
        mongoose.set("strictQuery", false);
        await mongoose.connect(URI);
        console.log("Database connection successful.");
        
    } catch (error) {
        console.error("Database connection failed", error);
        process.exit(1);
    }
}

export default connectDB;