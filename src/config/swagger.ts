// src/config/swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

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

export const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log('📚 Swagger UI disponible sur /api-docs');
};