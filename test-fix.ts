import dbConnect from './src/lib/mongodb';
import { getEligibleColleges } from './src/lib/services/colleges';

async function testFix() {
  await dbConnect();
  console.log('Connected to DB');

  // Test case: Rank 6005, Category: obc, Quota: all_india, Course: MBBS, Year: 2025
  const options = {
    studentRank: 6005,
    courseName: 'MBBS',
    category: 'obc',
    quota: 'all_india',
    year: 2025
  };

  console.log(`Searching for colleges with: ${JSON.stringify(options)}`);
  
  const { primary, others } = await getEligibleColleges(options);
  
  console.log('Results found:');
  console.log('Primary colleges count:', primary.length);
  console.log('Other colleges count:', others.length);

  if (primary.length > 0) {
    console.log('Sample primary college:', primary[0].collegeName, 'Category:', primary[0].category, 'Quota:', primary[0].quota);
  }

  process.exit(0);
}

testFix().catch(err => {
  console.error(err);
  process.exit(1);
});
