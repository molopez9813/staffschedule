# Nurse Scheduler - Hospital Staff Scheduling App

A modern web application for hospital staff (nurses, PCTs, and unit clerks) to manage and track their work schedules. This app will work on iPhone, Android, and web browsers.

## 📚 What is This?

This is a **React** application built with **Vite** - a modern development tool that helps you build web applications quickly. 

### Key Technologies:
- **React**: A popular JavaScript library for building user interfaces
- **Vite**: A fast build tool that makes development smooth and efficient
- **JavaScript**: The programming language used throughout

## 🎨 What's Included

### Landing Page Features:
- **Login Form**: For existing users to sign in
- **Sign Up Form**: For new users to create an account
- Beautiful gradient background with modern design
- Responsive layout that works on desktop, tablet, and mobile
- Tab switching between login and signup forms

## 🚀 How to Run the Application

### Step 1: Install Node.js
If you don't have Node.js installed:
1. Go to [https://nodejs.org/](https://nodejs.org/)
2. Download and install the LTS (Long Term Support) version
3. This installs both Node.js and npm (Node Package Manager)

### Step 2: Install Dependencies

Open your terminal (Terminal on Mac, Command Prompt on Windows) and run:

```bash
npm install
```

**What this does**: Downloads all the necessary libraries and packages your app needs to run (like React, Vite, etc.)

### Step 3: Start the Development Server

Run this command:

```bash
npm run dev
```

**What this does**: Starts a local development server on your computer

You should see output like:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

### Step 4: View in Your Browser

Open your web browser (Chrome, Firefox, Safari, etc.) and go to:

```
http://localhost:5173
```

**Congratulations!** You should now see the Nurse Scheduler landing page with the login/signup form.

## 📝 What Each File Does

### Project Structure:
```
nursescheduler/
├── package.json          # Lists all dependencies and scripts
├── vite.config.js        # Vite configuration settings
├── index.html            # Main HTML file
├── src/
│   ├── main.jsx         # Entry point - starts the React app
│   ├── App.jsx          # Main component with login/signup forms
│   ├── App.css          # Styles for the app
│   └── index.css        # Global styles
└── README.md            # This file
```

**Explanations:**
- `package.json`: Like a recipe card - it lists all ingredients (packages) your app needs
- `vite.config.js`: Configuration file that tells Vite how to build your app
- `index.html`: The base HTML structure
- `src/main.jsx`: This is where your React app starts
- `src/App.jsx`: Contains your landing page with login/signup functionality
- `src/App.css`: All the styling to make it look beautiful
- `src/index.css`: Global styles that apply to everything

## 🛠️ Available Commands

- `npm run dev` - Start the development server (use this to view and test)
- `npm run build` - Create production-ready files (for when you're ready to deploy)
- `npm run preview` - Preview the production build

## 📱 How It Works

1. **Login/Signup Toggle**: Click the tabs at the top to switch between "Log In" and "Sign Up"
2. **Form Validation**: The app checks that you've filled in all required fields
3. **Password Confirmation**: When signing up, you must enter the same password twice
4. **Responsive Design**: The page automatically adjusts to different screen sizes

## ✨ Features

### Current Features:

✅ **User Authentication**
- Login and Sign Up functionality
- Password validation and confirmation
- Secure local storage

✅ **Signup with Extended Information**
When creating an account, users must provide:
- Full Name
- **Role**: Charge Nurse, Nurse, PCT, HUC, Director, or Coordinator
- Hospital Name
- Department
- Date of Birth
- License Number & Expiration Date
- CPR Certification Number & Expiration Date
- **Shift Preference**: Day Shift, Night Shift, or Both Day & Night
- Email & Password

✅ **Credential Tracking & Expiration Alerts**
- Automatic tracking of license and CPR expiration dates
- **30-day advance warnings** when credentials are about to expire
- **Urgent alerts** when credentials have expired
- Dashboard displays all credentials with visual warnings

✅ **Birthday Notifications**
- Automatically notifies users when department members have birthdays
- Displays birthday greetings for colleagues in the same department
- Shows friendly notifications at the top of the dashboard

✅ **User Dashboard**
- Welcome screen with personalized greeting
- **Role, Department, and Hospital** information displayed prominently
- **Profile Editor**: Click "✏️ Edit Profile" button to update your information
- View all credentials in one place
- Real-time notification display
- **Schedule Management System**
  - 📅 **Monthly Calendar View**: See your working days at a glance with a full month calendar
  - 👥 **Daily View**: See who is working today in your department
  - ⏭️ **Next Shifts View**: View your upcoming shifts
  - **✏️ Create Schedule View** (Director/Coordinator Only):
    - View all staff members in your department
    - Click staff to select, then click calendar days to queue shifts
    - **Batch Shift Creation**: Add multiple shifts before saving - all shifts show as pending (○) with blue border
    - **Smart Shift Type Memory**: First click asks for Day/Night shift type, subsequent clicks use the same type automatically
    - Shift type resets when you select a different staff member or save/clear shifts
    - Click existing shift days to remove them
    - **Save All Button**: Commit all pending shifts at once with one click
    - **Clear Pending Button**: Remove all pending shifts without saving
    - Shows time off requests with visual indicators (⏳ for pending)
    - Click pending time off days to approve or reject requests directly from calendar
    - Instant schedule updates visible to staff after saving
  - **📊 Gantt Chart View** (Available to All Users):
    - Visual Gantt chart display of department schedule
    - Located right after "Monthly" button in schedule views
    - **Integrated with Monthly View**: Click "Monthly" button, then toggle between Calendar and Gantt chart using Week/Month buttons
    - **Calendar View**: Traditional monthly calendar with your scheduled days
    - **Gantt Chart View**: Visual timeline showing all department staff organized by shift and role
    - **Week/Month Toggle**: Switch between week and month views in the Gantt chart
    - **Organized by Shift**: Separate sections for Day Shifts (☀️) and Night Shifts (🌙)
    - **Organized by Role**: Staff sorted by role (Charge Nurse, Nurse, PCT, HUC, Director)
    - Color-coded bars:
      - Green for Day Shifts
      - Blue for Night Shifts
    - Shows staff name, role, and shift time
    - Easy to spot coverage gaps and staffing patterns
  - Navigate between months in calendar view
  - Visual indicators for working days
  - Staff cards showing shift details (Day/Night shifts, times)

✅ **Float & On-Call Rotation Tracking**
- 🌊 **Float Log**: Tracks when staff members float to other departments
- 📞 **On-Call Log**: Tracks on-call assignments
- **Rotation Banner**: Shows who is next to float and next to be on-call
- **Historical Tracking**: Displays last float date and last on-call date for each staff member
- **Fair Rotation Logic**: Automatically determines who is due next based on historical assignments
- **Visual Indicators**: Color-coded badges showing recent vs. older assignments
- **Quick Logging Buttons**: Click "Log Float" or "Log On-Call" to easily record new assignments
- **Decline Functionality**: When someone declines on-call, select from dropdown who actually took it
- **Department Tracking**: Specify which department staff floated to
- **Call-Back Tracking**: Mark when on-call staff are called back in - **deletes today's on-call entry** and shows previous on-call date
- **Modal Forms**: Professional pop-up forms for logging float and on-call assignments
- **Smart Dropdown**: Shows all staff working today when reassigning declined on-call
- **Dynamic Updates**: When marked as called back, the on-call entry is removed and staff history updates to show previous on-call
- **Permission System**: Only Directors, Charge Nurses working today, or staff currently on-call can log/modify float and on-call entries; all others can view only (read-only access)

✅ **Shift Swap System**
- **Request Swap Button**: Easily accessible "🔄 Request Swap" button in swap management section
- **Team Member Dropdown**: Select from all staff members in your department
- **Shift Details Display**: Shows your shift date, type, and times
- **Optional Partner Shift Date**: Enter the date of shift you want to swap with
- **Two-Step Approval**: Partner must approve, then Director/Coordinator must approve
- **Swap Management View**: See all your pending swap requests in one place
- **Pending Approvals Tab**: View and approve/reject swap requests waiting for your action
- **Notification Badge**: Shows count of pending swap approvals
- **Automatic Schedule Updates**: When approved by director, schedules are automatically updated
- **Color-Coded Status**: Visual indicators for pending, approved, completed, and rejected swaps
- **Audit Trail**: Tracks who requested, who approved, and when

✅ **Time Off Request System**
- **Request Days Off**: Staff can submit time off requests with date selection
- **PTO or Unpaid**: Choose between Paid Time Off (PTO) or Unpaid time off
- **Optional Reason**: Add a reason for time off requests
- **Director Approval**: All requests go to Director/Coordinator for approval
- **Automatic Schedule Updates**: When approved, the shift is automatically removed from schedule
- **Status Tracking**: See pending, approved, or rejected status with timestamps
- **Request History**: View all your time off requests in one place
- **Pending Badge**: Directors see notification badge with count of pending requests
- **Color-Coded Cards**: Visual indicators for request status (yellow=pending, green=approved, red=rejected)

- Professional, modern design

✅ **Responsive Design**
- Works seamlessly on desktop, tablet, and mobile devices
- Scrollable signup form for easy completion
- Intuitive tab switching between Login and Sign Up

✅ **Profile Editor**
- **Edit Profile Button**: Easily accessible from the dashboard header
- **Personal Information**: Update your name, role, and date of birth
- **Work Information**: Modify hospital, department, and **shift preference (Day/Night/Both)**
- **License Information**: Update license number and expiration date
- **CPR Certification**: Update CPR number and expiration date
- **Profile Picture**: Initials-based avatar that updates automatically
- **Save Changes**: All updates are saved immediately and reflected across the app
- **Organized Sections**: Information grouped into logical sections for easy editing
- **Shift Display**: Your shift preference is displayed in your profile header

### 🚧 Coming Next:
- Team calendar with department-wide view
- Schedule import/export
- Backend/database integration (currently uses localStorage)
- Email notifications for credential expiration and swap approvals
- Push notifications for pending approvals
- Mobile app versions (React Native)

## 🧪 Testing the Features

### How to Test Credential Expiration Alerts:

1. Create a new account with:
   - License expiration date set to today's date (for immediate alert)
   - Or set it to 15-20 days from today (for warning alert)
   - CPR expiration date the same way

2. Log in to see your dashboard

3. If your credentials expire within 30 days, you'll see a warning notification in orange

4. If your credentials have already expired, you'll see an urgent red notification

### How to Test Birthday Notifications:

1. Create a first account (e.g., "Sarah Johnson") with a department like "Cardiology"

2. Set the Date of Birth to today's date in the signup form

3. Log out

4. Create a second account (e.g., "John Smith") in the same department ("Cardiology")

5. Log in as John Smith - you should see: "🎉 It's Sarah Johnson's birthday today!"

Note: Birthday notifications only show for other users in your same department

### How to Test the Schedule Features:

1. **View Your Schedule**:
   - After logging in, you'll see a schedule section on your dashboard
   - Sample shifts are automatically created when you first log in
   - Click through the three view types: Monthly, Today, and Next

2. **Monthly Calendar View**:
   - Click the "📅 Monthly" button to see your working days in a calendar format
   - Working days are highlighted in purple
   - Today's date is marked with a red border
   - Use "Previous" and "Next" buttons to navigate between months

3. **Today's Staff View** (Enhanced with Float/On-Call Tracking):
   - Click the "👥 Today" button to see who is working today in your department
   - Shows staff member names, departments, and shift details
   - Displays shift type (Day/Night) and times
   - **📊 STAFF TALLY**: Shows real-time count of staff actually working (excluding called-in staff and Directors):
     - Count of Charge Nurses, Nurses, PCT, HUC
     - Total staff count (Directors and Coordinators are excluded from the count)
     - Automatically excludes staff marked as "called in"
   - **📞 CALLED IN SECTION**: Displays staff who called in today
     - Shows staff name, role, and reason (if provided)
     - Only Charge Nurses, HUC, or Directors can mark staff as called in
     - Can remove staff from called-in list (authorized users only)
   - **NEW**: Shows a rotation banner indicating who is next to float or on-call
   - **NEW**: Shows last float date and last on-call date for each staff member
   - **NEW**: Tracks historical assignments to ensure fair rotation
   - **NEW FEATURES**:
     - Click "Log Float" button to record a new float assignment (specify destination department)
     - Click "Log On-Call" button to record on-call assignment (choose duration)
     - Click "Decline" button if the assigned person declines on-call (opens dropdown to select another staff member)
     - Click "Mark Called Back" to update on-call status when staff is called in
     - **Click "📞 Mark Called In" button** on any staff card to mark them as called in (requires permission)
     - Modal pop-ups make it easy to enter information
     - Dropdown shows all staff working today for easy selection when declined
     - All entries are automatically saved and update the rotation tracking
   - **PERMISSION SYSTEM**: Action buttons are only visible if you are:
     - A Director or Coordinator
     - A Charge Nurse working today's shift
     - A staff member currently on call
     - For "Called In" marking: Only Directors, Charge Nurses, or HUCs can modify
     - All other staff see "View Only" instead of action buttons

4. **Next Shifts View**:
   - Click the "⏭️ Next" button to see your upcoming shifts
   - Shows dates, shift types, and times
   - Up to 10 upcoming shifts are displayed

5. **Create Schedule View** (Director/Coordinator Only):
   - Only visible when logged in as Director or Coordinator
   - Click the "✏️ Create" button in schedule view
   - Left sidebar shows all staff with name, role, and avatar
   - Click a staff member to select them (highlighted in purple)
   - **Batch Shift Creation**:
     - Click any calendar day to queue a shift
     - **First click**: Prompts you to choose Day or Night shift
     - **Subsequent clicks**: Automatically uses the same shift type you selected first (no prompt!)
     - Day will show with blue border and "○" indicator (pending)
     - Repeat to add multiple shifts of the same type quickly - they stay pending until you save
     - Click pending days again to remove them from queue
     - **Smart Memory**: Shift type resets when you select a different staff member
     - **Save All Shifts**: Click the green "💾 Save All Shifts" button to commit all pending shifts at once
     - **Clear Pending**: Click "Clear Pending" button to discard all queued shifts
     - Shows count of pending shifts (e.g., "3 pending shift(s) ready to save")
   - Click existing shift days (purple) to remove shifts
   - Time off requests show on calendar:
     - Orange background with ⏳ = Pending time off
     - Click on pending time off days (⏳) to approve or reject directly from calendar
     - Shows both PTO and Unpaid requests
     - Click on time off days to see details in tooltip
   - Navigate months with Previous/Next buttons
   - Changes update staff schedules immediately

6. **Gantt Chart View** (Available to All Users):
   - Click the "📊 Gantt" button (shows Gantt chart in the same area as monthly calendar)
   - Or click "📅 Monthly" and use the toggle buttons to switch to Gantt chart
   - **Timeframe Toggle**: Switch between Week view (7 days) and Month view (full month)
   - **Day Shifts Section**: Shows all day shift schedules
   - **Night Shifts Section**: Shows all night shift schedules
   - Each section lists staff sorted by role (Charge Nurse first, then Nurse, PCT, HUC)
   - Each row shows:
     - Staff name and role on the left
     - Calendar dates across the top (day of week and date)
     - Color-coded bars for shifts:
       - Green bar = Day shift (shows start time like "07:00")
       - Blue bar = Night shift (shows start time like "19:00")
   - Empty cells indicate no shift scheduled
   - Hover over rows to highlight
   - Use to quickly identify:
     - Coverage patterns
     - Staffing gaps
     - Role distribution
     - Day vs night shift coverage

### How to Test the Profile Editor:

1. Log in to your account
2. Click the **"✏️ Edit Profile"** button in the top-right corner
3. Update any fields:
   - Change your name, role, or date of birth
   - Update hospital or department
   - **Change shift preference** (Day Shift, Night Shift, or Both Day & Night)
   - Modify license number or expiration
   - Update CPR information
4. Click "Save Changes"
5. Your profile will be updated immediately across the app
6. Notice how your role, department, hospital, and shift preference update in the dashboard header

### How to Test the Shift Swap System:

1. **Create Two User Accounts**:
   - Create account 1: "Nurse A" with email nurse1@test.com
   - Create account 2: "Nurse B" with email nurse2@test.com
   - Create account 3: "Director" with email director@test.com and role "Director"

2. **As Nurse A (Request Swap)**:
   - Log in and scroll to "Shift Swap Management"
   - Click "🔄 Request Swap" button
   - Modal opens showing your upcoming shift
   - Select a team member from the dropdown (shows all staff in your department)
   - Optionally enter the date of the shift you want to swap with
   - Click "Submit Swap Request"
   - View your request status in "My Requests" tab

3. **As Nurse B (Approve Partner Request)**:
   - Log in and go to "Shift Swap Management"
   - Click "Pending Approval" tab
   - You'll see Nurse A's swap request
   - Click "Approve" (sends to Director for final approval)
   - Or click "Reject" to deny

4. **As Director (Final Approval)**:
   - Log in and go to "Shift Swap Management"
   - Click "Pending Approval" tab
   - You'll see swaps waiting for your approval
   - Click "Approve" to finalize the swap and update both schedules

5. **Check Updated Schedules**:
   - After Director approval, both Nurse A and Nurse B's schedules are updated
   - The shifts are swapped automatically

**Swap Request Flow:**
- Staff Member A requests to swap a shift
- Staff Member B must approve
- Director/Coordinator must give final approval
- Once approved, both schedules are updated automatically

### How to Test the Time Off Request System:

1. **As Staff Member**:
   - Log in as a regular staff member (not director)
   - Scroll to "Time Off Requests" section
   - Click "+ Request Time Off" button
   - Select a date
   - Choose between "PTO" or "Unpaid"
   - Optionally add a reason
   - Click "Submit Request"
   - See your request status in "My Time Off Requests"

2. **As Director**:
   - Log in as Director or Coordinator
   - Scroll to "Time Off Requests" section
   - See notification badge with count of pending requests
   - In "Pending Time Off Requests for Approval":
     - View staff name, date, type (PTO/Unpaid), and reason
     - Click "Approve" to approve and remove shift from schedule
     - Click "Reject" to deny the request

3. **Check Approved Request**:
   - Log back in as the staff member
   - Go to "My Time Off Requests"
   - See approved status with approval date and approver name
   - Check calendar - the approved date should have no shift scheduled

**Time Off Request Flow:**
- Staff member requests time off
- Director/Coordinator reviews and approves or rejects
- If approved, the shift is automatically removed from schedule
- Staff member sees updated status in their request history

### How to Test Multiple Users:

You can create multiple test accounts to see how the system works:
- Use different emails (e.g., user1@test.com, user2@test.com)
- Try different departments
- Set various expiration dates
- Create accounts with today's birthday to test birthday notifications

## 💡 Tips for Development

1. **Auto-Reload**: While the dev server is running, any changes you make will automatically update in the browser
2. **Developer Tools**: Right-click in your browser and select "Inspect" to see the code and debug
3. **Console**: Open browser console (F12 or Cmd+Option+I) to see any messages or errors
4. **Local Storage**: The app stores data in your browser's localStorage - you can view it in Developer Tools > Application > Local Storage

## 🔧 Troubleshooting

**Port already in use?**
- If port 5173 is busy, Vite will automatically use the next available port (5174, 5175, etc.)
- Check the terminal output for the correct URL

**Module not found errors?**
- Run `npm install` again to ensure all dependencies are installed

**Changes not showing?**
- Refresh your browser
- Check the terminal for any error messages

## 📧 Support

If you encounter any issues or have questions about how to run or modify the application, check the terminal output for error messages.

---

**Happy Coding!** 🎉 You've created your first React application!

