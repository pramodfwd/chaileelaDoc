import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createServer } from "../server/index";

let app: any;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!app) {
    app = await createServer();
  }

  return app(req, res);
}
