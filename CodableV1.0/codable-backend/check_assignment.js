import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const ClassAssignment = (await import('./src/instructor/models/ClassAssignment.js')).default;
    const asg = await ClassAssignment.findById('69efda47898d395ad988ab4d').lean();
    console.log(JSON.stringify(asg.codingTasks, null, 2));
    process.exit(0);
  });
