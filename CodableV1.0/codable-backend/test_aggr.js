import mongoose from 'mongoose';
import ClassAssignment from './src/instructor/models/ClassAssignment.js';
import ClassAssignmentSubmission from './src/models/ClassAssignmentSubmission.js';
import Class from './src/instructor/models/Class.js';

mongoose.connect('mongodb://localhost:27017/codable_db')
  .then(async () => {
    const classes = await Class.find().limit(1);
    if (!classes.length) { console.log('No classes'); process.exit(); }
    const classId = classes[0]._id;
    console.log('Class ID:', classId);
    
    const classIds = [classId];
    const assignmentsAggr = await ClassAssignment.aggregate([
      { $match: { classId: { $in: classIds }, status: 'published' } },
      { $group: { _id: '$classId', count: { $sum: 1 } } }
    ]);
    console.log('assignmentsAggr:', assignmentsAggr);
    
    const submissionsAggr = await ClassAssignmentSubmission.aggregate([
      { $match: { classId: { $in: classIds } } },
      { $group: { _id: '$classId', count: { $sum: 1 } } }
    ]);
    console.log('submissionsAggr:', submissionsAggr);
    
    process.exit();
  })
  .catch(console.error);
