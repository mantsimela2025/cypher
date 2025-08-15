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
  Badge
} from "reactstrap";
import { Icon } from "@/components/Component";
import AnalyticsStatsCards from "./components/AnalyticsStatsCards";
import {
  AssetOverviewChart,
  AssetValueChart,
  AssetUtilizationChart,
  AssetHealthChart,
  MaintenanceCostChart,
  AssetCategoryDoughnut,
  AssetStatusDoughnut,
} from "@/components/partials/charts/assets/AssetCharts";
import {
  assetOverviewData,
  assetValueData,
  AssetUtilizationData,
  AssetHealthData,
  MaintenanceCostData,
  AssetCategoryData,
  AssetStatusData,
  AssetLifecycleData,
  CostAnalysisData,
  TopAssetsData,
} from "@/components/partials/charts/assets/AssetData";

const AssetAnalytics = () => {
  const [timePeriod, setTimePeriod] = useState("12m");

  return (
    <>
      <Head title="Asset Analytics"></Head>
      <Content>
        <BlockHead size="sm">
          <BlockHeadContent>
            <BlockTitle page tag="h3">
              Asset Analytics
            </BlockTitle>
            <BlockDes className="text-soft">
              <p>Comprehensive analytics and insights for your asset portfolio.</p>
            </BlockDes>
          </BlockHeadContent>
        </BlockHead>

        {/* Key Metrics Row - Colorful Cards */}
        <Block>
          <AnalyticsStatsCards loading={false} />
        </Block>

        {/* Charts Row 1 */}
        <Block>
          <Row className="g-gs">
            <Col lg="8">
              <PreviewAltCard className="h-100">
                <Card className="card-bordered">
                  <CardHeader className="border-bottom">
                    <div className="card-title-group">
                      <CardTitle>
                        <h6 className="title">Asset Overview</h6>
                      </CardTitle>
                      <div className="card-tools">
                        <UncontrolledDropdown>
                          <DropdownToggle
                            tag="a"
                            className="dropdown-toggle btn btn-icon btn-trigger"
                            data-toggle="dropdown"
                          >
                            <Icon name="more-h"></Icon>
                          </DropdownToggle>
                          <DropdownMenu right>
                            <div className="dropdown-inner">
                              <DropdownItem
                                tag="a"
                                href="#dropdownitem"
                                onClick={(ev) => {
                                  ev.preventDefault();
                                  setTimePeriod("7d");
                                }}
                              >
                                7 Days
                              </DropdownItem>
                              <DropdownItem
                                tag="a"
                                href="#dropdownitem"
                                onClick={(ev) => {
                                  ev.preventDefault();
                                  setTimePeriod("1m");
                                }}
                              >
                                1 Month
                              </DropdownItem>
                              <DropdownItem
                                tag="a"
                                href="#dropdownitem"
                                onClick={(ev) => {
                                  ev.preventDefault();
                                  setTimePeriod("12m");
                                }}
                              >
                                12 Months
                              </DropdownItem>
                            </div>
                          </DropdownMenu>
                        </UncontrolledDropdown>
                      </div>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <div className="nk-ck">
                      <AssetOverviewChart data={assetOverviewData} />
                    </div>
                  </CardBody>
                </Card>
              </PreviewAltCard>
            </Col>
            <Col lg="4">
              <PreviewAltCard className="h-100">
                <Card className="card-bordered">
                  <CardHeader className="border-bottom">
                    <CardTitle>
                      <h6 className="title">Asset Categories</h6>
                    </CardTitle>
                  </CardHeader>
                  <CardBody>
                    <div className="nk-ck">
                      <AssetCategoryDoughnut data={AssetCategoryData} />
                    </div>
                    <div className="chart-label-group ps-5">
                      {AssetCategoryData.labels.map((label, index) => (
                        <div key={index} className="chart-label d-flex justify-content-between">
                          <div className="chart-label-item">
                            <div className="chart-label-dot" style={{backgroundColor: AssetCategoryData.datasets[0].backgroundColor[index]}}></div>
                            <span className="chart-label-text">{label}</span>
                          </div>
                          <span className="chart-label-count">{AssetCategoryData.datasets[0].data[index]}</span>
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              </PreviewAltCard>
            </Col>
          </Row>
        </Block>

        {/* Charts Row 2 */}
        <Block>
          <Row className="g-gs">
            <Col lg="4">
              <PreviewAltCard className="h-100">
                <Card className="card-bordered">
                  <CardHeader className="border-bottom">
                    <CardTitle>
                      <h6 className="title">Asset Value Trends</h6>
                    </CardTitle>
                  </CardHeader>
                  <CardBody>
                    <div className="nk-ck">
                      <AssetValueChart data={assetValueData} />
                    </div>
                  </CardBody>
                </Card>
              </PreviewAltCard>
            </Col>
            <Col lg="4">
              <PreviewAltCard className="h-100">
                <Card className="card-bordered">
                  <CardHeader className="border-bottom">
                    <CardTitle>
                      <h6 className="title">Utilization Rate</h6>
                    </CardTitle>
                  </CardHeader>
                  <CardBody>
                    <div className="nk-ck">
                      <AssetUtilizationChart data={AssetUtilizationData} />
                    </div>
                  </CardBody>
                </Card>
              </PreviewAltCard>
            </Col>
            <Col lg="4">
              <PreviewAltCard className="h-100">
                <Card className="card-bordered">
                  <CardHeader className="border-bottom">
                    <CardTitle>
                      <h6 className="title">Asset Status</h6>
                    </CardTitle>
                  </CardHeader>
                  <CardBody>
                    <div className="nk-ck">
                      <AssetStatusDoughnut data={AssetStatusData} />
                    </div>
                    <div className="chart-label-group ps-5">
                      {AssetStatusData.labels.map((label, index) => (
                        <div key={index} className="chart-label d-flex justify-content-between">
                          <div className="chart-label-item">
                            <div className="chart-label-dot" style={{backgroundColor: AssetStatusData.datasets[0].backgroundColor[index]}}></div>
                            <span className="chart-label-text">{label}</span>
                          </div>
                          <span className="chart-label-count">{AssetStatusData.datasets[0].data[index]}</span>
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              </PreviewAltCard>
            </Col>
          </Row>
        </Block>

        {/* Charts Row 3 */}
        <Block>
          <Row className="g-gs">
            <Col lg="6">
              <PreviewAltCard className="h-100">
                <Card className="card-bordered">
                  <CardHeader className="border-bottom">
                    <CardTitle>
                      <h6 className="title">Health Score Trend</h6>
                    </CardTitle>
                  </CardHeader>
                  <CardBody>
                    <div className="nk-ck">
                      <AssetHealthChart data={AssetHealthData} />
                    </div>
                  </CardBody>
                </Card>
              </PreviewAltCard>
            </Col>
            <Col lg="6">
              <PreviewAltCard className="h-100">
                <Card className="card-bordered">
                  <CardHeader className="border-bottom">
                    <CardTitle>
                      <h6 className="title">Maintenance Costs</h6>
                    </CardTitle>
                  </CardHeader>
                  <CardBody>
                    <div className="nk-ck">
                      <MaintenanceCostChart data={MaintenanceCostData} />
                    </div>
                  </CardBody>
                </Card>
              </PreviewAltCard>
            </Col>
          </Row>
        </Block>

        {/* Data Tables Row */}
        <Block>
          <Row className="g-gs">
            <Col lg="4">
              <PreviewAltCard className="h-100">
                <Card className="card-bordered">
                  <CardHeader className="border-bottom">
                    <CardTitle>
                      <h6 className="title">Asset Lifecycle</h6>
                    </CardTitle>
                  </CardHeader>
                  <CardBody>
                    <div className="nk-tb-list">
                      {AssetLifecycleData.map((item) => (
                        <div key={item.id} className="nk-tb-item">
                          <div className="nk-tb-col">
                            <div>
                              <span className="tb-lead">{item.stage}</span>
                              <span className="tb-sub d-block">
                                <Badge color={item.theme} pill>
                                  {item.count} assets ({item.percentage}%)
                                </Badge>
                              </span>
                              <span className="tb-sub">{item.value}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              </PreviewAltCard>
            </Col>
            <Col lg="4">
              <PreviewAltCard className="h-100">
                <Card className="card-bordered">
                  <CardHeader className="border-bottom">
                    <CardTitle>
                      <h6 className="title">Cost Analysis</h6>
                    </CardTitle>
                  </CardHeader>
                  <CardBody>
                    <div className="nk-tb-list">
                      {CostAnalysisData.map((item) => (
                        <div key={item.id} className="nk-tb-item">
                          <div className="nk-tb-col">
                            <div>
                              <span className="tb-lead">{item.category}</span>
                              <span className="tb-sub d-block">
                                Value: {item.currentValue} | Maintenance: {item.maintenanceCost}
                              </span>
                              <span className="tb-sub">
                                Utilization: {item.utilizationRate} | ROI: {item.roi}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              </PreviewAltCard>
            </Col>
            <Col lg="4">
              <PreviewAltCard className="h-100">
                <Card className="card-bordered">
                  <CardHeader className="border-bottom">
                    <CardTitle>
                      <h6 className="title">Top Assets</h6>
                    </CardTitle>
                  </CardHeader>
                  <CardBody>
                    <div className="nk-tb-list">
                      {TopAssetsData.map((item) => (
                        <div key={item.id} className="nk-tb-item">
                          <div className="nk-tb-col">
                            <div>
                              <span className="tb-lead">{item.name}</span>
                              <span className="tb-sub d-block">
                                <Badge color={item.theme} pill>
                                  {item.category}
                                </Badge>
                                <span className="ms-2">{item.value}</span>
                              </span>
                              <span className="tb-sub">
                                {item.condition} | Utilization: {item.utilization}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              </PreviewAltCard>
            </Col>
          </Row>
        </Block>
      </Content>
    </>
  );
};

export default AssetAnalytics;
