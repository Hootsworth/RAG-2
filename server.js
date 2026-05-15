import { createServer } from "./src/server/app.js";

const port = Number(process.env.PORT || 5173);
const server = createServer();

server.listen(port, () => {
  console.log(`Memory OS backend listening on http://localhost:${port}`);
});
