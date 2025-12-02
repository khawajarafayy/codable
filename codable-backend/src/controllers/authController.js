import userModel from "../models/User.js";
import StudentProfile from "../models/StudentProfile.js";

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
            res.status(400).json({success: false, message: "Invalid Credentials."});
        }

        try {
            const validUser = await userExists.comparePassword(password);
            if(validUser){
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


export default {registerUser, login};