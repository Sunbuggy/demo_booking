import { DataTable } from "./components/DataTable";
import RealtimeTableListener from "./components/TableListener";

export default function AuditLogPage() {
  return (
    <div>
      <h1>Audit Log</h1>
      <DataTable />
      {/* <RealtimeTableListener tableName="qr_history" /> */}
    </div>
  );
}
