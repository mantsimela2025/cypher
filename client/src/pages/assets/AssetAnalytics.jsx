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

const AssetAnalytics = () => {
  return (
    <React.Fragment>
      <Head title="Asset Analytics"></Head>
      <Content>
        <BlockHead size="sm">
          <BlockHeadContent>
            <BlockTitle page>Asset Analytics</BlockTitle>
            <BlockDes className="text-soft">
              <p>
                Comprehensive analytics and insights for asset management, including cost forecasting, 
                lifecycle planning, and ROI calculations.
              </p>
            </BlockDes>
          </BlockHeadContent>
        </BlockHead>

        <Block>
          <div className="card card-bordered">
            <div className="card-inner">
              <div className="text-center py-5">
                <div className="mb-3">
                  <Icon name="bar-chart" className="text-primary" style={{ fontSize: '3rem' }}></Icon>
                </div>
                <h5 className="title">Asset Analytics Dashboard</h5>
                <p className="text-soft">
                  This page will contain comprehensive asset analytics including:
                </p>
                <ul className="list-unstyled text-soft mt-3">
                  <li className="py-1">
                    <Icon name="check-circle" className="text-success me-2"></Icon>
                    Cost forecasting and budgeting
                  </li>
                  <li className="py-1">
                    <Icon name="check-circle" className="text-success me-2"></Icon>
                    Lifecycle planning and replacement scheduling
                  </li>
                  <li className="py-1">
                    <Icon name="check-circle" className="text-success me-2"></Icon>
                    ROI and depreciation calculations
                  </li>
                  <li className="py-1">
                    <Icon name="check-circle" className="text-success me-2"></Icon>
                    AI-powered cost optimization recommendations
                  </li>
                  <li className="py-1">
                    <Icon name="check-circle" className="text-success me-2"></Icon>
                    Asset performance metrics and trends
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

export default AssetAnalytics;
