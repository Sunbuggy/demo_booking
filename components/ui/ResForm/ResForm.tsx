import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Reservation } from "@/app/(biz)/biz/types";

export function ResForm({ reservation }: { reservation: Reservation }) {
  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="full_name" className="text-right">
          Full Name
        </Label>
        <Input
          id="full_name"
          defaultValue={reservation.full_name}
          className="col-span-3"
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="occasion" className="text-right">
          Occasion
        </Label>
        <Input
          id="occasion"
          defaultValue={reservation.occasion}
          className="col-span-3"
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="occasion" className="text-right">
          Phone
        </Label>
        <Input
          id="phone"
          defaultValue={reservation.phone}
          className="col-span-3"
        />
      </div> 
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="occasion" className="text-right">
          Email
        </Label>
        <Input
          id="email"
          defaultValue={reservation.email}
          className="col-span-3"
        />
      </div> 
         </div>
  );
}
