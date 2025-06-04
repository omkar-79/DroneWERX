"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const PORT = 4000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        message: 'DroneWERX Backend is running!'
    });
});
app.get('/api/v1/test', (req, res) => {
    res.json({
        message: 'DroneWERX API is working!',
        timestamp: new Date().toISOString()
    });
});
app.listen(PORT, () => {
    console.log(`🚀 DroneWERX Backend running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔗 Test API: http://localhost:${PORT}/api/v1/test`);
});
exports.default = app;
//# sourceMappingURL=minimal-server.js.map