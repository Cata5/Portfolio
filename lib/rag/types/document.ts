export type FileType =
  | "markdown"
  | "code"
  | "json"
  | "text"
  | "pdf"
  | "html"
  | "csv";

export type DocumentStatus = "indexed" | "pending" | "failed" | "stale";

export interface HeadingHierarchy {
  level: number; // 1 for #, 2 for ##, 3 for ###
  text: string;
  slug: string;
  path: string[]; // e.g. ["Vortex", "Architecture", "Streaming Pipeline"]
}

export interface ChunkMetadata {
  documentId: string;
  chunkId: string;
  parentId?: string;
  title: string;
  heading?: string;
  headingPath?: string[];
  source: string;
  sourceUrl?: string;
  filePath: string;
  fileType: FileType;
  language?: string;
  chunkIndex: number;
  totalChunks: number;
  documentHash: string;
  tokenCount: number;
  charCount: number;
  symbolNames?: string[]; // e.g. ["createSession", "VortexStreamProxy"]
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Chunk {
  id: string;
  documentId: string;
  parentId?: string;
  content: string;
  cleanContent: string;
  metadata: ChunkMetadata;
}

export interface Section {
  heading: HeadingHierarchy;
  content: string;
  codeBlocks?: { language: string; code: string }[];
  tables?: string[];
  lists?: string[];
  children?: Section[];
}

export interface Document {
  id: string;
  title: string;
  filePath: string;
  fileType: FileType;
  language?: string;
  rawContent: string;
  hash: string;
  sections?: Section[];
  chunks: Chunk[];
  metadata: {
    title: string;
    description?: string;
    source: string;
    sourceUrl?: string;
    filePath?: string;
    tags?: string[];
    author?: string;
    status: DocumentStatus;
    errorMessage?: string;
    indexedAt?: number;
    updatedAt: number;
    sizeBytes: number;
  };
}

export interface DocumentRegistryEntry {
  id: string;
  filePath: string;
  fileType: FileType;
  title: string;
  hash: string;
  chunkCount: number;
  tokenCount: number;
  status: DocumentStatus;
  indexedAt: number;
  updatedAt: number;
  sizeBytes: number;
  error?: string;
}
