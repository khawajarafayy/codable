const errorMiddleware = (err, req, res, next) => {
    const status = err.status || 500;
    const msg = err.message || "BACKEND ERROR";
    const extraInfo = err.extraDetails || "Error from backend";

    return res.status(status).json({message: msg, details: extraInfo});
};

export default errorMiddleware;