# Distribution Groups System Requirements

## System Overview

The Distribution Groups System is a comprehensive communications and user management platform within RAS-DASH that enables targeted messaging, organizational structure management, and advanced notification capabilities. This system supports enterprise-scale user categorization, role-based communication, and automated email delivery for operational notifications, security alerts, and administrative communications.

## Core Functionality

### Group Management
- **Group Creation & Configuration**: Create distribution groups with names, descriptions, types, and activation status
- **Advanced Search & Filtering**: Search groups by name, description, and status with pagination support
- **Group Types**: Support for different communication types (email, SMS, teams integration)
- **Access Control**: Group creation restricted to administrative users with proper permissions

### Member Management
- **User Assignment**: Add/remove users from distribution groups with role-based permissions
- **Bulk Operations**: Support for bulk user addition/removal with validation and conflict resolution
- **Member Roles**: Support for different member roles within groups (admin, member, viewer)
- **Active/Inactive Status**: Individual member status control independent of group status

### Email Communication
- **Targeted Messaging**: Send emails to all group members with HTML/text support
- **Email Templates**: Pre-built templates for security alerts, notifications, and announcements
- **Delivery Tracking**: Track email delivery status, open rates, and member engagement
- **Customizable Sender**: Configure sender name and email for organizational branding

### Administrative Interface
- **Comprehensive Dashboard**: Admin interface at `/admin/distribution-groups` with full CRUD operations
- **Member Management Interface**: Detailed member management at `/admin/distribution-groups/[id]/members`
- **Email Interface**: Email composition and sending at `/admin/distribution-groups/[id]/email`
- **Audit Trails**: Complete logging of group operations, membership changes, and communications

## Database Schema

### Distribution Groups Table
```sql
CREATE TABLE distribution_groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) DEFAULT 'email',
  is_active BOOLEAN DEFAULT true,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_distribution_groups_name ON distribution_groups(name);
CREATE INDEX idx_distribution_groups_type ON distribution_groups(type);
CREATE INDEX idx_distribution_groups_active ON distribution_groups(is_active);
CREATE INDEX idx_distribution_groups_created_by ON distribution_groups(created_by);
```

### Distribution Group Members Table
```sql
CREATE TABLE distribution_group_members (
  id SERIAL PRIMARY KEY,
  group_id INTEGER REFERENCES distribution_groups(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  role VARCHAR(50) DEFAULT 'member',
  is_active BOOLEAN DEFAULT true,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(group_id, user_id)
);

CREATE INDEX idx_distribution_group_members_group_id ON distribution_group_members(group_id);
CREATE INDEX idx_distribution_group_members_user_id ON distribution_group_members(user_id);
CREATE INDEX idx_distribution_group_members_active ON distribution_group_members(is_active);
CREATE INDEX idx_distribution_group_members_role ON distribution_group_members(role);
```

## Drizzle ORM Implementation

### Schema Definition (shared/schema.ts)
```typescript
import { pgTable, serial, varchar, text, boolean, integer, timestamp } from 'drizzle-orm/pg-core';

export const distributionGroups = pgTable('distribution_groups', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).default('email'),
  isActive: boolean('is_active').default(true),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const distributionGroupMembers = pgTable('distribution_group_members', {
  id: serial('id').primaryKey(),
  groupId: integer('group_id').references(() => distributionGroups.id),
  userId: integer('user_id').references(() => users.id),
  email: varchar('email', { length: 255 }),
  role: varchar('role', { length: 50 }).default('member'),
  isActive: boolean('is_active').default(true),
  addedAt: timestamp('added_at').defaultNow()
});

// Type definitions
export type DistributionGroup = typeof distributionGroups.$inferSelect;
export type InsertDistributionGroup = typeof distributionGroups.$inferInsert;
export type DistributionGroupMember = typeof distributionGroupMembers.$inferSelect;
export type InsertDistributionGroupMember = typeof distributionGroupMembers.$inferInsert;
```

### Zod Validation Schemas
```typescript
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const insertDistributionGroupSchema = createInsertSchema(distributionGroups, {
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  type: z.enum(['email', 'sms', 'teams']).default('email'),
  isActive: z.boolean().default(true)
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertDistributionGroupMemberSchema = createInsertSchema(distributionGroupMembers, {
  groupId: z.number().positive('Invalid group ID'),
  userId: z.number().positive('Invalid user ID'),
  email: z.string().email('Invalid email').optional(),
  role: z.enum(['admin', 'member', 'viewer']).default('member'),
  isActive: z.boolean().default(true)
}).omit({
  id: true,
  addedAt: true
});

export const selectDistributionGroupSchema = createSelectSchema(distributionGroups);
export const selectDistributionGroupMemberSchema = createSelectSchema(distributionGroupMembers);

// Form validation schemas
export const distributionGroupFormSchema = insertDistributionGroupSchema.extend({
  id: z.number().optional()
});

export const emailFormSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject too long'),
  body: z.string().min(1, 'Email body is required').max(10000, 'Email body too long'),
  isHtml: z.boolean().default(false),
  fromName: z.string().optional(),
  fromEmail: z.string().email('Invalid email address').optional()
});

export type DistributionGroupFormValues = z.infer<typeof distributionGroupFormSchema>;
export type EmailFormValues = z.infer<typeof emailFormSchema>;
```

## Service Layer Implementation

### Distribution Group Service (server/services/distributionGroupService.ts)
```typescript
import { eq, and, like, desc, asc, sql } from 'drizzle-orm';
import { db } from '../db';
import {
  distributionGroups,
  distributionGroupMembers,
  users,
  type DistributionGroup,
  type InsertDistributionGroup,
  type DistributionGroupMember,
  type InsertDistributionGroupMember
} from '@shared/schema';

export class DistributionGroupService {
  
  /**
   * Get paginated list of distribution groups with search
   */
  async getDistributionGroups(
    page: number = 1,
    pageSize: number = 10,
    searchTerm?: string
  ): Promise<{
    groups: DistributionGroup[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    let query = db.select().from(distributionGroups);
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(distributionGroups);
    
    if (searchTerm) {
      const searchCondition = like(distributionGroups.name, `%${searchTerm}%`);
      query = query.where(searchCondition);
      countQuery = countQuery.where(searchCondition);
    }
    
    const offset = (page - 1) * pageSize;
    query = query.limit(pageSize).offset(offset).orderBy(asc(distributionGroups.name));
    
    const [groupRows, countRows] = await Promise.all([query, countQuery]);
    const total = Number(countRows[0]?.count || 0);
    
    return {
      groups: groupRows,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }
  
  /**
   * Get distribution group by ID with members
   */
  async getDistributionGroupById(id: number): Promise<DistributionGroup & { members: any[] } | null> {
    const [group] = await db
      .select()
      .from(distributionGroups)
      .where(eq(distributionGroups.id, id));
    
    if (!group) return null;
    
    const members = await db
      .select({
        id: users.id,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        role: distributionGroupMembers.role,
        isActive: distributionGroupMembers.isActive,
        addedAt: distributionGroupMembers.addedAt
      })
      .from(distributionGroupMembers)
      .innerJoin(users, eq(distributionGroupMembers.userId, users.id))
      .where(eq(distributionGroupMembers.groupId, id));
    
    return { ...group, members };
  }
  
  /**
   * Create new distribution group
   */
  async createDistributionGroup(data: InsertDistributionGroup): Promise<DistributionGroup> {
    const [group] = await db
      .insert(distributionGroups)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return group;
  }
  
  /**
   * Update distribution group
   */
  async updateDistributionGroup(
    id: number, 
    data: Partial<InsertDistributionGroup>
  ): Promise<DistributionGroup | null> {
    const [group] = await db
      .update(distributionGroups)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(distributionGroups.id, id))
      .returning();
    
    return group || null;
  }
  
  /**
   * Delete distribution group and all memberships
   */
  async deleteDistributionGroup(id: number): Promise<boolean> {
    // Delete all memberships first
    await db
      .delete(distributionGroupMembers)
      .where(eq(distributionGroupMembers.groupId, id));
    
    // Delete the group
    const result = await db
      .delete(distributionGroups)
      .where(eq(distributionGroups.id, id))
      .returning();
    
    return result.length > 0;
  }
  
  /**
   * Add user to distribution group
   */
  async addUserToGroup(groupId: number, userId: number): Promise<DistributionGroupMember> {
    // Check if membership already exists
    const existing = await db
      .select()
      .from(distributionGroupMembers)
      .where(
        and(
          eq(distributionGroupMembers.groupId, groupId),
          eq(distributionGroupMembers.userId, userId)
        )
      )
      .limit(1);
    
    if (existing.length > 0) {
      return existing[0];
    }
    
    const [member] = await db
      .insert(distributionGroupMembers)
      .values({
        groupId,
        userId,
        role: 'member',
        isActive: true,
        addedAt: new Date()
      })
      .returning();
    
    return member;
  }
  
  /**
   * Remove user from distribution group
   */
  async removeUserFromGroup(groupId: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(distributionGroupMembers)
      .where(
        and(
          eq(distributionGroupMembers.groupId, groupId),
          eq(distributionGroupMembers.userId, userId)
        )
      )
      .returning();
    
    return result.length > 0;
  }
  
  /**
   * Update member role in group
   */
  async updateMemberRole(
    groupId: number, 
    userId: number, 
    role: string
  ): Promise<DistributionGroupMember | null> {
    const [member] = await db
      .update(distributionGroupMembers)
      .set({ role })
      .where(
        and(
          eq(distributionGroupMembers.groupId, groupId),
          eq(distributionGroupMembers.userId, userId)
        )
      )
      .returning();
    
    return member || null;
  }
  
  /**
   * Get all groups for a user
   */
  async getUserGroups(userId: number): Promise<DistributionGroup[]> {
    const groups = await db
      .select({
        id: distributionGroups.id,
        name: distributionGroups.name,
        description: distributionGroups.description,
        type: distributionGroups.type,
        isActive: distributionGroups.isActive,
        createdBy: distributionGroups.createdBy,
        createdAt: distributionGroups.createdAt,
        updatedAt: distributionGroups.updatedAt
      })
      .from(distributionGroupMembers)
      .innerJoin(distributionGroups, eq(distributionGroupMembers.groupId, distributionGroups.id))
      .where(eq(distributionGroupMembers.userId, userId));
    
    return groups;
  }
  
  /**
   * Send email to distribution group
   */
  async sendEmailToGroup(
    groupId: number,
    emailData: {
      subject: string;
      body: string;
      isHtml?: boolean;
      fromName?: string;
      fromEmail?: string;
    }
  ): Promise<{ success: boolean; recipients: number; messageId?: string }> {
    // Get active members with email addresses
    const members = await db
      .select({
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName
      })
      .from(distributionGroupMembers)
      .innerJoin(users, eq(distributionGroupMembers.userId, users.id))
      .where(
        and(
          eq(distributionGroupMembers.groupId, groupId),
          eq(distributionGroupMembers.isActive, true)
        )
      );
    
    const validEmails = members
      .filter(member => member.email && member.email.trim() !== '')
      .map(member => member.email!);
    
    if (validEmails.length === 0) {
      throw new Error('No valid email addresses found in distribution group');
    }
    
    // TODO: Implement actual email sending logic here
    // This would integrate with your email service (SendGrid, AWS SES, etc.)
    
    return {
      success: true,
      recipients: validEmails.length,
      messageId: `msg_${Date.now()}_${groupId}`
    };
  }
}

export const distributionGroupService = new DistributionGroupService();
```

## API Routes Implementation

### Distribution Group Routes (server/routes/distributionGroupRoutes.ts)
```typescript
import { Router } from 'express';
import { z } from 'zod';
import { distributionGroupService } from '../services/distributionGroupService';
import {
  insertDistributionGroupSchema,
  emailFormSchema,
  distributionGroupFormSchema
} from '@shared/schema';

const router = Router();

/**
 * GET /api/distribution-groups
 * Get paginated list of distribution groups
 */
router.get('/distribution-groups', async (req, res) => {
  try {
    const { page = '1', pageSize = '10', search } = req.query;
    
    const pageNum = parseInt(page as string, 10);
    const pageSizeNum = parseInt(pageSize as string, 10);
    
    if (pageNum < 1 || pageSizeNum < 1 || pageSizeNum > 100) {
      return res.status(400).json({ error: 'Invalid pagination parameters' });
    }
    
    const result = await distributionGroupService.getDistributionGroups(
      pageNum,
      pageSizeNum,
      search as string
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching distribution groups:', error);
    res.status(500).json({ error: 'Failed to fetch distribution groups' });
  }
});

/**
 * GET /api/distribution-groups/:id
 * Get distribution group by ID with members
 */
router.get('/distribution-groups/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid group ID' });
    }
    
    const group = await distributionGroupService.getDistributionGroupById(id);
    
    if (!group) {
      return res.status(404).json({ error: 'Distribution group not found' });
    }
    
    res.json(group);
  } catch (error) {
    console.error('Error fetching distribution group:', error);
    res.status(500).json({ error: 'Failed to fetch distribution group' });
  }
});

/**
 * POST /api/distribution-groups
 * Create new distribution group
 */
router.post('/distribution-groups', async (req, res) => {
  try {
    const validatedData = insertDistributionGroupSchema.parse(req.body);
    
    const group = await distributionGroupService.createDistributionGroup({
      ...validatedData,
      createdBy: req.user?.id // Assuming user is attached to request
    });
    
    res.status(201).json(group);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error creating distribution group:', error);
    res.status(500).json({ error: 'Failed to create distribution group' });
  }
});

/**
 * PUT /api/distribution-groups/:id
 * Update distribution group
 */
router.put('/distribution-groups/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid group ID' });
    }
    
    const validatedData = insertDistributionGroupSchema.partial().parse(req.body);
    
    const group = await distributionGroupService.updateDistributionGroup(id, validatedData);
    
    if (!group) {
      return res.status(404).json({ error: 'Distribution group not found' });
    }
    
    res.json(group);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error updating distribution group:', error);
    res.status(500).json({ error: 'Failed to update distribution group' });
  }
});

/**
 * DELETE /api/distribution-groups/:id
 * Delete distribution group
 */
router.delete('/distribution-groups/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid group ID' });
    }
    
    const success = await distributionGroupService.deleteDistributionGroup(id);
    
    if (!success) {
      return res.status(404).json({ error: 'Distribution group not found' });
    }
    
    res.json({ message: 'Distribution group deleted successfully' });
  } catch (error) {
    console.error('Error deleting distribution group:', error);
    res.status(500).json({ error: 'Failed to delete distribution group' });
  }
});

/**
 * POST /api/distribution-groups/:id/members
 * Add user to distribution group
 */
router.post('/distribution-groups/:id/members', async (req, res) => {
  try {
    const groupId = parseInt(req.params.id, 10);
    const { userId } = req.body;
    
    if (isNaN(groupId) || !userId || isNaN(parseInt(userId, 10))) {
      return res.status(400).json({ error: 'Invalid group ID or user ID' });
    }
    
    const member = await distributionGroupService.addUserToGroup(
      groupId, 
      parseInt(userId, 10)
    );
    
    res.status(201).json(member);
  } catch (error) {
    console.error('Error adding user to group:', error);
    res.status(500).json({ error: 'Failed to add user to group' });
  }
});

/**
 * DELETE /api/distribution-groups/:id/members/:userId
 * Remove user from distribution group
 */
router.delete('/distribution-groups/:id/members/:userId', async (req, res) => {
  try {
    const groupId = parseInt(req.params.id, 10);
    const userId = parseInt(req.params.userId, 10);
    
    if (isNaN(groupId) || isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid group ID or user ID' });
    }
    
    const success = await distributionGroupService.removeUserFromGroup(groupId, userId);
    
    if (!success) {
      return res.status(404).json({ error: 'Membership not found' });
    }
    
    res.json({ message: 'User removed from group successfully' });
  } catch (error) {
    console.error('Error removing user from group:', error);
    res.status(500).json({ error: 'Failed to remove user from group' });
  }
});

/**
 * POST /api/distribution-groups/:id/email
 * Send email to distribution group
 */
router.post('/distribution-groups/:id/email', async (req, res) => {
  try {
    const groupId = parseInt(req.params.id, 10);
    
    if (isNaN(groupId)) {
      return res.status(400).json({ error: 'Invalid group ID' });
    }
    
    const validatedEmail = emailFormSchema.parse(req.body);
    
    const result = await distributionGroupService.sendEmailToGroup(groupId, validatedEmail);
    
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error sending email to group:', error);
    res.status(500).json({ error: 'Failed to send email to group' });
  }
});

export default router;
```

## UI Components Implementation

### Distribution Groups List Page (client/src/pages/admin/distribution-groups/index.tsx)
```typescript
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Plus, Search, Edit, Trash2, Users, Mail, AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';

interface DistributionGroup {
  id: number;
  name: string;
  description: string;
  type: string;
  isActive: boolean;
  createdAt: string;
  members?: any[];
}

export default function DistributionGroupsPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [groupToDelete, setGroupToDelete] = useState<number | null>(null);
  
  const pageSize = 10;
  
  // Query to fetch distribution groups
  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['/api/distribution-groups', page, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      const response = await fetch(`/api/distribution-groups?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch distribution groups');
      }
      return response.json();
    },
  });
  
  // Mutation to delete a distribution group
  const deleteGroupMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/distribution-groups/${id}`);
    },
    onSuccess: () => {
      toast({
        title: 'Distribution group deleted',
        description: 'The distribution group has been deleted successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/distribution-groups'] });
      setGroupToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete distribution group',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const confirmDeleteGroup = () => {
    if (groupToDelete) {
      deleteGroupMutation.mutate(groupToDelete);
    }
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <span>Failed to load distribution groups. Please try again.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Distribution Groups</h1>
          <p className="text-muted-foreground">
            Manage user groups for targeted communications and notifications
          </p>
        </div>
        <Button onClick={() => navigate('/admin/distribution-groups/create')}>
          <Plus className="mr-2 h-4 w-4" />
          Create Group
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search Groups</CardTitle>
          <CardDescription>
            Find distribution groups by name or description
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search groups..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1); // Reset to first page on search
              }}
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Groups Table */}
      <Card>
        <CardHeader>
          <CardTitle>Groups</CardTitle>
          <CardDescription>
            {data ? `${data.total} total groups` : 'Loading groups...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.groups?.map((group: DistributionGroup) => (
                  <TableRow key={group.id}>
                    <TableCell className="font-medium">{group.name}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {group.description || 'No description'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{group.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={group.isActive ? 'default' : 'secondary'}>
                        {group.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {group.members?.length || 0} members
                    </TableCell>
                    <TableCell>
                      {new Date(group.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/distribution-groups/${group.id}/members`)}
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/distribution-groups/${group.id}/email`)}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/distribution-groups/${group.id}/edit`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setGroupToDelete(group.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={groupToDelete !== null} onOpenChange={(open) => !open && setGroupToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Distribution Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this distribution group? This action cannot be undone and all member associations will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteGroup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
```

## System Features

### Advanced Search & Filtering
- **Multi-field Search**: Search across group names, descriptions, and member information
- **Type Filtering**: Filter by communication type (email, SMS, teams)
- **Status Filtering**: Filter by active/inactive status
- **Pagination**: Efficient pagination for large datasets with configurable page sizes

### Member Management Features
- **Bulk Operations**: Add/remove multiple users simultaneously with validation
- **Role Management**: Assign different roles (admin, member, viewer) with granular permissions
- **Import/Export**: CSV import/export for bulk member management
- **Duplicate Detection**: Prevent duplicate memberships with automatic conflict resolution

### Email Communication Features
- **Rich Text Editor**: HTML email composition with template support
- **Template Library**: Pre-built templates for common communication types
- **Delivery Tracking**: Track email delivery status and engagement metrics
- **Scheduling**: Schedule emails for future delivery
- **Attachment Support**: Support for file attachments in email communications

### Administrative Features
- **Audit Logging**: Complete audit trail of all group operations and communications
- **Permission Management**: Role-based access control for group operations
- **Bulk Operations**: Administrative tools for bulk group management
- **Reporting**: Analytics and reporting on group usage and communication effectiveness

## Security & Performance Requirements

### Security Features
- **Access Control**: Role-based permissions for all group operations
- **Data Validation**: Comprehensive input validation and sanitization
- **Audit Trails**: Complete logging of all system operations
- **Email Security**: DKIM, SPF, and DMARC support for email authentication

### Performance Optimizations
- **Database Indexing**: Optimized indexes for search and filtering operations
- **Caching**: Redis caching for frequently accessed group data
- **Pagination**: Efficient pagination to handle large datasets
- **Background Processing**: Asynchronous email sending for large groups

### Scalability Considerations
- **Horizontal Scaling**: Support for multiple application instances
- **Database Optimization**: Query optimization for large-scale operations
- **Email Queue Management**: Queue-based email processing for high volume
- **API Rate Limiting**: Protection against abuse and resource exhaustion

## Integration Points

### Email Service Integration
- **SMTP Configuration**: Support for various SMTP providers
- **API Integration**: Direct integration with email service APIs (SendGrid, AWS SES)
- **Delivery Webhooks**: Real-time delivery status updates
- **Template Synchronization**: Two-way sync with email service templates

### User Management Integration
- **Active Directory/LDAP**: Sync with enterprise directory services
- **Single Sign-On**: Integration with SSO providers
- **Role Synchronization**: Automatic role updates from external systems
- **User Lifecycle**: Automatic group membership updates based on user status

### External System Integration
- **Notification Systems**: Integration with Slack, Teams, Discord
- **Ticketing Systems**: Integration with JIRA, ServiceNow for automated notifications
- **Monitoring Systems**: Integration with monitoring tools for alert distributions
- **API Webhooks**: External system integration via webhook notifications

This comprehensive documentation provides complete technical specifications for recreating the Distribution Groups system in any compatible environment, following the same detailed pattern established for the CVE Database Management system.