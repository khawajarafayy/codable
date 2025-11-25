import jwt from "jsonwebtoken";

const validate = (schema) => async (req, res, next) => {

  if (!schema) {
    console.error("validate middleware: schema is undefined");
    return res.status(500).json({ message: "Server validation configuration error" });
  }

  try {
    // Joi-style: schema.validate(req.body) -> { error }
    if (typeof schema.validate === "function") {
      const { error } = schema.validate(req.body);
      if (error) return res.status(400).json({ message: error.message });
      return next();
    }

    // Zod-style: schema.safeParse(req.body) -> { success, error }
    if (typeof schema.safeParse === "function") {
      const result = schema.safeParse(req.body);
      if (!result.success) return res.status(400).json({ message: result.error.message || result.error.toString() });
      return next();
    }

    // Generic parse (Zod parse or similar)
    if (typeof schema.parse === "function") {
      try {
        schema.parse(req.body);
        return next();
      } catch (err) {
        return res.status(400).json({ message: err.message || err.toString() });
      }
    }

    console.error("validate middleware: schema has no validate/parse method", schema);
    return res.status(500).json({ message: "Invalid validation schema" });
  } catch (err) {
    console.error("validate middleware error:", err);
    return res.status(500).json({ message: "Validation error", error: err.message });
  }
};

const userAuth = async (req, res, next) => {
  const { token } = req.headers;

  if (!token) {
    return res.json({ success: false, message: "Token not found. Login again" });
  }

  try {
    const tokenDecode = jwt.verify(token, process.env.SECRET_KEY);
    console.log("Decoded token: ", tokenDecode);

    if (tokenDecode.userId) {
      req.userId = tokenDecode.userId;
      return next();
    } else {
      return res.json({ success: false, message: "Not authorized. login again" });
    }
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

export default { validate, userAuth };