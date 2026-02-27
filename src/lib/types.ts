export type JobStatus =
  | "queued"
  | "scraping"
  | "building_pdf"
  | "done"
  | "error";

export interface Job {
  id: string;
  url: string;
  status: JobStatus;
  totalPages: number;
  currentPage: number;
  error?: string;
  documentTitle?: string;
  createdAt: number;
}

export interface ScrapeRequest {
  urls: string[];
  email?: string;
  passcode?: string;
}

export interface ScrapeProgress {
  jobId: string;
  status: JobStatus;
  currentPage: number;
  totalPages: number;
  error?: string;
  documentTitle?: string;
}

export interface PageData {
  imageUrl: string;
  directImageUrl?: string;
}
