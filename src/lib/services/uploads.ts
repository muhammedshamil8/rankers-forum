import * as XLSX from 'xlsx';
import dbConnect from '../mongodb';
import { UploadLogModel } from '@/models/UploadLog';
import {
  ExcelUploadLog,
  CollegeRankCutoff,
} from '@/types';
import { bulkCreateCutoffs, bulkUpsertCutoffs, getCutoffsByYear, syncCourses, syncLocations } from './colleges';
import { cleanCommas } from '@/lib/utils';

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



function normalizeExcelData(rows: any[], year: number): NormalizedCutoff[] {
  const map = new Map<string, NormalizedCutoff>();

  for (const row of rows) {
    const rawName = (row['College Name'] || row['collegeName'] || '').toString().trim();
    const collegeName = cleanCommas(rawName);
    const courseName = (row['Course Name'] || row['courseName'] || '').toString().trim();
    const category = (row['Allotted Category'] || row['category'] || '').toString().trim();
    
    if (!collegeName || !courseName) continue;

    const rawQuota = (row['Quota'] || '').toString().trim() || '';
    const key = `${collegeName}|${courseName}|${category}|${rawQuota}`;
    const city = cleanCommas((row['City'] || '').toString());
    const state = cleanCommas((row['State'] || '').toString());
    
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
      collegeLocation: cleanCommas(city ? `${city}, ${state}` : state),
      collegeType: normalizedType,
      quota: rawQuota,
      city: city,
      state: state,
      courseName: courseName,
      courseFees: Number(row['Course_fees'] || row['Course Fee'] || 0) || 0,
      category: category,
      rank: Number(row['All India Rank'] || row['rank'] || 0),
      year,
    });
  }

  return Array.from(map.values());
}


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


export async function updateUploadLog(
  id: string,
  data: Partial<ExcelUploadLog>
): Promise<void> {
  await dbConnect();
  await UploadLogModel.findByIdAndUpdate(id, data);
}


export async function processExcelUpload(
  buffer: Buffer,
  uploadedBy: string,
  fileName: string,
  year: number
): Promise<ExcelUploadLog> {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<ExcelRow>(sheet);

  if (rows.length === 0) {
    throw new Error('Excel file is empty');
  }

  const firstRow = rows[0];
  const actualHeaders = Object.keys(firstRow).map(h => h.trim().toLowerCase());
  const missingColumns = EXPECTED_COLUMNS.filter(col => {
    const normalizedCol = col.trim().toLowerCase();
    return !actualHeaders.includes(normalizedCol);
  });

  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
  }

  const headerMap: Record<string, string> = {};
  const actualKeys = Object.keys(firstRow);
  EXPECTED_COLUMNS.forEach(col => {
    const normalizedCol = col.trim().toLowerCase();
    const actualKey = actualKeys.find(k => k.trim().toLowerCase() === normalizedCol);
    if (actualKey) {
      headerMap[col] = actualKey;
    }
  });

  let uploadLog = await createUploadLog(uploadedBy, year, fileName, rows.length);

  const errorLog: string[] = [];
  let validRows: any[] = [];
  let failedRows = 0;

  try {
    for (let i = 0; i < rows.length; i++) {
      const rawRow = rows[i] as any;
      const rowIndex = i + 2;
      const mappedRow: any = {};
      EXPECTED_COLUMNS.forEach(col => {
        mappedRow[col] = rawRow[headerMap[col]];
      });
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

    const normalizedData = normalizeExcelData(validRows, year);
    console.log(`DEBUG: Rows after Excel deduplication: ${normalizedData.length}`);

    const locations = extractLocations(rows);
    const courses = extractCourses(rows);

    const bulkOps = normalizedData.map(item => ({
      updateOne: {
        filter: { 
          collegeName: item.collegeName, 
          courseName: item.courseName, 
          category: item.category, 
          year: item.year,
          quota: item.quota 
        },
        update: { $set: { ...item, updatedAt: new Date() } },
        upsert: true
      }
    }));

    let insertedCount = 0;
    let updatedCount = 0;
    let upsertedCount = 0;

    if (bulkOps.length > 0) {
      const result = await bulkUpsertCutoffs(bulkOps);
      insertedCount = result.insertedCount;
      updatedCount = result.modifiedCount;
      upsertedCount = result.upsertedCount;
      console.log(`DEBUG: bulkWrite Result: Inserted=${insertedCount}, Modified=${updatedCount}, Upserted=${upsertedCount}`);
    }

    await syncLocations(locations);
    await syncCourses(courses);

    const updateData = {
      processedRows: normalizedData.length,
      insertedCount: insertedCount + upsertedCount,
      updatedCount: updatedCount,
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

export async function getUploadLogById(id: string): Promise<ExcelUploadLog | null> {
  await dbConnect();
  
  const doc = await UploadLogModel.findById(id);
  if (!doc) {
    return null;
  }

  return mapLog(doc);
}
