# 🚀 Quick Start Guide - Testing the New Adaptive Profile

## Option 1: Test with Sample Data (Recommended for Quick Testing)

### Step 1: Add Temporary Seeding Route (Development Only)

Add this route to `codable-backend/src/routes/studentRoute.js`:

```javascript
// TEMPORARY - Development only - Remove before production
router.post("/seed-sample-data", 
  authMiddleware.userAuth, 
  async (req, res) => {
    try {
      const { seedSampleData } = await import("../utils/sampleDataSeeder.js");
      await seedSampleData(req.userId);
      res.json({ 
        success: true, 
        message: "Sample data seeded successfully. Refresh the profile page." 
      });
    } catch (error) {
      console.error("Seeding error:", error);
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }
);
```

### Step 2: Add API Method to Frontend

Add this to `codable-frontend/src/services/apiClient.js`:

```javascript
seedSampleData: () => {
    const token = localStorage.getItem('token');
    return request('/student/seed-sample-data', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'omit'
    });
}
```

### Step 3: Call from Browser Console

1. Start backend: `cd codable-backend && npm start`
2. Start frontend: `cd codable-frontend && npm run dev`
3. Login to your application
4. Navigate to Profile page
5. Open browser console (F12)
6. Run: 
   ```javascript
   api.seedSampleData().then(console.log)
   ```
7. Refresh the page
8. You should now see populated analytics!

---

## Option 2: Test with Real Data (Production Approach)

### How Data Gets Populated Naturally

The profile will populate as users:

1. **Solve problems** → Updates `topicMastery`
2. **Make errors** → Updates `errorStats`
3. **Complete sessions** → Updates `performanceHistory`
4. **Use hints** → Updates `behaviorMetrics`

### Simulating Problem Solving

You'll need to integrate profile updates into your code execution/problem-solving flow:

```javascript
// When user solves a problem successfully
await StudentProfile.findOneAndUpdate(
  { userId: userId, 'topicMastery.topicId': topicId },
  {
    $inc: {
      'topicMastery.$.totalAttempts': 1,
      'topicMastery.$.correctAttempts': 1,
      'topicMastery.$.firstAttemptSuccesses': isFirstAttempt ? 1 : 0,
    }
  }
);

// If topic doesn't exist yet
await StudentProfile.findOneAndUpdate(
  { userId: userId },
  {
    $push: {
      topicMastery: {
        topicId: topicId,
        topicName: topicName,
        totalAttempts: 1,
        correctAttempts: 1,
        firstAttemptSuccesses: 1,
        totalProblems: 1,
        hintsUsed: 0,
        lastPracticed: new Date(),
        difficultyLevel: 'beginner',
        codeQualityScores: [85]
      }
    }
  },
  { upsert: true }
);
```

---

## 🧪 Testing Checklist

### Backend Tests

1. **Test Endpoint**
   ```bash
   # Make sure backend is running
   curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/student/profile
   ```

2. **Verify Response Structure**
   - Check that response has `user_profile` object
   - Verify `skill_overview`, `topic_mastery`, etc. exist
   - Ensure calculations are correct

3. **Test with Empty Profile**
   - Create new user
   - Check profile loads without errors
   - Verify default values shown

### Frontend Tests

1. **Loading State**
   - Open profile page
   - Should show loading skeletons
   - Should transition to content

2. **Empty State**
   - Profile with no data should show "Start practicing" messages
   - No errors in console

3. **Populated State**
   - Seed sample data
   - All sections should display correctly
   - Color coding should work
   - Tab navigation should work

4. **Responsive Design**
   - Test on mobile (F12 → Toggle Device Toolbar)
   - Cards should stack properly
   - Table should scroll horizontally

5. **Visual Tests**
   - Skill Overview cards display correctly
   - Topic Mastery table colors match scores
   - Error Intelligence shows progress bars
   - Recommendations show properly

---

## 📊 Expected Output

### Sample Data Results:

**Skill Overview:**
- Overall Skill Rating: ~70
- Proficiency Level: Advanced
- Confidence Score: ~60%
- Recent Growth Rate: +15%

**Topic Mastery:**
- 5 topics with varying scores
- Color-coded badges (red/yellow/green)
- Recommended actions (review/practice/advance)

**Error Intelligence:**
- Syntax: ~41%
- Logic: ~27%
- Runtime: ~18%
- Edge Cases: ~14%

**Learning Behavior:**
- Avg Attempts: ~2.6
- Hint Dependency: ~30%
- Persistence: ~60
- Consistency: 72%

**Performance Trends:**
- Last 7 days: ~75%
- Last 30 days: ~68%
- Stability: ~85%
- Growth: Improving

**Recommendations:**
- Control Flow (Priority: 72)
- OOP (Priority: 67)
- Variables (Priority: 33)

---

## 🐛 Troubleshooting

### Issue: Profile not loading

**Solutions:**
1. Check browser console for errors
2. Verify backend is running (`localhost:3000`)
3. Check token is valid (localStorage.getItem('token'))
4. Verify CORS settings

### Issue: Calculations show 0 or NaN

**Solutions:**
1. Check if profile has data (use sample seeder)
2. Verify division by zero protections in backend
3. Check MongoDB for data: `db.studentprofiles.findOne({ userId: ObjectId("...") })`

### Issue: Components not displaying

**Solutions:**
1. Check for JavaScript errors in console
2. Verify all imports are correct
3. Ensure props are being passed correctly
4. Check if data structure matches expected format

### Issue: Sample data not seeding

**Solutions:**
1. Verify route is added to studentRoute.js
2. Check server console for errors
3. Ensure user is authenticated
4. Verify profile exists for user

---

## 🎨 Visual Preview

### What You Should See:

1. **Header Section**
   - User avatar/initials
   - Full name and membership badge
   - Join date, email, location

2. **4 Skill Overview Cards**
   - Colorful gradient backgrounds
   - Large numbers/values
   - Icon for each metric

3. **Analytics Tab**
   - Performance trends with 3 metrics
   - 2-column grid: Error Intelligence + Recommendations

4. **Topic Mastery Tab**
   - Full-width table
   - 6 columns with data
   - Color-coded badges

5. **Learning Behavior Tab**
   - 4 behavior cards
   - Improvement velocity banner

---

## ✅ Success Criteria

Your refactoring is successful if:

- ✅ Profile page loads without errors
- ✅ All sections display data correctly
- ✅ Loading states work
- ✅ Empty states show appropriate messages
- ✅ Colors match score thresholds
- ✅ Tabs switch smoothly
- ✅ Layout is responsive
- ✅ No console errors
- ✅ Backend calculations are correct
- ✅ Data structure matches documentation

---

## 🎯 Next Steps

1. **Test the sample seeder**
2. **Verify frontend displays correctly**
3. **Integrate with problem-solving flow**
4. **Remove temporary seeding route before production**
5. **Add unit tests for calculations**
6. **Monitor performance with real user data**

---

## 📞 Need Help?

If you encounter issues:

1. Check `PROFILE_REFACTORING_DOCS.md` for detailed documentation
2. Review browser console for errors
3. Check backend logs
4. Verify data in MongoDB
5. Test with sample data first

**Happy Testing!** 🚀
