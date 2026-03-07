import userModel from "../models/User.js";
import StudentProfile from "../models/StudentProfile.js";
import UserProgress from "../models/UserProgress.js";
import { OAuth2Client } from 'google-auth-library';

const GOOGLE_CLIENT_ID = '471077271767-6i9jn0ees4brp5kaa2npu34qagk91f61.apps.googleusercontent.com';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const registerUser = async (req, res) => {
    try {
        const {name, email, password} = req.body;

        if(!name || !email || !password){
            return res.status(400).json({success: false, message: "Missing Details"});
        }

        const userExists = await userModel.findOne({email: email});
        if(userExists){
            return res.status(400).json({success: false, message: "User already exists."}); 
        }

        try {
            const userData = { name, email, password };
            const newUser = new userModel(userData);
            await newUser.save();

            // Automatically create a student profile for the new user
            try {
                await StudentProfile.createForUser(newUser._id, { name, email });
                console.log("Student profile created for user:", newUser._id);
            } catch (profileError) {
                console.error("Error creating student profile:", profileError);
                // Continue even if profile creation fails - user can still login
            }

            res.status(200).json({
                success: true, 
                message: "User added successfully.",
                token: await newUser.generateToken(),
                user: { _id: newUser._id, name: newUser.name, email: newUser.email } 
            });
        } catch (error){
            console.error("Error creating user ",error);
            return res.status(400).json({success: false, message: "Server error."});
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({success: false, message: "Internal server error."}); 
    }
};

const login = async (req, res) => {
        const {email, password} = req.body;

        const userExists = await userModel.findOne({email: email});
        if(!userExists){
            return res.status(400).json({success: false, message: "Invalid Credentials."});
        }

        try {
            const validUser = await userExists.comparePassword(password);
            if(validUser){
                // Initialize or get user progress on login
                try {
                    await UserProgress.getOrCreate(userExists._id);
                } catch (progressError) {
                    console.error("Error initializing user progress:", progressError);
                    // Continue even if progress init fails
                }

                // Initialize or get student profile on login
                try {
                    await StudentProfile.getOrCreateForUser(userExists._id, { 
                        name: userExists.name, 
                        email: userExists.email 
                    });
                } catch (profileError) {
                    console.error("Error initializing student profile:", profileError);
                }

                res.status(200).json({
                    success: true, 
                    message: "Login Successful", 
                    token: await userExists.generateToken(), 
                    user: {_id: userExists._id, name: userExists.name, email: userExists.email}});
            }else{
                res.status(400).json({success: false, message:"Invalid email or password."});
            }
            
        } catch (error) {
            console.error(error);
            res.status(500).json({success: false, message: "Internal server error."});
        }
}

const googleLogin = async (req, res) => {
    try {
        console.log("Google login request body:", JSON.stringify(req.body));
        const { userInfo, credential } = req.body;
        
        if (!userInfo && !credential) {
            console.log("No userInfo or credential found");
            return res.status(400).json({ success: false, message: "Google credential is required" });
        }

        let email, name, picture, googleId;

        // Handle userInfo from access token flow (custom button)
        if (userInfo) {
            email = userInfo.email;
            name = userInfo.name;
            picture = userInfo.picture;
            googleId = userInfo.sub;
        } else {
            // Verify the ID token from Google (GoogleLogin component)
            try {
                const ticket = await googleClient.verifyIdToken({
                    idToken: credential,
                    audience: GOOGLE_CLIENT_ID
                });
                const payload = ticket.getPayload();
                email = payload.email;
                name = payload.name;
                picture = payload.picture;
                googleId = payload.sub;
            } catch (tokenError) {
                console.error("Token verification failed:", tokenError);
                return res.status(400).json({ success: false, message: "Invalid Google token" });
            }
        }

        if (!email) {
            return res.status(400).json({ success: false, message: "Email not provided by Google" });
        }
        
        // Find existing user by email or googleId
        let user = await userModel.findOne({ 
            $or: [{ email }, { googleId }] 
        });
        
        if (user) {
            // Update Google info if not set
            if (!user.googleId) {
                user.googleId = googleId;
                user.avatar = picture;
                await user.save();
            }
        } else {
            // Create new user
            user = new userModel({
                name,
                email,
                password: `google_${googleId}_${Date.now()}`, // Placeholder password
                googleId,
                avatar: picture,
                authProvider: 'google'
            });
            await user.save();
            
            // Create student profile for new Google user
            try {
                await StudentProfile.createForUser(user._id, { name, email });
                console.log("Student profile created for Google user:", user._id);
            } catch (profileError) {
                console.error("Error creating student profile:", profileError);
            }
        }

        // Initialize or get user progress
        try {
            await UserProgress.getOrCreate(user._id);
        } catch (progressError) {
            console.error("Error initializing user progress:", progressError);
        }

        // Initialize or get student profile
        try {
            await StudentProfile.getOrCreateForUser(user._id, { name: user.name, email: user.email });
        } catch (profileError) {
            console.error("Error initializing student profile:", profileError);
        }

        res.status(200).json({
            success: true,
            message: "Google login successful",
            token: await user.generateToken(),
            user: { 
                _id: user._id, 
                name: user.name, 
                email: user.email, 
                avatar: user.avatar 
            }
        });
    } catch (error) {
        console.error("Google auth error:", error);
        res.status(400).json({ success: false, message: "Google authentication failed" });
    }
};


export default {registerUser, login, googleLogin};