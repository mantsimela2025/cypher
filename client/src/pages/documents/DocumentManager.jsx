import React, { useState, useEffect } from 'react';
import Content from '@/layout/content/Content';
import Head from '@/layout/head/Head';
import {
  Block,
  BlockHead,
  BlockHeadContent,
  BlockTitle,
  BlockDes,
  BlockBetween,
  Icon,
  Button,
  Row,
  Col,
  PreviewCard
} from '@/components/Component';
import { Nav, NavItem, NavLink, TabContent, TabPane } from 'reactstrap';
import DocumentLibrary from './components/DocumentLibrary';
import DocumentFavorites from './components/DocumentFavorites';
import DocumentShared from './components/DocumentShared';
import DocumentTemplates from './components/DocumentTemplates';
import DocumentAnalytics from './components/DocumentAnalytics';
import DocumentUploadModal from './components/DocumentUploadModal';
import DocumentSettings from './components/DocumentSettings';

const DocumentManager = () => {
  const [activeTab, setActiveTab] = useState('library');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Mock data for development - replace with API calls
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setDocuments([
        {
          id: '1',
          name: 'Project Requirements.pdf',
          original_name: 'Project Requirements.pdf',
          size: 2048576,
          mime_type: 'application/pdf',
          url: '/documents/project-requirements.pdf',
          folder_id: null,
          user_id: 1,
          tags: ['project', 'requirements'],
          created_at: new Date('2024-01-15'),
          updated_at: new Date('2024-01-15'),
          is_favorite: false,
          is_shared: true,
          version_count: 3
        },
        {
          id: '2',
          name: 'System Architecture.docx',
          original_name: 'System Architecture.docx',
          size: 1536000,
          mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          url: '/documents/system-architecture.docx',
          folder_id: null,
          user_id: 1,
          tags: ['architecture', 'system'],
          created_at: new Date('2024-01-10'),
          updated_at: new Date('2024-01-12'),
          is_favorite: true,
          is_shared: false,
          version_count: 1
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleUpload = (files) => {
    // Handle file upload logic here
    console.log('Uploading files:', files);
    setUploadModalOpen(false);
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <>
      <Head title="Document Management" />
      <Content>
        <BlockHead size="sm">
          <BlockBetween>
            <BlockHeadContent>
              <BlockTitle tag="h3" page>
                Document Management
              </BlockTitle>
              <BlockDes className="text-soft">
                <p>Manage, organize, and collaborate on your documents</p>
              </BlockDes>
            </BlockHeadContent>
            <BlockHeadContent>
              <div className="toggle-wrap nk-block-tools-toggle">
                <Button
                  className="btn-icon btn-trigger toggle-expand me-n1"
                  color="transparent"
                >
                  <Icon name="menu-alt-r" />
                </Button>
                <div className="toggle-expand-content">
                  <ul className="nk-block-tools g-3">
                    <li>
                      <Button
                        color="primary"
                        onClick={() => setUploadModalOpen(true)}
                      >
                        <Icon name="upload" />
                        <span>Upload Documents</span>
                      </Button>
                    </li>
                  </ul>
                </div>
              </div>
            </BlockHeadContent>
          </BlockBetween>
        </BlockHead>

        <Block>
          <PreviewCard>
            <div className="card-inner">
              {/* Navigation Tabs */}
              <Nav tabs className="nav-tabs-mb-icon nav-tabs-card">
                <NavItem>
                  <NavLink
                    tag="a"
                    href="#library"
                    className={activeTab === 'library' ? 'active' : ''}
                    onClick={(e) => {
                      e.preventDefault();
                      handleTabChange('library');
                    }}
                  >
                    <Icon name="folder" />
                    <span>All Documents</span>
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    tag="a"
                    href="#favorites"
                    className={activeTab === 'favorites' ? 'active' : ''}
                    onClick={(e) => {
                      e.preventDefault();
                      handleTabChange('favorites');
                    }}
                  >
                    <Icon name="star" />
                    <span>Favorites</span>
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    tag="a"
                    href="#shared"
                    className={activeTab === 'shared' ? 'active' : ''}
                    onClick={(e) => {
                      e.preventDefault();
                      handleTabChange('shared');
                    }}
                  >
                    <Icon name="share-alt" />
                    <span>Shared</span>
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    tag="a"
                    href="#templates"
                    className={activeTab === 'templates' ? 'active' : ''}
                    onClick={(e) => {
                      e.preventDefault();
                      handleTabChange('templates');
                    }}
                  >
                    <Icon name="template" />
                    <span>Templates</span>
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    tag="a"
                    href="#analytics"
                    className={activeTab === 'analytics' ? 'active' : ''}
                    onClick={(e) => {
                      e.preventDefault();
                      handleTabChange('analytics');
                    }}
                  >
                    <Icon name="bar-chart" />
                    <span>Analytics</span>
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    tag="a"
                    href="#settings"
                    className={activeTab === 'settings' ? 'active' : ''}
                    onClick={(e) => {
                      e.preventDefault();
                      handleTabChange('settings');
                    }}
                  >
                    <Icon name="setting" />
                    <span>Settings</span>
                  </NavLink>
                </NavItem>
              </Nav>

              {/* Tab Content */}
              <TabContent activeTab={activeTab}>
                <TabPane tabId="library">
                  <DocumentLibrary
                    documents={filteredDocuments}
                    loading={loading}
                    searchTerm={searchTerm}
                    onSearch={handleSearch}
                    viewMode={viewMode}
                    onViewModeChange={handleViewModeChange}
                  />
                </TabPane>
                <TabPane tabId="favorites">
                  <DocumentFavorites
                    documents={filteredDocuments.filter(doc => doc.is_favorite)}
                    loading={loading}
                  />
                </TabPane>
                <TabPane tabId="shared">
                  <DocumentShared
                    documents={filteredDocuments.filter(doc => doc.is_shared)}
                    loading={loading}
                  />
                </TabPane>
                <TabPane tabId="templates">
                  <DocumentTemplates />
                </TabPane>
                <TabPane tabId="analytics">
                  <DocumentAnalytics />
                </TabPane>
                <TabPane tabId="settings">
                  <DocumentSettings />
                </TabPane>
              </TabContent>
            </div>
          </PreviewCard>
        </Block>

        {/* Upload Modal */}
        <DocumentUploadModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          onUpload={handleUpload}
        />
      </Content>
    </>
  );
};

export default DocumentManager;
