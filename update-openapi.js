const fs = require('fs');
const yaml = require('js-yaml');

const openapiPath = 'C:/Users/Founder Desk/3D Objects/Games4Kings-New/apps/api/openapi/openapi.yaml';
const doc = yaml.load(fs.readFileSync(openapiPath, 'utf8')) || {};
if (!doc.components) doc.components = {};
if (!doc.components.schemas) doc.components.schemas = {};

// Define new schemas
doc.components.schemas.Department = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    name: { type: 'string' },
    description: { type: 'string', nullable: true },
    teams: { type: 'array', items: { $ref: '#/components/schemas/Team' } }
  }
};
doc.components.schemas.Team = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    department_id: { type: 'integer' },
    name: { type: 'string' },
    description: { type: 'string', nullable: true }
  }
};
doc.components.schemas.Designation = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    name: { type: 'string' },
    description: { type: 'string', nullable: true }
  }
};

// Add new paths
const newPaths = {
  '/auth/profile': {
    get: {
      summary: 'Get current user profile',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': { description: 'Profile', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } }
      }
    },
    put: {
      summary: 'Update current user profile',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, phone: { type: 'string' }, avatar_url: { type: 'string' } } } } }
      },
      responses: {
        '200': { description: 'Updated Profile', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } }
      }
    }
  },
  '/directory': {
    get: {
      summary: 'Get employee directory',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'search', in: 'query', schema: { type: 'string' } },
        { name: 'department_id', in: 'query', schema: { type: 'integer' } }
      ],
      responses: {
        '200': { description: 'Directory list', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/User' } } } } } } }
      }
    }
  },
  '/org/departments': {
    get: {
      summary: 'List departments',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Departments', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Department' } } } } } }
    },
    post: {
      summary: 'Create department',
      security: [{ bearerAuth: [] }],
      requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, description: { type: 'string' } } } } } },
      responses: { '201': { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Department' } } } } }
    }
  },
  '/org/departments/{id}': {
    get: {
      summary: 'Get department',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      responses: { '200': { description: 'Department', content: { 'application/json': { schema: { $ref: '#/components/schemas/Department' } } } } }
    },
    put: {
      summary: 'Update department',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, description: { type: 'string' } } } } } },
      responses: { '200': { description: 'Updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Department' } } } } }
    },
    delete: {
      summary: 'Delete department',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      responses: { '204': { description: 'Deleted' } }
    }
  },
  '/org/departments/{departmentId}/teams': {
    post: {
      summary: 'Create team',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'departmentId', in: 'path', required: true, schema: { type: 'integer' } }],
      requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, description: { type: 'string' } } } } } },
      responses: { '201': { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Team' } } } } }
    }
  },
  '/org/departments/{departmentId}/teams/{teamId}': {
    delete: {
      summary: 'Delete team',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'departmentId', in: 'path', required: true, schema: { type: 'integer' } }, { name: 'teamId', in: 'path', required: true, schema: { type: 'integer' } }],
      responses: { '204': { description: 'Deleted' } }
    }
  },
  '/org/designations': {
    get: {
      summary: 'List designations',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Designations', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Designation' } } } } } }
    },
    post: {
      summary: 'Create designation',
      security: [{ bearerAuth: [] }],
      requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, description: { type: 'string' } } } } } },
      responses: { '201': { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Designation' } } } } }
    }
  },
  '/org/designations/{id}': {
    put: {
      summary: 'Update designation',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, description: { type: 'string' } } } } } },
      responses: { '200': { description: 'Updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Designation' } } } } }
    },
    delete: {
      summary: 'Delete designation',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      responses: { '204': { description: 'Deleted' } }
    }
  },
  '/org/users': {
    get: {
      summary: 'List users',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Users', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/User' } } } } } }
    },
    post: {
      summary: 'Create user',
      security: [{ bearerAuth: [] }],
      requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, email: { type: 'string' }, phone: { type: 'string' }, department_id: { type: 'integer' }, team_id: { type: 'integer' }, designation_id: { type: 'integer' }, roles: { type: 'array', items: { type: 'string' } } } } } } },
      responses: { '201': { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } } }
    }
  },
  '/org/users/{id}': {
    get: {
      summary: 'Get user',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      responses: { '200': { description: 'User', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } } }
    },
    put: {
      summary: 'Update user',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, email: { type: 'string' }, phone: { type: 'string' }, department_id: { type: 'integer' }, team_id: { type: 'integer' }, designation_id: { type: 'integer' }, status: { type: 'string', enum: ['active', 'inactive'] }, roles: { type: 'array', items: { type: 'string' } } } } } } },
      responses: { '200': { description: 'Updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } } }
    },
    delete: {
      summary: 'Delete user',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      responses: { '204': { description: 'Deleted' } }
    }
  }
};

Object.assign(doc.paths, newPaths);

fs.writeFileSync(openapiPath, yaml.dump(doc), 'utf8');
console.log('OpenAPI spec updated successfully.');
