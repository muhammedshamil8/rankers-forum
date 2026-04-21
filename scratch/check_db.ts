import mongoose from 'mongoose';
import dbConnect from '../src/lib/mongodb';
import { CollegeCutoffModel } from '../src/models/CollegeCutoff';

async function check() {
  await dbConnect();
  const quotas = await CollegeCutoffModel.distinct('quota');
  const categories = await CollegeCutoffModel.distinct('category');
  console.log('Quotas:', quotas);
  console.log('Categories:', categories);
  
  const nriSample = await CollegeCutoffModel.findOne({ quota: /nri/i });
  console.log('NRI Sample:', nriSample);
  
  process.exit(0);
}
check();
