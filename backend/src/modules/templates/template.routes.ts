import express from 'express';

const router = express.Router();

export interface TemplateInfo {
  id: string;
  name: string;
  description: string;
  tier: 'free' | 'pro';
  thumbnailUrl: string;
}

export const TEMPLATES: TemplateInfo[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional and professional layout suitable for corporate and formal invoicing.',
    tier: 'free',
    thumbnailUrl: '/templates/classic.png',
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean, contemporary typography with colored accents for modern service businesses.',
    tier: 'free',
    thumbnailUrl: '/templates/modern.png',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Stripped-back minimalist design highlighting essential invoice figures.',
    tier: 'pro',
    thumbnailUrl: '/templates/minimal.png',
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'High-contrast design with strong headers for creative agencies and studios.',
    tier: 'pro',
    thumbnailUrl: '/templates/bold.png',
  },
];

router.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    data: TEMPLATES,
  });
});

export const templateRoutes = router;
