import React from "react";
import Content from "@/layout/content/Content";
import Head from "@/layout/head/Head";
import {
  Block,
  BlockBetween,
  BlockDes,
  BlockHead,
  BlockHeadContent,
  BlockTitle,
} from "@/components/Component";

const DistributionGroups = () => {
  return (
    <React.Fragment>
      <Head title="Admin - Distribution Groups"></Head>
      <Content>
        <BlockHead size="sm">
          <BlockBetween>
            <BlockHeadContent>
              <BlockTitle tag="h3" page>
                Distribution Groups
              </BlockTitle>
              <BlockDes className="text-soft">
                <p>Manage user distribution groups and mailing lists.</p>
              </BlockDes>
            </BlockHeadContent>
          </BlockBetween>
        </BlockHead>

        <Block>
          <div className="card card-stretch">
            <div className="card-inner">
              <div className="text-center py-5">
                <h5>Distribution Groups Management</h5>
                <p className="text-soft">This page is under construction. Distribution groups functionality will be available soon.</p>
              </div>
            </div>
          </div>
        </Block>
      </Content>
    </React.Fragment>
  );
};

export default DistributionGroups;