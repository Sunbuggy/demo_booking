import { QrScanHistory } from './QrHistory';
import { UserType } from '@/app/(biz)/biz/users/types'; 

// Scanner page component
const ScanHistoryPage = ({ user }: { user: UserType | null }) => {
  return (
    <div>
      {/* Pass the user directly, no need to access user[0] */}
      <QrScanHistory user={user} />
    </div>
  );
};

export default ScanHistoryPage;
