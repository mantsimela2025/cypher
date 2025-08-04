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

const Scans = () => {
  return (
    <React.Fragment>
      <Head title="Scans" />
      <Content>
        <BlockHead size="sm">
          <BlockBetween>
            <BlockHeadContent>
              <BlockTitle page>Scans</BlockTitle>
              <BlockDes className="text-soft">
                Manage and monitor your security scans
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
                        <span>New Scan</span>
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
                    <Icon name="scan" className="text-soft" style={{ fontSize: '4rem' }} />
                    <h5 className="mt-3">Scan Management</h5>
                    <p className="text-soft">
                      This page will contain scan management functionality including:
                    </p>
                    <ul className="list-unstyled text-soft mt-3">
                      <li>• Active scan monitoring</li>
                      <li>• Scan history and logs</li>
                      <li>• Scan configuration</li>
                      <li>• Asset targeting</li>
                      <li>• Scan scheduling</li>
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

export default Scans;
