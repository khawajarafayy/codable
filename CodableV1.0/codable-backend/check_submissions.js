import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const ClassAssignmentSubmission = (await import('./src/models/ClassAssignmentSubmission.js')).default;
    const submissions = await ClassAssignmentSubmission.find({ assignmentType: "coding" }).sort({createdAt:-1}).limit(1).lean();
    console.log(JSON.stringify(submissions, null, 2));
    
    // Also let's check ClassAssignment to see the expected output!
    const ClassAssignment = (await import('./src/models/ClassAssignment.js')).default;
    if (submissions.length > 0) {
       const asg = await ClassAssignment.findById(submissions[0].assignmentId).lean();
       console.log("Assignment details:");
       console.log(JSON.stringify(asg.codingTasks, null, 2));
    }

    process.exit(0);
  });
