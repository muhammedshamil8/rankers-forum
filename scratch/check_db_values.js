const mongoose = require('mongoose');
const { CollegeCutoffModel } = require('./src/models/CollegeCutoff');
const dbConnect = require('./src/lib/mongodb').default;

async function checkData() {
  await dbConnect();
  const quotas = await CollegeCutoffModel.distinct('quota');
  const categories = await CollegeCutoffModel.distinct('category');
  const types = await CollegeCutoffModel.distinct('collegeType');
  
  console.log('Unique Quotas:', quotas);
  console.log('Unique Categories:', categories);
  console.log('Unique College Types:', types);
  
  process.exit(0);
}

checkData();
