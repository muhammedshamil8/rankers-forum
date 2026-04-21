import dbConnect from '../mongodb';
import { CollegeCutoffModel } from '@/models/CollegeCutoff';
import {
  CollegeRankCutoff,
  CollegeWithChance,
  ChanceLevel,
  CollegeType,
} from '@/types';


export function calculateChance(studentRank: number, closingRank: number): ChanceLevel {
  if (studentRank > closingRank) {
    return 'not_eligible';
  }

  const margin = closingRank - studentRank;
  const percentage = (margin / closingRank) * 100;

  if (percentage >= 20) return 'high';
  if (percentage >= 10) return 'moderate';
  return 'low';
}


export function getChanceLabel(chance: ChanceLevel): string {
  switch (chance) {
    case 'high': return 'High Chance';
    case 'moderate': return 'Moderate Chance';
    case 'low': return 'Low Chance';
    case 'not_eligible': return 'Not Eligible';
  }
}


export async function bulkCreateCutoffs(
  cutoffs: Omit<CollegeRankCutoff, 'id' | 'createdAt'>[]
): Promise<number> {
  await dbConnect();
  if (cutoffs.length === 0) return 0;
  
  try {
    const collection = CollegeCutoffModel.collection;
    const result = await collection.insertMany(cutoffs, { ordered: false });
    return result.insertedCount || 0;
  } catch (error: any) {
    if (error.result && error.result.insertedCount) {
      console.log(`DEBUG: Bulk write had partial success: ${error.result.insertedCount} inserted.`);
      return error.result.insertedCount;
    }
    console.error('DEBUG: Native bulk insert failed completely:', error);
    return 0;
  }
}


export async function bulkUpsertCutoffs(
  operations: any[]
): Promise<{ insertedCount: number; modifiedCount: number; upsertedCount: number }> {
  await dbConnect();
  if (operations.length === 0) {
    return { insertedCount: 0, modifiedCount: 0, upsertedCount: 0 };
  }

  try {
    const collection = CollegeCutoffModel.collection;
    const result = await collection.bulkWrite(operations, { ordered: false });
    
    return {
      insertedCount: result.insertedCount || 0,
      modifiedCount: result.modifiedCount || 0,
      upsertedCount: result.upsertedCount || 0,
    };
  } catch (error: any) {
    console.error('DEBUG: Bulk write failed:', error);
    if (error.result) {
      return {
        insertedCount: error.result.insertedCount || 0,
        modifiedCount: error.result.modifiedCount || 0,
        upsertedCount: error.result.upsertedCount || 0,
      };
    }
    return { insertedCount: 0, modifiedCount: 0, upsertedCount: 0 };
  }
}


const CATEGORY_MAPPING: Record<string, string[] | RegExp> = {
  general: ['GM', 'GMH', 'GMK', 'GMKH', 'GMR', 'GMRH', 'OPN'],
  obc: /^(1|2A|2B|3A|3B)/i,
  sc: /^SC/i,
  st: /^ST/i,
  ews: /^EWS/i,
};

const QUOTA_MAPPING: Record<string, string[]> = {
  state: ['GOVT', 'PRIV', 'MANAGEMENT', 'NRI', 'GOVERNMENT', 'PRIVATE', 'MGMT'],
  all_india: ['AIQ', 'GOVT', 'ALL INDIA', 'MANAGEMENT'],
  deemed: ['AIQ', 'DEEMED', 'PAID', 'NRI', 'ALL INDIA QUOTA', 'MANAGEMENT', 'MNG'],
};


export async function deleteCutoffsByYear(year: number): Promise<number> {
  await dbConnect();
  const res = await CollegeCutoffModel.deleteMany({ year });
  return res.deletedCount || 0;
}


export async function getEligibleColleges(options: {
  studentRank: number;
  courseName: string;
  category: string;
  year: number;
  counsellingType: 'state' | 'all_india' | string;
  tab?: string;
  collegeType?: CollegeType;
  locations?: string[];
  disableYearFallback?: boolean;
}): Promise<{ primary: CollegeWithChance[]; others: CollegeWithChance[] }> {
  await dbConnect();

  const categorySearch = options.category.toLowerCase();
  const counsellingType = options.counsellingType.toLowerCase();
  const tab = options.tab?.toLowerCase() || '';
  let quotaFilter: string[] | null = null;

  if (counsellingType === 'state') {
    if (tab === 'government') quotaFilter = ['GOVT', 'GOVERNMENT', 'G'];
    else if (tab === 'private') quotaFilter = ['PRIV', 'PRIVATE', 'PVT', 'P'];
    else if (tab === 'management') quotaFilter = ['OTHERS', 'MGMT', 'MANAGEMENT', 'MNG', 'OTHER', 'MQ', 'M'];
    else if (tab === 'nri') quotaFilter = ['NRI', 'NRI QUOTA', 'N'];
    else quotaFilter = ['GOVT', 'GOVERNMENT', 'PRIV', 'PRIVATE', 'OTHERS', 'MGMT', 'MANAGEMENT', 'MNG', 'NRI'];
  } else {
    if (tab === 'aiq') quotaFilter = ['AIQ', 'ALL INDIA', 'ALL INDIA QUOTA'];
    else if (tab === 'paid') quotaFilter = ['DEEMED', 'PAID', 'MNG', 'OTHERS', 'MANAGEMENT', 'DEEMED UNIVERSITY'];
    else if (tab === 'nri') quotaFilter = ['NRI', 'NRI QUOTA'];
    else quotaFilter = QUOTA_MAPPING['all_india'];
  }

  let categoryFilter: string | string[] | RegExp = CATEGORY_MAPPING[categorySearch] || options.category;

  if (tab === 'nri' || tab === 'management') {
    categoryFilter = /.*/; 
  }

  let targetYear = options.year;

  const checkQuery: any = {
    year: targetYear,
    courseName: { $regex: new RegExp(`^${options.courseName}$`, 'i') },
  };

  if (categoryFilter instanceof RegExp) {
    checkQuery.category = categoryFilter;
  } else if (Array.isArray(categoryFilter)) {
    checkQuery.category = { $in: categoryFilter };
  } else {
    checkQuery.category = new RegExp(`^${categoryFilter}$`, 'i');
  }

  if (quotaFilter) {
    if (Array.isArray(quotaFilter)) {
      checkQuery.quota = { $in: quotaFilter.map(q => new RegExp(`^${q}$`, 'i')) };
    } else {
      checkQuery.quota = new RegExp(`^${quotaFilter}$`, 'i');
    }
  }

  const initialCheck = await CollegeCutoffModel.findOne(checkQuery);
  
  if (!initialCheck && !options.disableYearFallback) {
    const latestYearDoc = await CollegeCutoffModel.findOne({
      ...checkQuery,
      year: { $exists: true },
    }).sort({ year: -1 });
    
    if (latestYearDoc) {
      targetYear = latestYearDoc.year;
      console.log(`DEBUG: Falling back from year ${options.year} to ${targetYear} as no records found`);
    }
  }

  const query: any = {
    courseName: { $regex: new RegExp(`^${options.courseName}$`, 'i') },
    year: targetYear,
    rank: { $gte: options.studentRank },
  };

  if (categoryFilter instanceof RegExp) {
    query.category = categoryFilter;
  } else if (Array.isArray(categoryFilter)) {
    query.category = { $in: categoryFilter };
  } else {
    query.category = new RegExp(`^${categoryFilter}$`, 'i');
  }

  if (quotaFilter) {
    if (Array.isArray(quotaFilter)) {
      query.quota = { $in: quotaFilter.map(q => new RegExp(`^${q}$`, 'i')) };
    } else {
      query.quota = new RegExp(`^${quotaFilter}$`, 'i');
    }
  }

  const locationsQuery = { ...query };
  let isFallback = false;

  if (options.locations && options.locations.length > 0) {
    locationsQuery.collegeLocation = { 
      $in: options.locations.map(loc => new RegExp(loc, 'i'))
    };
  }

  let docs = await CollegeCutoffModel.find(locationsQuery)
    .sort({ rank: 1 })
    .limit(100);

  if (docs.length < 20 && options.locations && options.locations.length > 0) {
    docs = await CollegeCutoffModel.find(query)
      .sort({ rank: 1 })
      .limit(100);
    isFallback = true;
  }

  const primary: CollegeWithChance[] = [];
  const others: CollegeWithChance[] = [];
  const locationSet = options.locations ? new Set(options.locations) : null;

  docs.forEach(doc => {
    const data = doc.toObject();
    const chance = calculateChance(options.studentRank, data.rank);

    const college = {
      id: doc._id.toString(),
      ...data,
      chance,
      chanceLabel: getChanceLabel(chance),
    } as CollegeWithChance;

    if (options.locations && options.locations.length > 0) {
      if (isFallback) {
        if (locationSet?.has(data.collegeLocation)) {
          primary.push(college);
        } else {
          others.push(college);
        }
      } else {
        primary.push(college);
      }
    } else {
      primary.push(college);
    }
  });

  return { primary, others };
}


interface PreviousYearCutoffs {
  colleges: CollegeWithChance[];
  otherColleges: CollegeWithChance[];
  totalCount: number;
}
export async function getPreviousYearCutoffs(options: {
  studentRank: number;
  courseName: string;
  category: string;
  currentYear: number;
  yearsBack?: number;
  collegeType?: CollegeType;
  locations?: string[];
}): Promise<Record<number, PreviousYearCutoffs>> {
  const yearsBack = options.yearsBack || 2;
  const results: Record<number, PreviousYearCutoffs> = {};

  for (let i = 1; i <= yearsBack; i++) {
    const year = options.currentYear - i;
    const { primary, others } = await getEligibleColleges({
      studentRank: options.studentRank,
      courseName: options.courseName,
      category: options.category,
      year,
      counsellingType: 'state', 
      collegeType: options.collegeType,
      locations: options.locations,
      disableYearFallback: true,
    });

    results[year] = { colleges: primary, otherColleges: others, totalCount: primary.length + others.length };
  }

  return results;
}


export async function getCutoffsByYear(year: number): Promise<CollegeRankCutoff[]> {
  await dbConnect();
  const docs = await CollegeCutoffModel.find({ year }).lean();
  return docs as unknown as CollegeRankCutoff[];
}


export async function getAvailableYears(): Promise<number[]> {
  await dbConnect();
  const years = await CollegeCutoffModel.distinct('year');
  return years.sort((a, b) => b - a);
}


export interface Location {
  id: string;
  name: string;
  isActive: boolean;
}

export async function syncLocations(locationNames: string[]): Promise<number> {
  return locationNames.length;
}


export async function getLocations(): Promise<Location[]> {
  await dbConnect();
  const rawLocations = await CollegeCutoffModel.distinct('collegeLocation');
  
  return rawLocations
    .filter(name => name)
    .map((name, i) => ({
      id: `loc-${i}`,
      name,
      isActive: true,
    }));
}


export interface Course {
  id: string;
  name: string;
  isActive: boolean;
}

export async function syncCourses(courseNames: string[]): Promise<number> {
  return courseNames.length;
}


export async function getCourses(): Promise<Course[]> {
  await dbConnect();
  const rawCourses = await CollegeCutoffModel.distinct('courseName');
  
  return rawCourses
    .filter(name => name)
    .map((name, i) => ({
      id: `course-${i}`,
      name,
      isActive: true,
    }));
}
