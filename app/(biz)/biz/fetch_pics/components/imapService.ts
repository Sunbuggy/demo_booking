// /* eslint-disable @typescript-eslint/no-unused-vars */
// /* eslint-disable import/no-anonymous-default-export */
// /* eslint-disable @typescript-eslint/no-explicit-any */
// /* eslint-disable @typescript-eslint/no-non-null-assertion */
// // connect to my gmail using the imap protocol and the imap package
// import Imap, { type Box, type ImapFetch, type ImapMessage } from "imap";
// import { type NextApiRequest, type NextApiResponse } from "next";
// import { type Source, simpleParser } from "mailparser";
// import fs from "fs";
// import path from "path";
// export default (req: NextApiRequest, res: NextApiResponse) => {
//   const imap = new Imap({
//     user: process.env.GOOGLE_EMAIL!,
//     password: process.env.GOOGLE_PASSWORD!,
//     host: "imap.gmail.com",
//     port: 993,
//     tls: true,
//     tlsOptions: { rejectUnauthorized: false },
//   });

//   function openInbox(cb: (error: Error, mailbox: Box) => void) {
//     imap.openBox("INBOX", true, cb);
//   }

//   imap.once("ready", function () {
//     openInbox(function (err: any, box: any) {
//       if (err) throw err;

//       // Search for emails from "jjOb"
//       imap.search(
//         ["ALL", ["TO", "SBVegas"]],
//         function (err: any, results: any) {
//           if (err) throw err;

//           const fetch: ImapFetch = imap.fetch(results, { bodies: "" });

//           fetch.on("message", function (msg: ImapMessage) {
//             msg.on("body", function (stream) {
//               const mailparser = simpleParser(stream as unknown as Source); // Pass the stream to simpleParser

//               mailparser
//                 .then((mail) => {
//                   const dateStr = mail.date || "";
//                   const date = new Date(dateStr);
//                   const formattedDate = `${date.toDateString()}`;
//                   // let's get the year, month, and day separately
//                   const year = date.getFullYear();
//                   const month = date.getMonth() + 1;
//                   const day = date.getDate();

//                   mail.attachments?.forEach((attachment, index) => {
//                     const outputDirectory = path.join(
//                       process.cwd(),
//                       `public/daily-pics/${year}/${month}/${day}/${(
//                         mail.subject || ""
//                       ).toLocaleUpperCase()}`
//                     );
//                     fs.mkdirSync(outputDirectory, { recursive: true });

//                     const outputFilePath = path.join(
//                       outputDirectory,
//                       `${attachment.filename || ""}`
//                     );

//                     // Check if the file exists
//                     if (!fs.existsSync(outputFilePath)) {
//                       fs.writeFileSync(outputFilePath, attachment.content);
//                     }
//                   });
//                 })
//                 .catch((err) => console.error(err));
//             });
//           });

//           fetch.once("error", function (err: string) {
//             console.log("Fetch error: " + err);
//           });

//           fetch.once("end", function () {
//             console.log("Done fetching all messages!");
//             res.status(200).json({ message: "Emails fetched successfully" });

//             imap.end();
//           });
//         }
//       );
//     });
//   });
//   imap.once("error", function (err: any) {
//     console.log(err);
//   });

//   imap.once("end", function () {
//     console.log("Connection ended");
//     res.status(200).json({ message: "Emails fetched successfully" });
//   });

//   imap.connect();
// };