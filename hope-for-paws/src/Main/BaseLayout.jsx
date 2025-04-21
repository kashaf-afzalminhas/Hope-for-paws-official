import React from 'react';
// import Navbar from './Navbar'

const BaseLayout = ({ children }) => {
  return (
    <div>
      <Navbar />
      <main>{children}</main>
      {/* <Footer /> */}
    </div>
  );
};

export default BaseLayout;