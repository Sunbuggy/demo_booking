import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Reservation } from "@/app/(biz)/biz/types";

export function ResForm({ reservation }: { reservation: Reservation }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
      <div className="flex flex-col gap-1">
        <Label htmlFor="fname" className="">
          First Name
        </Label>
        <Input
          id="fname"
          defaultValue={reservation.fname}
          className="w-full"
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="lname" className="">
          Last Name
        </Label>
        <Input
          id="lname"
          defaultValue={reservation.lname}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="occasion" className="">
          Occasion
        </Label>
        <Input
          id="occasion"
          defaultValue={reservation.occasion}
          className="w-full"
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="phone" className="">
          Phone
        </Label>
        <Input
          id="phone"
          defaultValue={reservation.phone}
          className="w-full"
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="email" className="">
          Email
        </Label>
        <Input
          id="email"
          defaultValue={reservation.email}
          className="w-full"
        />
      </div>
    </div>
  );
}