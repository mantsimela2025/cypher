import React from "react";
import { Outlet } from "react-router-dom";
import FileManagerProvider from "./Context";

const FileManagerProviderWrapper = () => {
  return (
    <FileManagerProvider>
      <Outlet />
    </FileManagerProvider>
  );
};

export default FileManagerProviderWrapper;