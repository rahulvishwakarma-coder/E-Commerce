import type { NextApiRequest, NextApiResponse } from 'next';
import app from '@backend/server';

export const config = {
  api: {
    externalResolver: true,
    bodyParser: false,
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // @ts-ignore
  return app(req, res);
}
