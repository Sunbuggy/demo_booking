import React from 'react';
import { VehicleTagType } from '../../admin/page';
// (alias) type VehicleTagType = {
//     close_tag_comment: string | null;
//     created_at: string | null;
//     created_by: string | null;
//     created_by_legacy: string | null;
//     id: string;
//     notes: string | null;
//     tag_status: Database["public"]["Enums"]["tag_status"]; // open, closed
//     updated_at: string | null;
//     updated_by: string | null;
//     updated_by_legacy: string | null;
//     vehicle_id: string | null;
// }
const TagForm = ({ id, tag }: { id: string; tag: VehicleTagType | null }) => {
  // create a form to add a new tag to a vehicle with all the necessary fields
  if (tag === null)
    return (
      <div>
        <form>
          <div>
            <label htmlFor="tag-status">Tag Status</label>
            <select id="tag-status" name="tag-status">
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div>
            <label htmlFor="notes">Notes</label>
            <textarea id="notes" name="notes" />
          </div>
          <div>
            <label htmlFor="close-tag-comment">Close Tag Comment</label>
            <textarea id="close-tag-comment" name="close-tag-comment" />
          </div>
          <button type="submit">Submit</button>
        </form>
      </div>
    );
  //   if there is an existing tag, display the tag details and allow the user to edit the tag with all the details displayed
  return (
    <div>
      <form>
        <div>
          <label htmlFor="tag-status">Tag Status</label>
          <select id="tag-status" name="tag-status">
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div>
          <label htmlFor="notes">Notes</label>
          <textarea id="notes" name="notes" />
        </div>
        <div>
          <label htmlFor="close-tag-comment">Close Tag Comment</label>
          <textarea id="close-tag-comment" name="close-tag-comment" />
        </div>
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default TagForm;
