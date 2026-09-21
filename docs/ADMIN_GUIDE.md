# Admin Guide - New Features

## Quick Start for Admins

### 1. Setting Up PIN Code for Exams

#### Step 1: Create an Exam
1. Go to **Admin Dashboard** → Click **"Create New Exam"**
2. Fill in exam details:
   - Exam Title (e.g., "Math Quiz")
   - Duration in Minutes (e.g., 30)
   - Instructions
   - Security Level

#### Step 2: Add PIN Code (Optional but Recommended)
In the exam creation form, look for the **"PIN Code"** field:
- Leave empty for no PIN requirement (anyone assigned can take it)
- Enter a 4-6 digit code (e.g., 1234) for added security
- PIN is checked before student can see questions

#### Step 3: Add Questions
1. Add questions to your exam
2. Questions are shown in green preview section
3. Can remove questions before saving

#### Step 4: Save Exam
Click **"Save Exam"** - exam is now created but draft status

#### Step 5: Activate & Assign
1. Exam appears in "Exams" section on admin dashboard
2. Click **"Assign"** to select which students can take it
3. Optional: Toggle **"Is Active"** to make it available
4. Students will see it on their dashboard if assigned

---

### 2. Managing Exams

#### Viewing Exams
- All exams appear in list on Admin Dashboard
- Shows title and status (Active/Draft)
- Three buttons next to each exam:

**Assign Button** (Blue)
- Opens student selection modal
- Search for students
- Select multiple students
- Click confirm to assign

**Results Button** (Gray)
- View all submissions for this exam
- See scores, student names, dates
- Download results if needed

**Delete Button** (Red) - NEW!
- Removes exam permanently
- Shows confirmation dialog
- Deletes all questions, assignments, and submissions
- ⚠️ Cannot be undone!

---

### 3. PIN Security Best Practices

#### When to Use PIN Codes:
✅ **Important exams** (final exams, certifications)
✅ **Prevent accidental access** (wrong exam clicked)
✅ **Timed proctored exams** (when you share PIN verbally)
✅ **Sensitive assessments** (needs extra authentication)

#### When NOT to Use PIN:
❌ **Practice quizzes** (low stakes)
❌ **Self-paced learning** (easy access preferred)
❌ **Diagnostic tests** (no security needed)

#### PIN Code Guidelines:
- Use 4-6 digits for memorability
- Avoid sequential numbers (1234) or repeated digits (1111)
- For verbal PIN delivery: Use random numbers
- For written PIN delivery: Make it short (4 digits)
- Example secure PIN: 7392

#### During Exam Administration:
1. Share PIN with students when exam starts
2. Remind them to enter exactly as you specified
3. PINs are case-insensitive for numbers only
4. One PIN per exam (not per student)

---

### 4. Student Profile Management - NEW!

#### View Student Profiles:
1. Go to Admin Dashboard
2. In "Students" section, student credentials show profile info
3. Currently shows username (password locked for students)

#### What Students Can Change:
✅ First Name
✅ Last Name  
✅ Email Address
✅ Custom profile information

#### What Students CANNOT Change:
❌ Username (permanent identifier)
❌ Password (requires admin reset)
❌ Role (admin/student status)

#### Helping Students:
- Students access profile via "Profile" button on their dashboard
- They can self-manage their information
- If they need password reset, they must contact you
- No way for students to change password themselves (security feature)

---

### 5. Deleting Exams

#### When to Delete:
- Exam no longer needed
- Duplicate exam created
- Exam data was incorrect
- Clear database of test exams

#### How to Delete:
1. Find exam in list
2. Click red **"Delete"** button
3. Confirm in dialog box
4. Exam is removed instantly

#### What Gets Deleted:
- ✅ Exam record
- ✅ All questions in exam
- ✅ All student assignments
- ✅ All submission records
- ✅ All answer data

#### Important:
⚠️ **This action CANNOT be undone**
- Deleted data cannot be recovered
- Student scores are permanently removed
- Only delete if absolutely sure
- Consider archiving instead of deleting

---

### 6. Workflow Examples

#### Example 1: Create a Secure Final Exam

1. Click "Create New Exam"
2. Enter:
   - Title: "Final Math Exam"
   - Duration: 120 minutes
   - PIN Code: 5748
   - Instructions: "Follow all rules..."
3. Add all questions
4. Save exam
5. Assign to all students in class
6. On exam day:
   - Tell students "PIN is 5748"
   - Students can't see questions until they enter PIN
   - Prevents early access

#### Example 2: Create a Practice Quiz

1. Click "Create New Exam"
2. Enter:
   - Title: "Practice Quiz - Chapter 3"
   - Duration: 30 minutes
   - PIN Code: (leave empty)
   - Instructions: "This is practice only"
3. Add questions
4. Save exam
5. Assign to all students
6. Students see it immediately, no PIN needed

#### Example 3: Managing Multiple Exam Versions

1. Create "Exam v1" with questions
2. Assign to first group
3. Students take it
4. Create "Exam v2" with different questions
5. Assign to second group
6. View results separately for each version
7. Delete old versions when not needed

---

### 7. Troubleshooting

#### Students Can't See Exam
**Check:**
- Is exam assigned to them? (Assign button)
- Is exam marked as "Active"?
- Are they logged in?
- Refresh their page

#### Students See "Incorrect PIN"
**Check:**
- Did you tell them the correct PIN?
- Is PIN entered exactly as specified?
- No spaces or special characters
- PIN is case-sensitive for numbers

#### Delete Button Doesn't Work
**Check:**
- Are you logged in as admin?
- Is browser showing any error?
- Try refreshing page
- Check browser console for errors

#### Questions Not Showing After PIN Entry
**Check:**
- Were questions added before saving exam?
- Are questions in the green preview section?
- Try refreshing the exam page
- Check browser console (F12) for errors

---

### 8. Best Practices for Admin

#### Before Creating Exams:
- ✅ Plan questions in advance
- ✅ Review all content for accuracy
- ✅ Test taking exam yourself first
- ✅ Decide if PIN needed
- ✅ Prepare assignment list

#### While Administering:
- ✅ Communicate clearly about PINs
- ✅ Monitor exam submissions
- ✅ Check results regularly
- ✅ Respond to student questions

#### After Exams Complete:
- ✅ Review all results
- ✅ Archive or delete old exams
- ✅ Export results if needed
- ✅ Provide feedback to students

#### Data Management:
- ✅ Keep test exams separate
- ✅ Delete test data regularly
- ✅ Backup important results
- ✅ Archive before deleting

---

### 9. Security Reminders

#### PIN Code Security:
- Don't use student names or birthdates
- Change PIN if compromised
- Don't write PIN in exams themselves
- Communicate PIN verbally when possible

#### Student Account Security:
- Passwords are hashed and secure
- Students cannot see password hash
- You cannot see student passwords
- Only option is password reset (new password)

#### Exam Integrity:
- PIN provides basic security
- Not a full proctoring solution
- Monitor for suspicious patterns
- Review time stamps on submissions

---

## Common Questions

**Q: Can a student take an exam without PIN?**
A: No, if exam has PIN set, they must enter it first.

**Q: Can I change PIN after exam is live?**
A: Yes, edit exam and update PIN code.

**Q: What if a student forgets the PIN?**
A: Tell them again or create exam without PIN.

**Q: Can students share PIN codes?**
A: Yes, currently one PIN per exam (not per student).

**Q: What happens to submissions if I delete an exam?**
A: All submission records are permanently deleted.

**Q: Can I recover a deleted exam?**
A: No, deletion is permanent. Consider exporting results first.

**Q: Can students change their password?**
A: No, you must reset it if they forget. This is for security.

**Q: How do students edit their profile?**
A: They click "Profile" button on dashboard. Can only edit name/email.

---

## Contact & Support

For technical issues:
1. Check browser console (F12)
2. Look for error messages
3. Try refreshing page
4. Restart application
5. Check database connection

For questions about functionality:
- Review this guide
- Check the main README.md
- Review feature documentation

---

**Last Updated**: 2024
**Version**: 1.0
**Status**: All Features Active ✅
