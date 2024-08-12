import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Reservation } from "@/app/(biz)/biz/types"
import { ResForm } from "../ResForm"

export function DialogDemo({ reservation }: { reservation: Reservation }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <u className=" font-extralight text-sm text-pink-500 cursor-pointer">
          {reservation.res_id}
        </u>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Reservation</DialogTitle>
          <DialogDescription>
            Make changes to the reservation details here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <ResForm reservation={reservation} />
        <DialogFooter>
          <Button type="submit">Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}