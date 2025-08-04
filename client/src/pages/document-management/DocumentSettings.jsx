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

const DocumentSettings = () => {
  return (
    <React.Fragment>
      <Head title="Document Settings" />
      <Content>
        <BlockHead size="sm">
          <BlockBetween>
            <BlockHeadContent>
              <BlockTitle page>Document Settings</BlockTitle>
              <BlockDes className="text-soft">
                Configure document management system settings
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
                        <Icon name="save" />
                        <span>Save Settings</span>
                      </Button>
                    </li>
                    <li>
                      <Button color="secondary">
                        <Icon name="reload" />
                        <span>Reset Defaults</span>
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
                    <Icon name="setting" className="text-soft" style={{ fontSize: '4rem' }} />
                    <h5 className="mt-3">Document Settings</h5>
                    <p className="text-soft">
                      This page will contain document system settings including:
                    </p>
                    <ul className="list-unstyled text-soft mt-3">
                      <li>• File upload restrictions and limits</li>
                      <li>• Storage and retention policies</li>
                      <li>• Access permissions and security</li>
                      <li>• Workflow and approval settings</li>
                      <li>• Integration configurations</li>
                      <li>• Notification preferences</li>
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

export default DocumentSettings;
