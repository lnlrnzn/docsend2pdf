import { v4 as uuidv4 } from "uuid";
import type { Job, JobStatus, ScrapeProgress } from "./types";
import { scrapeDocSend } from "./scraper";

const MAX_CONCURRENT = 5;

class JobManager {
  private jobs = new Map<string, Job>();
  private pdfBuffers = new Map<string, Buffer>();
  private listeners = new Map<string, Set<(progress: ScrapeProgress) => void>>();
  private activeCount = 0;
  private queue: string[] = [];

  createJob(url: string): Job {
    const job: Job = {
      id: uuidv4(),
      url,
      status: "queued",
      totalPages: 0,
      currentPage: 0,
      createdAt: Date.now(),
    };
    this.jobs.set(job.id, job);
    return job;
  }

  getJob(jobId: string): Job | undefined {
    return this.jobs.get(jobId);
  }

  getPdfBuffer(jobId: string): Buffer | undefined {
    return this.pdfBuffers.get(jobId);
  }

  subscribe(
    jobId: string,
    listener: (progress: ScrapeProgress) => void
  ): () => void {
    if (!this.listeners.has(jobId)) {
      this.listeners.set(jobId, new Set());
    }
    this.listeners.get(jobId)!.add(listener);
    return () => {
      this.listeners.get(jobId)?.delete(listener);
    };
  }

  private notify(jobId: string, progress: ScrapeProgress) {
    const listeners = this.listeners.get(jobId);
    if (listeners) {
      for (const listener of listeners) {
        listener(progress);
      }
    }
  }

  private updateJob(jobId: string, update: Partial<Job>) {
    const job = this.jobs.get(jobId);
    if (job) {
      Object.assign(job, update);
    }
  }

  async startJob(
    jobId: string,
    options: { email?: string; passcode?: string }
  ) {
    if (this.activeCount >= MAX_CONCURRENT) {
      this.queue.push(jobId);
      return;
    }
    this.activeCount++;
    this.processJob(jobId, options);
  }

  private async processJob(
    jobId: string,
    options: { email?: string; passcode?: string }
  ) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    try {
      this.updateJob(jobId, { status: "scraping" });
      this.notify(jobId, {
        jobId,
        status: "scraping",
        currentPage: 0,
        totalPages: 0,
      });

      const pdfBuffer = await scrapeDocSend(job.url, options, (progress) => {
        this.updateJob(jobId, {
          status: progress.status,
          currentPage: progress.currentPage,
          totalPages: progress.totalPages,
          documentTitle: progress.documentTitle,
        });
        this.notify(jobId, { jobId, ...progress });
      });

      this.pdfBuffers.set(jobId, pdfBuffer);
      this.updateJob(jobId, { status: "done" });
      this.notify(jobId, {
        jobId,
        status: "done",
        currentPage: job.totalPages,
        totalPages: job.totalPages,
        documentTitle: job.documentTitle,
      });

      // Auto-cleanup nach 30 Minuten
      setTimeout(() => {
        this.pdfBuffers.delete(jobId);
        this.jobs.delete(jobId);
        this.listeners.delete(jobId);
      }, 30 * 60 * 1000);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Unbekannter Fehler";
      this.updateJob(jobId, { status: "error", error: errorMsg });
      this.notify(jobId, {
        jobId,
        status: "error",
        currentPage: job.currentPage,
        totalPages: job.totalPages,
        error: errorMsg,
      });
    } finally {
      this.activeCount--;
      this.processQueue(options);
    }
  }

  private processQueue(options: { email?: string; passcode?: string }) {
    while (this.activeCount < MAX_CONCURRENT && this.queue.length > 0) {
      const nextId = this.queue.shift()!;
      this.activeCount++;
      this.processJob(nextId, options);
    }
  }
}

// Singleton (überlebt HMR-Reloads in dev)
const globalForJobManager = globalThis as unknown as { jobManager: JobManager };
export const jobManager = globalForJobManager.jobManager ?? new JobManager();
globalForJobManager.jobManager = jobManager;
