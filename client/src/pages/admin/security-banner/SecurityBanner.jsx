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

const SecurityBanner = () => {
  return (
    <React.Fragment>
      <Head title="Admin - Security Banner"></Head>
      <Content>
        <BlockHead size="sm">
          <BlockBetween>
            <BlockHeadContent>
              <BlockTitle tag="h3" page>
                Security Banner
              </BlockTitle>
              <BlockDes className="text-soft">
                <p>Manage system security banners and compliance notifications.</p>
              </BlockDes>
            </BlockHeadContent>
          </BlockBetween>
        </BlockHead>

        <Block>
          <div className="card card-stretch">
            <div className="card-inner">
              <div className="text-center py-5">
                <h5>Security Banner Management</h5>
                <p className="text-soft">This page is under construction. Security banner functionality will be available soon.</p>
              </div>
            </div>
          </div>
        </Block>
      </Content>
    </React.Fragment>
  );
};

export default SecurityBanner;