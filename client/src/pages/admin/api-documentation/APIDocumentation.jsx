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

const APIDocumentation = () => {
  return (
    <React.Fragment>
      <Head title="Admin - API Documentation"></Head>
      <Content>
        <BlockHead size="sm">
          <BlockBetween>
            <BlockHeadContent>
              <BlockTitle tag="h3" page>
                API Documentation
              </BlockTitle>
              <BlockDes className="text-soft">
                <p>Access system API documentation and developer resources.</p>
              </BlockDes>
            </BlockHeadContent>
          </BlockBetween>
        </BlockHead>

        <Block>
          <div className="card card-stretch">
            <div className="card-inner">
              <div className="text-center py-5">
                <h5>API Documentation Portal</h5>
                <p className="text-soft">This page is under construction. API documentation functionality will be available soon.</p>
              </div>
            </div>
          </div>
        </Block>
      </Content>
    </React.Fragment>
  );
};

export default APIDocumentation;