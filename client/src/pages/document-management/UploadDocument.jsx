import React from "react";
import Head from "@/layout/head/Head";
import Content from "@/layout/content/Content";
import {
  Block,
  BlockHead,
  BlockHeadContent,
  BlockTitle,
  BlockDes,
  BlockBetween,
  Row,
  Col,
  Button,
  Icon,
} from "@/components/Component";
import { Card } from "reactstrap";

const UploadDocument = () => {
  return (
    <React.Fragment>
      <Head title="Upload Document" />
      <Content>
        <BlockHead size="sm">
          <BlockBetween>
            <BlockHeadContent>
              <BlockTitle page>Upload Document</BlockTitle>
              <BlockDes className="text-soft">
                Upload and manage new documents
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
                      <Button color="primary">
                        <Icon name="upload-cloud" />
                        <span>Browse Files</span>
                      </Button>
                    </li>
                    <li>
                      <Button color="secondary">
                        <Icon name="folder" />
                        <span>Create Folder</span>
                      </Button>
                    </li>
                  </ul>
                </div>
              </div>
            </BlockHeadContent>
          </BlockBetween>
        </BlockHead>

        <Block>
          <Row className="g-gs">
            <Col xxl="12">
              <Card className="card-bordered h-100">
                <div className="card-inner">
                  <div className="text-center py-5">
                    <Icon name="upload-cloud" className="text-soft" style={{ fontSize: '4rem' }} />
                    <h5 className="mt-3">Upload Document</h5>
                    <p className="text-soft">
                      This page will contain document upload functionality including:
                    </p>
                    <ul className="list-unstyled text-soft mt-3">
                      <li>• Drag and drop file upload</li>
                      <li>• Multiple file selection</li>
                      <li>• File type validation</li>
                      <li>• Upload progress tracking</li>
                      <li>• Metadata assignment</li>
                      <li>• Category and tag assignment</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </Block>
      </Content>
    </React.Fragment>
  );
};

export default UploadDocument;
