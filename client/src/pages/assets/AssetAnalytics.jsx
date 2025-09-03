import React, { useState } from "react";
import Content from "@/layout/content/Content";
import Head from "@/layout/head/Head";
import {
  Block,
  BlockHead,
  BlockHeadContent,
  BlockTitle,
  BlockDes,
  Row,
  Col,
  PreviewAltCard,
  Progress
} from "@/components/Component";
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Table,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Badge,
  Button,
  Alert
} from "reactstrap";
import { Icon } from "@/components/Component";
import AssetAnalyticsChartsView from "./components/AssetAnalyticsChartsView";

const AssetAnalytics = () => {
  const [timePeriod, setTimePeriod] = useState("12m");

  return (
    <>
      <Head title="Asset Analytics"></Head>
      <Content>
        <BlockHead size="sm">
          <BlockHeadContent>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <BlockTitle page tag="h3">
                  Asset Analytics
                </BlockTitle>
                <BlockDes className="text-soft">
                  <p>Comprehensive analytics and insights for your asset portfolio.</p>
                </BlockDes>
              </div>
              <div className="d-flex gap-2">
                {/* Asset Analytics - Charts View Only */}
                <div className="d-flex align-items-center text-muted">
                  <Icon name="chart-bar-32" className="me-2"></Icon>
                  <span className="fw-bold">Interactive Analytics Dashboard</span>
                </div>
              </div>
            </div>
          </BlockHeadContent>
        </BlockHead>

        {/* Asset Analytics Info */}
        <Block>
          <Alert color="info" className="d-flex align-items-center">
            <Icon name="chart-bar-32" className="me-2"></Icon>
            <div>
              <strong>Asset Analytics Dashboard:</strong> Real-time insights from your asset portfolio with AI-powered analytics.
              <small className="d-block text-muted mt-1">
                Interactive charts with detailed information tooltips • Click ℹ️ icons for methodology and data sources
              </small>
            </div>
          </Alert>
        </Block>

        {/* Asset Analytics Charts View */}
        <Block>
          <AssetAnalyticsChartsView />
        </Block>
      </Content>
    </>
  );
};

export default AssetAnalytics;
