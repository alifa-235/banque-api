"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSwagger = exports.swaggerSpec = void 0;
// src/config/swagger.ts
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API Bancaire',
            version: '1.0.0',
            description: 'API pour système de transactions bancaires - Version démo (stockage mémoire)',
            contact: {
                name: 'Support',
                email: 'support@banque.com'
            }
        },
        servers: [
            {
                url: process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000',
                description: process.env.RENDER_EXTERNAL_URL ? 'Serveur de production' : 'Serveur de développement'
            }
        ],
        components: {
            schemas: {
                Account: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
                        accountNumber: { type: 'string', example: 'FR76123456789012345678' },
                        clientName: { type: 'string', example: 'Jean Dupont' },
                        clientEmail: { type: 'string', example: 'jean@email.com' },
                        type: { type: 'string', enum: ['courant', 'epargne'], example: 'courant' },
                        balance: { type: 'number', example: 100000 },
                        currency: { type: 'string', example: 'XAF' },
                        status: { type: 'string', enum: ['active', 'inactive'], example: 'active' },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                },
                Transaction: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        accountId: { type: 'string' },
                        type: { type: 'string', enum: ['depot', 'retrait', 'virement'] },
                        amount: { type: 'number' },
                        description: { type: 'string' },
                        date: { type: 'string', format: 'date-time' }
                    }
                }
            }
        }
    },
    apis: ['./src/routes/*.ts']
};
exports.swaggerSpec = (0, swagger_jsdoc_1.default)(options);
const setupSwagger = (app) => {
    app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(exports.swaggerSpec));
    console.log('📚 Swagger UI disponible sur /api-docs');
};
exports.setupSwagger = setupSwagger;
