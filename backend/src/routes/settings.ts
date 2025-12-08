import { Router, Request, Response } from 'express';
import type { ApiResponse } from '../types/index.js';
import { loadSettings, saveSettings } from '../services/appSettings.js';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const settings = loadSettings();
  res.json({ success: true, data: settings } as ApiResponse);
});

router.post('/', (req: Request, res: Response) => {
  saveSettings(req.body || {});
  res.json({ success: true } as ApiResponse);
});

export default router;
