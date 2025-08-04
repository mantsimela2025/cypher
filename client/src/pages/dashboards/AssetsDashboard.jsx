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

const AssetsDashboard = () => {
  return (
    <React.Fragment>
      <Head title="Assets Dashboard"></Head>
      <Content>
        <BlockHead size="sm">
          <BlockHeadContent>
            <BlockTitle page>Assets Dashboard</BlockTitle>
            <BlockDes className="text-soft">
              <p>
                Comprehensive asset management analytics and insights for inventory tracking, 
                cost optimization, and lifecycle management across your organization.
              </p>
            </BlockDes>
          </BlockHeadContent>
        </BlockHead>

        <Block>
          <div className="card card-bordered">
            <div className="card-inner">
              <div className="text-center py-5">
                <div className="mb-3">
                  <Icon name="package" className="text-primary" style={{ fontSize: '3rem' }}></Icon>
                </div>
                <h5 className="title">Assets Dashboard</h5>
                <p className="text-soft">
                  This page will contain comprehensive asset management analytics including:
                </p>
                <ul className="list-unstyled text-soft mt-3">
                  <li className="py-1">
                    <Icon name="check-circle" className="text-success me-2"></Icon>
                    Asset inventory tracking and categorization
                  </li>
                  <li className="py-1">
                    <Icon name="check-circle" className="text-success me-2"></Icon>
                    Cost analysis and depreciation calculations
                  </li>
                  <li className="py-1">
                    <Icon name="check-circle" className="text-success me-2"></Icon>
                    Lifecycle management and replacement planning
                  </li>
                  <li className="py-1">
                    <Icon name="check-circle" className="text-success me-2"></Icon>
                    Asset utilization and performance metrics
                  </li>
                  <li className="py-1">
                    <Icon name="check-circle" className="text-success me-2"></Icon>
                    Compliance and audit trail management
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

export default AssetsDashboard;