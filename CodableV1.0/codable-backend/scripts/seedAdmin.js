import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Admin from '../src/models/Admin.js';

const MONGO = process.env.MONGO_URI;

async function main(){
  if(!MONGO){
    console.error('MONGO_URI not set in environment. Aborting.');
    process.exit(1);
  }

  mongoose.set('strictQuery', false);
  await mongoose.connect(MONGO);

  const email = 'khawaja.admin@codable.com';
  const password = 'codable.admin.fyp';
  const name = 'Khawaja Admin';

  try{
    let existing = await Admin.findOne({ email: email.toLowerCase() });
    if(existing){
      existing.password = password;
      existing.name = name;
      await existing.save();
      console.log('Admin user updated:', email);
    } else {
      const admin = new Admin({ name, email: email.toLowerCase(), password });
      await admin.save();
      console.log('Admin user created:', email);
    }
    process.exit(0);
  }catch(err){
    console.error('Error seeding admin:', err);
    process.exit(2);
  }
}

main();
