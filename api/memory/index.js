import { getMemory, handleOptions, send } from "../_backend.js";

export default function handler(req, res) {
  if (handleOptions(req, res)) return;
  if (req.method !== "GET") return send(res, 405, { error: "method_not_allowed" });
  return send(res, 200, getMemory());
}
