import mongoose from 'mongoose';
import { CollegeCutoffModel } from './src/models/CollegeCutoff';
import dbConnect from './src/lib/mongodb';

async function checkData() {
  await dbConnect();
  console.log('Connected to DB');

  const count = await CollegeCutoffModel.countDocuments();
  console.log('Total documents in colleges_cutoffs:', count);

  const sample = await CollegeCutoffModel.findOne();
  console.log('Sample document:', JSON.stringify(sample, null, 2));

  const years = await CollegeCutoffModel.distinct('year');
  console.log('Available years:', years);

  const categories = await CollegeCutoffModel.distinct('category');
  console.log('Available categories:', categories);

  const quotas = await CollegeCutoffModel.distinct('quota');
  console.log('Available quotas:', quotas);

  const courses = await CollegeCutoffModel.distinct('courseName');
  console.log('Available courses (first 10):', courses.slice(0, 10));

  // Test query similar to what's failing
  const testQuery = {
    year: 2025,
    category: 'OBC', // This is what the code uses after toUpperCase()
    quota: 'ALL INDIA', // This is what the code uses after toUpperCase()
    courseName: 'MBBS'
  };
  const testResults = await CollegeCutoffModel.find(testQuery).limit(5);
  console.log(`Test results for ${JSON.stringify(testQuery)}:`, testResults.length);

  const testQueryLower = {
    year: 2025,
    category: 'obc',
    quota: 'All India',
    courseName: 'MBBS'
  };
  const testResultsLower = await CollegeCutoffModel.find(testQueryLower).limit(5);
  console.log(`Test results for ${JSON.stringify(testQueryLower)}:`, testResultsLower.length);

  process.exit(0);
}

checkData().catch(err => {
  console.error(err);
  process.exit(1);
});
