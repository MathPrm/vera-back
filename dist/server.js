"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const models_1 = __importDefault(require("./app/models")); // Assure l'import de l'objet db depuis index.ts
const items_routes_1 = __importDefault(require("./app/routes/items.routes"));
const verifications_routes_1 = __importDefault(require("./app/routes/verifications.routes"));
const verify_routes_1 = __importDefault(require("./app/routes/verify.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const clientOrigins = process.env.CLIENT_URL || "http://localhost:4200";
const corsOptions = {
    origin: clientOrigins.split(','),
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'DELETE']
};
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
models_1.default.sequelize
    .sync()
    .then(() => {
    console.log("Base de données synchronisée.");
})
    .catch((err) => {
    console.error("Erreur de synchronisation de la base de données:", err);
});
app.get("/", (req, res) => {
    res.json({ message: "Bienvenue sur l'API Items. Le serveur fonctionne !" });
});
(0, items_routes_1.default)(app);
(0, verifications_routes_1.default)(app);
(0, verify_routes_1.default)(app);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}.`);
});
//# sourceMappingURL=server.js.map