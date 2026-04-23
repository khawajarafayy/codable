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
  // Support both 'token' header and 'Authorization: Bearer <token>' header
  let token = req.headers.token;
  
  if (!token && req.headers.authorization) {
    // Extract token from 'Authorization: Bearer <token>'
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    return res.json({ success: false, message: "Token not found. Login again" });
  }

  try {
    const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token: ", tokenDecode);

    if (tokenDecode.userId) {
      req.userId = tokenDecode.userId;
      req.userRole = tokenDecode.role;
      return next();
    } else {
      return res.json({ success: false, message: "Not authorized. login again" });
    }
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

const authorize = (allowedRoles = []) => async (req, res, next) => {
  try {
    let token = req.headers.token;
    
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.json({ success: false, message: "Token not found. Login again" });
    }

    const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);

    if (tokenDecode.userId) {
      // Check if role is allowed
      if (allowedRoles.length > 0 && !allowedRoles.includes(tokenDecode.role)) {
        return res.status(403).json({ 
          success: false, 
          message: `Access denied. This resource requires one of these roles: ${allowedRoles.join(', ')}` 
        });
      }

      req.userId = tokenDecode.userId;
      req.userRole = tokenDecode.role;
      return next();
    } else {
      return res.json({ success: false, message: "Not authorized. login again" });
    }
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

export default { validate, userAuth, authorize };