import React from "react";
import Content from "@/layout/content/Content";
import Head from "@/layout/head/Head";
import {
  Block,
  BlockHead,
  BlockHeadContent,
  BlockTitle,
  BlockDes,
  Icon,
} from "@/components/Component";

const VulnerabilitiesDashboard = () => {
  return (
    <React.Fragment>
      <Head title="Vulnerabilities Dashboard"></Head>
      <Content>
        <BlockHead size="sm">
          <BlockHeadContent>
            <BlockTitle page>Vulnerabilities Dashboard</BlockTitle>
            <BlockDes className="text-soft">
              <p>
                Comprehensive vulnerability management analytics and insights for threat assessment, 
                risk prioritization, and remediation tracking across your infrastructure.
              </p>
            </BlockDes>
          </BlockHeadContent>
        </BlockHead>

        <Block>
          <div className="card card-bordered">
            <div className="card-inner">
              <div className="text-center py-5">
                <div className="mb-3">
                  <Icon name="shield-alert" className="text-primary" style={{ fontSize: '3rem' }}></Icon>
                </div>
                <h5 className="title">Vulnerabilities Dashboard</h5>
                <p className="text-soft">
                  This page will contain comprehensive vulnerability management analytics including:
                </p>
                <ul className="list-unstyled text-soft mt-3">
                  <li className="py-1">
                    <Icon name="check-circle" className="text-success me-2"></Icon>
                    Vulnerability discovery and classification tracking
                  </li>
                  <li className="py-1">
                    <Icon name="check-circle" className="text-success me-2"></Icon>
                    Risk scoring and prioritization algorithms
                  </li>
                  <li className="py-1">
                    <Icon name="check-circle" className="text-success me-2"></Icon>
                    Remediation progress and timeline analytics
                  </li>
                  <li className="py-1">
                    <Icon name="check-circle" className="text-success me-2"></Icon>
                    Threat landscape trends and intelligence feeds
                  </li>
                  <li className="py-1">
                    <Icon name="check-circle" className="text-success me-2"></Icon>
                    Compliance gap analysis and reporting
                  </li>
                </ul>
                <div className="mt-4">
                  <span className="badge badge-dim bg-primary">Coming Soon</span>
                </div>
              </div>
            </div>
          </div>
        </Block>
      </Content>
    </React.Fragment>
  );
};

export default VulnerabilitiesDashboard;