import dbConnect from './src/lib/mongodb';
import { getPreviousYearCutoffs } from './src/lib/services/colleges';

async function testYears() {
  await dbConnect();
  console.log('Connected to DB');

  // Test case: Rank 50000, Category: obc, Year reference: 2025, yearsBack: 2
  // Expect data for 2024 and 2023.
  const options = {
    studentRank: 50000,
    courseName: 'MBBS',
    category: 'obc',
    currentYear: 2025,
    yearsBack: 2
  };

  console.log(`Getting previous year cutoffs for: ${JSON.stringify(options)}`);
  
  const results = await getPreviousYearCutoffs(options);
  
  Object.keys(results).forEach(year => {
    const yr = Number(year);
    const data = results[yr];
    console.log(`\nYear: ${year}`);
    console.log(`Colleges found: ${data.colleges.length}`);
    if (data.colleges.length > 0) {
      console.log(`Sample college year in data: ${data.colleges[0].year}`);
      if (data.colleges[0].year !== yr) {
        console.warn(`!! WARNING: Year mismatch !! Expected ${yr} but found ${data.colleges[0].year}`);
      }
    } else {
      console.log(`No data found for ${year} (Correct if 2023 is empty)`);
    }
  });

  process.exit(0);
}

testYears().catch(err => {
  console.error(err);
  process.exit(1);
});
