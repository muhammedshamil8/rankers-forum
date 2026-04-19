const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function check() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not found');
  
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const collection = db.collection('college_cutoffs');
    
    console.log('Checking available courses...');
    const courses = await collection.distinct('courseName');
    console.log('Available Courses:', courses);
    
    console.log('\nSample for MBBS:');
    const mbbsSample = await collection.findOne({ courseName: /mbbs/i });
    console.log(mbbsSample);
    
    console.log('\nSample for BDS:');
    const bdsSample = await collection.findOne({ courseName: /bds/i });
    console.log(bdsSample);
    
    const bdsCount = await collection.countDocuments({ courseName: /bds/i });
    console.log('\nBDS Count:', bdsCount);
    
  } finally {
    await client.close();
  }
}

check().catch(console.error);
