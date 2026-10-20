const swaggerDoc = {
  openapi: '3.0.0',
  info: {
    title: 'ERP Management System API',
    version: '1.0.0',
    description: 'Enterprise Resource Planning (ERP) REST API built with Node.js, Express, and MongoDB. Supports User Authentication, RBAC (Admin, Sales, Purchase, Inventory), Products, Customers, Suppliers, Sales Orders, Purchase Orders, Goods Receipt Notes (GRN), and Invoices.',
  },
  servers: [
    {
      url: 'http://localhost:5000/api',
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  paths: {
    '/register': {
      post: {
        summary: 'Register a new user account',
        tags: ['Authentication'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'Alex Smith' },
                  email: { type: 'string', example: 'alex@erp.com' },
                  password: { type: 'string', example: 'password123' },
                  role: { type: 'string', enum: ['admin', 'sales', 'purchase', 'inventory'], example: 'sales' },
                  department: { type: 'string', example: 'Sales & Marketing' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'User registered successfully and token returned' },
          400: { description: 'Invalid input or user already exists' },
        },
      },
    },
    '/login': {
      post: {
        summary: 'Authenticate user with email and password',
        tags: ['Authentication'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'admin@erp.com' },
                  password: { type: 'string', example: 'password123' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'JWT authentication token and user profile returned' },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/users': {
      get: {
        summary: 'Get all users with search & pagination (Admin only)',
        tags: ['Users (Admin)'],
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'role', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: { description: 'Paginated user list' },
          403: { description: 'Forbidden (non-admin)' },
        },
      },
      post: {
        summary: 'Create a new user (Admin only)',
        tags: ['Users (Admin)'],
        responses: {
          201: { description: 'User created' },
        },
      },
    },
    '/products': {
      get: {
        summary: 'List products with search, category filtering, and lowStock filter',
        tags: ['Products'],
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'lowStock', in: 'query', schema: { type: 'boolean' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { 200: { description: 'Products array with pagination' } },
      },
      post: {
        summary: 'Create a product (Admin, Inventory, Purchase)',
        tags: ['Products'],
        responses: { 201: { description: 'Product created' } },
      },
    },
    '/products/{id}': {
      get: { summary: 'Get product by ID', tags: ['Products'] },
      put: { summary: 'Update product', tags: ['Products'] },
      delete: { summary: 'Delete product', tags: ['Products'] },
    },
    '/customers': {
      get: { summary: 'List customers', tags: ['Customers'] },
      post: { summary: 'Create customer', tags: ['Customers'] },
    },
    '/suppliers': {
      get: { summary: 'List suppliers', tags: ['Suppliers'] },
      post: { summary: 'Create supplier', tags: ['Suppliers'] },
    },
    '/purchase-orders': {
      get: { summary: 'List purchase orders', tags: ['Purchase Orders'] },
      post: { summary: 'Create purchase order', tags: ['Purchase Orders'] },
    },
    '/grn': {
      get: { summary: 'List Goods Receipt Notes', tags: ['Goods Receipt Notes (GRN)'] },
      post: {
        summary: 'Create Goods Receipt Note (Linked to PO & auto-increments product stock)',
        tags: ['Goods Receipt Notes (GRN)'],
        responses: { 201: { description: 'GRN created and inventory stock updated' } },
      },
    },
    '/sales-orders': {
      get: { summary: 'List sales orders', tags: ['Sales Orders'] },
      post: {
        summary: 'Create sales order (deducts product stock)',
        tags: ['Sales Orders'],
        responses: { 201: { description: 'Sales order created' } },
      },
    },
    '/invoices': {
      get: { summary: 'List invoices', tags: ['Invoices'] },
      post: {
        summary: 'Create invoice (Linked to Sales Order)',
        tags: ['Invoices'],
        responses: { 201: { description: 'Invoice created' } },
      },
    },
    '/invoices/{id}': {
      get: { summary: 'Get invoice details', tags: ['Invoices'] },
      put: { summary: 'Update invoice status (e.g. Paid)', tags: ['Invoices'] },
    },
    '/dashboard/stats': {
      get: {
        summary: 'Get comprehensive KPI statistics, chart series, and low stock alerts',
        tags: ['Dashboard Analytics'],
        responses: { 200: { description: 'Analytics payload' } },
      },
    },
  },
};

module.exports = swaggerDoc;
