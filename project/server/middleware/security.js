const multer = require('multer');

// 1. FRONTEND DEFENSE: Set up memory storage and enforce the strict 5MB limit
const upload = multer({
    storage: multer.memoryStorage(), // ZERO RETENTION: Keeps files in RAM, never writes to disk
    limits: { fileSize: 5 * 1024 * 1024 } // Blocks anything over 5MB
});

// 2. GATEWAY SECURITY: Middleware to validate the RapidAPI Proxy Secret
const validateRapidAPISecret = (req, res, next) => {
    const incomingSecret = req.headers['x-rapidapi-proxy-secret'];
    
    // Looks for the secret in your environment variables (.env)
    if (!incomingSecret || incomingSecret !== process.env.RAPIDAPI_PROXY_SECRET) {
        return res.status(401).json({ 
            success: false, 
            error: "Unauthorized access source. Request must route through the official gateway." 
        });
    }
    next(); // Secret matches perfectly, proceed to the route
};

module.exports = {
    upload,
    validateRapidAPISecret
};
