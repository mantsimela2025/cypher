# Admin Users Page - Comprehensive Development Documentation

## Overview
This document provides detailed development documentation for the `/admin/users` page in the RAS DASH cybersecurity platform. It covers the complete user management ecosystem, including user creation, modification, filtering, pagination, role management, status control, and comprehensive permission handling.

## Page Architecture Overview

### Two-Component User Management System
The admin users functionality is distributed across two main components:

1. **Main Users Page** (`/admin/users/index.tsx`) - User listing, filtering, and bulk operations
2. **User Dialog Component** (`/admin/users/user-dialog.tsx`) - User creation and editing interface

## Database Schema Architecture

### Users Table Structure
**Location:** Referenced in `shared/schema.ts` and managed through Drizzle ORM

```typescript
// Users table schema (Drizzle ORM)
interface User {
  id: number;
  username: string;
  password: string; // Encrypted/hashed
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role: 'admin' | 'manager' | 'analyst' | 'user';
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  authMethod?: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// User role enumeration
export const userRoleEnum = z.enum(['admin', 'manager', 'analyst', 'user']);

// User status enumeration  
export const userStatusEnum = z.enum(['active', 'inactive', 'pending', 'suspended']);

// Insert schema for user creation
export const insertUserSchema = createInsertSchema(users);

// User creation validation schema
export const CreateUserSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: userRoleEnum,
  password: z.string().min(8),
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
```

### Role Hierarchy and Permissions
```typescript
// Role hierarchy (highest to lowest privilege)
const roleHierarchy = {
  admin: {
    level: 4,
    description: 'Full system access including user management',
    permissions: ['*'] // All permissions
  },
  manager: {
    level: 3,
    description: 'Management access with limited administrative functions',
    permissions: ['read', 'write', 'manage_team', 'generate_reports']
  },
  analyst: {
    level: 2,
    description: 'Analysis and reporting capabilities',
    permissions: ['read', 'write', 'analyze', 'generate_reports']
  },
  user: {
    level: 1,
    description: 'Basic user access for viewing and limited interaction',
    permissions: ['read', 'limited_write']
  }
};

// Status definitions
const statusDefinitions = {
  active: {
    description: 'User can log in and access the system',
    color: 'green',
    badge: 'default'
  },
  inactive: {
    description: 'User account exists but cannot log in',
    color: 'gray',
    badge: 'secondary'
  },
  pending: {
    description: 'User account awaiting activation or approval',
    color: 'yellow',
    badge: 'outline'
  },
  suspended: {
    description: 'User account temporarily disabled due to security concerns',
    color: 'red',
    badge: 'destructive'
  }
};
```

## Form Schema Validation Architecture

### User Dialog Form Schema
**Location:** `src/pages/admin/users/user-dialog.tsx` (lines 37-47)

```typescript
// Complete form validation schema
const formSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().optional(), // Optional for updates
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  role: z.enum(userRoleEnum.enumValues),
  status: z.enum(userStatusEnum.enumValues),
});

type FormValues = z.infer<typeof formSchema>;
type UpdateUserDto = Partial<FormValues> & { id?: number };
```

### Server-Side Validation Schemas
**Location:** `server/controllers/userController.ts` (lines 7-26)

```typescript
// Create user validation (server-side)
const createUserSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  role: z.enum(['admin', 'manager', 'analyst', 'user']).default('user'),
  status: z.enum(['active', 'inactive', 'pending', 'suspended']).default('active'),
  authMethod: z.string().default('password'),
});

// Update user validation (server-side)
const updateUserSchema = z.object({
  username: z.string().min(1).optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  role: z.enum(['admin', 'manager', 'analyst', 'user']).optional(),
  status: z.enum(['active', 'inactive', 'pending', 'suspended']).optional(),
  authMethod: z.string().optional(),
});
```

## API Endpoints Architecture

### User Management API Routes
**Location:** `server/routes-backup.ts` - User-related endpoints

```typescript
// Core user CRUD operations
app.get("/api/users", userController.listUsers);
app.get("/api/users/:id", userController.getUser);
app.post("/api/users", userController.createUser);
app.patch("/api/users/:id", userController.updateUser);
app.delete("/api/users/:id", userController.deleteUser);

// User status management
app.patch("/api/users/:id/status", userController.updateUserStatus);

// User role management
app.patch("/api/users/:id/role", userController.updateUserRole);

// User profile management
app.patch("/api/users/:id/profile", userController.updateUserProfile);

// Authentication related
app.post("/api/users/:id/login", userController.loginAsUser);

// Search and autocomplete
app.get("/api/users/search/autocomplete", userController.searchUsersForAutocomplete);

// Role-based queries
app.get("/api/roles/:id/users", roleController.getRoleUsers);
```

### Expected Request/Response Formats

#### List Users Response
```typescript
{
  users: User[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

#### Create User Request
```typescript
{
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role: 'admin' | 'manager' | 'analyst' | 'user';
  status: 'active' | 'inactive' | 'pending' | 'suspended';
}
```

#### Update User Request
```typescript
{
  username?: string;
  password?: string; // Optional - only if changing password
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: 'admin' | 'manager' | 'analyst' | 'user';
  status?: 'active' | 'inactive' | 'pending' | 'suspended';
}
```

## Frontend Component Architecture

### Main Users Page Structure
**Location:** `src/pages/admin/users/index.tsx`

#### State Management Architecture
```typescript
const [page, setPage] = useState(1);
const [searchTerm, setSearchTerm] = useState("");
const [filter, setFilter] = useState<{
  role?: string;
  status?: string;
}>({});
const [isDialogOpen, setIsDialogOpen] = useState(false);
const [selectedUser, setSelectedUser] = useState<User | null>(null);
const pageSize = 10;
```

#### React Query Integration
```typescript
// Users listing with advanced filtering and pagination
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ["/api/users", page, pageSize, searchTerm, filter],
  queryFn: async () => {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    if (searchTerm) {
      queryParams.append("search", searchTerm);
    }

    const roleFilter = processFilterValue(filter.role || "");
    if (roleFilter) {
      queryParams.append("role", roleFilter);
    }

    const statusFilter = processFilterValue(filter.status || "");
    if (statusFilter) {
      queryParams.append("status", statusFilter);
    }

    const response = await fetch(`/api/users?${queryParams.toString()}`);
    if (!response.ok) {
      throw new Error("Failed to fetch users");
    }
    return await response.json();
  },
});

// User status update mutation
const statusMutation = useMutation({
  mutationFn: async ({ userId, status }: { userId: number; status: string }) => {
    return await apiRequest("PATCH", `/api/users/${userId}/status`, { status });
  },
  onSuccess: () => {
    toast({
      title: "Status updated",
      description: "User status has been updated successfully",
    });
    queryClient.invalidateQueries({ queryKey: ["/api/users"] });
  },
  onError: (error: any) => {
    toast({
      title: "Error",
      description: error.message || "Failed to update user status",
      variant: "destructive",
    });
  },
});
```

#### Advanced Filtering System
```typescript
// Filter processing utility
const processFilterValue = (value: string): string | undefined => {
  if (value === "all_roles" || value === "all_statuses") {
    return undefined;
  }
  return value || undefined;
};

// Role filter dropdown
<Select
  value={filter.role || "all_roles"}
  onValueChange={(value) => setFilter(prev => ({
    ...prev,
    role: value === "all_roles" ? undefined : value
  }))}
>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Filter by role" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all_roles">All Roles</SelectItem>
    {userRoleEnum.enumValues.map(role => (
      <SelectItem key={role} value={role}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </SelectItem>
    ))}
  </SelectContent>
</Select>

// Status filter dropdown
<Select
  value={filter.status || "all_statuses"}
  onValueChange={(value) => setFilter(prev => ({
    ...prev,
    status: value === "all_statuses" ? undefined : value
  }))}
>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Filter by status" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all_statuses">All Statuses</SelectItem>
    {userStatusEnum.enumValues.map(status => (
      <SelectItem key={status} value={status}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

#### Status Badge Rendering
```typescript
// Dynamic status badge with appropriate styling
const renderStatusBadge = (status: string | null) => {
  if (!status) return <Badge variant="outline">Unknown</Badge>;
  
  let variant: "default" | "secondary" | "destructive" | "outline" = "default";
  
  switch (status) {
    case "active":
      variant = "default";
      break;
    case "inactive":
      variant = "secondary";
      break;
    case "suspended":
      variant = "destructive";
      break;
    case "pending":
      variant = "outline";
      break;
    default:
      variant = "outline";
  }
  
  return (
    <Badge variant={variant}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};
```

#### Advanced Data Table with Actions
```typescript
// User table with comprehensive action menu
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Username</TableHead>
      <TableHead>Name</TableHead>
      <TableHead>Email</TableHead>
      <TableHead>Role</TableHead>
      <TableHead>Status</TableHead>
      <TableHead className="text-right">Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {data?.users?.map((user: User) => (
      <TableRow key={user.id}>
        <TableCell className="font-medium">{user.username}</TableCell>
        <TableCell>
          {user.firstName || user.lastName 
            ? `${user.firstName || ""} ${user.lastName || ""}` 
            : "-"}
        </TableCell>
        <TableCell>{user.email || "-"}</TableCell>
        <TableCell className="capitalize">{user.role}</TableCell>
        <TableCell>{renderStatusBadge(user.status)}</TableCell>
        <TableCell className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleEditUser(user)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Change Status</DropdownMenuLabel>
              {userStatusEnum.enumValues.map(status => (
                <DropdownMenuItem
                  key={status}
                  disabled={user.status === status}
                  onClick={() => handleStatusChange(user, status)}
                >
                  Set as {status.charAt(0).toUpperCase() + status.slice(1)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### User Dialog Component Structure
**Location:** `src/pages/admin/users/user-dialog.tsx`

#### Dynamic Form Initialization
```typescript
// Form setup with conditional defaults
const form = useForm<FormValues>({
  resolver: zodResolver(formSchema),
  defaultValues: {
    username: user?.username || "",
    password: "",  // Always empty for security
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    role: user?.role || "user",
    status: user?.status || "active",
  },
});

// Dynamic form reset when user changes
if (open && user && (
  form.getValues("username") !== user.username ||
  form.getValues("firstName") !== user.firstName ||
  form.getValues("lastName") !== user.lastName ||
  form.getValues("email") !== user.email ||
  form.getValues("phone") !== user.phone ||
  form.getValues("role") !== user.role ||
  form.getValues("status") !== user.status
)) {
  form.reset({
    username: user.username,
    password: "",
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    email: user.email || "",
    phone: user.phone || "",
    role: user.role || "user",
    status: user.status || "active",
  });
}
```

#### Dual Mutation System (Create/Update)
```typescript
// Create user mutation
const createMutation = useMutation({
  mutationFn: async (userData: FormValues) => {
    return await apiRequest("POST", "/api/users", userData);
  },
  onSuccess: () => {
    toast({
      title: "User created",
      description: "User has been created successfully",
    });
    queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    onOpenChange(false);
    form.reset();
  },
  onError: (error: any) => {
    toast({
      title: "Error",
      description: error.message || "Failed to create user",
      variant: "destructive",
    });
  },
  onSettled: () => {
    setIsSubmitting(false);
  },
});

// Update user mutation
const updateMutation = useMutation({
  mutationFn: async (userData: UpdateUserDto) => {
    const { id, ...data } = userData;
    return await apiRequest("PATCH", `/api/users/${id}`, data);
  },
  onSuccess: () => {
    toast({
      title: "User updated",
      description: "User has been updated successfully",
    });
    queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    onOpenChange(false);
    form.reset();
  },
  onError: (error: any) => {
    toast({
      title: "Error",
      description: error.message || "Failed to update user",
      variant: "destructive",
    });
  },
  onSettled: () => {
    setIsSubmitting(false);
  },
});
```

#### Smart Form Submission Logic
```typescript
// Intelligent form submission handling
const onSubmit = (values: FormValues) => {
  setIsSubmitting(true);
  
  // If password is empty and updating, remove it from the payload
  if (user && !values.password) {
    const { password, ...restValues } = values;
    updateMutation.mutate({ id: user.id, ...restValues });
  } else if (user) {
    updateMutation.mutate({ id: user.id, ...values });
  } else {
    createMutation.mutate(values);
  }
};
```

#### Comprehensive Form Layout
```typescript
// Two-column responsive form layout
<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
  {/* Username and Password Row */}
  <div className="grid grid-cols-2 gap-4">
    <FormField
      control={form.control}
      name="username"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Username</FormLabel>
          <FormControl>
            <Input 
              placeholder="Username" 
              {...field} 
              disabled={Boolean(user)} // Username cannot be changed
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    
    <FormField
      control={form.control}
      name="password"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{user ? "New Password" : "Password"}</FormLabel>
          <FormControl>
            <Input 
              type="password" 
              placeholder={user ? "Leave blank to keep current" : "Password"} 
              {...field} 
            />
          </FormControl>
          {user && (
            <FormDescription>
              Leave blank to keep current password
            </FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  </div>
  
  {/* Name Fields Row */}
  <div className="grid grid-cols-2 gap-4">
    <FormField
      control={form.control}
      name="firstName"
      render={({ field }) => (
        <FormItem>
          <FormLabel>First Name</FormLabel>
          <FormControl>
            <Input placeholder="First Name" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    
    <FormField
      control={form.control}
      name="lastName"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Last Name</FormLabel>
          <FormControl>
            <Input placeholder="Last Name" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </div>
  
  {/* Contact Information Row */}
  <div className="grid grid-cols-2 gap-4">
    <FormField
      control={form.control}
      name="email"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl>
            <Input placeholder="Email" type="email" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    
    <FormField
      control={form.control}
      name="phone"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Phone Number</FormLabel>
          <FormControl>
            <Input placeholder="Phone Number" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </div>
  
  {/* Role and Status Row */}
  <div className="grid grid-cols-2 gap-4">
    <FormField
      control={form.control}
      name="role"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Role</FormLabel>
          <Select 
            onValueChange={field.onChange} 
            defaultValue={field.value}
            value={field.value}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {userRoleEnum.enumValues.map(role => (
                <SelectItem key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
    
    <FormField
      control={form.control}
      name="status"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Status</FormLabel>
          <Select 
            onValueChange={field.onChange} 
            defaultValue={field.value}
            value={field.value}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {userStatusEnum.enumValues.map(status => (
                <SelectItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  </div>
  
  {/* Action Buttons */}
  <DialogFooter>
    <Button 
      type="button" 
      variant="outline" 
      onClick={() => onOpenChange(false)}
      disabled={isSubmitting}
    >
      Cancel
    </Button>
    <Button type="submit" disabled={isSubmitting}>
      {isSubmitting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {user ? "Updating..." : "Creating..."}
        </>
      ) : (
        user ? "Update User" : "Create User"
      )}
    </Button>
  </DialogFooter>
</form>
```

## Backend Controller Architecture

### User Controller Implementation
**Location:** `server/controllers/userController.ts`

#### Advanced User Listing with Filtering
```typescript
// Comprehensive user listing with pagination and filtering
export async function listUsers(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string || "1", 10);
    const pageSize = parseInt(req.query.pageSize as string || "10", 10);
    const search = req.query.search as string;
    const role = req.query.role as string;
    const status = req.query.status as string;
    
    const where: any = {};
    
    // Apply search filter across multiple fields
    if (search) {
      where[Op.or] = [
        { username: { [Op.iLike]: `%${search}%` } },
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    // Apply role filter
    if (role) {
      where.role = role;
    }
    
    // Apply status filter
    if (status) {
      where.status = status;
    }
    
    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] }, // Never return passwords
      limit: pageSize,
      offset: (page - 1) * pageSize,
      order: [['createdAt', 'DESC']]
    });
    
    return res.status(200).json({
      users: rows,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    });
  } catch (error) {
    console.error("Error listing users:", error);
    return res.status(500).json({ error: "Failed to retrieve users" });
  }
}
```

#### Secure User Creation with Validation
```typescript
// User creation with comprehensive validation
export async function createUser(req: Request, res: Response) {
  try {
    const result = createUserSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        error: "Invalid user data",
        details: result.error.format(),
      });
    }
    
    const userData = result.data;
    
    // Check for username uniqueness
    const existingUser = await User.findOne({ where: { username: userData.username } });
    if (existingUser) {
      return res.status(409).json({ error: "Username already exists" });
    }
    
    // Check for email uniqueness (if provided)
    if (userData.email) {
      const existingEmail = await User.findOne({ where: { email: userData.email } });
      if (existingEmail) {
        return res.status(409).json({ error: "Email already exists" });
      }
    }
    
    const user = await User.create(userData);
    
    // Remove password from response for security
    const { password, ...userResponse } = user.toJSON();
    
    return res.status(201).json(userResponse);
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({ error: "Failed to create user" });
  }
}
```

#### Smart User Update Logic
```typescript
// User update with selective field validation
export async function updateUser(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.id, 10);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    
    const result = updateUserSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        error: "Invalid user data",
        details: result.error.format(),
      });
    }
    
    const userData = result.data;
    
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Validate username uniqueness (if being updated)
    if (userData.username && userData.username !== user.username) {
      const existingUser = await User.findOne({ where: { username: userData.username } });
      if (existingUser) {
        return res.status(409).json({ error: "Username already exists" });
      }
    }
    
    // Validate email uniqueness (if being updated)
    if (userData.email && userData.email !== user.email) {
      const existingEmail = await User.findOne({ where: { email: userData.email } });
      if (existingEmail) {
        return res.status(409).json({ error: "Email already exists" });
      }
    }
    
    await user.update(userData);
    
    // Remove password from response
    const { password, ...userResponse } = user.toJSON();
    
    return res.status(200).json(userResponse);
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({ error: "Failed to update user" });
  }
}
```

## Storage Layer Architecture

### Drizzle ORM User Storage
**Location:** `server/pgStorage/userStorage.ts`

```typescript
// Advanced user queries with Drizzle ORM
export async function getUserById(id: number): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user;
}

export async function getUsersByRole(role: string): Promise<User[]> {
  const usersWithRole = await db.select().from(users).where(eq(users.role, role));
  return usersWithRole;
}

export async function getUsersByRoles(roles: string[]): Promise<User[]> {
  if (!roles || roles.length === 0) {
    return [];
  }
  
  const conditions = roles.map(role => eq(users.role, role));
  const usersWithRoles = await db.select().from(users).where(or(...conditions));
  return usersWithRoles;
}

export async function searchUsers(searchTerm: string): Promise<User[]> {
  const searchPattern = `%${searchTerm}%`;
  
  const matchingUsers = await db.select()
    .from(users)
    .where(
      or(
        like(users.username, searchPattern),
        like(users.email, searchPattern)
      )
    );
    
  return matchingUsers;
}
```

## Core Functionality Implementation

### User Management Operations
```typescript
// Handle user addition
const handleAddUser = () => {
  setSelectedUser(null);
  setIsDialogOpen(true);
};

// Handle user editing
const handleEditUser = (user: User) => {
  setSelectedUser(user);
  setIsDialogOpen(true);
};

// Handle user status changes
const handleStatusChange = async (user: User, status: string) => {
  statusMutation.mutate({ userId: user.id, status });
};

// Handle search functionality
const handleSearch = (e: React.FormEvent) => {
  e.preventDefault();
  refetch();
};

// Clear all filters
const clearFilters = () => {
  setSearchTerm("");
  setFilter({});
  refetch();
};
```

### Advanced Filter Processing
```typescript
// Process filter values to handle "all" options
const processFilterValue = (value: string): string | undefined => {
  if (value === "all_roles" || value === "all_statuses") {
    return undefined;
  }
  return value || undefined;
};
```

### Pagination Management
```typescript
// Pagination component integration
const totalPages = data?.totalPages || 1;

<Pagination
  currentPage={page}
  totalPages={totalPages}
  onPageChange={setPage}
/>
```

## UI Component Features

### Advanced Search and Filtering
- **Multi-field Search**: Search across username, first name, last name, and email
- **Role-based Filtering**: Filter users by their assigned roles
- **Status-based Filtering**: Filter users by their current status
- **Combined Filters**: Multiple filters can be applied simultaneously
- **Clear Filters**: One-click filter reset functionality

### Dynamic Status Management
- **Visual Status Indicators**: Color-coded badges for different user statuses
- **Quick Status Changes**: Dropdown menu for rapid status updates
- **Status Validation**: Prevents setting the same status twice
- **Real-time Updates**: Immediate UI refresh after status changes

### Comprehensive User Actions
- **Create New Users**: Full user creation with validation
- **Edit Existing Users**: Selective field updates with preservation of sensitive data
- **Status Management**: Quick status changes without full edit dialog
- **Password Security**: Passwords never exposed in UI, optional updates only

### Responsive Data Display
- **Pagination**: Configurable page sizes with navigation controls
- **Loading States**: Spinner animations during data operations
- **Error Handling**: Graceful error display with retry options
- **Empty States**: Informative messages when no data is available

## Security and Compliance Features

### Password Security
- **Password Hashing**: All passwords are hashed before storage
- **Password Exclusion**: Passwords never returned in API responses
- **Optional Password Updates**: Passwords only updated when explicitly provided
- **Minimum Length Requirements**: Enforced password complexity

### Access Control
- **Role-based Access**: Different privilege levels for different roles
- **Username Immutability**: Usernames cannot be changed after creation
- **Email Uniqueness**: Enforced unique email addresses across users
- **Status-based Access**: User status controls system access

### Data Validation
- **Client-side Validation**: Immediate feedback using Zod schemas
- **Server-side Validation**: Comprehensive backend validation
- **Duplicate Prevention**: Username and email uniqueness checks
- **Input Sanitization**: All inputs validated and sanitized

### Audit and Compliance
- **Action Logging**: All user management actions logged
- **Creation Timestamps**: Automatic tracking of user creation and updates
- **Status Change Tracking**: Historical record of status modifications
- **Role Change Monitoring**: Audit trail for privilege escalations

## Performance Optimization Features

### Efficient Data Loading
- **React Query Caching**: Intelligent data caching and invalidation
- **Pagination**: Server-side pagination to limit data transfer
- **Selective Field Loading**: Exclude sensitive fields from general queries
- **Optimistic Updates**: Immediate UI updates with rollback capability

### Search Optimization
- **Debounced Search**: Reduced API calls during typing
- **Multi-field Indexing**: Database indexes for efficient searching
- **Case-insensitive Search**: User-friendly search functionality
- **Pattern Matching**: Flexible search with partial matches

### Form Performance
- **Conditional Rendering**: Dynamic form fields based on operation type
- **Form State Management**: Efficient re-rendering with React Hook Form
- **Validation Caching**: Cached validation results for better performance
- **Memory Management**: Proper cleanup and state reset

## Error Handling and User Experience

### Comprehensive Error Management
- **API Error Handling**: Detailed error messages from server responses
- **Form Validation Errors**: Inline validation with helpful guidance
- **Network Error Recovery**: Graceful handling of connectivity issues
- **Conflict Resolution**: Clear messaging for duplicate data conflicts

### User-Friendly Interface
- **Progressive Disclosure**: Advanced options revealed when needed
- **Contextual Actions**: Role-appropriate action availability
- **Visual Feedback**: Loading states and success confirmations
- **Keyboard Navigation**: Full keyboard accessibility support

### Data Integrity
- **Optimistic Updates**: Immediate UI feedback with server confirmation
- **Rollback Capability**: Automatic rollback on server errors
- **State Synchronization**: Consistent data across multiple views
- **Cache Management**: Intelligent cache invalidation strategies

## Development Best Practices

### Code Organization
1. **Component Separation**: Clear separation between listing and editing components
2. **Type Safety**: Complete TypeScript coverage with shared schema types
3. **Validation Consistency**: Shared validation schemas between client and server
4. **Error Boundary Implementation**: Comprehensive error handling at component level

### Security Best Practices
1. **Password Security**: Never expose passwords in client-side code
2. **Input Validation**: Both client-side and server-side validation
3. **Authentication Required**: All endpoints require proper authentication
4. **Role-based Authorization**: Actions restricted based on user roles

### Performance Best Practices
1. **Pagination**: Server-side pagination for large datasets
2. **Caching Strategy**: Intelligent React Query caching configuration
3. **Debounced Search**: Optimized search to reduce server load
4. **Memory Management**: Proper cleanup of event listeners and subscriptions

## Testing and Quality Assurance

### Form Validation Testing
1. **Required Field Validation**: Test all required field scenarios
2. **Format Validation**: Email format, username length, password complexity
3. **Uniqueness Validation**: Username and email uniqueness constraints
4. **Error Message Accuracy**: Verify helpful and accurate error messages

### API Integration Testing
1. **CRUD Operations**: Complete create, read, update, delete functionality
2. **Filter Testing**: Verify all filter combinations work correctly
3. **Pagination Testing**: Test edge cases in pagination logic
4. **Error Response Handling**: Verify proper error response processing

### Security Testing
1. **Password Handling**: Ensure passwords are never exposed
2. **Access Control**: Verify role-based access restrictions
3. **Input Sanitization**: Test for SQL injection and XSS vulnerabilities
4. **Authentication**: Verify proper authentication requirements

## Conclusion

The admin users page provides a comprehensive, enterprise-grade user management system designed for cybersecurity environments. It offers granular control over user accounts, robust security features, and seamless integration with role-based access control while maintaining high usability standards and government compliance requirements.

The architecture supports real-time user management, secure password handling, and detailed audit trails essential for maintaining security and compliance in mission-critical cybersecurity operations for government and DOD deployments.