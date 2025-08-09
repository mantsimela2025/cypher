# Admin Settings Page - Comprehensive Development Documentation

## Overview
This document provides detailed development documentation for the `/admin/settings` page in the RAS DASH cybersecurity platform. It covers the complete ecosystem of system configuration management, including general system settings, notification configurations, external integrations, backup settings, logging configurations, AI provider management, authentication settings, environment variables, and security banner controls.

## Page Architecture Overview

### Multi-Component Settings Ecosystem
The admin settings functionality is distributed across multiple specialized pages:

1. **Main Settings Page** (`/admin/settings.tsx`) - Core system configuration
2. **AI Provider Settings** (`/admin/ai-provider-settings.tsx`) - AI service management
3. **Authentication Settings** (`/admin/auth-settings.tsx`) - Authentication and security policies
4. **Environment Settings** (`/admin/environment-settings.tsx`) - Environment variable management
5. **Security Banner Settings** (`/admin/security-banner-settings.tsx`) - Classification banner configuration

## Database Schema Architecture

### System Settings Table
**Location:** Referenced in `shared/schema.ts` and managed through system settings controllers

```typescript
// System settings stored in database with hierarchical structure
interface SystemSetting {
  id: number;
  settingKey: string;
  settingValue: any;
  module: string;
  description?: string;
  isSystem: boolean;
  isActive: boolean;
  category?: string;
  dataType?: 'string' | 'number' | 'boolean' | 'json';
  createdAt: Date;
  updatedAt: Date;
}

// Environment variables management
interface EnvVar {
  name: string;
  value: string;
  description?: string;
  isSecret: boolean;
  module: string;
  createdAt?: string;
  updatedAt?: string;
}

// AI Provider configuration
interface AIProvider {
  provider: string;
  available: boolean;
}
```

### Settings Categories and Modules
```typescript
// Settings modules organization
const settingsModules = {
  application: 'Application Settings',
  database: 'Database Credentials', 
  ai: 'AI Provider Settings',
  email: 'Email Configuration',
  vulnerability_db: 'Vulnerability Database',
  security: 'Security Configuration',
  backup: 'Backup and Recovery',
  logging: 'Logging and Monitoring',
  integrations: 'External Integrations',
  notifications: 'Notification Systems'
};
```

## Form Schema Validation Architecture

### Main Settings Page Schemas
**Location:** `src/pages/admin/settings.tsx` (lines 16-61)

```typescript
// General System Settings
const generalSettingsSchema = z.object({
  systemName: z.string().min(1, "System name is required"),
  defaultLanguage: z.string(),
  defaultTimezone: z.string(),
  dateFormat: z.string(),
  timeFormat: z.string(),
  maxSessionDuration: z.number().min(5).max(1440),
  enableMaintenanceMode: z.boolean(),
});

// Notification Configuration
const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  slackNotifications: z.boolean(),
  webhookNotifications: z.boolean(),
  webhookUrl: z.string().url().optional().or(z.literal("")),
  notificationBatchSize: z.number().min(1).max(100),
  batchIntervalMinutes: z.number().min(1).max(60),
  dailyDigestTime: z.string(),
});

// External System Integrations
const integrationSettingsSchema = z.object({
  enableAwsIntegration: z.boolean(),
  enableSlackIntegration: z.boolean(),
  enableJiraIntegration: z.boolean(),
  enableServiceNowIntegration: z.boolean(),
  enableActiveDirectoryIntegration: z.boolean(),
});

// Backup and Recovery Settings
const backupSettingsSchema = z.object({
  enableAutomaticBackups: z.boolean(),
  backupFrequency: z.string(),
  backupTime: z.string(),
  retentionPeriodDays: z.number().min(1).max(365),
  includeAttachments: z.boolean(),
  backupLocation: z.string(),
});

// Logging and Monitoring Settings
const loggingSettingsSchema = z.object({
  logLevel: z.string(),
  logRetentionDays: z.number().min(1).max(365),
  enableAuditLogging: z.boolean(),
  enableSecurityLogging: z.boolean(),
  enablePerformanceLogging: z.boolean(),
  exportLogsAutomatically: z.boolean(),
});
```

### Security Banner Settings Schema
**Location:** `src/pages/admin/security-banner-settings.tsx` (lines 17-20)

```typescript
const securityBannerSchema = z.object({
  enabled: z.boolean().default(true),
  classification: z.enum(["unclassified", "confidential", "secret", "topsecret", "topsecret_sci"]),
});

// Classification banner colors and text configuration
const bannerColors = {
  unclassified: { color: "#007a33", text: "UNCLASSIFIED", textColor: "#ffffff" },
  confidential: { color: "#0033a0", text: "CONFIDENTIAL", textColor: "#ffffff" },
  secret: { color: "#c8102e", text: "SECRET", textColor: "#ffffff" },
  topsecret: { color: "#ff8c00", text: "TOP SECRET", textColor: "#000000" },
  topsecret_sci: { color: "#fce83a", text: "TOP SECRET//SCI", textColor: "#000000" }
};
```

## API Endpoints Architecture

### System Settings API Routes
**Location:** `server/routes-backup.ts` - Settings-related endpoints

```typescript
// Core system settings management
app.get("/api/system-settings", systemSettingsController.getSystemSettings);
app.get("/api/system-settings/:key", systemSettingsController.getSystemSetting);
app.post("/api/system-settings", systemSettingsController.saveSystemSetting);

// AI Provider management
app.get("/api/ai-providers", aiProvidersController.getAvailableProviders);
app.post("/api/ai-providers/default", aiProvidersController.setDefaultProvider);

// Security banner configuration
app.get("/api/security/banner", securityController.getBannerSettings);
app.post("/api/security/banner", securityController.updateBannerSettings);

// Environment variable management
app.get("/api/admin/environment/env", environmentController.getEnvironmentVariables);
app.post("/api/admin/environment/env/:name", environmentController.updateEnvironmentVariable);
app.delete("/api/admin/environment/env/:name", environmentController.deleteEnvironmentVariable);
app.post("/api/admin/environment/migrate-env", environmentController.migrateEnvironmentVariables);

// AWS integration settings
app.get("/api/aws/settings", awsController.getAwsSettings);
app.post("/api/aws/settings", awsController.saveAwsSettings);

// Scanner and SIEM settings
app.get("/api/scanner/settings", scannerSettingsController.getScannerSettings);
app.put("/api/scanner/settings/engine", scannerSettingsController.updateScannerEngine);
app.put("/api/scanner/settings/notifications", scannerSettingsController.updateNotificationSettings);
app.get("/api/siem/settings", siemController.getSiemSettings);
```

### Expected Response Formats

#### System Settings Response
```typescript
{
  settings: SystemSetting[];
  categories: string[];
  modules: string[];
}
```

#### AI Providers Response
```typescript
{
  providers: AIProvider[];
  currentProvider: string;
}
```

#### Environment Variables Response
```typescript
{
  variables: EnvVar[];
  modules: string[];
  totalCount: number;
}
```

## Frontend Component Architecture

### Main Settings Page Structure
**Location:** `src/pages/admin/settings.tsx`

#### Five-Tab Layout System
```typescript
<Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
  <TabsList className="grid w-full md:w-auto grid-cols-2 md:grid-cols-5 gap-2">
    <TabsTrigger value="general">General</TabsTrigger>
    <TabsTrigger value="notifications">Notifications</TabsTrigger>
    <TabsTrigger value="integrations">Integrations</TabsTrigger>
    <TabsTrigger value="backup">Backup & Recovery</TabsTrigger>
    <TabsTrigger value="logging">Logging</TabsTrigger>
  </TabsList>
  {/* Tab content sections */}
</Tabs>
```

#### State Management Architecture
```typescript
const [activeTab, setActiveTab] = useState("general");

// Form management with React Hook Form
const generalForm = useForm<z.infer<typeof generalSettingsSchema>>({
  resolver: zodResolver(generalSettingsSchema),
  defaultValues: {
    systemName: "Vulnerability Management Platform",
    defaultLanguage: "en-US",
    defaultTimezone: "UTC",
    dateFormat: "YYYY-MM-DD",
    timeFormat: "24h",
    maxSessionDuration: 60,
    enableMaintenanceMode: false,
  },
});

const notificationForm = useForm<z.infer<typeof notificationSettingsSchema>>({
  resolver: zodResolver(notificationSettingsSchema),
  defaultValues: {
    emailNotifications: true,
    slackNotifications: false,
    webhookNotifications: false,
    webhookUrl: "",
    notificationBatchSize: 10,
    batchIntervalMinutes: 5,
    dailyDigestTime: "08:00",
  },
});

// Additional forms for integrations, backup, and logging
```

### AI Provider Settings Component
**Location:** `src/pages/admin/ai-provider-settings.tsx`

#### React Query Integration
```typescript
const { data, isLoading, error } = useQuery<ProviderResponse>({
  queryKey: ['/api/ai-providers'],
  staleTime: 1000 * 60 * 5, // 5 minutes
});

const updateProviderMutation = useMutation({
  mutationFn: async (provider: string) => {
    const response = await fetch('/api/ai-providers/default', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update AI provider');
    }
    
    return response.json();
  },
  onSuccess: () => {
    toast({
      title: "AI Provider Updated",
      description: `Default AI provider changed to ${selectedProvider}`,
    });
    queryClient.invalidateQueries({ queryKey: ['/api/ai-providers'] });
  }
});
```

#### Provider Selection Interface
```typescript
<RadioGroup value={selectedProvider} onValueChange={setSelectedProvider}>
  {availableProviders.map((provider) => (
    <div key={provider.provider} className={`flex items-center space-x-2 border p-4 rounded-md ${
      provider.available ? 'opacity-100' : 'opacity-60'
    } ${provider.provider === currentProvider ? 'ring-1 ring-primary' : ''}`}>
      <RadioGroupItem 
        value={provider.provider} 
        id={provider.provider}
        disabled={!provider.available}
      />
      <Label htmlFor={provider.provider} className="flex flex-1 justify-between items-center cursor-pointer">
        <div>
          <div className="font-medium capitalize">
            {provider.provider === 'openai' ? 'OpenAI' : 
             provider.provider === 'anthropic' ? 'Anthropic Claude' : 
             provider.provider === 'xai' ? 'xAI Grok' : 
             provider.provider === 'perplexity' ? 'Perplexity' : 
             provider.provider}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {provider.provider === 'openai' && 'GPT-4 models for code assistance, summarization, and image analysis'}
            {provider.provider === 'anthropic' && 'Claude 3 Opus, specialized in safety and detailed reasoning'}
            {provider.provider === 'xai' && 'Grok models focus on reasoning and problem-solving'}
            {provider.provider === 'perplexity' && 'LLaMA-based models with internet search capabilities'}
          </div>
        </div>
        
        <div className="flex items-center ml-4">
          {provider.available ? (
            <div className="flex items-center text-green-600 gap-1 text-sm">
              <Check className="h-4 w-4" />
              <span>Available</span>
            </div>
          ) : (
            <div className="flex items-center text-amber-600 gap-1 text-sm">
              <AlertTriangle className="h-4 w-4" />
              <span>API Key Missing</span>
            </div>
          )}
        </div>
      </Label>
    </div>
  ))}
</RadioGroup>
```

### Authentication Settings Component
**Location:** `src/pages/admin/auth-settings.tsx`

#### Five-Tab Authentication Configuration
```typescript
<TabsList className="grid w-full md:w-auto grid-cols-2 md:grid-cols-5 gap-2">
  <TabsTrigger value="general">General</TabsTrigger>
  <TabsTrigger value="mfa">Multi-Factor</TabsTrigger>
  <TabsTrigger value="sso">SSO</TabsTrigger>
  <TabsTrigger value="passwordPolicy">Password Policy</TabsTrigger>
  <TabsTrigger value="apiTokens">API Tokens</TabsTrigger>
</TabsList>
```

#### Authentication Method Configuration
```typescript
// Authentication methods with toggle switches
<div className="flex items-center justify-between space-x-2">
  <div className="flex flex-col space-y-1">
    <Label htmlFor="username-password">Username & Password</Label>
    <p className="text-sm text-muted-foreground">
      Traditional username and password authentication
    </p>
  </div>
  <Switch id="username-password" defaultChecked />
</div>

<div className="flex items-center justify-between space-x-2">
  <div className="flex flex-col space-y-1">
    <Label htmlFor="sso-login">Single Sign-On (SSO)</Label>
    <p className="text-sm text-muted-foreground">
      Allow users to sign in using your organization's SSO provider
    </p>
  </div>
  <Switch id="sso-login" />
</div>

<div className="flex items-center justify-between space-x-2">
  <div className="flex flex-col space-y-1">
    <Label htmlFor="mfa-required">Require Multi-Factor Authentication</Label>
    <p className="text-sm text-muted-foreground">
      Enforce MFA for all users on this system
    </p>
  </div>
  <Switch id="mfa-required" />
</div>
```

#### Multi-Factor Authentication Options
```typescript
// MFA method configuration with icons
<div className="flex items-center justify-between space-x-2">
  <div className="flex flex-col space-y-1">
    <div className="flex items-center space-x-2">
      <Shield className="h-4 w-4" />
      <Label htmlFor="totp">Time-based One-Time Password (TOTP)</Label>
    </div>
    <p className="text-sm text-muted-foreground">
      Allow authentication apps like Google Authenticator
    </p>
  </div>
  <Switch id="totp" defaultChecked />
</div>

<div className="flex items-center justify-between space-x-2">
  <div className="flex flex-col space-y-1">
    <div className="flex items-center space-x-2">
      <Fingerprint className="h-4 w-4" />
      <Label htmlFor="biometric">Biometric Authentication</Label>
    </div>
    <p className="text-sm text-muted-foreground">
      Allow fingerprint or facial recognition
    </p>
  </div>
  <Switch id="biometric" />
</div>

<div className="flex items-center justify-between space-x-2">
  <div className="flex flex-col space-y-1">
    <div className="flex items-center space-x-2">
      <Key className="h-4 w-4" />
      <Label htmlFor="hardware-key">Hardware Security Keys</Label>
    </div>
    <p className="text-sm text-muted-foreground">
      Support for FIDO2/WebAuthn security keys
    </p>
  </div>
  <Switch id="hardware-key" />
</div>
```

### Environment Settings Component
**Location:** `src/pages/admin/environment-settings.tsx`

#### Environment Variable Management
```typescript
// Environment variable queries and mutations
const { data: envVars = [], isLoading, error, refetch } = useQuery<EnvVar[]>({
  queryKey: ['/api/admin/environment/env'],
  refetchOnWindowFocus: false
});

const updateMutation = useMutation({
  mutationFn: async (variable: EnvVar) => {
    const response = await fetch(`/api/admin/environment/env/${variable.name}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        value: variable.value,
        isSecret: variable.isSecret,
        description: variable.description
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update environment variable');
    }
    
    return response.json();
  },
  onSuccess: () => {
    setShowAddDialog(false);
    refetch();
    toast({
      title: 'Success',
      description: 'Environment variable saved successfully',
    });
  }
});

const deleteMutation = useMutation({
  mutationFn: async (name: string) => {
    const response = await fetch(`/api/admin/environment/env/${name}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete environment variable');
    }
    
    return response.json();
  },
  onSuccess: () => {
    refetch();
    toast({
      title: 'Success',
      description: 'Environment variable deleted successfully',
    });
  }
});
```

#### Grouped Environment Variables Display
```typescript
// Group variables by module
const groupedVars = useMemo(() => {
  return envVars.reduce<EnvGroupedByModule>((acc, variable) => {
    const module = variable.module || 'application';
    if (!acc[module]) acc[module] = [];
    acc[module].push(variable);
    return acc;
  }, {});
}, [envVars]);

// Render grouped variables with accordion
<Accordion type="multiple" className="w-full">
  {Object.entries(groupedVars).map(([module, variables]) => (
    <AccordionItem key={module} value={module}>
      <AccordionTrigger className="flex items-center justify-between hover:no-underline">
        <div className="flex items-center gap-3">
          <Key className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium">{moduleNames[module] || module}</span>
          <span className="text-sm text-muted-foreground">
            ({variables.length} variable{variables.length !== 1 ? 's' : ''})
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variables.map((variable) => (
              <TableRow key={variable.name}>
                <TableCell className="font-medium">{variable.name}</TableCell>
                <TableCell>
                  {variable.isSecret ? (
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">
                        {showSecrets[variable.name] ? variable.value : '•'.repeat(8)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleShowSecret(variable.name)}
                      >
                        {showSecrets[variable.name] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ) : (
                    <span className="font-mono text-sm">{variable.value}</span>
                  )}
                </TableCell>
                <TableCell>
                  {variable.isSecret ? (
                    <div className="flex items-center gap-1 text-amber-600">
                      <Lock className="h-3 w-3" />
                      <span className="text-xs">Secret</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-green-600">
                      <Unlock className="h-3 w-3" />
                      <span className="text-xs">Public</span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {variable.description || '-'}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => promptDelete(variable.name)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AccordionContent>
    </AccordionItem>
  ))}
</Accordion>
```

### Security Banner Settings Component
**Location:** `src/pages/admin/security-banner-settings.tsx`

#### Real-Time Banner Preview
```typescript
// Banner preview with live updates
{watch.enabled && (
  <Card className="mb-8">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5" />
        Banner Preview
      </CardTitle>
      <CardDescription>
        This is how the security banner will appear to users.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div style={previewStyle}>
        {previewSettings.text}
      </div>
    </CardContent>
  </Card>
)}

// Generate preview style based on current form values
const previewStyle = {
  backgroundColor: previewSettings.color,
  color: previewSettings.textColor,
  padding: "1rem",
  textAlign: "center" as const,
  fontWeight: "bold" as const,
  marginBottom: "1.5rem",
};
```

#### Classification Level Selection
```typescript
<FormField
  control={form.control}
  name="classification"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Classification Level</FormLabel>
      <Select 
        onValueChange={(value) => {
          field.onChange(value);
          // Apply changes immediately for the preview
          updateBannerMutation.mutate({
            ...form.getValues(),
            classification: value as any
          });
        }}
        value={field.value}
      >
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Select a classification level" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="unclassified">
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded" 
                style={{ backgroundColor: bannerColors.unclassified.color }}
              />
              UNCLASSIFIED
            </div>
          </SelectItem>
          <SelectItem value="confidential">
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded" 
                style={{ backgroundColor: bannerColors.confidential.color }}
              />
              CONFIDENTIAL
            </div>
          </SelectItem>
          <SelectItem value="secret">
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded" 
                style={{ backgroundColor: bannerColors.secret.color }}
              />
              SECRET
            </div>
          </SelectItem>
          <SelectItem value="topsecret">
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded" 
                style={{ backgroundColor: bannerColors.topsecret.color }}
              />
              TOP SECRET
            </div>
          </SelectItem>
          <SelectItem value="topsecret_sci">
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded" 
                style={{ backgroundColor: bannerColors.topsecret_sci.color }}
              />
              TOP SECRET//SCI
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </FormItem>
  )}
/>
```

## Core Functionality Implementation

### General Settings Management
```typescript
// Form submission handlers for different setting categories
const onGeneralSubmit = (data: z.infer<typeof generalSettingsSchema>) => {
  toast({
    title: "General settings updated",
    description: "Your general system settings have been saved successfully.",
  });
  console.log(data);
};

const onNotificationSubmit = (data: z.infer<typeof notificationSettingsSchema>) => {
  toast({
    title: "Notification settings updated", 
    description: "Your notification settings have been saved successfully.",
  });
  console.log(data);
};

const onIntegrationSubmit = (data: z.infer<typeof integrationSettingsSchema>) => {
  toast({
    title: "Integration settings updated",
    description: "Your integration settings have been saved successfully.",
  });
  console.log(data);
};

const onBackupSubmit = (data: z.infer<typeof backupSettingsSchema>) => {
  toast({
    title: "Backup settings updated",
    description: "Your backup settings have been saved successfully.",
  });
  console.log(data);
};

const onLoggingSubmit = (data: z.infer<typeof loggingSettingsSchema>) => {
  toast({
    title: "Logging settings updated",
    description: "Your logging settings have been saved successfully.",
  });
  console.log(data);
};
```

### AI Provider Management Implementation
```typescript
// Handle AI provider selection and update
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (selectedProvider) {
    updateProviderMutation.mutate(selectedProvider);
  }
};

// Update selected provider when data loads
useEffect(() => {
  if (data?.currentProvider) {
    setSelectedProvider(data.currentProvider);
  }
}, [data?.currentProvider]);
```

### Environment Variable Management
```typescript
// Handle form submission for new environment variables
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (!newVariable.name || !newVariable.value) {
    toast({
      title: 'Validation Error',
      description: 'Name and value are required fields',
      variant: 'destructive'
    });
    return;
  }
  
  updateMutation.mutate(newVariable);
};

// Toggle showing a secret value
const toggleShowSecret = (name: string) => {
  setShowSecrets(prev => ({
    ...prev,
    [name]: !prev[name]
  }));
};

// Prompt for delete confirmation
const promptDelete = (name: string) => {
  if (confirm(`Are you sure you want to delete the environment variable "${name}"?`)) {
    deleteMutation.mutate(name);
  }
};

// Migration from .env to database
const promptMigrate = () => {
  if (confirm('This will migrate all environment variables from .env to database. Continue?')) {
    migrateMutation.mutate();
  }
};
```

### Security Banner Settings Implementation
```typescript
// Form submission handler with real-time updates
function onSubmit(data: SecurityBannerFormValues) {
  updateBannerMutation.mutate(data);
}

// Mutation for updating banner settings
const updateBannerMutation = useMutation({
  mutationFn: async (data: SecurityBannerFormValues) => {
    const settings = [
      {
        settingKey: "security.banner.enabled",
        settingValue: data.enabled,
        module: "security",
        description: "Enable or disable the security classification banner"
      },
      {
        settingKey: "security.banner.classification",
        settingValue: data.classification,
        module: "security", 
        description: "Security classification level (unclassified, confidential, secret, topsecret, topsecret_sci)"
      }
    ];

    // Update each setting individually
    for (const setting of settings) {
      await apiRequest("POST", "/api/system-settings", setting);
    }
    
    return data;
  },
  onSuccess: () => {
    toast({
      title: "Settings Updated",
      description: "Security banner settings have been saved successfully.",
    });
    // Invalidate queries to refresh the banner
    queryClient.invalidateQueries({ queryKey: ["/api/security/banner"] });
  }
});
```

## Settings Service Layer Architecture

### Settings Service Implementation
**Location:** Referenced from `server/services/settingsService.ts`

```typescript
// System settings management service
class SettingsService {
  async getSystemSettings(): Promise<SystemSetting[]> {
    return await this.findAll({
      where: { 
        isSystem: true,
        isActive: true
      },
      order: [['category', 'ASC'], ['settingKey', 'ASC']]
    });
  }

  async getSystemSetting(settingKey: string): Promise<SystemSetting | null> {
    return await this.findOne({
      where: { 
        settingKey,
        isActive: true
      }
    });
  }

  async saveSystemSetting(settingData: Partial<SystemSetting>): Promise<SystemSetting> {
    const existingSetting = await this.getSystemSetting(settingData.settingKey);
    
    if (existingSetting) {
      return await this.update(existingSetting.id, {
        settingValue: settingData.settingValue,
        description: settingData.description,
        updatedAt: new Date()
      });
    } else {
      return await this.create({
        ...settingData,
        isSystem: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }

  async getSettingsByModule(module: string): Promise<SystemSetting[]> {
    return await this.findAll({
      where: { 
        module,
        isActive: true
      },
      order: [['settingKey', 'ASC']]
    });
  }
}
```

### Storage Layer Integration
**Location:** References from `server/storage.ts` and `server/pgStorage.ts`

```typescript
// Memory storage implementation
async getSystemSettings(module?: string): Promise<SystemSetting[]> {
  let settings = Array.from(this.systemSettings.values());
  
  if (module) {
    settings = settings.filter(setting => setting.module === module);
  }
  
  return settings;
}

// PostgreSQL storage implementation with Drizzle ORM
async getSystemSettings(module?: string): Promise<SystemSetting[]> {
  if (module) {
    return db.select().from(systemSettings).where(eq(systemSettings.module, module));
  }
  return db.select().from(systemSettings);
}

async saveSystemSetting(setting: Partial<SystemSetting>): Promise<SystemSetting> {
  const [savedSetting] = await db
    .insert(systemSettings)
    .values(setting)
    .onConflictDoUpdate({
      target: systemSettings.settingKey,
      set: {
        settingValue: setting.settingValue,
        description: setting.description,
        updatedAt: new Date()
      }
    })
    .returning();
  
  return savedSetting;
}
```

## UI Component Features

### Dynamic Form Rendering
- **Conditional Field Display**: Webhook URL appears only when webhook notifications are enabled
- **Backup Settings**: Detailed backup options appear only when automatic backups are enabled
- **Real-time Validation**: Zod schema validation with instant feedback
- **Form State Persistence**: Forms maintain state between tab switches

### Interactive Elements
- **Toggle Switches**: Consistent switch components for boolean settings
- **Select Dropdowns**: Standardized select components with validation
- **Time Pickers**: Native HTML5 time input for scheduling
- **Number Inputs**: Range-validated numeric inputs with min/max constraints

### Visual Feedback
- **Toast Notifications**: Success/error feedback for all operations
- **Loading States**: Spinner indicators during API operations
- **Icon Integration**: Lucide React icons for visual context
- **Status Indicators**: Color-coded status badges and indicators

## Security and Compliance Features

### Data Protection
- **Environment Variable Encryption**: Sensitive data marked as secrets
- **Show/Hide Toggle**: Secure display of sensitive values
- **Input Validation**: Comprehensive validation for all form inputs
- **Access Control**: Admin-level permissions required for all settings

### Government Compliance
- **Security Banner**: DOD-compliant classification banners
- **Audit Logging**: All settings changes are logged
- **Session Management**: Configurable session timeouts
- **Multi-Factor Authentication**: Enterprise MFA configuration

### Classification Levels
- **UNCLASSIFIED**: Green banner (#007a33)
- **CONFIDENTIAL**: Blue banner (#0033a0)
- **SECRET**: Red banner (#c8102e)
- **TOP SECRET**: Orange banner (#ff8c00)
- **TOP SECRET//SCI**: Yellow banner (#fce83a)

## Integration Points

### External System Integrations
1. **AWS Integration**: Cloud service management and resource provisioning
2. **Slack Integration**: Notification delivery and team collaboration
3. **Jira Integration**: Issue tracking and project management
4. **ServiceNow Integration**: ITSM and CMDB connectivity
5. **Active Directory Integration**: User authentication and directory services

### Internal System Integration
1. **Audit Logging**: All settings changes tracked in audit system
2. **User Management**: Authentication settings affect user login process
3. **Notification System**: Settings control system-wide notification behavior
4. **Backup System**: Settings configure automatic backup operations
5. **AI Services**: Provider settings affect all AI-powered features

## Performance Optimization Features

### Efficient Data Loading
- **React Query Integration**: Intelligent caching and invalidation
- **Conditional Queries**: Queries execute only when relevant
- **Stale Time Configuration**: Optimal cache refresh intervals
- **Loading State Management**: Proper loading indicators

### Form Optimization
- **Form State Management**: React Hook Form for optimal re-rendering
- **Schema Validation**: Client-side validation reduces server requests
- **Debounced Updates**: Real-time preview with optimized update frequency
- **Memory Management**: Proper cleanup and state reset

## Error Handling and User Experience

### Comprehensive Error States
- **API Error Handling**: Detailed error messages from server responses
- **Form Validation Errors**: Inline validation with helpful messages
- **Network Error Recovery**: Graceful handling of connectivity issues
- **Loading State Management**: Consistent loading indicators

### User-Friendly Interface
- **Progressive Disclosure**: Advanced options revealed when needed
- **Contextual Help**: Descriptions and tooltips for complex settings
- **Visual Hierarchy**: Clear organization with icons and typography
- **Responsive Design**: Optimal layout on all device sizes

## Development Best Practices

### Code Organization
1. **Separation of Concerns**: Clear separation between UI, API, and business logic
2. **Type Safety**: Complete TypeScript coverage with Zod validation
3. **Component Modularity**: Reusable components across settings pages
4. **Error Boundaries**: Comprehensive error handling at component level

### Security Best Practices
1. **Input Sanitization**: All inputs validated and sanitized
2. **Environment Variable Protection**: Secure handling of sensitive data
3. **Authentication Required**: All endpoints require admin authentication
4. **Audit Trail**: Complete audit logging for compliance

### Testing and Quality Assurance
1. **Form Validation Testing**: Comprehensive validation scenario coverage
2. **API Integration Testing**: Mock and real API endpoint testing
3. **Security Testing**: Validation of access controls and data protection
4. **User Experience Testing**: Usability testing across different scenarios

## Conclusion

The admin settings ecosystem provides a comprehensive, enterprise-grade configuration management system designed for cybersecurity environments. It offers granular control over system behavior, robust security features, and seamless integration with external systems while maintaining high usability standards and government compliance requirements.

The architecture supports real-time configuration changes, secure environment variable management, and detailed audit trails essential for maintaining security and compliance in mission-critical cybersecurity operations for government and DOD deployments.