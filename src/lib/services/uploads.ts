import * as XLSX from 'xlsx';
import dbConnect from '../mongodb';
import { UploadLogModel } from '@/models/UploadLog';
import {
  ExcelUploadLog,
  CollegeRankCutoff,
} from '@/types';
import { bulkCreateCutoffs, bulkUpsertCutoffs, getCutoffsByYear, syncCourses, syncLocations } from './colleges';

// Expected column headers in the Excel file
const EXPECTED_COLUMNS = [
  'All India Rank',
  'Quota',
  'College Type',
  'College Name',
  'State',
  'City',
  'Course Name',
  'Allotted Category',
  'Course_fees',
] as const;

interface ExcelRow {
  'SI No'?: number;
  'All India Rank': number;
  'Quota': string;
  'College Type': string;
  'College Name': string;
  'State': string;
  'City': string;
  'Course Name': string;
  'Allotted Category': string;
  'Course_fees': number;
}

interface NormalizedCutoff {
  collegeName: string;
  collegeLocation: string;
  collegeType: string;
  quota: string;
  city: string;
  state: string;
  courseName: string;
  courseFees: number;
  category: string;
  rank: number;
  year: number;
}

/**
 * Validate Excel row
 */
function validateRow(row: Record<string, unknown>, rowIndex: number): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!row['College Name']) {
    errors.push(`Row ${rowIndex}: Missing College Name`);
  }
  if (!row['Allotted Category']) {
    errors.push(`Row ${rowIndex}: Missing Allotted Category`);
  }
  if (!row['Course Name']) {
    errors.push(`Row ${rowIndex}: Missing Course Name`);
  }
  const rankStr = row['All India Rank'];
  if (rankStr === undefined || rankStr === null || isNaN(Number(rankStr))) {
    errors.push(`Row ${rowIndex}: Invalid All India Rank`);
  }
  if (row['Course_fees'] !== undefined && isNaN(Number(row['Course_fees']))) {
    errors.push(`Row ${rowIndex}: Invalid Course Fees`);
  }
  if (!row['State']) {
    errors.push(`Row ${rowIndex}: Missing State`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Normalize Excel data in memory - takes LAST occurrence for each unique combination
 */
function normalizeExcelData(rows: any[], year: number): NormalizedCutoff[] {
  const map = new Map<string, NormalizedCutoff>();

  for (const row of rows) {
    const collegeName = (row['College Name'] || row['collegeName'] || '').toString().trim();
    const courseName = (row['Course Name'] || row['courseName'] || '').toString().trim();
    const category = (row['Allotted Category'] || row['category'] || '').toString().trim();
    
    if (!collegeName || !courseName) continue;

    // Create unique key for deduplication
    const key = `${collegeName}|${courseName}|${category}`;

    // Always overwrite with later row (last wins)
    const city = (row['City'] || '').toString().trim();
    const state = (row['State'] || '').toString().trim();
    
    // Normalize college type based on instructions:
    // 'government' (govt), 'private', 'deemed' (private university)
    const rawType = (row['College Type'] || row['collegeType'] || '').toString().trim().toLowerCase();
    let normalizedType = rawType;
    
    if (rawType.includes('govt')) {
      normalizedType = 'government';
    } else if (rawType.includes('private university') || rawType.includes('deemed')) {
      normalizedType = 'deemed';
    } else if (rawType.includes('private')) {
      normalizedType = 'private';
    }
    
    map.set(key, {
      collegeName: collegeName,
      collegeLocation: city ? `${city}, ${state}` : state,
      collegeType: normalizedType,
      quota: (row['Quota'] || '').toString().trim() || '',
      city: (row['City'] || '').toString().trim() || '',
      state: (row['State'] || '').toString().trim() || '',
      courseName: courseName,
      courseFees: Number(row['Course_fees'] || row['Course Fee'] || 0) || 0,
      category: category,
      rank: Number(row['All India Rank'] || row['rank'] || 0),
      year,
    });
  }

  return Array.from(map.values());
}

/**
 * Extract unique locations from rows
 */
function extractLocations(rows: ExcelRow[]): string[] {
  const locations = new Set<string>();

  for (const row of rows) {
    const city = row['City']?.toString().trim();
    const state = row['State']?.toString().trim();
    if (city && state) {
      locations.add(`${city}, ${state}`);
    } else if (state) {
      locations.add(state);
    }
  }

  return Array.from(locations);
}

/**
 * Extract unique courses from rows
 */
function extractCourses(rows: ExcelRow[]): string[] {
  const courses = new Set<string>();

  for (const row of rows) {
    const course = row['Course Name']?.trim();
    if (course) {
      courses.add(course);
    }
  }

  return Array.from(courses);
}

function mapLog(doc: any): ExcelUploadLog {
  const data = doc.toObject ? doc.toObject() : doc;
  return {
    id: data._id.toString(),
    uploadedBy: data.uploadedBy,
    year: data.year,
    fileName: data.fileName,
    totalRows: data.totalRows,
    processedRows: data.processedRows,
    insertedCount: data.insertedCount || 0,
    updatedCount: data.updatedCount || 0,
    skippedCount: data.skippedCount || 0,
    failedRows: data.failedRows,
    errorLog: data.errorLog,
    status: data.status,
    createdAt: data.createdAt,
    completedAt: data.completedAt,
  } as ExcelUploadLog;
}

/**
 * Create upload log
 */
export async function createUploadLog(
  uploadedBy: string,
  year: number,
  fileName: string,
  totalRows: number
): Promise<ExcelUploadLog> {
  await dbConnect();
  
  const log = await UploadLogModel.create({
    uploadedBy,
    year,
    fileName,
    totalRows,
    processedRows: 0,
    failedRows: 0,
    errorLog: [],
    status: 'processing',
    completedAt: null,
  });

  return mapLog(log);
}

/**
 * Update upload log progress
 */
export async function updateUploadLog(
  id: string,
  data: Partial<ExcelUploadLog>
): Promise<void> {
  await dbConnect();
  await UploadLogModel.findByIdAndUpdate(id, data);
}

/**
 * Process Excel file for college data upload - OPTIMIZED with bulk operations
 */
export async function processExcelUpload(
  buffer: Buffer,
  uploadedBy: string,
  fileName: string,
  year: number
): Promise<ExcelUploadLog> {
  // Parse Excel file
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<ExcelRow>(sheet);

  if (rows.length === 0) {
    throw new Error('Excel file is empty');
  }

  // Validate headers (Case-insensitive and trim spaces)
  const firstRow = rows[0];
  const actualHeaders = Object.keys(firstRow).map(h => h.trim().toLowerCase());
  const missingColumns = EXPECTED_COLUMNS.filter(col => {
    const normalizedCol = col.trim().toLowerCase();
    return !actualHeaders.includes(normalizedCol);
  });

  if (missingColumns.length > 0) {
    // Try to find the closest match for the error message
    throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
  }

  // Create a mapping of expected columns to actual header keys found in the file
  const headerMap: Record<string, string> = {};
  const actualKeys = Object.keys(firstRow);
  EXPECTED_COLUMNS.forEach(col => {
    const normalizedCol = col.trim().toLowerCase();
    const actualKey = actualKeys.find(k => k.trim().toLowerCase() === normalizedCol);
    if (actualKey) {
      headerMap[col] = actualKey;
    }
  });

  // Create upload log
  let uploadLog = await createUploadLog(uploadedBy, year, fileName, rows.length);

  const errorLog: string[] = [];
  let validRows: any[] = [];
  let failedRows = 0;

  try {
    // Step 1: Validate all rows using the headerMap
    for (let i = 0; i < rows.length; i++) {
      const rawRow = rows[i] as any;
      const rowIndex = i + 2;

      // Remap raw row keys to expected column names for validation and normalization
      const mappedRow: any = {};
      EXPECTED_COLUMNS.forEach(col => {
        mappedRow[col] = rawRow[headerMap[col]];
      });
      // Add SI No if it exists
      if (rawRow['SI No']) mappedRow['SI No'] = rawRow['SI No'];
      if (rawRow['SI. No']) mappedRow['SI No'] = rawRow['SI. No'];
      if (rawRow['S.No']) mappedRow['SI No'] = rawRow['S.No'];
      if (rawRow['Sl No']) mappedRow['SI No'] = rawRow['Sl No'];
      if (rawRow['Sl. No']) mappedRow['SI No'] = rawRow['Sl. No'];
      if (rawRow['Sr No']) mappedRow['SI No'] = rawRow['Sr No'];
      if (rawRow['Sr. No']) mappedRow['SI No'] = rawRow['Sr. No'];

      const validation = validateRow(mappedRow, rowIndex);

      if (!validation.valid) {
        errorLog.push(...validation.errors);
        failedRows++;
      } else {
        validRows.push(mappedRow);
      }
    }

    console.log(`DEBUG: Total rows in Excel: ${rows.length}`);
    console.log(`DEBUG: Failed validation: ${failedRows}`);
    console.log(`DEBUG: Valid rows for processing: ${validRows.length}`);

    // Step 2: Normalize data (validRows are now already mapped to EXPECTED_COLUMNS keys)
    const normalizedData = normalizeExcelData(validRows, year);
    console.log(`DEBUG: Rows after deduplication: ${normalizedData.length}`);

    // Step 3: Extract unique locations and courses (Still here for compatibility with callers, handled automatically by MongoDB distincts)
    const locations = extractLocations(rows);
    const courses = extractCourses(rows);

    // Step 4: Refactored: Fetch all existing MongoDB records for this year for in-memory comparison
    console.log(`DEBUG: Fetching existing cutoffs for year ${year}...`);
    const existingCutoffs = await getCutoffsByYear(year);
    
    // Build an in-memory Map for existing DB records using a unique key
    const dbMap = new Map<string, CollegeRankCutoff>();
    existingCutoffs.forEach(item => {
      const key = `${item.collegeName}|${item.courseName}|${item.category}|${item.year}`;
      dbMap.set(key, item);
    });

    // Build another Map for normalized Excel data
    const excelMap = new Map<string, NormalizedCutoff>();
    normalizedData.forEach(item => {
      const key = `${item.collegeName}|${item.courseName}|${item.category}|${item.year}`;
      excelMap.set(key, item);
    });

    const bulkOps: any[] = [];
    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    // Step 5: Compare both datasets and build bulk operations
    for (const [key, excelItem] of excelMap.entries()) {
      const dbItem = dbMap.get(key);

      if (!dbItem) {
        // CASE: Key exists only in Excel -> INSERT
        insertedCount++;
        bulkOps.push({
          updateOne: {
            filter: { 
              collegeName: excelItem.collegeName, 
              courseName: excelItem.courseName, 
              category: excelItem.category, 
              year: excelItem.year 
            },
            update: { $set: { ...excelItem, createdAt: new Date() } },
            upsert: true
          }
        });
      } else {
        // CASE: Key exists in both -> Check for changes
        const isChanged = (
          dbItem.rank !== excelItem.rank ||
          dbItem.courseFees !== excelItem.courseFees ||
          dbItem.collegeType !== excelItem.collegeType ||
          dbItem.quota !== excelItem.quota ||
          dbItem.city !== excelItem.city ||
          dbItem.state !== excelItem.state ||
          dbItem.collegeLocation !== excelItem.collegeLocation
        );

        if (isChanged) {
          // UPDATE
          updatedCount++;
          bulkOps.push({
            updateOne: {
              filter: { 
                collegeName: excelItem.collegeName, 
                courseName: excelItem.courseName, 
                category: excelItem.category, 
                year: excelItem.year 
              },
              update: { $set: excelItem },
              upsert: true
            }
          });
        } else {
          // SKIP/UNCHANGED
          skippedCount++;
        }
      }
    }

    console.log(`DEBUG: Stats: INSERTED=${insertedCount}, UPDATED=${updatedCount}, SKIPPED=${skippedCount}`);

    // Step 6: Execute bulk write if there are operations
    let finalProcessedCount = 0;
    if (bulkOps.length > 0) {
      const { insertedCount, modifiedCount, upsertedCount } = await bulkUpsertCutoffs(bulkOps);
      finalProcessedCount = insertedCount + modifiedCount + upsertedCount;
      console.log(`DEBUG: bulkWrite Result: Inserted=${insertedCount}, Modified=${modifiedCount}, Upserted=${upsertedCount}`);
    }

    // Step 7: Sync locations and courses (Trigger the legacy stubs)
    await syncLocations(locations);
    await syncCourses(courses);

    // Final update
    const updateData = {
      processedRows: insertedCount + updatedCount,
      insertedCount,
      updatedCount,
      skippedCount,
      failedRows,
      errorLog,
      status: failedRows === rows.length ? 'failed' : 'completed',
      completedAt: new Date(),
    } as any;
    
    await updateUploadLog(uploadLog.id, updateData);

    return {
      ...uploadLog,
      ...updateData
    };
  } catch (error) {
    await updateUploadLog(uploadLog.id, {
      status: 'failed',
      errorLog: [...errorLog, (error as Error).message],
      completedAt: new Date() as any,
    });

    throw error;
  }
}

/**
 * Get upload logs with optional filters
 */
export async function getUploadLogs(options: {
  year?: number;
  status?: ExcelUploadLog['status'];
  limit?: number;
} = {}): Promise<ExcelUploadLog[]> {
  await dbConnect();

  let query: any = {};

  if (options.year) {
    query.year = options.year;
  }

  if (options.status) {
    query.status = options.status;
  }

  let dbQuery = UploadLogModel.find(query).sort({ createdAt: -1 });
  
  if (options.limit) {
    dbQuery = dbQuery.limit(options.limit);
  }

  const logs = await dbQuery.exec();
  return logs.map(mapLog);
}

/**
 * Get upload log by ID
 */
export async function getUploadLogById(id: string): Promise<ExcelUploadLog | null> {
  await dbConnect();
  
  const doc = await UploadLogModel.findById(id);
  if (!doc) {
    return null;
  }

  return mapLog(doc);
}
