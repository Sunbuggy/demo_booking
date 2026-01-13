// components/GroupCard.tsx
import DeleteGroupButton from './delete-group-button';

export default function GroupCard({ group }) {
  return (
    <div className="border rounded-md shadow-sm p-3 bg-white">
      {/* --- HEADER --- */}
      <div className="flex justify-between items-center mb-2 border-b pb-2">
        <h4 className="font-bold">{group.group_name}</h4>
        
        {/* PUT THE BUTTON HERE */}
        <DeleteGroupButton groupId={group.id} /> 
      </div>

      {/* --- BODY (Vehicles, Guests, etc) --- */}
      <div className="text-sm">
        {group.vehicles.map(v => (
           <div key={v.id}>{v.quantity}x {v.vehicle_name}</div>
        ))}
      </div>
    </div>
  )
}