const Joi = require('joi');

// Asset Cost Management Validation
const assetCostManagementSchema = {
  create: Joi.object({
    costType: Joi.string().valid(
      'acquisition', 'operational', 'maintenance', 'licensing',
      'support', 'training', 'disposal'
    ).required(),
    amount: Joi.number().positive().precision(2).required(),
    currency: Joi.string().length(3).default('USD'),
    billingCycle: Joi.string().valid(
      'one_time', 'monthly', 'quarterly', 'annual', 'custom'
    ).default('one_time'),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().greater(Joi.ref('startDate')),
    vendor: Joi.string().max(255),
    contractNumber: Joi.string().max(255),
    purchaseOrder: Joi.string().max(255),
    invoiceNumber: Joi.string().max(255),
    costCenter: Joi.string().max(255),
    budgetCode: Joi.string().max(255),
    notes: Joi.string(),
    attachments: Joi.array().items(Joi.object({
      filename: Joi.string().required(),
      url: Joi.string().uri().required(),
      size: Joi.number().positive(),
      type: Joi.string()
    })).default([]),
    metadata: Joi.object().default({}),
    assetUuid: Joi.string().uuid().required()
  }),

  update: Joi.object({
    costType: Joi.string().valid(
      'acquisition', 'operational', 'maintenance', 'licensing',
      'support', 'training', 'disposal'
    ),
    amount: Joi.number().positive().precision(2),
    currency: Joi.string().length(3),
    billingCycle: Joi.string().valid(
      'one_time', 'monthly', 'quarterly', 'annual', 'custom'
    ),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
    vendor: Joi.string().max(255),
    contractNumber: Joi.string().max(255),
    purchaseOrder: Joi.string().max(255),
    invoiceNumber: Joi.string().max(255),
    costCenter: Joi.string().max(255),
    budgetCode: Joi.string().max(255),
    notes: Joi.string(),
    attachments: Joi.array().items(Joi.object({
      filename: Joi.string().required(),
      url: Joi.string().uri().required(),
      size: Joi.number().positive(),
      type: Joi.string()
    })),
    metadata: Joi.object()
  }).min(1)
};

// Asset Lifecycle Validation
const assetLifecycleSchema = {
  create: Joi.object({
    purchaseDate: Joi.date().iso(),
    warrantyEndDate: Joi.date().iso().greater(Joi.ref('purchaseDate')),
    manufacturerEolDate: Joi.date().iso(),
    internalEolDate: Joi.date().iso(),
    replacementCycleMonths: Joi.number().integer().positive().max(120),
    estimatedReplacementCost: Joi.number().positive().precision(2),
    replacementBudgetYear: Joi.number().integer().min(2020).max(2050),
    replacementBudgetQuarter: Joi.number().integer().min(1).max(4),
    replacementNotes: Joi.string(),
    assetUuid: Joi.string().uuid().required()
  }),

  update: Joi.object({
    purchaseDate: Joi.date().iso(),
    warrantyEndDate: Joi.date().iso(),
    manufacturerEolDate: Joi.date().iso(),
    internalEolDate: Joi.date().iso(),
    replacementCycleMonths: Joi.number().integer().positive().max(120),
    estimatedReplacementCost: Joi.number().positive().precision(2),
    replacementBudgetYear: Joi.number().integer().min(2020).max(2050),
    replacementBudgetQuarter: Joi.number().integer().min(1).max(4),
    replacementNotes: Joi.string(),
    assetUuid: Joi.string().uuid()
  }).min(1)
};

// Asset Operational Costs Validation
const assetOperationalCostsSchema = {
  create: Joi.object({
    yearMonth: Joi.date().iso().required(),
    powerCost: Joi.number().min(0).precision(2),
    spaceCost: Joi.number().min(0).precision(2),
    networkCost: Joi.number().min(0).precision(2),
    storageCost: Joi.number().min(0).precision(2),
    laborCost: Joi.number().min(0).precision(2),
    otherCosts: Joi.number().min(0).precision(2),
    notes: Joi.string(),
    assetUuid: Joi.string().uuid().required()
  }),

  update: Joi.object({
    yearMonth: Joi.date().iso(),
    powerCost: Joi.number().min(0).precision(2),
    spaceCost: Joi.number().min(0).precision(2),
    networkCost: Joi.number().min(0).precision(2),
    storageCost: Joi.number().min(0).precision(2),
    laborCost: Joi.number().min(0).precision(2),
    otherCosts: Joi.number().min(0).precision(2),
    notes: Joi.string(),
    assetUuid: Joi.string().uuid()
  }).min(1)
};

// Asset Risk Mapping Validation
const assetRiskMappingSchema = {
  create: Joi.object({
    assetUuid: Joi.string().uuid().required(),
    existingAssetId: Joi.number().integer().positive(),
    riskModelId: Joi.number().integer().positive(),
    costCenterId: Joi.number().integer().positive(),
    mappingConfidence: Joi.number().min(0).max(1).precision(2).default(0.85),
    mappingMethod: Joi.string().valid('automatic', 'manual', 'hybrid').default('automatic'),
    mappingCriteria: Joi.object({
      criteria: Joi.array().items(Joi.string()),
      scores: Joi.array().items(Joi.number().min(0).max(1)),
      weights: Joi.array().items(Joi.number().min(0).max(1)),
      threshold: Joi.number().min(0).max(1)
    }),
    verifiedBy: Joi.number().integer().positive(),
    verifiedAt: Joi.date().iso()
  }),

  update: Joi.object({
    assetUuid: Joi.string().uuid(),
    existingAssetId: Joi.number().integer().positive(),
    riskModelId: Joi.number().integer().positive(),
    costCenterId: Joi.number().integer().positive(),
    mappingConfidence: Joi.number().min(0).max(1).precision(2),
    mappingMethod: Joi.string().valid('automatic', 'manual', 'hybrid'),
    mappingCriteria: Joi.object({
      criteria: Joi.array().items(Joi.string()),
      scores: Joi.array().items(Joi.number().min(0).max(1)),
      weights: Joi.array().items(Joi.number().min(0).max(1)),
      threshold: Joi.number().min(0).max(1)
    }),
    verifiedBy: Joi.number().integer().positive(),
    verifiedAt: Joi.date().iso()
  }).min(1)
};

// Query parameter validation
const querySchema = {
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(50),
    sortBy: Joi.string(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }),

  assetCostFilters: Joi.object({
    costType: Joi.string().valid(
      'purchase', 'lease', 'maintenance', 'support', 'license', 
      'subscription', 'upgrade', 'repair', 'insurance', 'other'
    ),
    billingCycle: Joi.string().valid(
      'one_time', 'monthly', 'quarterly', 'semi_annual', 'annual', 'biennial'
    ),
    vendor: Joi.string(),
    costCenter: Joi.string(),
    minAmount: Joi.number().min(0),
    maxAmount: Joi.number().min(0),
    dateFrom: Joi.date().iso(),
    dateTo: Joi.date().iso(),
    assetUuid: Joi.string().uuid()
  }),

  lifecycleFilters: Joi.object({
    warrantyExpiring: Joi.boolean(),
    eolApproaching: Joi.boolean(),
    replacementDue: Joi.boolean(),
    budgetYear: Joi.number().integer().min(2020).max(2050),
    assetUuid: Joi.string().uuid()
  }),

  operationalCostFilters: Joi.object({
    yearMonth: Joi.date().iso(),
    yearFrom: Joi.date().iso(),
    yearTo: Joi.date().iso(),
    assetUuid: Joi.string().uuid(),
    costType: Joi.string().valid('power', 'space', 'network', 'storage', 'labor', 'other')
  }),

  riskMappingFilters: Joi.object({
    mappingMethod: Joi.string().valid('automatic', 'manual', 'hybrid'),
    verified: Joi.boolean(),
    minConfidence: Joi.number().min(0).max(1),
    maxConfidence: Joi.number().min(0).max(1),
    riskModelId: Joi.number().integer().positive(),
    costCenterId: Joi.number().integer().positive(),
    assetUuid: Joi.string().uuid()
  })
};

module.exports = {
  assetCostManagementSchema,
  assetLifecycleSchema,
  assetOperationalCostsSchema,
  assetRiskMappingSchema,
  querySchema
};
