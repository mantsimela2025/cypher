import React, { useState, useEffect } from "react";
import Head from "@/layout/head/Head";
import Content from "@/layout/content/Content";
import {
  Block,
  BlockHead,
  BlockHeadContent,
  BlockTitle,
  BlockDes,
  BlockBetween,
  Button,
  Icon,
} from "@/components/Component";
import { toast, ToastContainer } from "react-toastify";

// Components
import CategoriesDataTable from "./components/CategoriesDataTable";
import CategoryDetailsPanel from "./components/CategoryDetailsPanel";
import CategoryFormPanel from "./components/CategoryFormPanel";

// API (will be implemented)
import { categoriesApi } from "@/utils/categoriesApi";

const Categories = () => {
  // State management
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});

  // Panel states
  const [detailsPanelOpen, setDetailsPanelOpen] = useState(false);
  const [formPanelOpen, setFormPanelOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [parentCategory, setParentCategory] = useState(null);

  // Mock data for now - will be replaced with API calls
  const mockCategories = [
    {
      id: 1,
      name: "Security Documentation",
      description: "All security-related policies, procedures, and guidelines",
      parentId: null,
      parentName: null,
      status: "active",
      documentCount: 25,
      createdAt: "2024-01-15T10:30:00Z",
      updatedAt: "2024-01-20T14:45:00Z"
    },
    {
      id: 2,
      name: "Policies",
      description: "Corporate security policies and standards",
      parentId: 1,
      parentName: "Security Documentation",
      status: "active",
      documentCount: 12,
      createdAt: "2024-01-16T09:15:00Z",
      updatedAt: "2024-01-18T11:30:00Z"
    },
    {
      id: 3,
      name: "Procedures",
      description: "Step-by-step security procedures and workflows",
      parentId: 1,
      parentName: "Security Documentation",
      status: "active",
      documentCount: 8,
      createdAt: "2024-01-16T10:45:00Z",
      updatedAt: "2024-01-19T16:20:00Z"
    },
    {
      id: 4,
      name: "Technical Documentation",
      description: "System architecture, API docs, and technical specifications",
      parentId: null,
      parentName: null,
      status: "active",
      documentCount: 18,
      createdAt: "2024-01-12T08:20:00Z",
      updatedAt: "2024-01-22T13:15:00Z"
    },
    {
      id: 5,
      name: "API Documentation",
      description: "REST API specifications and integration guides",
      parentId: 4,
      parentName: "Technical Documentation",
      status: "active",
      documentCount: 7,
      createdAt: "2024-01-17T14:30:00Z",
      updatedAt: "2024-01-21T09:45:00Z"
    },
    {
      id: 6,
      name: "System Architecture",
      description: "Architecture diagrams and system design documents",
      parentId: 4,
      parentName: "Technical Documentation",
      status: "active",
      documentCount: 11,
      createdAt: "2024-01-18T11:15:00Z",
      updatedAt: "2024-01-23T15:30:00Z"
    },
    {
      id: 7,
      name: "Compliance",
      description: "Regulatory compliance documentation and audits",
      parentId: null,
      parentName: null,
      status: "active",
      documentCount: 15,
      createdAt: "2024-01-10T12:45:00Z",
      updatedAt: "2024-01-19T17:20:00Z"
    },
    {
      id: 8,
      name: "Training Materials",
      description: "Employee training documents and resources",
      parentId: null,
      parentName: null,
      status: "draft",
      documentCount: 3,
      createdAt: "2024-01-25T10:00:00Z",
      updatedAt: "2024-01-25T10:00:00Z"
    }
  ];

  // API functions
  const fetchCategories = async () => {
    try {
      setLoading(true);
      console.log('📄 Fetching categories...');
      
      // Use real API call
      const response = await categoriesApi.getAll();
      const categoriesData = response.data || [];
      
      console.log(`📊 SUCCESS: Loaded ${categoriesData.length} categories`);
      setCategories(categoriesData);
      
      // Calculate stats
      const totalCategories = categoriesData.length;
      const activeCategories = categoriesData.filter(c => c.status === 'active').length;
      const rootCategories = categoriesData.filter(c => !c.parentId).length;
      const totalDocuments = categoriesData.reduce((sum, c) => sum + (c.documentCount || 0), 0);
      
      setStats({
        total: totalCategories,
        active: activeCategories,
        root: rootCategories,
        documents: totalDocuments
      });
      
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      toast.error('Failed to load categories');
      setCategories([]);
      setStats({});
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCategory = async (categoryData, isEditing) => {
    try {
      console.log('💾 Saving category:', categoryData);
      
      // Use real API calls
      if (isEditing) {
        await categoriesApi.update(categoryData.id, categoryData);
        console.log('✏️ Updated category:', categoryData);
        toast.success('Category updated successfully');
      } else {
        await categoriesApi.create(categoryData);
        console.log('➕ Created category:', categoryData);
        toast.success('Category created successfully');
      }
      
      // Refresh categories list
      await fetchCategories();
      
      return Promise.resolve();
    } catch (error) {
      console.error('❌ Error saving category:', error);
      toast.error('Failed to save category');
      throw error;
    }
  };

  const handleDeleteCategory = async (category) => {
    try {
      if (window.confirm(`Are you sure you want to delete "${category.name}"? This action cannot be undone.`)) {
        console.log('🗑️ Deleting category:', category);
        
        // Use real API call
        await categoriesApi.delete(category.id);
        
        toast.success('Category deleted successfully');
        await fetchCategories();
      }
    } catch (error) {
      console.error('❌ Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  };

  // Event handlers
  const handleViewCategory = (category) => {
    console.log('👁️ View category:', category);
    setSelectedCategory(category);
    setDetailsPanelOpen(true);
  };

  const handleEditCategory = (category) => {
    console.log('✏️ Edit category:', category);
    setSelectedCategory(category);
    setParentCategory(null);
    setFormPanelOpen(true);
  };

  const handleAddCategory = () => {
    console.log('➕ Add new category');
    setSelectedCategory(null);
    setParentCategory(null);
    setFormPanelOpen(true);
  };

  const handleAddSubcategory = (parentCat) => {
    console.log('📁 Add subcategory to:', parentCat);
    setSelectedCategory(null);
    setParentCategory(parentCat);
    setFormPanelOpen(true);
  };

  // Panel close handlers
  const handleCloseDetailsPanel = () => {
    setDetailsPanelOpen(false);
    setSelectedCategory(null);
  };

  const handleCloseFormPanel = () => {
    setFormPanelOpen(false);
    setSelectedCategory(null);
    setParentCategory(null);
  };

  // Get available parent categories for form
  const getAvailableParents = () => {
    // Filter out the category being edited and its descendants to prevent circular references
    if (selectedCategory) {
      return categories.filter(cat => 
        cat.id !== selectedCategory.id && 
        cat.parentId !== selectedCategory.id
      );
    }
    return categories.filter(cat => cat.status === 'active');
  };

  // Effects
  useEffect(() => {
    fetchCategories();
  }, []);

  // Debug logging
  console.log(`🎨 RENDER: Categories page with ${categories.length} categories`);
  console.log(`📊 STATS:`, stats);

  return (
    <React.Fragment>
      <Head title="Document Categories" />
      <Content>
        <BlockHead size="sm">
          <BlockBetween>
            <BlockHeadContent>
              <BlockTitle page>Document Categories</BlockTitle>
              <BlockDes className="text-soft">
                Organize documents with categories and hierarchies
              </BlockDes>
            </BlockHeadContent>
            <BlockHeadContent>
              <div className="toggle-wrap nk-block-tools-toggle">
                <Button
                  className="btn-icon btn-trigger toggle-expand me-n1"
                  color="transparent"
                >
                  <Icon name="menu-alt-r"></Icon>
                </Button>
                <div className="toggle-expand-content">
                  <ul className="nk-block-tools g-3">
                    <li>
                      <Button color="primary" onClick={handleAddCategory}>
                        <Icon name="plus" />
                        <span>Add Category</span>
                      </Button>
                    </li>
                    <li>
                      <Button color="secondary" onClick={() => {
                        // For now, just show a message. Later this could open a dialog to select parent
                        toast.info('Select a parent category from the table, then use "Add Subcategory" action');
                      }}>
                        <Icon name="folder-plus" />
                        <span>Add Subcategory</span>
                      </Button>
                    </li>
                  </ul>
                </div>
              </div>
            </BlockHeadContent>
          </BlockBetween>
        </BlockHead>

        {/* Stats Cards */}
        {!loading && (
          <Block>
            <div className="row g-gs">
              <div className="col-md-3">
                <div className="card card-bordered">
                  <div className="card-inner">
                    <div className="card-title-group align-start mb-2">
                      <div className="card-title">
                        <h6 className="title">Total Categories</h6>
                      </div>
                      <div className="card-tools">
                        <Icon name="folder" className="text-primary"></Icon>
                      </div>
                    </div>
                    <div className="align-end">
                      <div className="number">
                        <span className="amount">{stats.total || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card card-bordered">
                  <div className="card-inner">
                    <div className="card-title-group align-start mb-2">
                      <div className="card-title">
                        <h6 className="title">Active Categories</h6>
                      </div>
                      <div className="card-tools">
                        <Icon name="check-circle" className="text-success"></Icon>
                      </div>
                    </div>
                    <div className="align-end">
                      <div className="number">
                        <span className="amount">{stats.active || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card card-bordered">
                  <div className="card-inner">
                    <div className="card-title-group align-start mb-2">
                      <div className="card-title">
                        <h6 className="title">Root Categories</h6>
                      </div>
                      <div className="card-tools">
                        <Icon name="home" className="text-info"></Icon>
                      </div>
                    </div>
                    <div className="align-end">
                      <div className="number">
                        <span className="amount">{stats.root || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card card-bordered">
                  <div className="card-inner">
                    <div className="card-title-group align-start mb-2">
                      <div className="card-title">
                        <h6 className="title">Total Documents</h6>
                      </div>
                      <div className="card-tools">
                        <Icon name="file-text" className="text-warning"></Icon>
                      </div>
                    </div>
                    <div className="align-end">
                      <div className="number">
                        <span className="amount">{stats.documents || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Block>
        )}

        {/* Categories Data Table */}
        <Block>
          <CategoriesDataTable
            data={categories}
            loading={loading}
            onView={handleViewCategory}
            onEdit={handleEditCategory}
            onDelete={handleDeleteCategory}
            onAddSubcategory={handleAddSubcategory}
          />
        </Block>

        <ToastContainer />

        {/* Category Details Slide-out Panel */}
        <CategoryDetailsPanel
          isOpen={detailsPanelOpen}
          onClose={handleCloseDetailsPanel}
          categoryData={selectedCategory}
          onEdit={handleEditCategory}
          onAddSubcategory={handleAddSubcategory}
        />

        {/* Category Form Slide-out Panel */}
        <CategoryFormPanel
          isOpen={formPanelOpen}
          onClose={handleCloseFormPanel}
          categoryData={selectedCategory}
          parentCategory={parentCategory}
          onSave={handleSaveCategory}
          availableParents={getAvailableParents()}
        />
      </Content>
    </React.Fragment>
  );
};

export default Categories;
