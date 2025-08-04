import React from "react";
import Content from "@/layout/content/Content";
import Head from "@/layout/head/Head";
import FileManagerTabNavigation from "./TabNavigation";
import { useFileManager } from "./Context";

const FileManagerLayout = ({...props}) => {
  const {fileManager} = useFileManager();

  return (
    <>
      <Head title="Documents and Artifacts"></Head>
      <Content>
        <FileManagerTabNavigation />
        <div className="nk-content-inner">
          <div className="nk-content-body">
            {props.children}
          </div>
        </div>
      </Content>
    </>
  );
};

export default FileManagerLayout;
