import React from 'react';
// import Payment from "./acceptHosted";
import { AcceptHosted } from 'react-acceptjs';

const AcceptHostedPage = ({ formToken }: { formToken: string }) => {
  return (
    <div className="flex items-center justify-center">
      {/* <div className="col-auto" /> */}
      {/* <div className="col d-flex align-items-center justify-content-start"> */}
      <AcceptHosted
        formToken={formToken}
        integration="redirect"

        //   environment="PRODUCTION"
      >
        🔒Finalize Payment
      </AcceptHosted>
    </div>
  );
};

export default AcceptHostedPage;
