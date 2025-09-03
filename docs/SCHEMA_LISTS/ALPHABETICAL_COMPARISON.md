# Alphabetical Schema Comparison

**Generated:** December 2024  
**Database Tables:** 234  
**Existing Drizzle Schemas:** 23  
**Missing Schemas:** 211  
**Coverage:** ~10%

## 📋 ALL DATABASE TABLES (ALPHABETICAL)

Based on analysis of `docs/DATABASE_GUIDES/Cypher.sql`:

```
  1. ❌ SequelizeMeta
  2. ✅ access_requests -> accessRequests
  3. ❌ ai_assistance_requests
  4. ❌ app_modules
  5. ✅ artifact_categories -> artifactCategories
  6. ✅ artifact_references -> artifactReferences
  7. ✅ artifact_tags -> artifactTags
  8. ✅ artifacts -> artifacts
  9. ❌ asset_cost_management
 10. ❌ asset_group_members
 11. ❌ asset_groups
 12. ❌ asset_lifecycle
 13. ❌ asset_network
 14. ❌ asset_operational_costs
 15. ❌ asset_risk_mapping
 16. ❌ asset_systems
 17. ❌ asset_tags
 18. ❌ asset_vulnerabilities
 19. ✅ assets -> assets
 20. ❌ ato_documents
 21. ❌ ato_workflow_history
 22. ❌ attack_surface_mapping
 23. ❌ audit_logs
 24. ❌ authorizations_to_operate
 25. ❌ backup_jobs
 26. ❌ batches
 27. ❌ budget_impact
 28. ❌ business_impact_analysis
 29. ❌ business_impact_costs
 30. ❌ categories
 31. ❌ cloud_assets
 32. ❌ cloud_cost_mapping
 33. ❌ compliance_controls
 34. ❌ compliance_frameworks
 35. ❌ conflict_resolutions
 36. ❌ control_compliance_status
 37. ❌ control_evidence
 38. ❌ control_findings
 39. ❌ control_inheritance
 40. ❌ control_poams
 41. ✅ controls -> controls
 42. ❌ cost_budgets
 43. ❌ cost_centers
 44. ❌ cpe_mappings
 45. ❌ cross_system_correlations
 46. ❌ custom_field_values
 47. ❌ custom_fields
 48. ❌ cve_mappings
 49. ✅ cves -> cves
 50. ❌ dashboard_metrics
 51. ❌ dashboard_shares
 52. ❌ dashboard_themes
 53. ❌ dashboard_widgets
 54. ❌ dashboards
 55. ❌ data_conflicts
 56. ❌ data_contexts
 57. ❌ data_freshness
 58. ❌ data_quality
 59. ❌ deployments
 60. ❌ diagram_node_library
 61. ❌ diagram_projects
 62. ❌ diagram_shared_projects
 63. ❌ diagram_templates
 64. ❌ diagram_versions
 65. ❌ diagrams
 66. ❌ digital_signatures
 67. ❌ distribution_group_members
 68. ❌ distribution_groups
 69. ❌ document_analytics
 70. ❌ document_changes
 71. ❌ document_comments
 72. ❌ document_favorites
 73. ❌ document_shares
 74. ❌ document_templates
 75. ❌ document_versions
 76. ❌ documents
 77. ✅ email_logs -> emailLogs
 78. ✅ email_templates -> emailTemplates
 79. ❌ enterprise_risk_aggregation
 80. ❌ entity_synonyms
 81. ❌ entity_tags
 82. ❌ errors
 83. ❌ exploits
 84. ❌ export_jobs
 85. ❌ folders
 86. ❌ generated_reports
 87. ❌ import_history
 88. ❌ import_jobs
 89. ❌ information_classification_items
 90. ❌ integrations
 91. ❌ job_executions
 92. ❌ license_costs
 93. ❌ license_types
 94. ❌ licenses
 95. ❌ metrics
 96. ❌ module_analytics
 97. ❌ module_audit_log
 98. ❌ module_dependencies
 99. ❌ module_navigation
100. ❌ module_settings
101. ❌ network_diagrams
102. ❌ nl_queries
103. ❌ nlq_chat_messages
104. ❌ nlq_chat_sessions
105. ❌ nlq_data_sources
106. ❌ nlq_few_shot_examples
107. ❌ nlq_prompt_config
108. ❌ nlq_query_logs
109. ❌ notification_channels
110. ❌ notification_deliveries
111. ❌ notification_subscriptions
112. ❌ notification_templates
113. ❌ notifications
114. ❌ openai_usage
115. ❌ patch_approval_history
116. ❌ patch_approvals
117. ❌ patch_job_dependencies
118. ❌ patch_job_logs
119. ❌ patch_job_targets
120. ❌ patch_jobs
121. ❌ patch_notes
122. ❌ patch_schedule_executions
123. ❌ patch_schedules
124. ❌ patches
125. ❌ patches_orphan
126. ✅ permissions -> permissions
127. ❌ plan_of_action_milestones
128. ❌ poam_approval_comments
129. ❌ poam_assets
130. ❌ poam_cves
131. ❌ poam_milestones
132. ❌ poam_signatures
133. ✅ poams -> poams
134. ❌ policies
135. ❌ policy_procedures
136. ❌ policy_workflow_history
137. ❌ policy_workflow_policies
138. ❌ policy_workflows
139. ❌ procedures
140. ❌ query_templates
141. ❌ references
142. ❌ remediation_cost_entries
143. ❌ report_configurations
144. ❌ report_schedules
145. ❌ report_templates
146. ❌ reports
147. ❌ risk_adjustment_factors
148. ❌ risk_factors
149. ❌ risk_models
150. ❌ risk_score_history
151. ❌ role_module_permissions
152. ❌ role_navigation_permissions
153. ✅ role_permissions -> rolePermissions
154. ✅ roles -> roles
155. ❌ saved_filters
156. ❌ scan_findings
157. ❌ scan_jobs
158. ❌ scan_policies
159. ❌ scan_reports
160. ❌ scan_results
161. ❌ scan_schedules
162. ❌ scan_targets
163. ❌ scan_templates
164. ❌ schedules
165. ❌ security_classification_guide
166. ❌ session
167. ❌ settings
168. ❌ siem_alerts
169. ❌ siem_analytics
170. ❌ siem_dashboards
171. ❌ siem_events
172. ❌ siem_incidents
173. ❌ siem_log_sources
174. ❌ siem_rules
175. ❌ siem_threat_intelligence
176. ❌ software_assets
177. ❌ software_lifecycle
178. ❌ ssh_connection_profiles
179. ❌ ssp_controls
180. ❌ ssp_poam_mappings
181. ❌ stig_ai_assistance
182. ❌ stig_asset_assignments
183. ❌ stig_assessments
184. ❌ stig_assets
185. ❌ stig_checklists
186. ❌ stig_collections
187. ❌ stig_downloads
188. ❌ stig_fix_status
189. ❌ stig_library
190. ❌ stig_mappings
191. ❌ stig_reviews
192. ❌ stig_rules
193. ❌ stig_scan_results
194. ❌ system_assets
195. ❌ system_compliance_mapping
196. ❌ system_configuration_drift
197. ❌ system_discovery_results
198. ❌ system_discovery_scans
199. ❌ system_impact_levels
200. ❌ system_security_posture
201. ❌ system_threat_modeling
202. ✅ systems -> systems
203. ❌ tags
204. ❌ tasks
205. ❌ user_dashboards
206. ❌ user_module_preferences
207. ✅ user_preferences -> userPreferences
208. ✅ user_roles -> userRoles
209. ✅ users -> users
210. ❌ vendor_map
211. ❌ vulnerability_cost_analysis
212. ❌ vulnerability_cost_factors
213. ❌ vulnerability_cost_history
214. ❌ vulnerability_cost_models
215. ❌ vulnerability_cves
216. ❌ vulnerability_databases
217. ❌ vulnerability_patches
218. ❌ vulnerability_poams
219. ❌ vulnerability_references
220. ❌ vulnerability_risk_scores
221. ✅ vulnerabilities -> vulnerabilities
222. ❌ webhook_configurations
223. ❌ webhook_deliveries
224. ❌ webhook_logs
225. ❌ webhook_rate_limits
226. ❌ webhook_security
227. ❌ webhook_subscriptions
228. ❌ widget_templates
229. ❌ workflow_edges
230. ❌ workflow_executions
231. ❌ workflow_instances
232. ❌ workflow_nodes
233. ❌ workflow_triggers
234. ❌ workflows
```

## ✅ EXISTING DRIZZLE SCHEMAS (23 total)

```
  1. ✅ access_requests -> accessRequests
  2. ✅ artifact_categories -> artifactCategories
  3. ✅ artifact_references -> artifactReferences
  4. ✅ artifact_tags -> artifactTags
  5. ✅ artifacts -> artifacts
  6. ✅ asset_cost_management -> assetCostManagement
  7. ✅ asset_groups -> assetGroups
  8. ✅ asset_lifecycle -> assetLifecycle
  9. ✅ asset_vulnerabilities -> assetVulnerabilities
 10. ✅ assets -> assets
 11. ✅ controls -> controls
 12. ✅ cves -> cves
 13. ✅ email_logs -> emailLogs
 14. ✅ email_templates -> emailTemplates
 15. ✅ permissions -> permissions
 16. ✅ poams -> poams
 17. ✅ role_permissions -> rolePermissions
 18. ✅ roles -> roles
 19. ✅ systems -> systems
 20. ✅ user_preferences -> userPreferences
 21. ✅ user_roles -> userRoles
 22. ✅ users -> users
 23. ✅ vulnerabilities -> vulnerabilities
```

## ❌ MISSING DRIZZLE SCHEMAS (211 total)

**High Priority (Security & Core Features):**
```
  1. ai_assistance_requests
  2. scan_jobs
  3. scan_results
  4. scan_schedules
  5. scan_targets
  6. scan_policies
  7. siem_events
  8. siem_alerts
  9. siem_log_sources
 10. notifications
```

**Complete Missing List (Alphabetical):**
```
  1. SequelizeMeta
  2. ai_assistance_requests
  3. app_modules
  4. asset_group_members
  5. asset_lifecycle
  6. asset_network
  7. asset_operational_costs
  8. asset_risk_mapping
  9. asset_systems
 10. asset_tags
 11. ato_documents
 12. ato_workflow_history
 13. attack_surface_mapping
 14. audit_logs
 15. authorizations_to_operate
 16. backup_jobs
 17. batches
 18. budget_impact
 19. business_impact_analysis
 20. business_impact_costs
 21. categories
 22. cloud_assets
 23. cloud_cost_mapping
 24. compliance_controls
 25. compliance_frameworks
 26. conflict_resolutions
 27. control_compliance_status
 28. control_evidence
 29. control_findings
 30. control_inheritance
 31. control_poams
 32. cost_budgets
 33. cost_centers
 34. cpe_mappings
 35. cross_system_correlations
 36. custom_field_values
 37. custom_fields
 38. cve_mappings
 39. dashboard_metrics
 40. dashboard_shares
 41. dashboard_themes
 42. dashboard_widgets
 43. dashboards
 44. data_conflicts
 45. data_contexts
 46. data_freshness
 47. data_quality
 48. deployments
 49. diagram_node_library
 50. diagram_projects
 51. diagram_shared_projects
 52. diagram_templates
 53. diagram_versions
 54. diagrams
 55. digital_signatures
 56. distribution_group_members
 57. distribution_groups
 58. document_analytics
 59. document_changes
 60. document_comments
 61. document_favorites
 62. document_shares
 63. document_templates
 64. document_versions
 65. documents
 66. enterprise_risk_aggregation
 67. entity_synonyms
 68. entity_tags
 69. errors
 70. exploits
 71. export_jobs
 72. folders
 73. generated_reports
 74. import_history
 75. import_jobs
 76. information_classification_items
 77. integrations
 78. job_executions
 79. license_costs
 80. license_types
 81. licenses
 82. metrics
 83. module_analytics
 84. module_audit_log
 85. module_dependencies
 86. module_navigation
 87. module_settings
 88. network_diagrams
 89. nl_queries
 90. nlq_chat_messages
 91. nlq_chat_sessions
 92. nlq_data_sources
 93. nlq_few_shot_examples
 94. nlq_prompt_config
 95. nlq_query_logs
 96. notification_channels
 97. notification_deliveries
 98. notification_subscriptions
 99. notification_templates
100. notifications
101. openai_usage
102. patch_approval_history
103. patch_approvals
104. patch_job_dependencies
105. patch_job_logs
106. patch_job_targets
107. patch_jobs
108. patch_notes
109. patch_schedule_executions
110. patch_schedules
111. patches
112. patches_orphan
113. plan_of_action_milestones
114. poam_approval_comments
115. poam_assets
116. poam_cves
117. poam_milestones
118. poam_signatures
119. policies
120. policy_procedures
121. policy_workflow_history
122. policy_workflow_policies
123. policy_workflows
124. procedures
125. query_templates
126. references
127. remediation_cost_entries
128. report_configurations
129. report_schedules
130. report_templates
131. reports
132. risk_adjustment_factors
133. risk_factors
134. risk_models
135. risk_score_history
136. role_module_permissions
137. role_navigation_permissions
138. saved_filters
139. scan_findings
140. scan_jobs
141. scan_policies
142. scan_reports
143. scan_results
144. scan_schedules
145. scan_targets
146. scan_templates
147. schedules
148. security_classification_guide
149. session
150. settings
151. siem_alerts
152. siem_analytics
153. siem_dashboards
154. siem_events
155. siem_incidents
156. siem_log_sources
157. siem_rules
158. siem_threat_intelligence
159. software_assets
160. software_lifecycle
161. ssh_connection_profiles
162. ssp_controls
163. ssp_poam_mappings
164. stig_ai_assistance
165. stig_asset_assignments
166. stig_assessments
167. stig_assets
168. stig_checklists
169. stig_collections
170. stig_downloads
171. stig_fix_status
172. stig_library
173. stig_mappings
174. stig_reviews
175. stig_rules
176. stig_scan_results
177. system_assets
178. system_compliance_mapping
179. system_configuration_drift
180. system_discovery_results
181. system_discovery_scans
182. system_impact_levels
183. system_security_posture
184. system_threat_modeling
185. tags
186. tasks
187. user_dashboards
188. user_module_preferences
189. vendor_map
190. vulnerability_cost_analysis
191. vulnerability_cost_factors
192. vulnerability_cost_history
193. vulnerability_cost_models
194. vulnerability_cves
195. vulnerability_databases
196. vulnerability_patches
197. vulnerability_poams
198. vulnerability_references
199. vulnerability_risk_scores
200. webhook_configurations
201. webhook_deliveries
202. webhook_logs
203. webhook_rate_limits
204. webhook_security
205. webhook_subscriptions
206. widget_templates
207. workflow_edges
208. workflow_executions
209. workflow_instances
210. workflow_nodes
211. workflow_triggers
212. workflows
```

## 🎯 QUICK REFERENCE

**Run these commands to check your schema coverage:**

```bash
# Quick check
cd api
node scripts/quick-schema-check.js

# Detailed analysis
node scripts/check-drizzle-schema-coverage.js

# Massive schema analysis
node scripts/analyze-massive-schema.js

# Alphabetical comparison
node scripts/alphabetical-schema-comparison.js
```

**Priority Implementation Order:**
1. **Security & Scanning** (scan_*, vulnerability_*)
2. **SIEM & Monitoring** (siem_*)
3. **AI & Automation** (ai_*, nlq_*, notifications)
4. **Patch Management** (patch_*)
5. **STIG & Compliance** (stig_*)
6. **Document Management** (document_*, documents)

---

**Last Updated:** December 2024  
**Status:** 211 of 234 tables need Drizzle schemas  
**Coverage:** ~10% complete
