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

const EnvironmentSettings = () => {
  return (
    <React.Fragment>
      <Head title="Admin - Environment Settings"></Head>
      <Content>
        <BlockHead size="sm">
          <BlockBetween>
            <BlockHeadContent>
              <BlockTitle tag="h3" page>
                Environment Settings
              </BlockTitle>
              <BlockDes className="text-soft">
                <p>Manage environment-specific configurations and deployment settings.</p>
              </BlockDes>
            </BlockHeadContent>
          </BlockBetween>
        </BlockHead>

        <Block>
          <div className="card card-stretch">
            <div className="card-inner">
              <div className="text-center py-5">
                <h5>Environment Settings Management</h5>
                <p className="text-soft">This page is under construction. Environment settings functionality will be available soon.</p>
              </div>
            </div>
          </div>
        </Block>
      </Content>
    </React.Fragment>
  );
};

export default EnvironmentSettings;