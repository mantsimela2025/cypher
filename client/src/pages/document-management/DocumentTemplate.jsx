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

const DocumentTemplate = () => {
  return (
    <React.Fragment>
      <Head title="Document Template" />
      <Content>
        <BlockHead size="sm">
          <BlockBetween>
            <BlockHeadContent>
              <BlockTitle page>Document Template</BlockTitle>
              <BlockDes className="text-soft">
                Create and manage document templates
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
                        <Icon name="plus" />
                        <span>New Template</span>
                      </Button>
                    </li>
                    <li>
                      <Button color="secondary">
                        <Icon name="copy" />
                        <span>Import Template</span>
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
                    <Icon name="template" className="text-soft" style={{ fontSize: '4rem' }} />
                    <h5 className="mt-3">Document Template</h5>
                    <p className="text-soft">
                      This page will contain document template functionality including:
                    </p>
                    <ul className="list-unstyled text-soft mt-3">
                      <li>• Template creation and editing</li>
                      <li>• Template library management</li>
                      <li>• Variable and placeholder support</li>
                      <li>• Template versioning</li>
                      <li>• Template sharing and permissions</li>
                      <li>• Document generation from templates</li>
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

export default DocumentTemplate;
