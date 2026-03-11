"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateApiKey = generateApiKey;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Generate a secure random API key
 * @returns A 64-character hex string
 */
function generateApiKey() {
    return crypto_1.default.randomBytes(32).toString('hex');
}
// Generate and log a new key when this file is run directly
if (require.main === module) {
    console.log('Generated API Key:', generateApiKey());
}
//# sourceMappingURL=generateApiKey.js.map