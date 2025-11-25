import z from "zod";

const signUpSchema = z.object({
    name: z
    .string({required_error: "Name is required."})
    .trim(),
    email: z
    .string({required_error: "Email is required"})
    .trim()
    .email("Invalid Email Address"),
    password: z
    .string({required_error: "Password is required"})
    .trim()
    .min(6, {message: "Password must have atleast 6 characters"})
    .max(12, {message: "Password can not exceed 12 characters"})
});

export default signUpSchema;