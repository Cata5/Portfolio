/**
 * The answers pre-compiled by `npm run rag:archive`.
 *
 * Imported statically rather than fetched: the file is part of the bundle, so
 * the static export needs no network request and no base-path handling, and the
 * archive is available the instant a visitor asks something - the same way the
 * CMS content it also answers from is.
 */

import archiveData from "@/content/rag-archive.json";
import type { ArchiveFile } from "./types";

export const ragArchive = archiveData as unknown as ArchiveFile;
