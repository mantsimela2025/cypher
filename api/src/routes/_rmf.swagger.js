/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     RmfProject:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         system_id: { type: integer, nullable: true }
 *         title: { type: string }
 *         description: { type: string, nullable: true }
 *         environment: { type: string, enum: ["on-premises","cloud","hybrid"], nullable: true }
 *         sponsor_org: { type: string, nullable: true }
 *         ao_user_id: { type: integer, nullable: true }
 *         isso_user_id: { type: integer, nullable: true }
 *         issm_user_id: { type: integer, nullable: true }
 *         start_date: { type: string, format: date, nullable: true }
 *         target_authorization_date: { type: string, format: date, nullable: true }
 *         current_step: { type: string, enum: ["categorize","select","implement","assess","authorize","monitor"] }
 *         status: { type: string, enum: ["draft","active","on_hold","completed","retired"] }
 *         created_by: { type: integer, nullable: true }
 *         created_at: { type: string, format: date-time }
 *         updated_at: { type: string, format: date-time }
 *     RmfProjectCreate:
 *       type: object
 *       required: [title]
 *       properties:
 *         title: { type: string, example: "Payments System RMF" }
 *         system_id: { type: integer, example: 42 }
 *         description: { type: string, example: "Onboarding per NIST RMF" }
 *         environment: { type: string, example: "cloud" }
 *         sponsor_org: { type: string, example: "CIO Office" }
 *         ao_user_id: { type: integer, example: 5 }
 *         isso_user_id: { type: integer, example: 12 }
 *         issm_user_id: { type: integer, example: 18 }
 *         start_date: { type: string, format: date, example: "2025-01-15" }
 *         target_authorization_date: { type: string, format: date, example: "2025-06-30" }
 *     RmfProjectUpdate:
 *       type: object
 *       properties:
 *         title: { type: string }
 *         status: { type: string, enum: ["draft","active","on_hold","completed","retired"] }
 *         current_step: { type: string, enum: ["categorize","select","implement","assess","authorize","monitor"] }
 *         environment: { type: string, enum: ["on-premises","cloud","hybrid"] }
 *     RmfStep:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         rmf_project_id: { type: integer }
 *         step: { type: string, enum: ["categorize","select","implement","assess","authorize","monitor"] }
 *         status: { type: string, enum: ["not_started","in_progress","completed","blocked"] }
 *         started_at: { type: string, format: date-time, nullable: true }
 *         completed_at: { type: string, format: date-time, nullable: true }
 *         blocked_reason: { type: string, nullable: true }
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     RmfQuestionnaire:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         code: { type: string }
 *         title: { type: string }
 *         version: { type: string }
 *         schema_json: { type: object }
 *         is_active: { type: boolean }
 *     RmfQuestionnaireCreate:
 *       type: object
 *       required: [code, title, schema_json]
 *       properties:
 *         code: { type: string, example: "HVA" }
 *         title: { type: string, example: "High Value Asset Questionnaire" }
 *         version: { type: string, example: "1.0" }
 *         schema_json:
 *           type: object
 *           example:
 *             type: object
 *             required: [is_hva]
 *             properties:
 *               is_hva: { type: boolean, title: "Is the system an HVA?" }
 *     RmfQuestionnaireUpdate:
 *       type: object
 *       properties:
 *         code: { type: string }
 *         title: { type: string }
 *         version: { type: string }
 *         schema_json: { type: object }
 *         is_active: { type: boolean }
 *
 *     RmfTask:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         rmf_step_id: { type: integer }
 *         key: { type: string }
 *         title: { type: string }
 *         description: { type: string, nullable: true }
 *         status: { type: string, enum: ["not_started","in_progress","completed","needs_review"] }
 *         assigned_to: { type: integer, nullable: true }
 *         due_date: { type: string, format: date, nullable: true }
 *         order_index: { type: integer, nullable: true }
 *     RmfTaskCreate:
 *       type: object
 *       required: [key, title]
 *       properties:
 *         key: { type: string, example: "project_identification" }
 *         title: { type: string, example: "Project Identification" }
 *         description: { type: string, example: "Provide identifiers and summary" }
 *         assigned_to: { type: integer, example: 23 }
 *         due_date: { type: string, format: date, example: "2025-02-01" }
 *         order_index: { type: integer, example: 1 }
 *     RmfTaskUpdate:
 *       type: object
 *       properties:
 *         title: { type: string }
 *         description: { type: string }
 *         status: { type: string, enum: ["not_started","in_progress","completed","needs_review"] }
 *         assigned_to: { type: integer }
 *         due_date: { type: string, format: date }
 *         order_index: { type: integer }
 */
