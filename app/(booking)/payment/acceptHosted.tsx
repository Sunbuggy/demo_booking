'use client';
import React, { Dispatch, SetStateAction } from 'react';
// import Payment from "./acceptHosted";
import { AcceptHosted } from 'react-acceptjs';

const AcceptHostedPage = ({
  formToken,
  setResponse
}: {
  formToken: string;
  setResponse: Dispatch<SetStateAction<string>>;
}) => {
  return (
    <div>
      {/* <div className="col-auto" /> */}
      {/* <div className="col d-flex align-items-center justify-content-start"> */}
      <AcceptHosted
        formToken={formToken}
        integration="iframe"
        onTransactionResponse={(response) =>
          setResponse(JSON.stringify(response, null, 2) + '\n')
        }
        onCancel={() => setResponse((prevState) => prevState + 'Cancelled!\n')}
        onSuccessfulSave={() =>
          setResponse((prevState) => prevState + 'Successful save!\n')
        }
        onResize={(w, h) =>
          setResponse(
            (prevState) =>
              prevState + `Received resize message to ${w} x ${h}!\n`
          )
        }
        //   environment="PRODUCTION"
      >
        <AcceptHosted.Button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-zinc-950 dark:focus-visible:ring-zinc-300 bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90 h-10 px-4 py-2 mb-5">
          🔒Finalize Payment
        </AcceptHosted.Button>
        {/* <AcceptHosted.IFrameBackdrop /> */}
        {/* <AcceptHosted.IFrameContainer> */}
        <AcceptHosted.IFrame className="w-[360px] h-[800px] overflow-auto" />
        {/* </AcceptHosted.IFrameContainer> */}
      </AcceptHosted>
    </div>
  );
};

export default AcceptHostedPage;
