import React from 'react';
import Router from "./route/Index";
import ChatWidget from "./components/ChatWidget";

const App = () => {
  return (
    <>
      <Router />
      {/* Global Chat Widget */}
      <ChatWidget />
    </>
  );
};
export default App;