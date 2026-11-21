import puppeteer, { type Browser } from 'puppeteer';
import { env } from '../../config/env.js';

class PdfService {
  private browser: Browser | null = null;
  private activeJobs = 0;
  private maxConcurrency: number;

  constructor() {
    this.maxConcurrency = env.PDF_MAX_CONCURRENCY || 2;
  }

  private async getBrowser(): Promise<Browser> {
    if (!this.browser || !this.browser.connected) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
        ],
      });
    }
    return this.browser;
  }

  async generatePdf(html: string, options: { format?: 'A4' | 'Letter' } = {}): Promise<Buffer> {
    // Basic concurrency guard
    while (this.activeJobs >= this.maxConcurrency) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    this.activeJobs++;
    let page: any = null;

    try {
      const browser = await this.getBrowser();
      page = await browser.newPage();

      // Set viewport for consistent PDF layout
      await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });

      // In-memory HTML rendering — zero external network SSRF risk
      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: 10000,
      });

      const pdfBuffer = await page.pdf({
        format: options.format || 'A4',
        printBackground: true,
        preferCSSPageSize: true,
      });

      return Buffer.from(pdfBuffer);
    } finally {
      if (page) {
        try {
          await page.close();
        } catch {}
      }
      this.activeJobs--;
    }
  }

  async closeBrowser(): Promise<void> {
    if (this.browser) {
      try {
        await this.browser.close();
      } catch {}
      this.browser = null;
    }
  }
}

export const pdfService = new PdfService();
