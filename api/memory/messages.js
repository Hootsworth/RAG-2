import { addMessage, handleOptions, send } from "../_backend.js";

export default function handler(req, res) {
  if (handleOptions(req, res)) return;
  if (req.method !== "POST") return send(res, 405, { error: "method_not_allowed" });
  const message = addMessage(req.body);
  if (message.error) return send(res, 400, message);
  return send(res, 201, message);
}
