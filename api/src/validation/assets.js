const Joi = require('joi');

// Core Asset Validation Schemas
const assetSchema = {
  create: Joi.object({
    hostname: Joi.string().max(255).required(),
    netbiosName: Joi.string().max(100).allow(null, ''),
    systemId: Joi.string().max(50).allow(null, ''),
    hasAgent: Joi.boolean().default(false),
    hasPluginResults: Joi.boolean().default(false),
    firstSeen: Joi.date().iso().allow(null),
    lastSeen: Joi.date().iso().allow(null),
    exposureScore: Joi.number().integer().min(0).max(1000).allow(null),
    acrScore: Joi.number().precision(1).min(0).max(10).allow(null),
    criticalityRating: Joi.string().valid('low', 'moderate', 'high', 'critical').allow(null),
    source: Joi.string().max(50).default('manual'),
    batchId: Joi.string().uuid().allow(null),
    rawJson: Joi.object().allow(null),
    // Related data
    operatingSystem: Joi.string().max(255).allow(null, ''),
    systemType: Joi.string().max(100).allow(null, ''),
    fqdn: Joi.string().max(255).allow(null, ''),
    ipv4Address: Joi.string().ip({ version: ['ipv4'] }).allow(null, ''),
    macAddress: Joi.string().pattern(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/).allow(null, ''),
    networkType: Joi.string().max(50).allow(null, '')
  }),

  update: Joi.object({
    hostname: Joi.string().max(255),
    netbiosName: Joi.string().max(100).allow(null, ''),
    systemId: Joi.string().max(50).allow(null, ''),
    hasAgent: Joi.boolean(),
    hasPluginResults: Joi.boolean(),
    firstSeen: Joi.date().iso().allow(null),
    lastSeen: Joi.date().iso().allow(null),
    exposureScore: Joi.number().integer().min(0).max(1000).allow(null),
    acrScore: Joi.number().precision(1).min(0).max(10).allow(null),
    criticalityRating: Joi.string().valid('low', 'moderate', 'high', 'critical').allow(null),
    source: Joi.string().max(50),
    batchId: Joi.string().uuid().allow(null),
    rawJson: Joi.object().allow(null),
    // Related data
    operatingSystem: Joi.string().max(255).allow(null, ''),
    systemType: Joi.string().max(100).allow(null, ''),
    fqdn: Joi.string().max(255).allow(null, ''),
    ipv4Address: Joi.string().ip({ version: ['ipv4'] }).allow(null, ''),
    macAddress: Joi.string().pattern(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/).allow(null, ''),
    networkType: Joi.string().max(50).allow(null, '')
  }).min(1) // At least one field must be provided for update
};

// Query parameter validation
const querySchema = {
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().valid(
      'hostname', 'createdAt', 'updatedAt', 'lastSeen', 'firstSeen', 
      'exposureScore', 'acrScore', 'criticalityRating'
    ).default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }),

  filters: Joi.object({
    hostname: Joi.string().max(255).allow(''),
    systemId: Joi.string().max(50).allow(''),
    hasAgent: Joi.boolean().allow(''),
    hasPluginResults: Joi.boolean().allow(''),
    criticalityRating: Joi.string().valid('low', 'moderate', 'high', 'critical').allow(''),
    // Frontend compatibility - map criticality to criticalityRating
    criticality: Joi.string().valid('low', 'moderate', 'high', 'critical').allow(''),
    source: Joi.string().max(50).allow(''),
    operatingSystem: Joi.string().max(255).allow(''),
    systemType: Joi.string().max(100).allow(''),
    // Frontend compatibility - assetType maps to systemType
    assetType: Joi.string().max(100).allow(''),
    ipAddress: Joi.string().ip().allow(''),
    networkType: Joi.string().max(50).allow(''),
    // Tags support
    tags: Joi.string().allow(''),
    // Date range filters
    createdAfter: Joi.date().iso(),
    createdBefore: Joi.date().iso(),
    lastSeenAfter: Joi.date().iso(),
    lastSeenBefore: Joi.date().iso(),
    // Score filters
    minExposureScore: Joi.number().integer().min(0).max(1000),
    maxExposureScore: Joi.number().integer().min(0).max(1000),
    minAcrScore: Joi.number().min(0).max(10),
    maxAcrScore: Joi.number().min(0).max(10),
    // Search
    search: Joi.string().max(255).allow('')
  })
};

// Bulk operations validation
const bulkSchema = {
  bulkUpdate: Joi.object({
    assetUuids: Joi.array().items(Joi.string().uuid()).min(1).max(100).required(),
    updates: assetSchema.update.required()
  }),

  bulkDelete: Joi.object({
    assetUuids: Joi.array().items(Joi.string().uuid()).min(1).max(100).required(),
    force: Joi.boolean().default(false) // Force delete even if asset has related data
  })
};

module.exports = {
  assetSchema,
  querySchema,
  bulkSchema
};
