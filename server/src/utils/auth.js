import { HttpError } from "./httpError.js";

export function getAuthenticatedUserId(req) {
  const id = req.user?.id ?? req.user?._id ?? req.user?.userId;
  if (!id) throw new HttpError(401, "Authentication required.");
  return String(id);
}
