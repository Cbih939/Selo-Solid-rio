// middlewares/authMiddleware.js
const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
    const authHeader = req.headers["authorization"];

    console.log("=== [AUTH MIDDLEWARE] ===");
    console.log("Headers recebidos:", req.headers);

    if (!authHeader) {
        console.warn("[AUTH] Nenhum token fornecido.");
        return res.status(401).json({ error: "Token não fornecido" });
    }

    const token = authHeader.replace("Bearer ", "");

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        console.log("[AUTH] Token recebido:", token);
        console.log("[AUTH] Payload decodificado:", decoded);

        // anexa usuário ao request
        req.user = decoded;

        console.log("[AUTH] Usuário autenticado com sucesso:", decoded);
        console.log("============================");

        next();
    } catch (err) {
        console.error("[AUTH] Erro ao verificar token:", err.message);
        return res.status(401).json({ error: "Token inválido ou expirado" });
    }
};
