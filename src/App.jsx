import { useState, useEffect } from 'react'
import './App.css'
import * as XLSX from 'xlsx'

function App() {
  const [isLogin, setIsLogin] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)
  
  // Schedule view state
  const [scheduleView, setScheduleView] = useState('monthly') // 'monthly', 'daily', 'swap', 'timeoff', 'staff', 'create'
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedStaffForSchedule, setSelectedStaffForSchedule] = useState(null)
  const [pendingShifts, setPendingShifts] = useState([]) // {staffEmail, date, shiftType}
  const [lastShiftTypeSelected, setLastShiftTypeSelected] = useState(null) // Remember last shift type for batch creation
  const [showCalledInModal, setShowCalledInModal] = useState(false)
  const [selectedCalledInStaff, setSelectedCalledInStaff] = useState(null)
  const [ganttViewType, setGanttViewType] = useState('calendar') // 'calendar' or 'gantt' for monthly view toggle
  const [ganttTimeframe, setGanttTimeframe] = useState('month') // 'week' or 'month' for gantt chart view
  
  // Profile picture state
  const [profilePicture, setProfilePicture] = useState(null)
  const [profilePicturePreview, setProfilePicturePreview] = useState(null)

  // Unit meeting states
  const [showMeetingModal, setShowMeetingModal] = useState(false)
  const [meetingDate, setMeetingDate] = useState('')
  const [meetingTime, setMeetingTime] = useState('09:00')
  const [meetingDuration, setMeetingDuration] = useState('60')
  const [meetingTitle, setMeetingTitle] = useState('')
  const [meetingDescription, setMeetingDescription] = useState('')

  // Modal states
  const [showFloatModal, setShowFloatModal] = useState(false)
  const [showOnCallModal, setShowOnCallModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showSwapModal, setShowSwapModal] = useState(false)
  const [selectedStaffForFloat, setSelectedStaffForFloat] = useState(null)
  const [selectedStaffForOnCall, setSelectedStaffForOnCall] = useState(null)
  const [floatToDepartment, setFloatToDepartment] = useState('')
  const [onCallDuration, setOnCallDuration] = useState('24 hours')
  const [onCallDeclined, setOnCallDeclined] = useState(false)
  
  // Profile editor states
  const [profileEditData, setProfileEditData] = useState(null)
  
  // Profile editing functions
  const openProfileEditor = () => {
    setProfileEditData({
      ...user,
      profilePicture: user.profilePicture || null,
      supervisedDepartments: user.supervisedDepartments || [user.department || '']
    })
    setProfilePicturePreview(user.profilePicture || null)
    setShowProfileModal(true)
  }

  const handleProfileChange = (field, value) => {
    setProfileEditData(prev => ({ ...prev, [field]: value }))
  }

  const saveProfile = () => {
    if (!profileEditData) return

    const users = getUsers()
    const userIndex = users.findIndex(u => u.email === user.email)
    
    if (userIndex === -1) {
      alert('User not found')
      return
    }

    // Update profile picture if changed
    const updatedProfileData = {
      ...profileEditData,
      profilePicture: profilePicturePreview || profileEditData.profilePicture
    }

    users[userIndex] = {
      ...users[userIndex],
      ...updatedProfileData
    }

    saveUsers(users)
    
    // Update current user
    const updatedUser = { ...user, ...updatedProfileData }
    setUser(updatedUser)
    localStorage.setItem('currentUser', JSON.stringify(updatedUser))
    
    alert('Profile updated successfully!')
    setShowProfileModal(false)
    setProfileEditData(null)
    setProfilePicture(null)
    setProfilePicturePreview(null)
  }

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setProfilePicture(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfilePicturePreview(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeProfilePicture = () => {
    setProfilePicture(null)
    setProfilePicturePreview(null)
    handleProfileChange('profilePicture', null)
  }
  
  // Swap states
  const [showSwapRequestModal, setShowSwapRequestModal] = useState(false)
  const [selectedSwapShift, setSelectedSwapShift] = useState(null)
  const [swapPartner, setSwapPartner] = useState('')
  const [swapPartnerShiftDate, setSwapPartnerShiftDate] = useState('')
  const [swapView, setSwapView] = useState('pending') // 'pending', 'requests'
  
  // Time off states
  const [showTimeOffModal, setShowTimeOffModal] = useState(false)
  const [timeOffDate, setTimeOffDate] = useState('')
  const [timeOffType, setTimeOffType] = useState('PTO')
  const [timeOffReason, setTimeOffReason] = useState('')
  
  // Form states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [hospital, setHospital] = useState('')
  const [department, setDepartment] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [licenseExpiration, setLicenseExpiration] = useState('')
  const [cprExpiration, setCprExpiration] = useState('')
  const [shiftPreference, setShiftPreference] = useState('Day')
  const [phoneNumber, setPhoneNumber] = useState('')
  
  // Custom credentials management
  const [showCredentialModal, setShowCredentialModal] = useState(false)
  const [newCredentialName, setNewCredentialName] = useState('')
  const [newCredentialExpiration, setNewCredentialExpiration] = useState('')
  const [editingCredentialIndex, setEditingCredentialIndex] = useState(null)
  
  // Staff management states
  const [showAddStaffModal, setShowAddStaffModal] = useState(false)
  const [newStaffName, setNewStaffName] = useState('')
  const [newStaffEmail, setNewStaffEmail] = useState('')
  const [newStaffPhone, setNewStaffPhone] = useState('')
  const [newStaffRole, setNewStaffRole] = useState('')
  const [newStaffDepartment, setNewStaffDepartment] = useState('')
  
  // Director department selector
  const [selectedDepartment, setSelectedDepartment] = useState('')

  // Call-ins view state
  const [showCallInsView, setShowCallInsView] = useState(false)

  // Staff edit states
  const [showEditStaffModal, setShowEditStaffModal] = useState(false)
  const [editingStaff, setEditingStaff] = useState(null)
  const [editLicenseExpiration, setEditLicenseExpiration] = useState('')
  const [editCprExpiration, setEditCprExpiration] = useState('')
  const [editCredentials, setEditCredentials] = useState([])
  const [editLastFloatDate, setEditLastFloatDate] = useState('')
  const [editLastOnCallDate, setEditLastOnCallDate] = useState('')

  // Pending staff edit states
  const [showEditPendingStaffModal, setShowEditPendingStaffModal] = useState(false)
  const [editingPendingStaff, setEditingPendingStaff] = useState(null)
  const [editPendingStaffName, setEditPendingStaffName] = useState('')
  const [editPendingStaffEmail, setEditPendingStaffEmail] = useState('')
  const [editPendingStaffPhone, setEditPendingStaffPhone] = useState('')
  const [editPendingStaffRole, setEditPendingStaffRole] = useState('')
  const [editPendingStaffDepartment, setEditPendingStaffDepartment] = useState('')
  const [editPendingLastFloatDate, setEditPendingLastFloatDate] = useState('')
  const [editPendingLastOnCallDate, setEditPendingLastOnCallDate] = useState('')
  
  // Schedule upload states
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadedScheduleData, setUploadedScheduleData] = useState(null)
  const [googleSheetUrl, setGoogleSheetUrl] = useState('')
  const [uploadMethod, setUploadMethod] = useState('file') // 'file' or 'googlesheet'
  
  // Staff import states
  const [showImportStaffModal, setShowImportStaffModal] = useState(false)
  const [importStaffMethod, setImportStaffMethod] = useState('file') // 'file' or 'googlesheet'
  const [importStaffGoogleSheetUrl, setImportStaffGoogleSheetUrl] = useState('')

  // Check if user is already logged in
  useEffect(() => {
    const loggedInUser = localStorage.getItem('currentUser')
    if (loggedInUser) {
      setUser(JSON.parse(loggedInUser))
      setIsLoggedIn(true)
    }
  }, [])

  const getUsers = () => {
    const users = localStorage.getItem('users')
    return users ? JSON.parse(users) : []
  }

  const saveUsers = (users) => {
    localStorage.setItem('users', JSON.stringify(users))
  }

  // Pending Staff Management (for directors to add staff before they sign up)
  const getPendingStaff = () => {
    const pending = localStorage.getItem('pendingStaff')
    return pending ? JSON.parse(pending) : []
  }

  const savePendingStaff = (staff) => {
    localStorage.setItem('pendingStaff', JSON.stringify(staff))
  }

  const addPendingStaff = (staffData) => {
    const pending = getPendingStaff()
    const newStaff = {
      id: `pending-${Date.now()}`,
      ...staffData,
      createdAt: new Date().toISOString()
    }
    pending.push(newStaff)
    savePendingStaff(pending)
    return newStaff
  }

  const matchPendingStaff = (email, phone) => {
    const pending = getPendingStaff()
    return pending.find(p => 
      p.email.toLowerCase() === email.toLowerCase() && 
      p.phone === phone
    )
  }

  const removePendingStaff = (pendingId) => {
    const pending = getPendingStaff()
    const filtered = pending.filter(p => p.id !== pendingId)
    savePendingStaff(filtered)
  }

  // Helper function to get active department
  const getActiveDepartment = () => {
    if (user && (user.role === 'Director' || user.role === 'Coordinator' || user.role === 'Nursing Administrator')) {
      // For directors/coordinators/admins, use selected department or default to their department
      return selectedDepartment || user.department
    }
    // For regular staff, always use their own department
    return user.department
  }

  const handleLogin = (e) => {
    e.preventDefault()
    const users = getUsers()
    const foundUser = users.find(u => u.email === email && u.password === password)
    
    if (foundUser) {
      setUser(foundUser)
      setIsLoggedIn(true)
      localStorage.setItem('currentUser', JSON.stringify(foundUser))
      alert('Login successful!')
    } else {
      alert('Invalid email or password')
    }
  }

  const handleSignup = (e) => {
    e.preventDefault()
    
    // Validate passwords match
    if (password !== confirmPassword) {
      alert('Passwords do not match!')
      return
    }

    // Validate required fields
    if (!name || !role || !hospital || !department || !dateOfBirth || !shiftPreference || !phoneNumber) {
      alert('Please fill in all required fields')
      return
    }

    // Check if email already exists
    const users = getUsers()
    if (users.find(u => u.email === email)) {
      alert('Email already registered')
      return
    }

    // Check if there's a pending staff member that matches
    const pendingStaff = matchPendingStaff(email, phoneNumber)
    
    // Create credentials array with CPR
    const credentials = [
      {
        name: 'CPR',
        expiration: cprExpiration
      }
    ]

    // Create new user
    const newUser = {
      name: pendingStaff?.name || name,
      role: pendingStaff?.role || role,
      email,
      phone: phoneNumber,
      password,
      hospital,
      department,
      dateOfBirth,
      licenseNumber,
      licenseExpiration,
      cprExpiration,
      credentials: credentials,
      shiftPreference
    }

    // Save user
    users.push(newUser)
    saveUsers(users)

    // Remove pending staff if matched
    if (pendingStaff) {
      removePendingStaff(pendingStaff.id)
      alert(`Welcome ${newUser.name}! Your account has been linked to your staff profile.`)
    } else {
      alert('Account created successfully! You can now log in.')
    }
    
    // Reset form
    setName('')
    setRole('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setHospital('')
    setDepartment('')
    setDateOfBirth('')
    setLicenseNumber('')
    setLicenseExpiration('')
    setCprExpiration('')
    setShiftPreference('Day')
    setPhoneNumber('')
    
    setIsLogin(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('currentUser')
    setUser(null)
    setIsLoggedIn(false)
    setEmail('')
    setPassword('')
  }

  // Get credential expiration warnings
  const getCredentialWarnings = (user) => {
    const warnings = []
    const today = new Date()
    
    if (user.licenseExpiration) {
      const expDate = new Date(user.licenseExpiration)
      const daysUntilExpiration = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24))
      
      if (daysUntilExpiration < 0) {
        warnings.push({ type: 'license', message: 'Your license has EXPIRED!', days: daysUntilExpiration })
      } else if (daysUntilExpiration <= 30) {
        warnings.push({ type: 'license', message: `Your license expires in ${daysUntilExpiration} days`, days: daysUntilExpiration })
      }
    }
    
    // Check CPR expiration (standalone field for backwards compatibility)
    if (user.cprExpiration) {
      const expDate = new Date(user.cprExpiration)
      const daysUntilExpiration = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24))
      
      if (daysUntilExpiration < 0) {
        warnings.push({ type: 'cpr', message: 'Your CPR certification has EXPIRED!', days: daysUntilExpiration })
      } else if (daysUntilExpiration <= 30) {
        warnings.push({ type: 'cpr', message: `Your CPR certification expires in ${daysUntilExpiration} days`, days: daysUntilExpiration })
      }
    }
    
    // Check custom credentials array
    if (user.credentials && Array.isArray(user.credentials)) {
      user.credentials.forEach((credential, index) => {
        if (credential.expiration) {
          const expDate = new Date(credential.expiration)
          const daysUntilExpiration = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24))
          
          if (daysUntilExpiration < 0) {
            warnings.push({ 
              type: 'credential', 
              message: `Your ${credential.name} certification has EXPIRED!`, 
              days: daysUntilExpiration,
              credentialName: credential.name
            })
          } else if (daysUntilExpiration <= 30) {
            warnings.push({ 
              type: 'credential', 
              message: `Your ${credential.name} certification expires in ${daysUntilExpiration} days`, 
              days: daysUntilExpiration,
              credentialName: credential.name
            })
          }
        }
      })
    }
    
    return warnings
  }

  // Get birthday notifications for department
  const getBirthdayNotifications = (currentUser) => {
    if (!currentUser) return []
    
    const users = getUsers()
    const today = new Date()
    const notifications = []
    
    // Get all users in the same department
    const deptMembers = users.filter(u => 
      u.department === currentUser.department && 
      u.email !== currentUser.email
    )
    
    deptMembers.forEach(member => {
      if (member.dateOfBirth) {
        const dob = new Date(member.dateOfBirth)
        const todayMonth = today.getMonth()
        const todayDate = today.getDate()
        const dobMonth = dob.getMonth()
        const dobDate = dob.getDate()
        
        if (dobMonth === todayMonth && dobDate === todayDate) {
          notifications.push({ 
            type: 'birthday', 
            message: `🎉 It's ${member.name}'s birthday today!`,
            person: member.name 
          })
        }
      }
    })
    
    return notifications
  }

  const getUserCredentialWarnings = () => {
    return user ? getCredentialWarnings(user) : []
  }

  const getUserBirthdayNotifications = () => {
    return user ? getBirthdayNotifications(user) : []
  }

  // Schedule helper functions
  const getSchedules = () => {
    const schedules = localStorage.getItem('schedules')
    return schedules ? JSON.parse(schedules) : []
  }

  const saveSchedules = (schedules) => {
    localStorage.setItem('schedules', JSON.stringify(schedules))
  }

  const getUserSchedule = (userId) => {
    const schedules = getSchedules()
    return schedules.filter(s => s.userId === userId)
  }

  const getDepartmentSchedules = (department, date) => {
    const schedules = getSchedules()
    const users = getUsers()
    const pendingStaff = getPendingStaff()
    const targetDate = new Date(date)
    
    return schedules.filter(s => {
      const scheduleDate = new Date(s.date)
      const user = users.find(u => u.email === s.userId)
      const pending = user ? null : pendingStaff.find(p => p.email === s.userId && p.department === department)
      
      return scheduleDate.toDateString() === targetDate.toDateString() && 
             ((user && user.department === department) || (pending && pending.department === department))
    }).map(s => {
      const user = users.find(u => u.email === s.userId)
      const pending = user ? null : pendingStaff.find(p => p.email === s.userId)
      return { 
        ...s, 
        userName: user ? user.name : (pending ? pending.name : 'Unknown'),
        isPending: !!pending
      }
    })
  }

  const getUpcomingShifts = (userId, limit = 5) => {
    const today = new Date()
    const schedules = getSchedules()
    
    return schedules
      .filter(s => s.userId === userId && new Date(s.date) >= today)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, limit)
  }

  const initializeDemoSchedule = () => {
    if (!user || !localStorage.getItem('schedules')) {
      const demoShifts = []
      const today = new Date()
      
      // Create sample shifts for the current month
      for (let i = 0; i < 7; i++) {
        const date = new Date(today)
        date.setDate(today.getDate() + i * 3)
        demoShifts.push({
          id: `demo-${i}`,
          userId: user.email,
          date: date.toISOString().split('T')[0],
          shiftType: i % 2 === 0 ? 'Day' : 'Night',
          startTime: i % 2 === 0 ? '07:00' : '19:00',
          endTime: i % 2 === 0 ? '19:00' : '07:00'
        })
      }
      
      saveSchedules(demoShifts)
    }
  }

  // Initialize demo schedule when user logs in
  useEffect(() => {
    if (user) {
      const schedules = localStorage.getItem('schedules')
      if (!schedules || JSON.parse(schedules).length === 0) {
        // Only add demo data if no schedules exist
        if (user) {
          initializeDemoSchedule()
        }
      }
    }
  }, [user])

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    return { daysInMonth, startingDayOfWeek, year, month }
  }

  const isWorkDay = (date, userId) => {
    const schedules = getSchedules()
    const dateStr = date.toISOString().split('T')[0]
    return schedules.some(s => s.userId === userId && s.date === dateStr)
  }

  const getWorkingStaffToday = () => {
    if (!user) return []
    const today = new Date().toISOString().split('T')[0]
    return getDepartmentSchedules(user.department, today)
  }

  const getNextShiftStaff = () => {
    if (!user) return []
    const schedules = getSchedules()
    const users = getUsers()
    const today = new Date()
    
    // Get all upcoming shifts in the next 24 hours for the department
    const upcoming = schedules.filter(s => {
      const scheduleDate = new Date(s.date)
      const scheduleUser = users.find(u => u.email === s.userId)
      
      return scheduleDate > today && 
             scheduleDate <= new Date(today.getTime() + 24 * 60 * 60 * 1000) &&
             scheduleUser && scheduleUser.department === getActiveDepartment() && scheduleUser.hospital === user.hospital
    }).map(s => {
      const scheduleUser = users.find(u => u.email === s.userId)
      return { ...s, userName: scheduleUser ? scheduleUser.name : 'Unknown' }
    })
    
    return upcoming.sort((a, b) => new Date(a.date) - new Date(b.date))
  }

  // Float and On-Call tracking functions
  const getFloatLog = () => {
    const floatLog = localStorage.getItem('floatLog')
    return floatLog ? JSON.parse(floatLog) : []
  }

  const saveFloatLog = (floatLog) => {
    localStorage.setItem('floatLog', JSON.stringify(floatLog))
  }

  const getOnCallLog = () => {
    const onCallLog = localStorage.getItem('onCallLog')
    return onCallLog ? JSON.parse(onCallLog) : []
  }

  const saveOnCallLog = (onCallLog) => {
    localStorage.setItem('onCallLog', JSON.stringify(onCallLog))
  }

  const initializeFloatAndOnCallLogs = () => {
    if (!user) return
    
    // Initialize float log with demo data if empty
    const floatLog = getFloatLog()
    if (floatLog.length === 0) {
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const threeDaysAgo = new Date(today)
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
      const sixDaysAgo = new Date(today)
      sixDaysAgo.setDate(sixDaysAgo.getDate() - 6)

      const users = getUsers()
      // Create sample float records
      if (users.length >= 2) {
        saveFloatLog([
          {
            id: 'float-1',
            userId: users[1].email,
            date: yesterday.toISOString().split('T')[0],
            toDepartment: 'ICU'
          },
          {
            id: 'float-2',
            userId: users[Math.min(2, users.length - 1)]?.email || users[0].email,
            date: threeDaysAgo.toISOString().split('T')[0],
            toDepartment: 'Emergency'
          }
        ])
      }
    }

    // Initialize on-call log with demo data if empty
    const onCallLog = getOnCallLog()
    if (onCallLog.length === 0) {
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const fourDaysAgo = new Date(today)
      fourDaysAgo.setDate(fourDaysAgo.getDate() - 4)

      const users = getUsers()
      // Create sample on-call records
      if (users.length >= 2) {
        saveOnCallLog([
          {
            id: 'oncall-1',
            userId: users[1].email,
            date: yesterday.toISOString().split('T')[0],
            duration: '24 hours'
          },
          {
            id: 'oncall-2',
            userId: users[Math.min(2, users.length - 1)]?.email || users[0].email,
            date: fourDaysAgo.toISOString().split('T')[0],
            duration: '24 hours'
          }
        ])
      }
    }
  }

  const getLastFloatDate = (userId) => {
    const floatLog = getFloatLog()
    const userFloats = floatLog.filter(f => f.userId === userId).sort((a, b) => new Date(b.date) - new Date(a.date))
    return userFloats.length > 0 ? userFloats[0].date : null
  }

  const getLastOnCallDate = (userId) => {
    const onCallLog = getOnCallLog()
    const today = new Date().toISOString().split('T')[0]
    // Get all on-calls except today's (the called back ones are already filtered)
    const userOnCalls = onCallLog
      .filter(o => o.userId === userId && o.date !== today)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
    return userOnCalls.length > 0 ? userOnCalls[0].date : null
  }

  const getNextForFloat = (shiftType = null) => {
    if (!user) return null
    const workingStaff = getWorkingStaffToday()
    const users = getUsers()
    
    // Filter by shift type if specified
    let filteredStaff = workingStaff
    if (shiftType) {
      filteredStaff = workingStaff.filter(shift => shift.shiftType === shiftType)
    }
    
    if (filteredStaff.length === 0) return null

    // Sort by last float date (oldest first)
    const staffWithFloatInfo = filteredStaff.map(shift => {
      const user = users.find(u => u.email === shift.userId)
      return {
        ...shift,
        lastFloatDate: getLastFloatDate(shift.userId),
        totalFloats: getFloatLog().filter(f => f.userId === shift.userId).length
      }
    })

    // Sort by last float date (ascending, with null dates first), then by total floats
    staffWithFloatInfo.sort((a, b) => {
      if (!a.lastFloatDate && !b.lastFloatDate) return a.totalFloats - b.totalFloats
      if (!a.lastFloatDate) return -1
      if (!b.lastFloatDate) return 1
      
      const dateA = new Date(a.lastFloatDate)
      const dateB = new Date(b.lastFloatDate)
      
      if (dateA.getTime() === dateB.getTime()) {
        return a.totalFloats - b.totalFloats
      }
      
      return dateA - dateB
    })

    return staffWithFloatInfo[0]
  }

  const getNextForOnCall = (shiftType = null) => {
    if (!user) return null
    const workingStaff = getWorkingStaffToday()
    const users = getUsers()
    
    // Filter by shift type if specified
    let filteredStaff = workingStaff
    if (shiftType) {
      filteredStaff = workingStaff.filter(shift => shift.shiftType === shiftType)
    }
    
    if (filteredStaff.length === 0) return null

    // Sort by last on-call date (oldest first)
    const staffWithOnCallInfo = filteredStaff.map(shift => {
      const user = users.find(u => u.email === shift.userId)
      return {
        ...shift,
        lastOnCallDate: getLastOnCallDate(shift.userId),
        totalOnCalls: getOnCallLog().filter(o => o.userId === shift.userId).length
      }
    })

    // Sort by last on-call date (ascending, with null dates first), then by total on-calls
    staffWithOnCallInfo.sort((a, b) => {
      if (!a.lastOnCallDate && !b.lastOnCallDate) return a.totalOnCalls - b.totalOnCalls
      if (!a.lastOnCallDate) return -1
      if (!b.lastOnCallDate) return 1
      
      const dateA = new Date(a.lastOnCallDate)
      const dateB = new Date(b.lastOnCallDate)
      
      if (dateA.getTime() === dateB.getTime()) {
        return a.totalOnCalls - b.totalOnCalls
      }
      
      return dateA - dateB
    })

    return staffWithOnCallInfo[0]
  }

  // Handler functions for logging floats and on-calls
  const logFloat = (staffName, toDepartment) => {
    if (!staffName || !toDepartment) {
      alert('Please select a staff member and department')
      return
    }
    
    const workingStaff = getWorkingStaffToday()
    const staff = workingStaff.find(s => s.userName === staffName)
    
    if (!staff) {
      alert('Staff member not found')
      return
    }
    
    const floatLog = getFloatLog()
    const newFloat = {
      id: `float-${Date.now()}`,
      userId: staff.userId,
      date: new Date().toISOString().split('T')[0],
      toDepartment: toDepartment
    }
    
    floatLog.push(newFloat)
    saveFloatLog(floatLog)
    
    setShowFloatModal(false)
    setSelectedStaffForFloat(null)
    setFloatToDepartment('')
    alert(`${staffName} floated to ${toDepartment} department successfully logged!`)
  }

  const logOnCall = (staffName, duration) => {
    if (!staffName) {
      alert('Please select a staff member')
      return
    }
    
    const workingStaff = getWorkingStaffToday()
    const staff = workingStaff.find(s => s.userName === staffName)
    
    if (!staff) {
      alert('Staff member not found')
      return
    }
    
    const onCallLog = getOnCallLog()
    const newOnCall = {
      id: `oncall-${Date.now()}`,
      userId: staff.userId,
      date: new Date().toISOString().split('T')[0],
      duration: duration,
      calledBack: false
    }
    
    onCallLog.push(newOnCall)
    saveOnCallLog(onCallLog)
    
    setShowOnCallModal(false)
    setSelectedStaffForOnCall(null)
    setOnCallDuration('24 hours')
    setOnCallDeclined(false)
    alert(`${staffName} on-call logged successfully!`)
  }

  const declineOnCall = () => {
    setOnCallDeclined(true)
    setSelectedStaffForOnCall(null)
    setShowOnCallModal(true)
  }

  const markOnCallAsCalledBack = (staffName) => {
    if (!staffName) {
      alert('Please select a staff member')
      return
    }
    
    const workingStaff = getWorkingStaffToday()
    const staff = workingStaff.find(s => s.userName === staffName)
    
    if (!staff) {
      alert('Staff member not found')
      return
    }
    
    const onCallLog = getOnCallLog()
    const today = new Date().toISOString().split('T')[0]
    
    // Find and delete today's on-call entry for this staff member
    const todayOnCallIndex = onCallLog.findIndex(
      o => o.userId === staff.userId && o.date === today
    )
    
    if (todayOnCallIndex !== -1) {
      // Delete the entry
      onCallLog.splice(todayOnCallIndex, 1)
      saveOnCallLog(onCallLog)
      alert(`${staffName} marked as called back! On-call entry deleted.`)
      
      // Force re-render to update the UI
      setUser({ ...user })
    } else {
      alert('No on-call entry found for today')
    }
  }

  // Shift Swap Functions
  const getSwapRequests = () => {
    const swaps = localStorage.getItem('swapRequests')
    return swaps ? JSON.parse(swaps) : []
  }

  const saveSwapRequests = (requests) => {
    localStorage.setItem('swapRequests', JSON.stringify(requests))
  }

  const isUserDirector = () => {
    return user && (user.role === 'Director' || user.role === 'Coordinator')
  }

  const canManageRoles = () => {
    return user && (user.role === 'Director' || user.role === 'Coordinator' || user.role === 'Nursing Administrator')
  }

  // Credential Management Functions
  const addCredential = () => {
    if (!newCredentialName || !newCredentialExpiration) {
      alert('Please fill in credential name and expiration date')
      return
    }

    const users = getUsers()
    const currentUser = users.find(u => u.email === user.email)
    
    if (!currentUser.credentials) {
      currentUser.credentials = []
    }

    const credential = {
      name: newCredentialName,
      expiration: newCredentialExpiration
    }

    currentUser.credentials.push(credential)
    
    // Update localStorage
    const userIndex = users.findIndex(u => u.email === user.email)
    users[userIndex] = currentUser
    saveUsers(users)
    
    // Update current user
    setUser({ ...user, credentials: currentUser.credentials })
    localStorage.setItem('currentUser', JSON.stringify({ ...user, credentials: currentUser.credentials }))
    
    // Reset form
    setNewCredentialName('')
    setNewCredentialExpiration('')
    setShowCredentialModal(false)
  }

  const editCredential = (index) => {
    const credential = user.credentials[index]
    setNewCredentialName(credential.name)
    setNewCredentialExpiration(credential.expiration)
    setEditingCredentialIndex(index)
    setShowCredentialModal(true)
  }

  const updateCredential = () => {
    if (!newCredentialName || !newCredentialExpiration) {
      alert('Please fill in credential name and expiration date')
      return
    }

    const users = getUsers()
    const currentUser = users.find(u => u.email === user.email)
    
    if (!currentUser.credentials) {
      currentUser.credentials = []
    }

    currentUser.credentials[editingCredentialIndex] = {
      name: newCredentialName,
      expiration: newCredentialExpiration
    }
    
    // Update localStorage
    const userIndex = users.findIndex(u => u.email === user.email)
    users[userIndex] = currentUser
    saveUsers(users)
    
    // Update current user
    setUser({ ...user, credentials: currentUser.credentials })
    localStorage.setItem('currentUser', JSON.stringify({ ...user, credentials: currentUser.credentials }))
    
    // Reset form
    setNewCredentialName('')
    setNewCredentialExpiration('')
    setEditingCredentialIndex(null)
    setShowCredentialModal(false)
  }

  const removeCredential = (index) => {
    if (!confirm('Are you sure you want to remove this credential?')) return

    const users = getUsers()
    const currentUser = users.find(u => u.email === user.email)
    
    if (!currentUser.credentials) return

    currentUser.credentials.splice(index, 1)
    
    // Update localStorage
    const userIndex = users.findIndex(u => u.email === user.email)
    users[userIndex] = currentUser
    saveUsers(users)
    
    // Update current user
    setUser({ ...user, credentials: currentUser.credentials })
    localStorage.setItem('currentUser', JSON.stringify({ ...user, credentials: currentUser.credentials }))
  }

  const canModifyFloatAndOnCall = () => {
    if (!user) return false
    
    // Directors and Coordinators can always modify
    if (isUserDirector()) return true
    
    // Check if user is a Charge Nurse working today
    const workingToday = getWorkingStaffToday()
    const userWorking = workingToday.find(s => s.userId === user.email)
    if (userWorking && user.role === 'Charge Nurse') return true
    
    // Check if user is currently on call today
    const onCallToday = getOnCallLog().filter(entry => {
      const entryDate = new Date(entry.date)
      const today = new Date()
      return entryDate.toDateString() === today.toDateString() && entry.userId === user.email
    })
    if (onCallToday.length > 0) return true
    
    return false
  }

  const canManageCalledIn = () => {
    if (!user) return false
    if (isUserDirector()) return true
    
    // Check if user is a Charge Nurse or HUC working today
    const workingToday = getWorkingStaffToday()
    const userWorking = workingToday.find(s => s.userId === user.email)
    
    if (userWorking && (user.role === 'Charge Nurse' || user.role === 'HUC')) {
      return true
    }
    
    return false
  }

  // Schedule Upload and Import Functions
  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      
      // Get the first sheet
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(firstSheet)
      
      setUploadedScheduleData(jsonData)
      alert(`Schedule uploaded! Found ${jsonData.length} rows. Click "Import Schedule" to add shifts.`)
    }
    reader.readAsArrayBuffer(file)
  }

  const handleGoogleSheetImport = async () => {
    if (!googleSheetUrl) {
      alert('Please enter a Google Sheets URL')
      return
    }

    try {
      // Convert Google Sheets URL to CSV export URL
      let csvUrl = googleSheetUrl.trim()
      
      // Handle different Google Sheets URL formats
      if (csvUrl.includes('/d/')) {
        // Extract the sheet ID from the URL
        const sheetIdMatch = csvUrl.match(/\/d\/([a-zA-Z0-9-_]+)/)
        if (sheetIdMatch) {
          const sheetId = sheetIdMatch[1]
          // Convert to CSV export URL
          csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`
        }
      } else {
        alert('Please enter a valid Google Sheets URL')
        return
      }

      // Fetch the CSV data
      const response = await fetch(csvUrl)
      if (!response.ok) {
        throw new Error('Failed to fetch Google Sheets data. Make sure the sheet is publicly accessible (Share -> Anyone with the link)')
      }

      const csvText = await response.text()
      
      // Parse CSV to JSON using SheetJS
      const workbook = XLSX.read(csvText, { type: 'string' })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(firstSheet)
      
      if (jsonData.length === 0) {
        alert('No data found in the Google Sheet')
        return
      }

      setUploadedScheduleData(jsonData)
      alert(`Google Sheets imported successfully! Found ${jsonData.length} rows. Click "Import Schedule" to add shifts.`)
    } catch (error) {
      console.error('Error importing Google Sheet:', error)
      alert(`Error importing Google Sheet: ${error.message}\n\nMake sure the Google Sheet is publicly accessible:\n1. Open the sheet\n2. Click "Share"\n3. Change access to "Anyone with the link"\n4. Copy the URL and try again.`)
    }
  }

  const importScheduleFromUpload = () => {
    if (!uploadedScheduleData || uploadedScheduleData.length === 0) {
      alert('No schedule data to import')
      return
    }

    const users = getUsers()
    const schedules = getSchedules()
    let importedCount = 0
    const notFoundStaff = []

    // Expected columns: Name, Email, Date, Shift Type, Start Time, End Time
    uploadedScheduleData.forEach((row) => {
      const name = row['Name'] || row['name']
      const email = row['Email'] || row['email']
      const date = row['Date'] || row['date']
      const shiftType = row['Shift Type'] || row['shiftType'] || row['Shift Type'] || 'Day'
      const startTime = row['Start Time'] || row['startTime'] || row['Start Time'] || '07:00'
      const endTime = row['End Time'] || row['endTime'] || row['End Time'] || '19:00'

      if (!name || !email || !date) {
        return // Skip invalid rows
      }

      // Find user by email or name
      let staffMember = users.find(u => u.email.toLowerCase() === email.toLowerCase())
      if (!staffMember) {
        staffMember = users.find(u => u.name.toLowerCase() === name.toLowerCase())
      }

      if (!staffMember) {
        notFoundStaff.push(`${name} (${email})`)
        return
      }

      // Check if schedule already exists
      const dateStr = new Date(date).toISOString().split('T')[0]
      const existingSchedule = schedules.find(
        s => s.userId === staffMember.email && s.date === dateStr
      )

      if (!existingSchedule) {
        schedules.push({
          id: `imported-${Date.now()}-${Math.random()}`,
          userId: staffMember.email,
          date: dateStr,
          shiftType: shiftType || 'Day',
          startTime: startTime,
          endTime: endTime
        })
        importedCount++
      }
    })

    saveSchedules(schedules)
    
    let message = `Successfully imported ${importedCount} shifts!`
    if (notFoundStaff.length > 0) {
      message += `\n\nNote: ${notFoundStaff.length} staff member(s) not found and skipped:\n${notFoundStaff.slice(0, 5).join('\n')}${notFoundStaff.length > 5 ? '\n...' : ''}\n\nPlease add them to the staff list first.`
    }
    
    alert(message)
    setUploadedScheduleData(null)
    setShowUploadModal(false)
  }

  const downloadScheduleTemplate = () => {
    // Create sample data for template
    const templateData = [
      { Name: 'Jane Doe', Email: 'jane@example.com', Date: '2024-01-15', 'Shift Type': 'Day', 'Start Time': '07:00', 'End Time': '19:00' },
      { Name: 'John Smith', Email: 'john@example.com', Date: '2024-01-15', 'Shift Type': 'Night', 'Start Time': '19:00', 'End Time': '07:00' }
    ]

    // Create workbook
    const ws = XLSX.utils.json_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Schedule')

    // Generate Excel file
    XLSX.writeFile(wb, 'Schedule_Template.xlsx')
  }

  // Directors and Nursing Administrators: Add Staff Member Function
  const handleAddStaff = () => {
    if (!newStaffName || !newStaffEmail || !newStaffPhone || !newStaffRole) {
      alert('Please fill in all required fields')
      return
    }

    // Check if email already exists in users or pending staff
    const users = getUsers()
    const pending = getPendingStaff()
    
    if (users.find(u => u.email.toLowerCase() === newStaffEmail.toLowerCase())) {
      alert('This email is already registered')
      return
    }
    
    if (pending.find(p => p.email.toLowerCase() === newStaffEmail.toLowerCase())) {
      alert('This email already has a pending staff record')
      return
    }

    if (!newStaffDepartment) {
      alert('Please enter a department')
      return
    }

    const newStaffData = {
      name: newStaffName,
      email: newStaffEmail,
      phone: newStaffPhone,
      role: newStaffRole,
      department: newStaffDepartment,
      hospital: user.hospital,
      createdBy: user.email
    }

    addPendingStaff(newStaffData)
    alert(`Staff member "${newStaffName}" added successfully! They can now sign up with their email and phone number.`)
    
    // Reset form
    setNewStaffName('')
    setNewStaffEmail('')
    setNewStaffPhone('')
    setNewStaffRole('')
    setNewStaffDepartment('')
    setShowAddStaffModal(false)
  }

  // Staff Import Functions
  const handleImportStaffFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(sheet)

      if (rows.length === 0) {
        alert('No data found in the file')
        return
      }

      const users = getUsers()
      const pending = getPendingStaff()
      let successCount = 0
      let errorCount = 0

      rows.forEach(row => {
        const name = row['Name'] || row['name']
        const email = row['Email'] || row['email']
        const phone = row['Phone'] || row['phone']
        const role = row['Role'] || row['role']
        const department = row['Department'] || row['department'] || getActiveDepartment()
        const hospital = row['Hospital'] || row['hospital'] || user.hospital

        if (!name || !email || !phone || !role) {
          errorCount++
          return
        }

        // Check if email already exists
        if (users.find(u => u.email.toLowerCase() === email.toLowerCase()) ||
            pending.find(p => p.email.toLowerCase() === email.toLowerCase())) {
          errorCount++
          return
        }

        const newStaffData = {
          name,
          email,
          phone,
          role,
          department,
          hospital,
          createdBy: user.email
        }

        addPendingStaff(newStaffData)
        successCount++
      })

      alert(`Import complete: ${successCount} staff members added${errorCount > 0 ? `, ${errorCount} skipped (duplicates or incomplete data)` : ''}`)
      setShowImportStaffModal(false)
    } catch (error) {
      console.error('Error importing staff:', error)
      alert('Error importing staff file. Please check the format.')
    }
  }

  const handleImportStaffGoogleSheet = async () => {
    if (!importStaffGoogleSheetUrl) {
      alert('Please enter a Google Sheet URL')
      return
    }

    try {
      // Convert Google Sheet URL to CSV export URL
      const sheetId = importStaffGoogleSheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
      if (!sheetId) {
        alert('Invalid Google Sheet URL')
        return
      }

      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId[1]}/export?format=csv&gid=0`
      const response = await fetch(csvUrl)
      const csvText = await response.text()
      const rows = XLSX.utils.sheet_to_json(XLSX.utils.aoa_to_sheet(csvText.split('\n').map(line => line.split(','))))

      if (rows.length === 0) {
        alert('No data found in the sheet')
        return
      }

      const users = getUsers()
      const pending = getPendingStaff()
      let successCount = 0
      let errorCount = 0

      rows.forEach(row => {
        const name = row['Name'] || row['name']
        const email = row['Email'] || row['email']
        const phone = row['Phone'] || row['phone']
        const role = row['Role'] || row['role']
        const department = row['Department'] || row['department'] || getActiveDepartment()
        const hospital = row['Hospital'] || row['hospital'] || user.hospital

        if (!name || !email || !phone || !role) {
          errorCount++
          return
        }

        // Check if email already exists
        if (users.find(u => u.email.toLowerCase() === email.toLowerCase()) ||
            pending.find(p => p.email.toLowerCase() === email.toLowerCase())) {
          errorCount++
          return
        }

        const newStaffData = {
          name,
          email,
          phone,
          role,
          department,
          hospital,
          createdBy: user.email
        }

        addPendingStaff(newStaffData)
        successCount++
      })

      alert(`Import complete: ${successCount} staff members added${errorCount > 0 ? `, ${errorCount} skipped (duplicates or incomplete data)` : ''}`)
      setShowImportStaffModal(false)
      setImportStaffGoogleSheetUrl('')
    } catch (error) {
      console.error('Error importing staff from Google Sheet:', error)
      alert('Error importing staff from Google Sheet. Please check the URL and format.')
    }
  }

  // Edit Staff Credentials Functions
  const openEditStaffModal = (staff) => {
    setEditingStaff(staff)
    setEditLicenseExpiration(staff.licenseExpiration || '')
    setEditCprExpiration(staff.cprExpiration || '')
    setEditCredentials(staff.credentials ? [...staff.credentials] : [])
    
    // Get last float and on-call dates
    const lastFloat = getLastFloatDate(staff.email)
    const lastOnCall = getLastOnCallDate(staff.email)
    
    setEditLastFloatDate(lastFloat || '')
    setEditLastOnCallDate(lastOnCall || '')
    
    setShowEditStaffModal(true)
  }

  const handleSaveStaffCredentials = () => {
    if (!editingStaff) return

    const users = getUsers()
    const staffIndex = users.findIndex(u => u.email === editingStaff.email)
    
    if (staffIndex === -1) {
      alert('Staff member not found')
      return
    }

    // Update the staff member's credentials
    users[staffIndex] = {
      ...users[staffIndex],
      licenseExpiration: editLicenseExpiration,
      cprExpiration: editCprExpiration,
      credentials: editCredentials
    }

    saveUsers(users)

    // Update float log if date changed
    if (editLastFloatDate) {
      const floatLog = getFloatLog()
      const lastFloat = getLastFloatDate(editingStaff.email)
      
      // If there's an existing entry and the date changed, update it
      if (lastFloat && lastFloat !== editLastFloatDate) {
        const floatEntry = floatLog.find(f => f.userId === editingStaff.email && f.date === lastFloat)
        if (floatEntry) {
          floatEntry.date = editLastFloatDate
          saveFloatLog(floatLog)
        }
      } else if (!lastFloat && editLastFloatDate) {
        // Add new float entry
        floatLog.push({
          id: `float-${Date.now()}-${Math.random()}`,
          userId: editingStaff.email,
          userName: editingStaff.name,
          date: editLastFloatDate,
          department: 'Manual Entry'
        })
        saveFloatLog(floatLog)
      }
    }

    // Update on-call log if date changed
    if (editLastOnCallDate) {
      const onCallLog = getOnCallLog()
      const lastOnCall = getLastOnCallDate(editingStaff.email)
      
      // If there's an existing entry and the date changed, update it
      if (lastOnCall && lastOnCall !== editLastOnCallDate) {
        const onCallEntry = onCallLog.find(o => o.userId === editingStaff.email && o.date === lastOnCall)
        if (onCallEntry) {
          onCallEntry.date = editLastOnCallDate
          saveOnCallLog(onCallLog)
        }
      } else if (!lastOnCall && editLastOnCallDate) {
        // Add new on-call entry
        onCallLog.push({
          id: `oncall-${Date.now()}-${Math.random()}`,
          userId: editingStaff.email,
          userName: editingStaff.name,
          date: editLastOnCallDate,
          duration: '24 hours'
        })
        saveOnCallLog(onCallLog)
      }
    }
    
    alert('Staff credentials updated successfully!')
    setShowEditStaffModal(false)
    setEditingStaff(null)
    setEditLicenseExpiration('')
    setEditCprExpiration('')
    setEditCredentials([])
    setEditLastFloatDate('')
    setEditLastOnCallDate('')
  }

  const handleAddCredentialForStaff = () => {
    if (!newCredentialName || !newCredentialExpiration) {
      alert('Please fill in credential name and expiration date')
      return
    }

    const newCredential = {
      name: newCredentialName,
      expiration: newCredentialExpiration
    }

    setEditCredentials([...editCredentials, newCredential])
    setNewCredentialName('')
    setNewCredentialExpiration('')
    setShowCredentialModal(false)
  }

  const handleEditStaffCredential = (index) => {
    const credential = editCredentials[index]
    setNewCredentialName(credential.name)
    setNewCredentialExpiration(credential.expiration)
    setEditingCredentialIndex(index)
    setShowCredentialModal(true)
  }

  const handleUpdateStaffCredential = () => {
    if (editingCredentialIndex === null || !newCredentialName || !newCredentialExpiration) return

    const updatedCredentials = [...editCredentials]
    updatedCredentials[editingCredentialIndex] = {
      name: newCredentialName,
      expiration: newCredentialExpiration
    }
    setEditCredentials(updatedCredentials)
    setNewCredentialName('')
    setNewCredentialExpiration('')
    setEditingCredentialIndex(null)
    setShowCredentialModal(false)
  }

  const handleRemoveStaffCredential = (index) => {
    const updatedCredentials = editCredentials.filter((_, i) => i !== index)
    setEditCredentials(updatedCredentials)
  }

  // Pending Staff Edit Functions
  const openEditPendingStaffModal = (pendingStaff) => {
    setEditingPendingStaff(pendingStaff)
    setEditPendingStaffName(pendingStaff.name || '')
    setEditPendingStaffEmail(pendingStaff.email || '')
    setEditPendingStaffPhone(pendingStaff.phone || '')
    setEditPendingStaffRole(pendingStaff.role || '')
    setEditPendingStaffDepartment(pendingStaff.department || '')
    
    // Get last float and on-call dates
    const lastFloat = getLastFloatDate(pendingStaff.email)
    const lastOnCall = getLastOnCallDate(pendingStaff.email)
    
    setEditPendingLastFloatDate(lastFloat || '')
    setEditPendingLastOnCallDate(lastOnCall || '')
    
    setShowEditPendingStaffModal(true)
  }

  const handleSavePendingStaff = () => {
    if (!editingPendingStaff) return

    const pendingStaff = getPendingStaff()
    const staffIndex = pendingStaff.findIndex(p => p.id === editingPendingStaff.id)
    
    if (staffIndex === -1) {
      alert('Pending staff member not found')
      return
    }

    const oldEmail = editingPendingStaff.email
    const emailChanged = oldEmail !== editPendingStaffEmail

    // Update the pending staff member's information
    pendingStaff[staffIndex] = {
      ...pendingStaff[staffIndex],
      name: editPendingStaffName,
      email: editPendingStaffEmail,
      phone: editPendingStaffPhone,
      role: editPendingStaffRole,
      department: editPendingStaffDepartment
    }

    savePendingStaff(pendingStaff)

    // If email changed, update userId in logs
    if (emailChanged) {
      const floatLog = getFloatLog()
      const onCallLog = getOnCallLog()
      const schedules = getSchedules()
      
      // Update float log
      floatLog.forEach(entry => {
        if (entry.userId === oldEmail) {
          entry.userId = editPendingStaffEmail
        }
      })
      saveFloatLog(floatLog)
      
      // Update on-call log
      onCallLog.forEach(entry => {
        if (entry.userId === oldEmail) {
          entry.userId = editPendingStaffEmail
        }
      })
      saveOnCallLog(onCallLog)
      
      // Update schedules
      schedules.forEach(schedule => {
        if (schedule.userId === oldEmail) {
          schedule.userId = editPendingStaffEmail
        }
      })
      saveSchedules(schedules)
    }

    // Update float log if date is provided
    if (editPendingLastFloatDate) {
      const floatLog = getFloatLog()
      const currentEmail = emailChanged ? editPendingStaffEmail : oldEmail
      
      // Check if an entry for this user already exists
      const existingFloatEntries = floatLog.filter(f => f.userId === currentEmail)
      
      if (existingFloatEntries.length > 0) {
        // Update the most recent float entry
        const mostRecentFloat = existingFloatEntries.sort((a, b) => new Date(b.date) - new Date(a.date))[0]
        if (mostRecentFloat) {
          mostRecentFloat.date = editPendingLastFloatDate
          mostRecentFloat.userName = editPendingStaffName
          saveFloatLog(floatLog)
        }
      } else {
        // Add new float entry
        floatLog.push({
          id: `float-${Date.now()}-${Math.random()}`,
          userId: currentEmail,
          userName: editPendingStaffName,
          date: editPendingLastFloatDate,
          department: 'Manual Entry'
        })
        saveFloatLog(floatLog)
      }
    }

    // Update on-call log if date is provided
    if (editPendingLastOnCallDate) {
      const onCallLog = getOnCallLog()
      const currentEmail = emailChanged ? editPendingStaffEmail : oldEmail
      
      // Check if an entry for this user already exists
      const existingOnCallEntries = onCallLog.filter(o => o.userId === currentEmail)
      
      if (existingOnCallEntries.length > 0) {
        // Update the most recent on-call entry
        const mostRecentOnCall = existingOnCallEntries.sort((a, b) => new Date(b.date) - new Date(a.date))[0]
        if (mostRecentOnCall) {
          mostRecentOnCall.date = editPendingLastOnCallDate
          mostRecentOnCall.userName = editPendingStaffName
          saveOnCallLog(onCallLog)
        }
      } else {
        // Add new on-call entry
        onCallLog.push({
          id: `oncall-${Date.now()}-${Math.random()}`,
          userId: currentEmail,
          userName: editPendingStaffName,
          date: editPendingLastOnCallDate,
          duration: '24 hours'
        })
        saveOnCallLog(onCallLog)
      }
    }
    
    alert('Pending staff information updated successfully!')
    setShowEditPendingStaffModal(false)
    setEditingPendingStaff(null)
    setEditPendingStaffName('')
    setEditPendingStaffEmail('')
    setEditPendingStaffPhone('')
    setEditPendingStaffRole('')
    setEditPendingStaffDepartment('')
    setEditPendingLastFloatDate('')
    setEditPendingLastOnCallDate('')
  }

  // Remove Staff Function
  const removeStaffFromDepartment = (staffEmail, staffName) => {
    if (!confirm(`Are you sure you want to remove ${staffName} from this department?\n\nThis will:\n- Remove them from the department roster\n- Keep their schedule data (can be reassigned later)\n- Remove them from float/on-call rotation\n\nThis action cannot be undone.`)) {
      return
    }

    const users = getUsers()
    const userIndex = users.findIndex(u => u.email === staffEmail)
    
    if (userIndex === -1) {
      alert('Staff member not found')
      return
    }

    // Check if user is trying to remove themselves
    if (staffEmail === user.email) {
      alert('You cannot remove yourself from the department.')
      return
    }

    // Remove the staff member from the users list
    users.splice(userIndex, 1)
    saveUsers(users)

    // Remove them from float log
    const floatLog = getFloatLog()
    const updatedFloatLog = floatLog.filter(f => f.userId !== staffEmail)
    saveFloatLog(updatedFloatLog)

    // Remove them from on-call log
    const onCallLog = getOnCallLog()
    const updatedOnCallLog = onCallLog.filter(o => o.userId !== staffEmail)
    saveOnCallLog(updatedOnCallLog)

    // Remove them from called-in log
    const calledInLog = localStorage.getItem('calledIn')
    if (calledInLog) {
      const calledIn = JSON.parse(calledInLog)
      const updatedCalledIn = calledIn.filter(c => c.userId !== staffEmail)
      localStorage.setItem('calledIn', JSON.stringify(updatedCalledIn))
    }

    // Note: We keep their schedule data in case they need to be re-added
    // The schedules will just not be visible to anyone since there's no user

    alert(`${staffName} has been removed from the department.`)
    
    // Force re-render
    setUser({ ...user })
  }

  // Called In Functions
  const getCalledInToday = () => {
    const today = new Date().toISOString().split('T')[0]
    const calledInLog = localStorage.getItem('calledIn')
    if (!calledInLog) return []
    const all = JSON.parse(calledInLog)
    return all.filter(entry => entry.date === today)
  }

  const getCallInHistory = () => {
    const calledInLog = localStorage.getItem('calledIn')
    if (!calledInLog) return []
    
    const all = JSON.parse(calledInLog)
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    
    // Filter for last calendar year and sort by date (newest first)
    return all
      .filter(entry => new Date(entry.date) >= oneYearAgo)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  }

  const saveCalledIn = (staffEmail, staffName, reason) => {
    const today = new Date().toISOString().split('T')[0]
    const calledInLog = localStorage.getItem('calledIn')
    const all = calledInLog ? JSON.parse(calledInLog) : []
    
    // Remove any existing entry for this staff today
    const filtered = all.filter(entry => !(entry.date === today && entry.userId === staffEmail))
    
    // Add new entry
    filtered.push({
      id: `called-in-${Date.now()}`,
      userId: staffEmail,
      userName: staffName,
      date: today,
      reason: reason || '',
      reportedBy: user.email,
      reportedByName: user.name,
      createdAt: new Date().toISOString()
    })
    
    localStorage.setItem('calledIn', JSON.stringify(filtered))
  }

  const markCalledIn = (staffEmail, staffName) => {
    setSelectedCalledInStaff({ email: staffEmail, name: staffName })
    setShowCalledInModal(true)
  }

  const handleCalledInSubmit = (reason) => {
    if (!selectedCalledInStaff) return
    saveCalledIn(selectedCalledInStaff.email, selectedCalledInStaff.name, reason)
    setShowCalledInModal(false)
    setSelectedCalledInStaff(null)
    alert(`${selectedCalledInStaff.name} marked as called in.`)
  }

  // Gantt Chart Helper Functions
  const getWeekDates = (date = new Date()) => {
    const day = date.getDay()
    const diff = date.getDate() - day
    const monday = new Date(date.setDate(diff))
    const week = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      week.push(d)
    }
    return week
  }

  const getMonthDates = (date = new Date()) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const dates = []
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d))
    }
    return dates
  }

  const getDepartmentGanttData = () => {
    if (!user) return []
    const allUsers = getUsers()
    const pendingStaff = getPendingStaff()
    const schedules = getSchedules()
    
    // Get registered users in the same department
    const registeredStaff = allUsers.filter(u => u.department === getActiveDepartment() && u.hospital === user.hospital)
    
    // Get pending staff in the same department
    const pendingInDepartment = pendingStaff.filter(p => 
      p.department === getActiveDepartment() && p.hospital === user.hospital
    )
    
    // Combine both registered and pending staff
    const departmentStaff = [...registeredStaff]
    pendingInDepartment.forEach(pending => {
      // Only add if not already in registered staff (by email)
      if (!registeredStaff.find(u => u.email === pending.email)) {
        departmentStaff.push({
          email: pending.email,
          name: pending.name,
          role: pending.role,
          department: pending.department,
          hospital: pending.hospital,
          isPending: true
        })
      }
    })
    
    // Use ganttTimeframe for standalone gantt view, or ganttViewType for monthly view
    const isGanttMode = scheduleView === 'gantt' || (scheduleView === 'monthly' && ganttViewType === 'gantt')
    const timeframe = isGanttMode ? ganttTimeframe : ganttViewType === 'gantt' ? ganttTimeframe : 'month'
    
    const dates = timeframe === 'week' ? getWeekDates() : getMonthDates(currentMonth)
    
    // Organize by shift, then by role
    const organized = []
    
    // Group by shift type (Day, Night)
    const dayShifts = []
    const nightShifts = []
    
    departmentStaff.forEach(staff => {
      const staffSchedules = schedules.filter(s => s.userId === staff.email)
      
      dates.forEach(date => {
        const dateStr = date.toISOString().split('T')[0]
        const shift = staffSchedules.find(s => s.date === dateStr)
        
        if (shift) {
          const entry = {
            staffEmail: staff.email,
            staffName: staff.name,
            role: staff.role,
            date: dateStr,
            shiftType: shift.shiftType,
            startTime: shift.startTime,
            endTime: shift.endTime,
            isPending: staff.isPending || false
          }
          
          if (shift.shiftType === 'Day') {
            dayShifts.push(entry)
          } else {
            nightShifts.push(entry)
          }
        }
      })
    })
    
    // Sort by role: Charge Nurse, Nurse, PCT, HUC
    const roleOrder = ['Charge Nurse', 'Nurse', 'PCT', 'HUC', 'Director', 'Coordinator']
    const sortByRole = (a, b) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role)
    
    dayShifts.sort((a, b) => {
      if (a.staffName === b.staffName) return 0
      return sortByRole(a, b)
    })
    
    nightShifts.sort((a, b) => {
      if (a.staffName === b.staffName) return 0
      return sortByRole(a, b)
    })
    
    return { dayShifts, nightShifts, dates }
  }

  const submitSwapRequest = () => {
    if (!selectedSwapShift || !swapPartner) {
      alert('Please select your shift and a swap partner')
      return
    }

    const partnerEmail = swapPartner.split(' - ')[1] // Extract email from "Name - email"
    const partnerInfo = getUsers().find(u => u.email === partnerEmail)
    
    // Check if cross-department swap
    const sameDepartment = isSameDepartment(user.email, partnerEmail)
    const requesterDepartment = user.department
    const partnerDepartment = partnerInfo ? partnerInfo.department : ''
    
    const swapRequests = getSwapRequests()
    const newRequest = {
      id: `swap-${Date.now()}`,
      requesterId: user.email,
      requesterName: user.name,
      requesterDepartment: requesterDepartment,
      shiftDate: selectedSwapShift.date,
      partnerShiftDate: swapPartnerShiftDate,
      partnerId: partnerEmail,
      partnerName: swapPartner.split(' - ')[0], // Extract name from "Name - email"
      partnerDepartment: partnerDepartment,
      sameDepartment: sameDepartment,
      status: 'pending-partner-approval',
      approvals: {
        partnerApproved: false,
        requesterDirectorApproved: false,
        partnerDirectorApproved: false
      },
      createdAt: new Date().toISOString()
    }

    swapRequests.push(newRequest)
    saveSwapRequests(swapRequests)
    
    alert('Swap request sent! Waiting for partner approval.')
    setShowSwapRequestModal(false)
    setSelectedSwapShift(null)
    setSwapPartner('')
    setSwapPartnerShiftDate('')
  }

  const getAvailableTeamMembers = () => {
    if (!user) return []
    const users = getUsers()
    // Return all users in the same hospital, excluding current user
    return users.filter(u => u.hospital === user.hospital && u.email !== user.email)
  }

  const isSameDepartment = (email1, email2) => {
    const users = getUsers()
    const user1 = users.find(u => u.email === email1)
    const user2 = users.find(u => u.email === email2)
    return user1 && user2 && user1.department === user2.department
  }

  const getDirectorForDepartment = (department, hospital) => {
    const users = getUsers()
    return users.find(u => 
      u.role === 'Director' && 
      u.department === department && 
      u.hospital === hospital
    )
  }

  const openSwapRequestModal = (shift) => {
    setSelectedSwapShift(shift)
    setShowSwapRequestModal(true)
  }

  const approveSwapRequest = (requestId) => {
    const requests = getSwapRequests()
    const request = requests.find(r => r.id === requestId)
    
    if (!request) return
    
    if (request.status === 'pending-partner-approval') {
      // Staff member is approving/partner approving
      if (user.email === request.partnerId) {
        // Partner approving the swap
        request.approvals.partnerApproved = true
        request.partnerApprovedAt = new Date().toISOString()
        
        if (request.sameDepartment) {
          // Same department - needs one director approval
          request.status = 'pending-director-approval'
          alert('Swap request approved! Waiting for director approval.')
        } else {
          // Cross-department - needs both directors
          request.status = 'pending-both-directors-approval'
          alert('Swap request approved! Now waiting for both directors to approve.')
        }
      }
    } else if (request.status === 'pending-director-approval' || 
               request.status === 'pending-both-directors-approval') {
      // Director approving
      if (!isUserDirector()) return
      
      const requestersDept = request.requesterDepartment
      const partnersDept = request.partnerDepartment
      const currentUserDept = user.department
      
      // Check which director is approving
      if (currentUserDept === requestersDept) {
        // Requester's director
        request.approvals.requesterDirectorApproved = true
        request.requesterDirectorApprovedAt = new Date().toISOString()
        request.requesterDirectorEmail = user.email
        request.requesterDirectorName = user.name
      } else if (currentUserDept === partnersDept) {
        // Partner's director
        request.approvals.partnerDirectorApproved = true
        request.partnerDirectorApprovedAt = new Date().toISOString()
        request.partnerDirectorEmail = user.email
        request.partnerDirectorName = user.name
      }
      
      // Check if all required approvals are complete
      const allApprovalsComplete = 
        request.approvals.partnerApproved &&
        (request.sameDepartment ? 
          request.approvals.requesterDirectorApproved : 
          (request.approvals.requesterDirectorApproved && request.approvals.partnerDirectorApproved))
      
      if (allApprovalsComplete) {
        finalizeSwap(requestId)
        return
      } else {
        if (request.sameDepartment) {
          alert('Approval recorded! Waiting for director.')
        } else {
          const awaiting = !request.approvals.requesterDirectorApproved ? 'Requester' : 'Partner'
          alert(`Approval recorded! Still waiting for ${awaiting} department director.`)
        }
      }
    }
    
    saveSwapRequests(requests)
  }

  const finalizeSwap = (requestId) => {
    const requests = getSwapRequests()
    const request = requests.find(r => r.id === requestId)
    
    if (!request) return
    
    // Update schedules
    const schedules = getSchedules()
    const requesterSchedule = schedules.find(s => s.userId === request.requesterId && s.date === request.shiftDate)
    const partnerSchedule = schedules.find(s => s.userId === request.partnerId && s.date === request.partnerShiftDate)
    
    if (requesterSchedule && partnerSchedule) {
      // Swap the shifts
      const tempUserId = requesterSchedule.userId
      requesterSchedule.userId = partnerSchedule.userId
      partnerSchedule.userId = tempUserId
      
      saveSchedules(schedules)
    }
    
    // Mark as completed
    request.status = 'completed'
    request.completedAt = new Date().toISOString()
    
    // Note: approvedBy is already set by the approval process
    
    saveSwapRequests(requests)
    
    let approvalMessage = 'Shift swap completed!\n'
    if (request.sameDepartment) {
      approvalMessage += 'Same department swap - approved by director.'
    } else {
      approvalMessage += 'Cross-department swap - approved by both directors.'
    }
    
    alert(approvalMessage)
  }

  const rejectSwapRequest = (requestId) => {
    const requests = getSwapRequests()
    const request = requests.find(r => r.id === requestId)
    
    if (request) {
      request.status = 'rejected'
      request.rejectedAt = new Date().toISOString()
      request.rejectedBy = user.email
      request.rejectedByName = user.name
      saveSwapRequests(requests)
      alert('Swap request rejected.')
    }
  }

  const getMySwapRequests = () => {
    if (!user) return []
    return getSwapRequests().filter(r => r.requesterId === user.email || r.partnerId === user.email)
  }

  const getPendingSwapsForApproval = () => {
    if (!user) return []
    const requests = getSwapRequests()
    
    if (isUserDirector()) {
      // For directors, show pending requests where their approval is needed
      return requests.filter(r => {
        if (r.status === 'pending-director-approval') {
          // Same department swap - this director needs to approve
          const activeDept = getActiveDepartment()
          return r.requesterDepartment === activeDept || r.partnerDepartment === activeDept
        }
        if (r.status === 'pending-both-directors-approval') {
          // Cross-department - check if this director hasn't approved yet
          const activeDept = getActiveDepartment()
          const needsRequesterApproval = r.requesterDepartment === activeDept && !r.approvals.requesterDirectorApproved
          const needsPartnerApproval = r.partnerDepartment === activeDept && !r.approvals.partnerDirectorApproved
          return needsRequesterApproval || needsPartnerApproval
        }
        return false
      })
    }
    
    return requests.filter(r => r.partnerId === user.email && r.status === 'pending-partner-approval')
  }

  // Time Off Functions
  const getTimeOffRequests = () => {
    const requests = localStorage.getItem('timeOffRequests')
    return requests ? JSON.parse(requests) : []
  }

  const saveTimeOffRequests = (requests) => {
    localStorage.setItem('timeOffRequests', JSON.stringify(requests))
  }

  const submitTimeOffRequest = () => {
    if (!timeOffDate) {
      alert('Please select a date')
      return
    }

    const requests = getTimeOffRequests()
    const newRequest = {
      id: `timeoff-${Date.now()}`,
      userId: user.email,
      userName: user.name,
      date: timeOffDate,
      type: timeOffType,
      reason: timeOffReason,
      status: 'pending',
      createdAt: new Date().toISOString()
    }

    requests.push(newRequest)
    saveTimeOffRequests(requests)
    
    alert('Time off request submitted! Waiting for director approval.')
    setShowTimeOffModal(false)
    setTimeOffDate('')
    setTimeOffReason('')
    setTimeOffType('PTO')
  }

  const approveTimeOffRequest = (requestId) => {
    const requests = getTimeOffRequests()
    const request = requests.find(r => r.id === requestId)
    
    if (!request) return
    
    request.status = 'approved'
    request.approvedAt = new Date().toISOString()
    request.approvedBy = user.email
    request.approvedByName = user.name
    
    // Remove the shift from schedule if it exists
    const schedules = getSchedules()
    const shiftIndex = schedules.findIndex(s => s.userId === request.userId && s.date === request.date)
    
    if (shiftIndex !== -1) {
      schedules.splice(shiftIndex, 1)
      saveSchedules(schedules)
    }
    
    saveTimeOffRequests(requests)
    alert('Time off request approved and schedule updated!')
  }

  const rejectTimeOffRequest = (requestId) => {
    const requests = getTimeOffRequests()
    const request = requests.find(r => r.id === requestId)
    
    if (request) {
      request.status = 'rejected'
      request.rejectedAt = new Date().toISOString()
      request.rejectedBy = user.email
      request.rejectedByName = user.name
      saveTimeOffRequests(requests)
      alert('Time off request rejected.')
    }
  }

  const getMyTimeOffRequests = () => {
    if (!user) return []
    return getTimeOffRequests().filter(r => r.userId === user.email)
  }

  const getPendingTimeOffForApproval = () => {
    if (!user || !isUserDirector()) return []
    return getTimeOffRequests().filter(r => r.status === 'pending')
  }

  // Schedule Creation Functions
  const getAllStaffMembers = () => {
    if (!user) return []
    const users = getUsers()
    const pendingStaff = getPendingStaff()
    
    // Get registered users in the same department
    const registeredStaff = users.filter(u => u.department === getActiveDepartment() && u.hospital === user.hospital)
    
    // Get pending staff in the same department
    const pendingInDepartment = pendingStaff.filter(p => 
      p.department === getActiveDepartment() && p.hospital === user.hospital
    )
    
    // Combine both registered and pending staff, ensuring no duplicates
    const combined = [...registeredStaff]
    pendingInDepartment.forEach(pending => {
      // Only add if not already in registered staff (by email)
      if (!registeredStaff.find(u => u.email === pending.email)) {
        combined.push({
          email: pending.email,
          name: pending.name,
          role: pending.role,
          department: pending.department,
          hospital: pending.hospital,
          isPending: true,
          phone: pending.phone
        })
      }
    })
    
    return combined
  }

  const assignShift = (staffEmail, date, shiftType = 'Day', startTime = '07:00', endTime = '19:00') => {
    const schedules = getSchedules()
    
    // Check if shift already exists for this staff member on this date
    const existingIndex = schedules.findIndex(s => s.userId === staffEmail && s.date === date)
    
    if (existingIndex === -1) {
      // Create new shift
      const newShift = {
        id: `shift-${Date.now()}-${Math.random()}`,
        userId: staffEmail,
        date: date,
        shiftType: shiftType,
        startTime: startTime,
        endTime: endTime
      }
      schedules.push(newShift)
    } else {
      // Update existing shift
      schedules[existingIndex].shiftType = shiftType
      schedules[existingIndex].startTime = startTime
      schedules[existingIndex].endTime = endTime
    }
    
    saveSchedules(schedules)
    alert('Shift assigned successfully!')
  }

  const removeShift = (staffEmail, date) => {
    const schedules = getSchedules()
    const index = schedules.findIndex(s => s.userId === staffEmail && s.date === date)
    
    if (index !== -1) {
      schedules.splice(index, 1)
      saveSchedules(schedules)
      alert('Shift removed successfully!')
    }
  }

  const getAllStaffSchedules = (staffEmail) => {
    const schedules = getSchedules()
    return schedules.filter(s => s.userId === staffEmail)
  }

  const getTimeOffForDate = (date) => {
    const requests = getTimeOffRequests()
    return requests.filter(r => r.date === date && r.userId)
  }

  const handleDayClickForSchedule = (date, staffEmail) => {
    if (!user || !isUserDirector()) return
    
    const dateStr = date.toISOString().split('T')[0]
    const schedules = getSchedules()
    const existingShift = schedules.find(s => s.userId === staffEmail && s.date === dateStr)
    
    // Check if there's already a pending shift for this date
    const existingPendingIndex = pendingShifts.findIndex(
      p => p.staffEmail === staffEmail && p.date === dateStr
    )
    
    if (existingPendingIndex !== -1) {
      // Remove pending shift
      const newPending = [...pendingShifts]
      newPending.splice(existingPendingIndex, 1)
      setPendingShifts(newPending)
      // Clear last shift type if no pending shifts remain for this staff
      const remainingForStaff = newPending.filter(p => p.staffEmail === staffEmail)
      if (remainingForStaff.length === 0) {
        setLastShiftTypeSelected(null)
      }
      alert('Pending shift removed. Click Save to commit changes.')
      return
    }
    
    if (existingShift) {
      if (confirm('Remove existing shift for this day?')) {
        removeShift(staffEmail, dateStr)
      }
    } else {
      // Determine shift type - use remembered type if available, otherwise ask
      let shiftType = lastShiftTypeSelected
      
      if (!shiftType) {
        // First time - ask for shift type with Charge options
        shiftType = prompt('Enter shift type:\n- Day\n- Night\n- Charge Day\n- Charge Night', 'Day')
        if (!shiftType) return // User cancelled
      }
      
      if (shiftType) {
        // Determine start and end times based on shift type
        let startTime, endTime
        if (shiftType === 'Charge Day' || shiftType === 'Day') {
          startTime = '07:00'
          endTime = '19:00'
        } else if (shiftType === 'Charge Night' || shiftType === 'Night') {
          startTime = '19:00'
          endTime = '07:00'
        } else {
          startTime = '07:00'
          endTime = '19:00'
        }
        
        setPendingShifts([...pendingShifts, {
          staffEmail,
          date: dateStr,
          shiftType,
          startTime,
          endTime
        }])
        
        // Remember this shift type for next click
        setLastShiftTypeSelected(shiftType)
      }
    }
  }

  const savePendingShifts = () => {
    if (pendingShifts.length === 0) {
      alert('No pending shifts to save')
      return
    }

    const schedules = getSchedules()
    pendingShifts.forEach(shift => {
      // Check if shift already exists
      const existingIndex = schedules.findIndex(s => s.userId === shift.staffEmail && s.date === shift.date)
      
      if (existingIndex === -1) {
        schedules.push({
          id: `shift-${Date.now()}-${Math.random()}`,
          userId: shift.staffEmail,
          date: shift.date,
          shiftType: shift.shiftType,
          startTime: shift.startTime,
          endTime: shift.endTime
        })
      }
    })
    
    saveSchedules(schedules)
    setPendingShifts([])
    setLastShiftTypeSelected(null) // Clear remembered shift type after saving
    alert(`Successfully saved ${pendingShifts.length} shift(s)!`)
  }

  const clearPendingShifts = () => {
    if (pendingShifts.length === 0) return
    if (confirm(`Clear all ${pendingShifts.length} pending shift(s)?`)) {
      setPendingShifts([])
      setLastShiftTypeSelected(null) // Clear remembered shift type
    }
  }

  // Unit Meeting Functions
  const createUnitMeeting = () => {
    if (!meetingDate || !meetingTitle || !meetingTime) {
      alert('Please fill in meeting date, title, and time')
      return
    }

    const users = getUsers()
    const departmentStaff = users.filter(u => u.department === getActiveDepartment() && u.hospital === user.hospital)
    const schedules = getSchedules()
    let meetingCount = 0

    // Calculate end time based on duration
    const startMinutes = parseInt(meetingTime.split(':')[0]) * 60 + parseInt(meetingTime.split(':')[1])
    const durationMinutes = parseInt(meetingDuration)
    const endMinutes = startMinutes + durationMinutes
    const endHours = Math.floor(endMinutes / 60)
    const endMins = endMinutes % 60
    const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`

    // Add meeting to each staff member's schedule
    departmentStaff.forEach(staff => {
      // Check if shift or meeting already exists for this date
      const existingIndex = schedules.findIndex(s => s.userId === staff.email && s.date === meetingDate)
      
      if (existingIndex === -1) {
        // No existing shift, create meeting entry
        schedules.push({
          id: `meeting-${Date.now()}-${Math.random()}`,
          userId: staff.email,
          date: meetingDate,
          shiftType: 'Meeting',
          startTime: meetingTime,
          endTime: endTime,
          isMeeting: true,
          meetingTitle: meetingTitle,
          meetingDescription: meetingDescription || ''
        })
        meetingCount++
      } else {
        // Shift exists, add meeting note
        const existingShift = schedules[existingIndex]
        if (!existingShift.isMeeting) {
          // Don't overwrite existing shift, just add a note
          alert(`Some staff already have shifts scheduled for ${meetingDate}. Meeting will be added only to those without shifts.`)
        }
      }
    })

    if (meetingCount > 0) {
      saveSchedules(schedules)
      alert(`Unit meeting created! Added to ${meetingCount} staff member schedule(s).`)
    }

    // Reset form
    setMeetingDate('')
    setMeetingTime('09:00')
    setMeetingDuration('60')
    setMeetingTitle('')
    setMeetingDescription('')
    setShowMeetingModal(false)
  }

  const handleTimeOffDayClick = (date, staffEmail) => {
    const requests = getTimeOffRequests()
    const request = requests.find(r => r.userId === staffEmail && r.date === date && r.status === 'pending')
    
    if (request) {
      const staffName = getUsers().find(u => u.email === staffEmail)?.name || 'Unknown'
      const action = confirm(
        `Time Off Request for ${staffName}\n` +
        `Date: ${formatDate(date)}\n` +
        `Type: ${request.type}\n` +
        `Reason: ${request.reason || 'None'}\n\n` +
        `Click OK to approve, Cancel to reject.`
      )
      
      if (action) {
        approveTimeOffRequest(request.id)
      } else {
        rejectTimeOffRequest(request.id)
      }
    }
  }

  // Initialize logs when user logs in
  useEffect(() => {
    if (user) {
      initializeFloatAndOnCallLogs()
    }
  }, [user])

  // If logged in, show dashboard
  if (isLoggedIn && user) {
    const credentialWarnings = getUserCredentialWarnings()
    const birthdayNotifications = getUserBirthdayNotifications()
    
    return (
      <div className="app">
        <div className="container">
          <div className="dashboard-header">
            <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                overflow: 'hidden',
                flexShrink: 0
              }}>
                {user.profilePicture ? (
                  <img 
                    src={user.profilePicture} 
                    alt={user.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    color: 'white',
                    fontWeight: 'bold'
                  }}>
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
              </div>
              <div style={{flex: 1}}>
                <h1>Welcome, {user.name}!</h1>
                <p className="user-info">
                  {user.role || 'Staff'} • {getActiveDepartment()} Department • {user.hospital}
                  {user.shiftPreference && <span> • {user.shiftPreference === 'Both' ? 'Day & Night Shifts' : `${user.shiftPreference} Shift`}</span>}
                </p>
                {(user.role === 'Director' || user.role === 'Coordinator' || user.role === 'Nursing Administrator') && (
                  <div style={{marginTop: '10px'}}>
                    <label style={{display: 'block', fontSize: '0.85rem', color: '#666', marginBottom: '5px'}}>
                      View Department:
                    </label>
                    <select
                      value={selectedDepartment || user.department}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '5px',
                        border: '1px solid #ddd',
                        fontSize: '0.9rem',
                        background: 'white',
                        cursor: 'pointer',
                        minWidth: '200px'
                      }}
                    >
                      <option value={user.department}>{user.department}</option>
                      {(() => {
                        const allUsers = getUsers()
                        const pendingStaff = getPendingStaff()
                        
                        // Get departments based on role
                        let availableDepartments = new Set()
                        
                        if (user.role === 'Nursing Administrator') {
                          // Nursing Administrators see all departments in their hospital
                          allUsers.forEach(u => {
                            if (u.hospital === user.hospital) {
                              availableDepartments.add(u.department)
                            }
                          })
                          pendingStaff.forEach(p => {
                            if (p.hospital === user.hospital && p.department) {
                              availableDepartments.add(p.department)
                            }
                          })
                        } else if (user.role === 'Director' || user.role === 'Coordinator') {
                          // Directors/Coordinators see only their supervised departments
                          const supervisedDepts = user.supervisedDepartments || [user.department]
                          supervisedDepts.forEach(dept => availableDepartments.add(dept))
                        }
                        
                        return Array.from(availableDepartments)
                          .filter(dept => dept !== user.department)
                          .sort()
                          .map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))
                      })()}
                    </select>
                  </div>
                )}
              </div>
            </div>
            <div className="header-buttons">
              <button onClick={openProfileEditor} className="profile-button">
                ✏️ Edit Profile
              </button>
              <button onClick={handleLogout} className="logout-button">
                Log Out
              </button>
            </div>
          </div>

          {/* Notifications */}
          {(credentialWarnings.length > 0 || birthdayNotifications.length > 0) && (
            <div className="notifications-section">
              {credentialWarnings.map((warning, index) => (
                <div key={`credential-${index}`} className={`notification ${warning.days < 0 ? 'urgent' : 'warning'}`}>
                  <span className="notification-icon">⚠️</span>
                  <span className="notification-message">{warning.message}</span>
                </div>
              ))}
              {birthdayNotifications.map((notif, index) => (
                <div key={`birthday-${index}`} className="notification birthday">
                  <span className="notification-icon">🎉</span>
                  <span className="notification-message">{notif.message}</span>
                </div>
              ))}
            </div>
          )}

          {/* User Credentials */}
          <div className="card">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
              <h2>My Credentials</h2>
              <button 
                onClick={() => {
                  setNewCredentialName('')
                  setNewCredentialExpiration('')
                  setEditingCredentialIndex(null)
                  setShowCredentialModal(true)
                }}
                className="submit-btn"
                style={{padding: '8px 15px', fontSize: '0.9rem'}}
              >
                + Add Credential
              </button>
            </div>
            <div className="credentials-grid">
              <div className="credential-item">
                <label>License Number</label>
                <p className="credential-value">{user.licenseNumber || 'N/A'}</p>
              </div>
              <div className="credential-item">
                <label>License Expiration</label>
                <p className={`credential-value ${credentialWarnings.find(w => w.type === 'license') ? 'expiring' : ''}`}>
                  {user.licenseExpiration || 'N/A'}
                </p>
              </div>
              <div className="credential-item">
                <label>CPR Expiration</label>
                <p className={`credential-value ${credentialWarnings.find(w => w.type === 'cpr') ? 'expiring' : ''}`}>
                  {user.cprExpiration || 'N/A'}
                </p>
              </div>
              
              {/* Custom Credentials */}
              {user.credentials && user.credentials.length > 0 && user.credentials.map((credential, index) => {
                const warning = credentialWarnings.find(w => w.type === 'credential' && w.credentialName === credential.name)
                return (
                  <div key={index} className="credential-item" style={{position: 'relative'}}>
                    <label>{credential.name}</label>
                    <p className={`credential-value ${warning ? 'expiring' : ''}`}>
                      {credential.expiration}
                    </p>
                    <div style={{display: 'flex', gap: '5px', marginTop: '5px'}}>
                      <button 
                        onClick={() => editCredential(index)}
                        style={{
                          padding: '4px 10px',
                          fontSize: '0.75rem',
                          background: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => removeCredential(index)}
                        style={{
                          padding: '4px 10px',
                          fontSize: '0.75rem',
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Schedule Section */}
          <div className="card schedule-card">
            <div className="schedule-header">
              <h2>
                {scheduleView === 'monthly' && ganttViewType === 'calendar' && 'My Monthly Schedule'}
                {scheduleView === 'monthly' && ganttViewType === 'gantt' && 'Department Schedule - Gantt Chart'}
                {scheduleView === 'daily' && `Who's Working Today - ${new Date().toLocaleDateString()}`}
                {scheduleView === 'swap' && 'Shift Swap Management'}
                {scheduleView === 'timeoff' && 'Time Off Requests'}
                {scheduleView === 'staff' && 'Staff Management'}
                {scheduleView === 'callins' && 'Call-Ins History'}
                {scheduleView === 'create' && 'Create Schedule'}
              </h2>
              <div className="view-buttons">
                <button 
                  className={`view-btn ${scheduleView === 'monthly' && ganttViewType === 'calendar' ? 'active' : ''}`}
                  onClick={() => {
                    setScheduleView('monthly')
                    setGanttViewType('calendar')
                  }}
                >
                  📅 Monthly
                </button>
                <button 
                  className={`view-btn ${scheduleView === 'monthly' && ganttViewType === 'gantt' ? 'active' : ''}`}
                  onClick={() => {
                    setScheduleView('monthly')
                    setGanttViewType('gantt')
                  }}
                >
                  📊 Gantt
                </button>
                <button 
                  className={`view-btn ${scheduleView === 'swap' ? 'active' : ''}`}
                  onClick={() => setScheduleView('swap')}
                >
                  🔄 Swaps
                  {getPendingSwapsForApproval().length > 0 && (
                    <span className="notification-badge">{getPendingSwapsForApproval().length}</span>
                  )}
                </button>
                <button 
                  className={`view-btn ${scheduleView === 'timeoff' ? 'active' : ''}`}
                  onClick={() => setScheduleView('timeoff')}
                >
                  📅 Time Off
                  {isUserDirector() && getPendingTimeOffForApproval().length > 0 && (
                    <span className="notification-badge">{getPendingTimeOffForApproval().length}</span>
                  )}
                </button>
                <button 
                  className={`view-btn ${scheduleView === 'daily' ? 'active' : ''}`}
                  onClick={() => setScheduleView('daily')}
                >
                  👥 Today
                </button>
                {isUserDirector() && (
                  <button 
                    className={`view-btn ${scheduleView === 'callins' ? 'active' : ''}`}
                    onClick={() => setScheduleView('callins')}
                  >
                    📞 Call-Ins
                  </button>
                )}
                {canManageRoles() && (
                  <button 
                    className={`view-btn ${scheduleView === 'staff' ? 'active' : ''}`}
                    onClick={() => setScheduleView('staff')}
                  >
                    👨‍⚕️ Staff
                  </button>
                )}
                {isUserDirector() && (
                  <button 
                    className={`view-btn ${scheduleView === 'create' ? 'active' : ''}`}
                    onClick={() => setScheduleView('create')}
                  >
                    ✏️ Create
                  </button>
                )}
              </div>
            </div>

            {/* Monthly Calendar View or Gantt Chart */}
            {scheduleView === 'monthly' && (
              <>
                <div className="calendar-nav">
                  <button onClick={() => {
                    const newMonth = new Date(currentMonth)
                    newMonth.setMonth(newMonth.getMonth() - 1)
                    setCurrentMonth(newMonth)
                  }}>
                    ← Previous
                  </button>
                  <h3>{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
                  <button onClick={() => {
                    const newMonth = new Date(currentMonth)
                    newMonth.setMonth(newMonth.getMonth() + 1)
                    setCurrentMonth(newMonth)
                  }}>
                    Next →
                  </button>
                </div>
                {/* View Toggle */}
                <div className="gantt-view-toggle" style={{marginBottom: '20px', justifyContent: 'flex-end', padding: '10px 0'}}>
                  <button 
                    className={`toggle-btn ${ganttViewType === 'calendar' ? 'active' : ''}`}
                    onClick={() => setGanttViewType('calendar')}
                  >
                    📅 Calendar
                  </button>
                  <button 
                    className={`toggle-btn ${ganttViewType === 'gantt' ? 'active' : ''}`}
                    onClick={() => setGanttViewType('gantt')}
                  >
                    📊 Gantt Chart
                  </button>
                </div>

                {ganttViewType === 'calendar' ? (
                  <div className="calendar-view">
                    <div className="calendar-grid">
                      <div className="day-header">Sun</div>
                      <div className="day-header">Mon</div>
                      <div className="day-header">Tue</div>
                      <div className="day-header">Wed</div>
                      <div className="day-header">Thu</div>
                      <div className="day-header">Fri</div>
                      <div className="day-header">Sat</div>
                      {Array.from({ length: getDaysInMonth(currentMonth).startingDayOfWeek }).map((_, i) => (
                        <div key={`empty-${i}`} className="calendar-day empty"></div>
                      ))}
                      {Array.from({ length: getDaysInMonth(currentMonth).daysInMonth }).map((_, i) => {
                        const day = i + 1
                        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
                        const isWorking = isWorkDay(date, user.email)
                        const isToday = date.toDateString() === new Date().toDateString()
                        
                        return (
                          <div 
                            key={day} 
                            className={`calendar-day ${isWorking ? 'working' : ''} ${isToday ? 'today' : ''}`}
                          >
                            <div className="day-number">{day}</div>
                            {isWorking && <div className="shift-indicator">●</div>}
                          </div>
                        )
                      })}
                    </div>
                    <div className="calendar-legend">
                      <div className="legend-item">
                        <span className="legend-dot working"></span>
                        <span>Working Day</span>
                      </div>
                      <div className="legend-item">
                        <span className="legend-dot today"></span>
                        <span>Today</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="gantt-view">
                    <div className="gantt-controls">
                      <div className="gantt-view-toggle">
                        <button 
                          className={`toggle-btn ${ganttTimeframe === 'week' ? 'active' : ''}`}
                          onClick={() => setGanttTimeframe('week')}
                        >
                          📅 Week
                        </button>
                        <button 
                          className={`toggle-btn ${ganttTimeframe === 'month' ? 'active' : ''}`}
                          onClick={() => setGanttTimeframe('month')}
                        >
                          📆 Month
                        </button>
                      </div>
                    </div>

                    {(() => {
                      const ganttData = getDepartmentGanttData()
                      const { dayShifts, nightShifts, dates } = ganttData

                      // Group by staff member
                      const dayStaffMap = new Map()
                      dayShifts.forEach(shift => {
                        if (!dayStaffMap.has(shift.staffName)) {
                          dayStaffMap.set(shift.staffName, {
                            name: shift.staffName,
                            role: shift.role,
                            isPending: shift.isPending,
                            shifts: []
                          })
                        }
                        dayStaffMap.get(shift.staffName).shifts.push(shift)
                      })

                      const nightStaffMap = new Map()
                      nightShifts.forEach(shift => {
                        if (!nightStaffMap.has(shift.staffName)) {
                          nightStaffMap.set(shift.staffName, {
                            name: shift.staffName,
                            role: shift.role,
                            isPending: shift.isPending,
                            shifts: []
                          })
                        }
                        nightStaffMap.get(shift.staffName).shifts.push(shift)
                      })

                      return (
                        <div className="gantt-container">
                          {/* Day Shifts */}
                          {dayShifts.length > 0 && (
                            <div className="gantt-section">
                              <h3 className="gantt-section-title">☀️ Day Shifts</h3>
                              <div className="gantt-table">
                                <div className="gantt-header">
                                  <div className="gantt-staff-column">Staff / Role</div>
                                  <div className="gantt-dates-row">
                                    {dates.map((date, idx) => (
                                      <div key={idx} className="gantt-date-cell">
                                        <div className="gantt-date-day">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                                        <div className="gantt-date-num">{date.getDate()}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                {/* Staff Counts Rows - Multiple rows for different roles */}
                                {['Charge Nurse', 'Nurse', 'PCT', 'HUC'].map((role, roleIdx) => (
                                  <div key={role} style={{
                                    display: 'flex',
                                    background: '#f0f8ff',
                                    borderBottom: roleIdx === 3 ? '2px solid #4169E1' : '1px solid #e0e0e0',
                                    padding: '4px 0',
                                    fontSize: '0.85rem',
                                    width: '100%'
                                  }}>
                                    <div style={{
                                      width: '180px',
                                      padding: '0 15px',
                                      fontWeight: 'bold',
                                      color: '#4169E1',
                                      fontSize: '0.8rem',
                                      display: 'flex',
                                      alignItems: 'center'
                                    }}>
                                      {role === 'Charge Nurse' ? '👩‍⚕️ Charge:' : 
                                       role === 'Nurse' ? '👨‍⚕️ Nurses:' : 
                                       role === 'PCT' ? '🩺 PCT:' : 
                                       '📋 HUC:'}
                                    </div>
                                    <div style={{display: 'flex', flex: 1, gap: 0}}>
                                      {dates.map((date, dateIdx) => {
                                        const dateStr = date.toISOString().split('T')[0]
                                        // Count staff of this role scheduled for this day in day shifts
                                        // For Charge Nurse, include those working Charge Day shifts
                                        const roleCount = Array.from(dayStaffMap.values()).filter(staff => {
                                          const hasShiftOnDate = staff.shifts.some(s => s.date === dateStr)
                                          if (!hasShiftOnDate) return false
                                          
                                          if (role === 'Charge Nurse') {
                                            return staff.role === role || staff.shifts.some(s => s.date === dateStr && (s.shiftType === 'Charge Day' || s.shiftType === 'Charge Night'))
                                          } else if (role === 'Nurse') {
                                            // Don't count Charge Day/Night shift holders as regular nurses
                                            return staff.role === role && !staff.shifts.some(s => s.date === dateStr && (s.shiftType === 'Charge Day' || s.shiftType === 'Charge Night'))
                                          }
                                          return staff.role === role
                                        }).length
                                        return (
                                          <div key={dateIdx} style={{
                                            flex: 1,
                                            padding: '2px',
                                            textAlign: 'center',
                                            fontWeight: 'bold',
                                            color: '#4169E1'
                                          }}>
                                            {roleCount}
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </div>
                                ))}
                                <div className="gantt-body">
                                  {Array.from(dayStaffMap.values()).map((staff, idx) => (
                                    <div key={idx} className="gantt-row">
                                      <div className="gantt-staff-cell">
                                        <div className="gantt-staff-name">
                                          {staff.name}
                                          {staff.isPending && (
                                            <span style={{
                                              marginLeft: '5px',
                                              fontSize: '0.7rem',
                                              background: '#ffc107',
                                              color: '#000',
                                              padding: '2px 5px',
                                              borderRadius: '3px',
                                              fontWeight: 'bold'
                                            }}>⏳ Pending</span>
                                          )}
                                        </div>
                                        <div className="gantt-staff-role">{staff.role}</div>
                                      </div>
                                      <div className="gantt-shifts-row">
                                        {dates.map((date, dateIdx) => {
                                          const dateStr = date.toISOString().split('T')[0]
                                          const hasShift = staff.shifts.find(s => s.date === dateStr)
                                          return (
                                            <div key={dateIdx} className={`gantt-shift-cell ${hasShift ? 'has-shift' : ''}`}>
                                              {hasShift && <div className="gantt-bar day-bar">{hasShift.startTime}</div>}
                                            </div>
                                          )
                                        })}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Night Shifts */}
                          {nightShifts.length > 0 && (
                            <div className="gantt-section">
                              <h3 className="gantt-section-title">🌙 Night Shifts</h3>
                              <div className="gantt-table">
                                <div className="gantt-header">
                                  <div className="gantt-staff-column">Staff / Role</div>
                                  <div className="gantt-dates-row">
                                    {dates.map((date, idx) => (
                                      <div key={idx} className="gantt-date-cell">
                                        <div className="gantt-date-day">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                                        <div className="gantt-date-num">{date.getDate()}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                {/* Staff Counts Rows - Multiple rows for different roles */}
                                {['Charge Nurse', 'Nurse', 'PCT', 'HUC'].map((role, roleIdx) => (
                                  <div key={role} style={{
                                    display: 'flex',
                                    background: '#2c3e50',
                                    borderBottom: roleIdx === 3 ? '2px solid #4169E1' : '1px solid #555',
                                    padding: '4px 0',
                                    fontSize: '0.85rem',
                                    width: '100%'
                                  }}>
                                    <div style={{
                                      width: '180px',
                                      padding: '0 15px',
                                      fontWeight: 'bold',
                                      color: '#fff',
                                      fontSize: '0.8rem',
                                      display: 'flex',
                                      alignItems: 'center'
                                    }}>
                                      {role === 'Charge Nurse' ? '👩‍⚕️ Charge:' : 
                                       role === 'Nurse' ? '👨‍⚕️ Nurses:' : 
                                       role === 'PCT' ? '🩺 PCT:' : 
                                       '📋 HUC:'}
                                    </div>
                                    <div style={{display: 'flex', flex: 1, gap: 0}}>
                                      {dates.map((date, dateIdx) => {
                                        const dateStr = date.toISOString().split('T')[0]
                                        // Count staff of this role scheduled for this day in night shifts
                                        // For Charge Nurse, include those working Charge Day shifts
                                        const roleCount = Array.from(nightStaffMap.values()).filter(staff => {
                                          const hasShiftOnDate = staff.shifts.some(s => s.date === dateStr)
                                          if (!hasShiftOnDate) return false
                                          
                                          if (role === 'Charge Nurse') {
                                            return staff.role === role || staff.shifts.some(s => s.date === dateStr && (s.shiftType === 'Charge Day' || s.shiftType === 'Charge Night'))
                                          } else if (role === 'Nurse') {
                                            // Don't count Charge Day/Night shift holders as regular nurses
                                            return staff.role === role && !staff.shifts.some(s => s.date === dateStr && (s.shiftType === 'Charge Day' || s.shiftType === 'Charge Night'))
                                          }
                                          return staff.role === role
                                        }).length
                                        return (
                                          <div key={dateIdx} style={{
                                            flex: 1,
                                            padding: '2px',
                                            textAlign: 'center',
                                            fontWeight: 'bold',
                                            color: '#fff'
                                          }}>
                                            {roleCount}
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </div>
                                ))}
                                <div className="gantt-body">
                                  {Array.from(nightStaffMap.values()).map((staff, idx) => (
                                    <div key={idx} className="gantt-row">
                                      <div className="gantt-staff-cell">
                                        <div className="gantt-staff-name">
                                          {staff.name}
                                          {staff.isPending && (
                                            <span style={{
                                              marginLeft: '5px',
                                              fontSize: '0.7rem',
                                              background: '#ffc107',
                                              color: '#000',
                                              padding: '2px 5px',
                                              borderRadius: '3px',
                                              fontWeight: 'bold'
                                            }}>⏳ Pending</span>
                                          )}
                                        </div>
                                        <div className="gantt-staff-role">{staff.role}</div>
                                      </div>
                                      <div className="gantt-shifts-row">
                                        {dates.map((date, dateIdx) => {
                                          const dateStr = date.toISOString().split('T')[0]
                                          const hasShift = staff.shifts.find(s => s.date === dateStr)
                                          return (
                                            <div key={dateIdx} className={`gantt-shift-cell ${hasShift ? 'has-shift' : ''}`}>
                                              {hasShift && <div className="gantt-bar night-bar">{hasShift.startTime}</div>}
                                            </div>
                                          )
                                        })}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {dayShifts.length === 0 && nightShifts.length === 0 && (
                            <p className="placeholder-text">No shifts scheduled for this period. Use "Create Schedule" to add shifts.</p>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                )}
              </>
            )}

            {/* Daily View - Who's Working Today */}
            {scheduleView === 'daily' && (
              <div className="daily-view">
                {(() => {
                  const workingStaff = getWorkingStaffToday()
                  const dayStaff = workingStaff.filter(s => s.shiftType === 'Day')
                  const nightStaff = workingStaff.filter(s => s.shiftType === 'Night')
                  
                  return workingStaff.length > 0 ? (
                    <>
                      {/* Day Shift Section */}
                      {dayStaff.length > 0 && (
                        <div className="shift-section">
                          <h3 style={{marginBottom: '20px', color: '#FFA500', borderBottom: '2px solid #FFA500', paddingBottom: '10px'}}>☀️ Day Shift</h3>
                          
                          {(() => {
                            const nextDayFloat = getNextForFloat('Day')
                            const nextDayOnCall = getNextForOnCall('Day')
                            
                            return (nextDayFloat || nextDayOnCall) && (
                              <div className="rotation-banner">
                                {nextDayFloat && (
                                  <div className="rotation-item">
                                    <span className="rotation-label">🔄 Next to Float:</span>
                                    <span className="rotation-name">{nextDayFloat.userName}</span>
                                    {canModifyFloatAndOnCall() ? (
                                      <button 
                                        className="rotation-btn"
                                        onClick={() => {
                                          setSelectedStaffForFloat(nextDayFloat.userName)
                                          setShowFloatModal(true)
                                        }}
                                      >
                                        Log Float
                                      </button>
                                    ) : (
                                      <span className="rotation-info-text">View Only</span>
                                    )}
                                  </div>
                                )}
                                {nextDayOnCall && (
                                  <div className="rotation-item">
                                    <span className="rotation-label">📞 Next On-Call:</span>
                                    <span className="rotation-name">{nextDayOnCall.userName}</span>
                                    {canModifyFloatAndOnCall() ? (
                                      <>
                                        <button 
                                          className="rotation-btn"
                                          onClick={() => {
                                            setSelectedStaffForOnCall(nextDayOnCall.userName)
                                            setOnCallDeclined(false)
                                            setShowOnCallModal(true)
                                          }}
                                        >
                                          Log On-Call
                                        </button>
                                        <button 
                                          className="rotation-btn decline-btn"
                                          onClick={() => declineOnCall()}
                                        >
                                          Decline
                                        </button>
                                        <button 
                                          className="rotation-btn callback-btn"
                                          onClick={() => markOnCallAsCalledBack(nextDayOnCall.userName)}
                                        >
                                          Mark Called Back
                                        </button>
                                      </>
                                    ) : (
                                      <span className="rotation-info-text">View Only</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })()}
                      
                      {/* Staff Tally Section - Day Shift */}
                      {(() => {
                        const calledInToday = getCalledInToday()
                        const calledInEmails = calledInToday.map(c => c.userId)
                        const allUsers = getUsers()
                        
                        // Get day shift staff actually working (not called in, not floated, exclude Directors and Coordinators)
                        const pendingStaffList = getPendingStaff()
                        const actuallyWorking = dayStaff
                          .filter(shift => !calledInEmails.includes(shift.userId))
                          .map(shift => {
                            const staffUser = allUsers.find(u => u.email === shift.userId)
                            const pendingStaff = staffUser ? null : pendingStaffList.find(p => p.email === shift.userId)
                            return { 
                              ...shift, 
                              role: staffUser?.role || pendingStaff?.role || 'Unknown'
                            }
                          })
                          .filter(shift => shift.role !== 'Director' && shift.role !== 'Coordinator')
                        
                        // Count by role - include those working charge shifts
                        const chargeCount = actuallyWorking.filter(s => 
                          s.role === 'Charge Nurse' || s.shiftType === 'Charge Day' || s.shiftType === 'Charge Night'
                        ).length
                        const nurseCount = actuallyWorking.filter(s => 
                          s.role === 'Nurse' && s.shiftType !== 'Charge Day' && s.shiftType !== 'Charge Night'
                        ).length
                        const pctCount = actuallyWorking.filter(s => s.role === 'PCT').length
                        const hucCount = actuallyWorking.filter(s => s.role === 'HUC').length
                        const totalCount = actuallyWorking.length
                        
                        return (
                          <>
                            <div className="staff-tally-card">
                              <h3 className="tally-header">📊 Staff Count Today</h3>
                              <div className="tally-grid">
                                <div className="tally-item">
                                  <span className="tally-label">Charge Nurse:</span>
                                  <span className="tally-count">{chargeCount}</span>
                                </div>
                                <div className="tally-item">
                                  <span className="tally-label">Nurses:</span>
                                  <span className="tally-count">{nurseCount}</span>
                                </div>
                                <div className="tally-item">
                                  <span className="tally-label">PCT:</span>
                                  <span className="tally-count">{pctCount}</span>
                                </div>
                                <div className="tally-item">
                                  <span className="tally-label">HUC:</span>
                                  <span className="tally-count">{hucCount}</span>
                                </div>
                                <div className="tally-item total">
                                  <span className="tally-label">Total Staff:</span>
                                  <span className="tally-count">{totalCount}</span>
                                </div>
                              </div>
                              {calledInToday.length > 0 && (
                                <div className="called-in-section">
                                  <div className="called-in-header">
                                    <span className="called-in-label">📞 Called In ({calledInToday.length})</span>
                                  </div>
                                  {calledInToday.map((entry, idx) => {
                                    const calledInUser = allUsers.find(u => u.email === entry.userId)
                                    return (
                                      <div key={idx} className="called-in-item">
                                        <span className="called-in-name">{entry.userName} ({calledInUser?.role || 'Staff'})</span>
                                        {entry.reason && (
                                          <span className="called-in-reason">- {entry.reason}</span>
                                        )}
                                        {canManageCalledIn() && (
                                          <button 
                                            className="remove-called-in-btn"
                                            onClick={() => {
                                              const calledInLog = localStorage.getItem('calledIn')
                                              const all = calledInLog ? JSON.parse(calledInLog) : []
                                              const updated = all.filter(e => e.id !== entry.id)
                                              localStorage.setItem('calledIn', JSON.stringify(updated))
                                              alert(`${entry.userName} removed from called in list.`)
                                            }}
                                            title="Remove from called in list"
                                          >
                                            ✕
                                          </button>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          </>
                        )
                      })()}
                      
                      {/* Day Staff List */}
                      <div className="staff-list">
                        {dayStaff.map((shift, index) => {
                          const user = getUsers().find(u => u.email === shift.userId)
                          const lastFloatDate = getLastFloatDate(shift.userId)
                          const lastOnCallDate = getLastOnCallDate(shift.userId)
                          const formattedFloatDate = lastFloatDate ? new Date(lastFloatDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Never'
                          const formattedOnCallDate = lastOnCallDate ? new Date(lastOnCallDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Never'
                          
                          return (
                            <div key={index} className="staff-card enhanced">
                              <div className="staff-main">
                                <div className="staff-info">
                                  <div className="staff-avatar">{shift.userName ? shift.userName.charAt(0).toUpperCase() : '?'}</div>
                                  <div>
                                    <h4>
                                      {shift.userName}
                                      {shift.isPending && (
                                        <span style={{
                                          marginLeft: '8px',
                                          fontSize: '0.7rem',
                                          background: '#ffc107',
                                          color: '#000',
                                          padding: '2px 6px',
                                          borderRadius: '3px',
                                          fontWeight: 'bold'
                                        }}>
                                          ⏳ Pending
                                        </span>
                                      )}
                                    </h4>
                                    <p>{user ? user.department : 'Unknown'} Department</p>
                                  </div>
                                </div>
                                <div className="shift-info">
                                  <div className="shift-type">{shift.shiftType} Shift</div>
                                  <div className="shift-time">{shift.startTime} - {shift.endTime}</div>
                                </div>
                              </div>
                              <div className="staff-history">
                                <div className="history-item">
                                  <span className="history-label">🌊 Last Float:</span>
                                  <span className={`history-date ${lastFloatDate ? '' : 'never'}`}>{formattedFloatDate}</span>
                                </div>
                                <div className="history-item">
                                  <span className="history-label">📞 Last On-Call:</span>
                                  <span className={`history-date ${lastOnCallDate ? '' : 'never'}`}>{formattedOnCallDate}</span>
                                </div>
                                {canManageCalledIn() && (
                                  <button 
                                    className="mark-called-in-btn"
                                    onClick={() => markCalledIn(shift.userId, shift.userName)}
                                    title="Mark as called in"
                                  >
                                    📞 Mark Called In
                                  </button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      </div>
                      )}
                      
                      {/* Night Shift Section */}
                      {nightStaff.length > 0 && (
                        <div className="shift-section" style={{marginTop: '30px'}}>
                          <h3 style={{marginBottom: '20px', color: '#4169E1', borderBottom: '2px solid #4169E1', paddingBottom: '10px'}}>🌙 Night Shift</h3>
                          
                          {(() => {
                            const nextNightFloat = getNextForFloat('Night')
                            const nextNightOnCall = getNextForOnCall('Night')
                            
                            return (nextNightFloat || nextNightOnCall) && (
                              <div className="rotation-banner">
                                {nextNightFloat && (
                                  <div className="rotation-item">
                                    <span className="rotation-label">🔄 Next to Float:</span>
                                    <span className="rotation-name">{nextNightFloat.userName}</span>
                                    {canModifyFloatAndOnCall() ? (
                                      <button 
                                        className="rotation-btn"
                                        onClick={() => {
                                          setSelectedStaffForFloat(nextNightFloat.userName)
                                          setShowFloatModal(true)
                                        }}
                                      >
                                        Log Float
                                      </button>
                                    ) : (
                                      <span className="rotation-info-text">View Only</span>
                                    )}
                                  </div>
                                )}
                                {nextNightOnCall && (
                                  <div className="rotation-item">
                                    <span className="rotation-label">📞 Next On-Call:</span>
                                    <span className="rotation-name">{nextNightOnCall.userName}</span>
                                    {canModifyFloatAndOnCall() ? (
                                      <>
                                        <button 
                                          className="rotation-btn"
                                          onClick={() => {
                                            setSelectedStaffForOnCall(nextNightOnCall.userName)
                                            setOnCallDeclined(false)
                                            setShowOnCallModal(true)
                                          }}
                                        >
                                          Log On-Call
                                        </button>
                                        <button 
                                          className="rotation-btn decline-btn"
                                          onClick={() => declineOnCall()}
                                        >
                                          Decline
                                        </button>
                                        <button 
                                          className="rotation-btn callback-btn"
                                          onClick={() => markOnCallAsCalledBack(nextNightOnCall.userName)}
                                        >
                                          Mark Called Back
                                        </button>
                                      </>
                                    ) : (
                                      <span className="rotation-info-text">View Only</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })()}
                          
                          {/* Night Staff List */}
                          <div className="staff-list">
                            {nightStaff.map((shift, index) => {
                              const user = getUsers().find(u => u.email === shift.userId)
                              const lastFloatDate = getLastFloatDate(shift.userId)
                              const lastOnCallDate = getLastOnCallDate(shift.userId)
                              const formattedFloatDate = lastFloatDate ? new Date(lastFloatDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Never'
                              const formattedOnCallDate = lastOnCallDate ? new Date(lastOnCallDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Never'
                              
                              return (
                                <div key={index} className="staff-card enhanced">
                                  <div className="staff-main">
                                    <div className="staff-info">
                                      <div className="staff-avatar">{shift.userName ? shift.userName.charAt(0).toUpperCase() : '?'}</div>
                                      <div>
                                        <h4>{shift.userName}</h4>
                                        <p>{user ? user.department : 'Unknown'} Department</p>
                                      </div>
                                    </div>
                                    <div className="shift-info">
                                      <div className="shift-type">{shift.shiftType} Shift</div>
                                      <div className="shift-time">{shift.startTime} - {shift.endTime}</div>
                                    </div>
                                  </div>
                                  <div className="staff-history">
                                    <div className="history-item">
                                      <span className="history-label">🌊 Last Float:</span>
                                      <span className={`history-date ${lastFloatDate ? '' : 'never'}`}>{formattedFloatDate}</span>
                                    </div>
                                    <div className="history-item">
                                      <span className="history-label">📞 Last On-Call:</span>
                                      <span className={`history-date ${lastOnCallDate ? '' : 'never'}`}>{formattedOnCallDate}</span>
                                    </div>
                                    {canManageCalledIn() && (
                                      <button 
                                        className="mark-called-in-btn"
                                        onClick={() => markCalledIn(shift.userId, shift.userName)}
                                        title="Mark as called in"
                                      >
                                        📞 Mark Called In
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                          
                          {/* Staff Tally Section - Night Shift */}
                          {(() => {
                            const calledInToday = getCalledInToday()
                            const calledInEmails = calledInToday.map(c => c.userId)
                            const allUsers = getUsers()
                            const pendingStaffList = getPendingStaff()
                            
                            // Get night shift staff actually working (not called in, not floated, exclude Directors and Coordinators)
                            const actuallyWorking = nightStaff
                              .filter(shift => !calledInEmails.includes(shift.userId))
                              .map(shift => {
                                const staffUser = allUsers.find(u => u.email === shift.userId)
                                const pendingStaff = staffUser ? null : pendingStaffList.find(p => p.email === shift.userId)
                                return { 
                                  ...shift, 
                                  role: staffUser?.role || pendingStaff?.role || 'Unknown'
                                }
                              })
                              .filter(shift => shift.role !== 'Director' && shift.role !== 'Coordinator')
                            
                            // Count by role - include those working charge shifts
                            const chargeCount = actuallyWorking.filter(s => 
                              s.role === 'Charge Nurse' || s.shiftType === 'Charge Day' || s.shiftType === 'Charge Night'
                            ).length
                            const nurseCount = actuallyWorking.filter(s => 
                              s.role === 'Nurse' && s.shiftType !== 'Charge Day' && s.shiftType !== 'Charge Night'
                            ).length
                            const pctCount = actuallyWorking.filter(s => s.role === 'PCT').length
                            const hucCount = actuallyWorking.filter(s => s.role === 'HUC').length
                            const totalCount = actuallyWorking.length
                            
                            return (
                              <>
                                <div className="staff-tally-card">
                                  <h3 className="tally-header">📊 Night Shift Staff Count</h3>
                                  <div className="tally-grid">
                                    <div className="tally-item">
                                      <span className="tally-label">Charge Nurse:</span>
                                      <span className="tally-count">{chargeCount}</span>
                                    </div>
                                    <div className="tally-item">
                                      <span className="tally-label">Nurses:</span>
                                      <span className="tally-count">{nurseCount}</span>
                                    </div>
                                    <div className="tally-item">
                                      <span className="tally-label">PCT:</span>
                                      <span className="tally-count">{pctCount}</span>
                                    </div>
                                    <div className="tally-item">
                                      <span className="tally-label">HUC:</span>
                                      <span className="tally-count">{hucCount}</span>
                                    </div>
                                    <div className="tally-item total">
                                      <span className="tally-label">Total Night Staff:</span>
                                      <span className="tally-count">{totalCount}</span>
                                    </div>
                                  </div>
                                </div>
                              </>
                            )
                          })()}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="placeholder-text">No one scheduled to work today in your department.</p>
                  )
                })()}
              </div>
            )}

            {/* Shift Swap View */}
            {scheduleView === 'swap' && (
              <div style={{padding: '20px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px'}}>
                  <button 
                    className="request-swap-btn"
                    onClick={() => {
                      const schedules = getSchedules()
                      const userSchedules = schedules.filter(s => s.userId === user.email && new Date(s.date) >= new Date())
                      const sortedSchedules = userSchedules.sort((a, b) => new Date(a.date) - new Date(b.date))
                      
                      if (sortedSchedules.length > 0) {
                        const shift = sortedSchedules[0]
                        const formattedShift = {
                          date: shift.date,
                          shiftType: shift.shiftType,
                          startTime: shift.startTime,
                          endTime: shift.endTime
                        }
                        openSwapRequestModal(formattedShift)
                      } else {
                        alert('You need to have upcoming shifts to request a swap')
                      }
                    }}
                  >
                    🔄 Request Swap
                  </button>
                  <div className="view-buttons">
                    <button 
                      className={`view-btn ${swapView === 'pending' ? 'active' : ''}`}
                      onClick={() => setSwapView('pending')}
                    >
                      📋 My Requests
                    </button>
                    <button 
                      className={`view-btn ${swapView === 'approvals' ? 'active' : ''}`}
                      onClick={() => setSwapView('approvals')}
                    >
                      ✅ Pending Approval
                      {getPendingSwapsForApproval().length > 0 && (
                        <span className="notification-badge">{getPendingSwapsForApproval().length}</span>
                      )}
                    </button>
                  </div>
                </div>

                {swapView === 'pending' && (
                  <div className="swap-requests-list">
                    {(() => {
                      const myRequests = getMySwapRequests()
                      return myRequests.length > 0 ? (
                        myRequests.map((request, index) => (
                          <div key={index} className={`swap-request-card ${request.status}`}>
                            <div className="swap-request-header">
                              <div>
                                <h4>{request.status === 'pending-partner-approval' ? 'Waiting for Partner' : 
                                      request.status === 'pending-director-approval' ? 'Waiting for Director' :
                                      request.status === 'completed' ? '✓ Completed' : 'Rejected'}</h4>
                                <p>With: {user.email === request.requesterId ? request.partnerName : request.requesterName}</p>
                              </div>
                            </div>
                            <div className="swap-request-details">
                              <p><strong>Your Shift Date:</strong> {formatDate(request.shiftDate)}</p>
                              {request.partnerShiftDate && (
                                <p><strong>Their Shift Date:</strong> {formatDate(request.partnerShiftDate)}</p>
                              )}
                              <p><strong>Requested:</strong> {new Date(request.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="placeholder-text">No shift swap requests yet.</p>
                      )
                    })()}
                  </div>
                )}

                {swapView === 'approvals' && (
                  <div className="swap-approvals-list">
                    {(() => {
                      const pendingApprovals = getPendingSwapsForApproval()
                      return pendingApprovals.length > 0 ? (
                        pendingApprovals.map((request, index) => (
                          <div key={index} className="swap-request-card pending-approval">
                            <div className="swap-request-header">
                              <div>
                                <h4>Awaiting Your Approval</h4>
                                <p>{request.requesterName} wants to swap with you</p>
                              </div>
                            </div>
                            <div className="swap-request-details">
                              <p><strong>Their Shift Date:</strong> {formatDate(request.shiftDate)}</p>
                              {request.partnerShiftDate && (
                                <p><strong>Your Shift Date:</strong> {formatDate(request.partnerShiftDate)}</p>
                              )}
                              <p><strong>Requested:</strong> {new Date(request.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="swap-request-actions">
                              <button 
                                className="approve-btn"
                                onClick={() => approveSwapRequest(request.id)}
                              >
                                Approve
                              </button>
                              <button 
                                className="reject-btn"
                                onClick={() => rejectSwapRequest(request.id)}
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="placeholder-text">No pending approvals.</p>
                      )
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* Time Off View */}
            {scheduleView === 'timeoff' && (
              <div style={{padding: '20px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px'}}>
                  {!isUserDirector() && (
                    <button 
                      className="request-timeoff-btn"
                      onClick={() => setShowTimeOffModal(true)}
                    >
                      + Request Time Off
                    </button>
                  )}
                  {isUserDirector() && getPendingTimeOffForApproval().length > 0 && (
                    <span className="notification-badge">{getPendingTimeOffForApproval().length} Pending</span>
                  )}
                </div>

                {isUserDirector() && (
                  <div className="timeoff-approval-section">
                    <h3>Pending Time Off Requests for Approval</h3>
                    {(() => {
                      const pendingRequests = getPendingTimeOffForApproval()
                      return pendingRequests.length > 0 ? (
                        <div className="timeoff-list">
                          {pendingRequests.map((request, index) => (
                            <div key={index} className="timeoff-card pending">
                              <div className="timeoff-header">
                                <h4>{request.userName}</h4>
                                <span className={`timeoff-badge ${request.type.toLowerCase()}`}>
                                  {request.type}
                                </span>
                              </div>
                              <div className="timeoff-details">
                                <p><strong>Date:</strong> {formatDate(request.date)}</p>
                                {request.reason && <p><strong>Reason:</strong> {request.reason}</p>}
                                <p><strong>Requested:</strong> {new Date(request.createdAt).toLocaleDateString()}</p>
                              </div>
                              <div className="timeoff-actions">
                                <button 
                                  className="approve-btn"
                                  onClick={() => approveTimeOffRequest(request.id)}
                                >
                                  Approve
                                </button>
                                <button 
                                  className="reject-btn"
                                  onClick={() => rejectTimeOffRequest(request.id)}
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="placeholder-text">No pending time off requests.</p>
                      )
                    })()}
                  </div>
                )}

                <div className="my-timeoff-section">
                  <h3>My Time Off Requests</h3>
                  {(() => {
                    const myRequests = getMyTimeOffRequests()
                    return myRequests.length > 0 ? (
                      <div className="timeoff-list">
                        {myRequests.map((request, index) => (
                          <div key={index} className={`timeoff-card ${request.status}`}>
                            <div className="timeoff-header">
                              <h4>{request.status === 'pending' ? '⏳ Pending' : 
                                    request.status === 'approved' ? '✅ Approved' : '❌ Rejected'}</h4>
                              <span className={`timeoff-badge ${request.type.toLowerCase()}`}>
                                {request.type}
                              </span>
                            </div>
                            <div className="timeoff-details">
                              <p><strong>Date:</strong> {formatDate(request.date)}</p>
                              {request.reason && <p><strong>Reason:</strong> {request.reason}</p>}
                              <p><strong>Requested:</strong> {new Date(request.createdAt).toLocaleDateString()}</p>
                              {request.approvedAt && (
                                <p><strong>Approved:</strong> {new Date(request.approvedAt).toLocaleDateString()} by {request.approvedByName}</p>
                              )}
                              {request.rejectedAt && (
                                <p><strong>Rejected:</strong> {new Date(request.rejectedAt).toLocaleDateString()} by {request.rejectedByName}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="placeholder-text">No time off requests yet. Click "Request Time Off" to submit one.</p>
                    )
                  })()}
                </div>
              </div>
            )}

            {/* Staff Management View */}
            {scheduleView === 'staff' && canManageRoles() && (
              <div style={{padding: '20px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px', gap: '10px'}}>
                  <button 
                    className="submit-btn"
                    onClick={() => setShowAddStaffModal(true)}
                    style={{flex: 1}}
                  >
                    + Add Staff Member
                  </button>
                  <button 
                    className="submit-btn"
                    onClick={() => setShowImportStaffModal(true)}
                    style={{flex: 1, background: '#28a745'}}
                  >
                    📥 Import Staff (Excel/Sheets)
                  </button>
                </div>

                {/* Pending Staff */}
                <div style={{marginTop: '20px'}}>
                  <h3>Pending Registration</h3>
                  {(() => {
                    const pendingStaff = getPendingStaff()
                    const departmentPending = pendingStaff.filter(p => p.department === getActiveDepartment() && p.hospital === user.hospital)
                    
                    return departmentPending.length > 0 ? (
                      <div style={{display: 'grid', gap: '10px', marginTop: '10px'}}>
                        {departmentPending.map((staff, index) => (
                          <div key={index} style={{
                            background: '#f5f5f5',
                            padding: '15px',
                            borderRadius: '8px',
                            border: '1px solid #ddd'
                          }}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
                              <div>
                                <strong>{staff.name}</strong> - {staff.role}
                                <p style={{margin: '5px 0 0 0', color: '#666', fontSize: '0.9rem'}}>
                                  {staff.email} • {staff.phone}
                                  {staff.department && <span> • {staff.department}</span>}
                                </p>
                              </div>
                              <span style={{
                                padding: '5px 10px',
                                background: '#ffa500',
                                color: 'white',
                                borderRadius: '4px',
                                fontSize: '0.85rem'
                              }}>
                                Awaiting Registration
                              </span>
                            </div>
                            <button 
                              onClick={() => openEditPendingStaffModal(staff)}
                              style={{
                                padding: '8px 15px',
                                background: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                width: '100%'
                              }}
                            >
                              ✏️ Edit Information
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="placeholder-text">No pending staff members.</p>
                    )
                  })()}
                </div>

                {/* Registered Staff */}
                <div style={{marginTop: '30px'}}>
                  <h3>Registered Staff</h3>
                  {(() => {
                    const allUsers = getUsers()
                    const departmentStaff = allUsers.filter(u => u.department === getActiveDepartment() && u.hospital === user.hospital)
                    
                    return departmentStaff.length > 0 ? (
                      <div style={{display: 'grid', gap: '15px', marginTop: '15px'}}>
                        {departmentStaff.map((staff, index) => {
                          // Calculate days until expiration
                          const getDaysUntilExpiration = (expirationDate) => {
                            if (!expirationDate) return null
                            const today = new Date()
                            const exp = new Date(expirationDate)
                            const diff = Math.ceil((exp - today) / (1000 * 60 * 60 * 24))
                            return diff
                          }

                          const licenseDays = getDaysUntilExpiration(staff.licenseExpiration)
                          const cprDays = getDaysUntilExpiration(staff.cprExpiration)
                          
                          return (
                            <div key={index} style={{
                              background: '#f5f5f5',
                              padding: '20px',
                              borderRadius: '8px',
                              border: '1px solid #ddd'
                            }}>
                              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                                <div>
                                  <strong>{staff.name}</strong> - {staff.role}
                                  <p style={{margin: '5px 0 0 0', color: '#666', fontSize: '0.9rem'}}>
                                    {staff.email} {staff.phone ? `• ${staff.phone}` : ''}
                                  </p>
                                </div>
                                <span style={{
                                  padding: '5px 10px',
                                  background: '#28a745',
                                  color: 'white',
                                  borderRadius: '4px',
                                  fontSize: '0.85rem'
                                }}>
                                  ✓ Active
                                </span>
                              </div>

                              {/* Credentials Display */}
                              <div style={{
                                background: 'white',
                                padding: '15px',
                                borderRadius: '6px',
                                marginBottom: '10px'
                              }}>
                                <h4 style={{margin: '0 0 10px 0', fontSize: '0.95rem', color: '#333'}}>📋 Credentials</h4>
                                
                                {/* License */}
                                {staff.licenseExpiration && (
                                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '5px 0'}}>
                                    <span style={{fontSize: '0.9rem'}}>
                                      <strong>License:</strong> {staff.licenseExpiration}
                                    </span>
                                    {licenseDays !== null && (
                                      <span style={{
                                        padding: '3px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.8rem',
                                        background: licenseDays <= 30 ? '#dc3545' : licenseDays <= 60 ? '#ffc107' : '#28a745',
                                        color: 'white',
                                        fontWeight: 'bold'
                                      }}>
                                        {licenseDays <= 0 ? `${Math.abs(licenseDays)} days expired` : 
                                         licenseDays <= 30 ? `Expires in ${licenseDays} days` : 
                                         `${licenseDays} days remaining`}
                                      </span>
                                    )}
                                  </div>
                                )}

                                {/* CPR */}
                                {staff.cprExpiration && (
                                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '5px 0'}}>
                                    <span style={{fontSize: '0.9rem'}}>
                                      <strong>CPR:</strong> {staff.cprExpiration}
                                    </span>
                                    {cprDays !== null && (
                                      <span style={{
                                        padding: '3px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.8rem',
                                        background: cprDays <= 30 ? '#dc3545' : cprDays <= 60 ? '#ffc107' : '#28a745',
                                        color: 'white',
                                        fontWeight: 'bold'
                                      }}>
                                        {cprDays <= 0 ? `${Math.abs(cprDays)} days expired` : 
                                         cprDays <= 30 ? `Expires in ${cprDays} days` : 
                                         `${cprDays} days remaining`}
                                      </span>
                                    )}
                                  </div>
                                )}

                                {/* Other Credentials */}
                                {staff.credentials && staff.credentials.length > 0 && staff.credentials.map((cred, idx) => {
                                  const credDays = getDaysUntilExpiration(cred.expiration)
                                  return (
                                    <div key={idx} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '5px 0'}}>
                                      <span style={{fontSize: '0.9rem'}}>
                                        <strong>{cred.name}:</strong> {cred.expiration}
                                      </span>
                                      {credDays !== null && (
                                        <span style={{
                                          padding: '3px 8px',
                                          borderRadius: '4px',
                                          fontSize: '0.8rem',
                                          background: credDays <= 30 ? '#dc3545' : credDays <= 60 ? '#ffc107' : '#28a745',
                                          color: 'white',
                                          fontWeight: 'bold'
                                        }}>
                                          {credDays <= 0 ? `${Math.abs(credDays)} days expired` : 
                                           credDays <= 30 ? `Expires in ${credDays} days` : 
                                           `${credDays} days remaining`}
                                        </span>
                                      )}
                                    </div>
                                  )
                                })}

                                {!staff.licenseExpiration && !staff.cprExpiration && (!staff.credentials || staff.credentials.length === 0) && (
                                  <p style={{margin: '5px 0', color: '#999', fontSize: '0.85rem'}}>No credentials on file</p>
                                )}
                              </div>

                              <div style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
                                <button 
                                  onClick={() => openEditStaffModal(staff)}
                                  style={{
                                    padding: '10px 20px',
                                    background: '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    flex: '1'
                                  }}
                                >
                                  📝 Edit Credentials
                                </button>
                                <button 
                                  onClick={() => removeStaffFromDepartment(staff.email, staff.name)}
                                  style={{
                                    padding: '10px 20px',
                                    background: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    flex: '1'
                                  }}
                                  disabled={staff.email === user.email}
                                  title={staff.email === user.email ? 'You cannot remove yourself' : 'Remove staff member from department'}
                                >
                                  🗑️ Remove Staff
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="placeholder-text">No registered staff in your department.</p>
                    )
                  })()}
                </div>
              </div>
            )}

            {/* Call-Ins History View - Director Only */}
            {scheduleView === 'callins' && isUserDirector() && (
              <div style={{padding: '20px'}}>
                <div style={{marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <div>
                    <h3 style={{margin: 0, color: '#333'}}>Call-Ins History (Last 12 Months)</h3>
                    <p style={{margin: '5px 0 0 0', color: '#666', fontSize: '0.9rem'}}>
                      Tracking call-ins for {getActiveDepartment()} Department
                    </p>
                  </div>
                  <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                    <span style={{
                      padding: '5px 12px',
                      background: '#e9ecef',
                      borderRadius: '5px',
                      fontSize: '0.9rem',
                      color: '#666'
                    }}>
                      Total: {getCallInHistory().length} call-ins
                    </span>
                  </div>
                </div>

                {(() => {
                  const callInHistory = getCallInHistory()
                  const allUsers = getUsers()
                  
                  // Filter by active department and hospital
                  const departmentCallIns = callInHistory.filter(entry => {
                    const staff = allUsers.find(u => u.email === entry.userId)
                    return staff && staff.department === getActiveDepartment() && staff.hospital === user.hospital
                  })
                  
                  if (departmentCallIns.length === 0) {
                    return (
                      <div style={{
                        textAlign: 'center',
                        padding: '40px',
                        color: '#666',
                        background: '#f8f9fa',
                        borderRadius: '8px',
                        border: '1px solid #e0e0e0'
                      }}>
                        <div style={{fontSize: '48px', marginBottom: '15px'}}>📞</div>
                        <h4 style={{margin: '10px 0', color: '#333'}}>No call-ins recorded</h4>
                        <p>Call-ins will appear here when staff members are marked as called in.</p>
                      </div>
                    )
                  }
                  
                  // Group by month
                  const monthlyGroups = departmentCallIns.reduce((acc, entry) => {
                    const monthKey = new Date(entry.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
                    if (!acc[monthKey]) {
                      acc[monthKey] = []
                    }
                    acc[monthKey].push(entry)
                    return acc
                  }, {})
                  
                  return (
                    <div>
                      {Object.keys(monthlyGroups).sort((a, b) => new Date(b) - new Date(a)).map(month => (
                        <div key={month} style={{
                          marginBottom: '25px',
                          background: '#f8f9fa',
                          borderRadius: '8px',
                          padding: '15px',
                          border: '1px solid #e0e0e0'
                        }}>
                          <h4 style={{
                            margin: '0 0 15px 0',
                            color: '#4169E1',
                            borderBottom: '2px solid #4169E1',
                            paddingBottom: '8px'
                          }}>
                            {month} ({monthlyGroups[month].length} call-in{monthlyGroups[month].length !== 1 ? 's' : ''})
                          </h4>
                          
                          <div style={{display: 'grid', gap: '10px'}}>
                            {monthlyGroups[month].map((entry, index) => {
                              const staffMember = allUsers.find(u => u.email === entry.userId)
                              return (
                                <div key={entry.id || index} style={{
                                  background: 'white',
                                  padding: '15px',
                                  borderRadius: '6px',
                                  border: '1px solid #ddd',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center'
                                }}>
                                  <div style={{flex: 1}}>
                                    <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px'}}>
                                      <strong style={{fontSize: '1rem', color: '#333'}}>
                                        {entry.userName}
                                      </strong>
                                      {staffMember && (
                                        <span style={{
                                          padding: '2px 8px',
                                          background: '#e9ecef',
                                          borderRadius: '4px',
                                          fontSize: '0.8rem',
                                          color: '#666'
                                        }}>
                                          {staffMember.role}
                                        </span>
                                      )}
                                    </div>
                                    <div style={{fontSize: '0.9rem', color: '#666', display: 'flex', gap: '15px', flexWrap: 'wrap'}}>
                                      <span>📅 {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                      {entry.reason && <span>📝 {entry.reason}</span>}
                                      {entry.reportedByName && (
                                        <span>👤 Reported by {entry.reportedByName}</span>
                                      )}
                                    </div>
                                  </div>
                                  <div style={{display: 'flex', gap: '5px'}}>
                                    {new Date(entry.date) >= new Date(new Date().setDate(new Date().getDate() - 7)) && (
                                      <span style={{
                                        padding: '4px 8px',
                                        background: '#dc3545',
                                        color: 'white',
                                        borderRadius: '4px',
                                        fontSize: '0.75rem',
                                        fontWeight: 'bold'
                                      }}>
                                        NEW
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
            )}

            {/* Create Schedule View - Director Only */}
            {scheduleView === 'create' && isUserDirector() && (
              <div className="create-schedule-view">
                <div className="calendar-nav">
                  <button onClick={() => {
                    const newMonth = new Date(currentMonth)
                    newMonth.setMonth(newMonth.getMonth() - 1)
                    setCurrentMonth(newMonth)
                  }}>
                    ← Previous
                  </button>
                  <h3>{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
                  <button onClick={() => {
                    const newMonth = new Date(currentMonth)
                    newMonth.setMonth(newMonth.getMonth() + 1)
                    setCurrentMonth(newMonth)
                  }}>
                    Next →
                  </button>
                </div>
                
                <div style={{marginBottom: '20px', display: 'flex', gap: '10px', justifyContent: 'center'}}>
                  <button 
                    className="submit-btn"
                    onClick={() => setShowUploadModal(true)}
                    style={{padding: '10px 20px', fontSize: '0.95rem'}}
                  >
                    📤 Upload Schedule from Excel/Sheets
                  </button>
                  <button 
                    className="submit-btn"
                    onClick={() => setShowMeetingModal(true)}
                    style={{padding: '10px 20px', fontSize: '0.95rem', background: '#10b981'}}
                  >
                    📅 Create Unit Meeting
                  </button>
                </div>

                {/* Info Banner about Pending Staff */}
                {(() => {
                  const hasPendingStaff = getAllStaffMembers().some(s => s.isPending)
                  if (hasPendingStaff) {
                    return (
                      <div style={{
                        marginBottom: '20px',
                        padding: '12px 15px',
                        background: '#fff3cd',
                        border: '1px solid #ffc107',
                        borderRadius: '8px',
                        color: '#856404',
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        <span style={{fontSize: '1.2rem'}}>ℹ️</span>
                        <div>
                          <strong>Pending Staff Members:</strong> Staff with <span style={{
                            background: '#ffc107',
                            color: '#000',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            fontWeight: 'bold',
                            fontSize: '0.85rem'
                          }}>⏳ Pending</span> badges haven't signed up yet. You can create schedules for them now, and they'll see their shifts automatically once they create an account.
                        </div>
                      </div>
                    )
                  }
                  return null
                })()}

                <div className="staff-schedule-grid">
                  <div className="staff-column">
                    <div className="staff-header">Staff Members</div>
                    {getAllStaffMembers().map((staff, index) => (
                      <div 
                        key={index} 
                        className={`staff-name-cell ${selectedStaffForSchedule === staff.email ? 'selected' : ''}`}
                        onClick={() => {
                          const newSelection = selectedStaffForSchedule === staff.email ? null : staff.email
                          setSelectedStaffForSchedule(newSelection)
                          // Clear last shift type when selecting a different staff member
                          if (newSelection !== selectedStaffForSchedule) {
                            setLastShiftTypeSelected(null)
                            setPendingShifts([]) // Also clear pending shifts when switching staff
                          }
                        }}
                      >
                        <div className="staff-avatar-small">{staff.name.charAt(0).toUpperCase()}</div>
                        <div>
                          <div className="staff-name-text">
                            {staff.name}
                            {staff.isPending && (
                              <span style={{
                                marginLeft: '5px',
                                fontSize: '0.7rem',
                                background: '#ffc107',
                                color: '#000',
                                padding: '2px 6px',
                                borderRadius: '3px',
                                fontWeight: 'bold'
                              }}>
                                ⏳ Pending
                              </span>
                            )}
                          </div>
                          <div className="staff-role-text">{staff.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="calendar-column">
                    <div className="calendar-grid create-schedule">
                      <div className="day-header">Sun</div>
                      <div className="day-header">Mon</div>
                      <div className="day-header">Tue</div>
                      <div className="day-header">Wed</div>
                      <div className="day-header">Thu</div>
                      <div className="day-header">Fri</div>
                      <div className="day-header">Sat</div>
                      {Array.from({ length: getDaysInMonth(currentMonth).startingDayOfWeek }).map((_, i) => (
                        <div key={`empty-${i}`} className="calendar-day empty"></div>
                      ))}
                      {Array.from({ length: getDaysInMonth(currentMonth).daysInMonth }).map((_, i) => {
                        const day = i + 1
                        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
                        const dateStr = date.toISOString().split('T')[0]
                        const staffSchedules = getAllStaffSchedules(selectedStaffForSchedule)
                        const hasShift = staffSchedules.find(s => s.date === dateStr)
                        const hasPendingShift = pendingShifts.find(p => p.staffEmail === selectedStaffForSchedule && p.date === dateStr)
                        const timeOff = getTimeOffForDate(dateStr).filter(r => r.userId === selectedStaffForSchedule)
                        
                        return (
                          <div 
                            key={day} 
                            className={`calendar-day admin-day ${hasShift ? 'working' : ''} ${hasPendingShift ? 'pending-shift' : ''} ${timeOff.length > 0 ? 'timeoff' : ''}`}
                            onClick={() => {
                              if (!selectedStaffForSchedule) return
                              // Check if it's a time off request (pending only)
                              const pendingTimeOff = timeOff.find(r => r.status === 'pending')
                              if (pendingTimeOff && isUserDirector()) {
                                handleTimeOffDayClick(dateStr, selectedStaffForSchedule)
                              } else {
                                handleDayClickForSchedule(date, selectedStaffForSchedule)
                              }
                            }}
                            style={{cursor: selectedStaffForSchedule ? 'pointer' : 'default'}}
                            title={
                              hasPendingShift ? `${hasPendingShift.shiftType} (Pending)` :
                              timeOff.length > 0 ? 
                                `${timeOff[0].type} - ${timeOff[0].status}` : 
                                hasShift ? `${hasShift.shiftType} - ${hasShift.startTime}-${hasShift.endTime}` : 
                                'Click to add shift'
                            }
                          >
                            <div className="day-number">{day}</div>
                            {hasShift && <div className="shift-indicator">●</div>}
                            {hasPendingShift && <div className="pending-indicator">○</div>}
                            {timeOff.length > 0 && (
                              <div className="timeoff-indicator" title={timeOff[0].type}>
                                {timeOff[0].status === 'pending' ? '⏳' : timeOff[0].status === 'approved' ? '✓' : '✗'}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    <div className="calendar-legend">
                      <div className="legend-item">
                        <span className="legend-dot working"></span>
                        <span>Working</span>
                      </div>
                      <div className="legend-item">
                        <span className="legend-dot pending"></span>
                        <span>Pending (○)</span>
                      </div>
                      <div className="legend-item">
                        <span className="legend-dot timeoff"></span>
                        <span>Time Off Requested</span>
                      </div>
                      <div className="legend-item">
                        <span className="legend-dot today"></span>
                        <span>Today</span>
                      </div>
                    </div>

                    {pendingShifts.length > 0 && (
                      <div className="pending-shifts-info">
                        <div className="pending-count">
                          <strong>{pendingShifts.length}</strong> pending shift(s) ready to save
                        </div>
                        <div className="pending-actions">
                          <button 
                            className="save-pending-btn"
                            onClick={savePendingShifts}
                          >
                            💾 Save All Shifts ({pendingShifts.length})
                          </button>
                          <button 
                            className="clear-pending-btn"
                            onClick={clearPendingShifts}
                          >
                            Clear Pending
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {selectedStaffForSchedule && (
                  <div className="selected-staff-info">
                    {(() => {
                      const selectedStaff = getAllStaffMembers().find(s => s.email === selectedStaffForSchedule)
                      return (
                        <>
                          <p>
                            Select a day on the calendar to queue shifts for <strong>{selectedStaff?.name}</strong>
                            {selectedStaff?.isPending && (
                              <span style={{
                                marginLeft: '8px',
                                fontSize: '0.8rem',
                                background: '#ffc107',
                                color: '#000',
                                padding: '2px 6px',
                                borderRadius: '3px',
                                fontWeight: 'bold'
                              }}>
                                ⏳ Pending Signup
                              </span>
                            )}
                          </p>
                          {selectedStaff?.isPending && (
                            <p style={{fontSize: '0.9rem', color: '#856404', background: '#fff3cd', padding: '8px', borderRadius: '5px', marginBottom: '10px'}}>
                              💡 This staff member hasn't signed up yet. Schedule them now, and they'll see their shifts automatically when they create an account!
                            </p>
                          )}
                          <p style={{fontSize: '0.85rem', color: '#666'}}>• Click a day to queue shift for this staff member</p>
                          <p style={{fontSize: '0.85rem', color: '#666'}}>• Days with ○ are pending (will be saved when you click Save)</p>
                          <p style={{fontSize: '0.85rem', color: '#666'}}>• Days with ⏳ indicate time off requests</p>
                        </>
                      )
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>


          {/* Swap Request Modal */}
          {showSwapRequestModal && selectedSwapShift && (
            <div className="modal-overlay" onClick={() => setShowSwapRequestModal(false)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h3>Request Shift Swap</h3>
                <div className="modal-content">
                  <div className="form-group">
                    <label>Your Shift</label>
                    <input
                      type="text"
                      value={`${formatDate(selectedSwapShift.date)} - ${selectedSwapShift.shiftType} (${selectedSwapShift.startTime}-${selectedSwapShift.endTime})`}
                      disabled
                      style={{cursor: 'not-allowed', background: '#f5f5f5'}}
                    />
                  </div>
                  <div className="form-group">
                    <label>Select Team Member</label>
                    <select
                      value={swapPartner}
                      onChange={(e) => setSwapPartner(e.target.value)}
                      required
                    >
                      <option value="">Select a team member...</option>
                      {getAvailableTeamMembers().map((member, index) => (
                        <option key={index} value={`${member.name} - ${member.email}`}>
                          {member.name} ({member.role})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Their Shift Date (Optional)</label>
                    <input
                      type="date"
                      value={swapPartnerShiftDate}
                      onChange={(e) => setSwapPartnerShiftDate(e.target.value)}
                    />
                    <small style={{color: '#666', fontSize: '0.85rem', marginTop: '5px', display: 'block'}}>
                      If you know which shift they want to swap with you, enter the date
                    </small>
                  </div>
                </div>
                <div className="modal-buttons">
                  <button 
                    className="cancel-btn"
                    onClick={() => {
                      setShowSwapRequestModal(false)
                      setSelectedSwapShift(null)
                      setSwapPartner('')
                      setSwapPartnerShiftDate('')
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    className="submit-btn"
                    onClick={submitSwapRequest}
                    disabled={!swapPartner}
                  >
                    Submit Swap Request
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Float Logging Modal */}
          {showFloatModal && (
            <div className="modal-overlay" onClick={() => setShowFloatModal(false)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h3>Log Float Assignment</h3>
                <div className="modal-content">
                  <div className="form-group">
                    <label>Staff Member</label>
                    <input
                      type="text"
                      value={selectedStaffForFloat || ''}
                      disabled
                    />
                  </div>
                  <div className="form-group">
                    <label>Float To Department</label>
                    <input
                      type="text"
                      value={floatToDepartment}
                      onChange={(e) => setFloatToDepartment(e.target.value)}
                      placeholder="e.g., ICU, Emergency, Surgery"
                      required
                    />
                  </div>
                </div>
                <div className="modal-buttons">
                  <button 
                    className="cancel-btn"
                    onClick={() => {
                      setShowFloatModal(false)
                      setSelectedStaffForFloat(null)
                      setFloatToDepartment('')
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    className="submit-btn"
                    onClick={() => logFloat(selectedStaffForFloat, floatToDepartment)}
                  >
                    Log Float
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* On-Call Logging Modal */}
          {showOnCallModal && (
            <div className="modal-overlay" onClick={() => setShowOnCallModal(false)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h3>{onCallDeclined ? 'Assign On-Call to Another Staff Member' : 'Log On-Call Assignment'}</h3>
                <div className="modal-content">
                  <div className="form-group">
                    <label>Staff Member</label>
                    {onCallDeclined ? (
                      <select
                        value={selectedStaffForOnCall || ''}
                        onChange={(e) => setSelectedStaffForOnCall(e.target.value)}
                        required
                      >
                        <option value="">Select staff member...</option>
                        {getWorkingStaffToday().map((staff, index) => (
                          <option key={index} value={staff.userName}>
                            {staff.userName}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={selectedStaffForOnCall || ''}
                        disabled
                      />
                    )}
                  </div>
                  <div className="form-group">
                    <label>Duration</label>
                    <select
                      value={onCallDuration}
                      onChange={(e) => setOnCallDuration(e.target.value)}
                    >
                      <option value="12 hours">12 hours</option>
                      <option value="24 hours">24 hours</option>
                      <option value="36 hours">36 hours</option>
                      <option value="48 hours">48 hours</option>
                    </select>
                  </div>
                </div>
                <div className="modal-buttons">
                  <button 
                    className="cancel-btn"
                    onClick={() => {
                      setShowOnCallModal(false)
                      setSelectedStaffForOnCall(null)
                      setOnCallDuration('24 hours')
                      setOnCallDeclined(false)
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    className="submit-btn"
                    onClick={() => logOnCall(selectedStaffForOnCall, onCallDuration)}
                    disabled={!selectedStaffForOnCall}
                  >
                    {onCallDeclined ? 'Assign On-Call' : 'Log On-Call'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Called In Modal */}
          {showCalledInModal && selectedCalledInStaff && (
            <div className="modal-overlay" onClick={() => setShowCalledInModal(false)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h3>Mark Staff as Called In</h3>
                <div className="modal-content">
                  <div className="form-group">
                    <label>Staff Member</label>
                    <input
                      type="text"
                      value={selectedCalledInStaff.name}
                      disabled
                      style={{cursor: 'not-allowed', background: '#f5f5f5'}}
                    />
                  </div>
                  <div className="form-group">
                    <label>Reason (Optional)</label>
                    <textarea
                      id="calledInReason"
                      placeholder="Enter reason for calling in..."
                      rows="3"
                      style={{width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', resize: 'vertical'}}
                    />
                  </div>
                </div>
                <div className="modal-buttons">
                  <button 
                    className="cancel-btn"
                    onClick={() => {
                      setShowCalledInModal(false)
                      setSelectedCalledInStaff(null)
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    className="submit-btn"
                    onClick={() => {
                      const reason = document.getElementById('calledInReason').value
                      handleCalledInSubmit(reason)
                    }}
                  >
                    Mark as Called In
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Profile Editor Modal */}
          {showProfileModal && profileEditData && (
            <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
              <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
                <h3>Edit Profile</h3>
                <div className="modal-content profile-edit">
                  {/* Profile Picture Section */}
                  <div className="profile-picture-section">
                    <div className="profile-avatar-large">
                      {profileEditData.name ? profileEditData.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <p className="profile-avatar-text">Profile Picture (Initials)</p>
                  </div>

                  {/* Personal Information */}
                  <div className="form-section">
                    <h4>Personal Information</h4>
                    <div className="form-group">
                      <label>Full Name</label>
                      <input
                        type="text"
                        value={profileEditData.name || ''}
                        onChange={(e) => handleProfileChange('name', e.target.value)}
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Role</label>
                        <select
                          value={profileEditData.role || ''}
                          onChange={(e) => handleProfileChange('role', e.target.value)}
                          disabled={!canManageRoles()}
                          style={!canManageRoles() ? {cursor: 'not-allowed', background: '#f5f5f5'} : {}}
                          title={!canManageRoles() ? 'Only Directors and Nursing Administrators can change roles' : ''}
                        >
                          <option value="">Select role</option>
                          <option value="Charge Nurse">Charge Nurse</option>
                          <option value="Nurse">Nurse</option>
                          <option value="PCT">PCT (Patient Care Technician)</option>
                          <option value="HUC">HUC (Health Unit Coordinator)</option>
                          <option value="Director">Director</option>
                          <option value="Coordinator">Coordinator</option>
                          <option value="Nursing Administrator">Nursing Administrator</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Date of Birth</label>
                        <input
                          type="date"
                          value={profileEditData.dateOfBirth || ''}
                          onChange={(e) => handleProfileChange('dateOfBirth', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Work Information */}
                  <div className="form-section">
                    <h4>Work Information</h4>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Hospital</label>
                        <input
                          type="text"
                          value={profileEditData.hospital || ''}
                          onChange={(e) => handleProfileChange('hospital', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Department</label>
                        <input
                          type="text"
                          value={profileEditData.department || ''}
                          onChange={(e) => handleProfileChange('department', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Shift Preference</label>
                      <select
                        value={profileEditData.shiftPreference || 'Day'}
                        onChange={(e) => handleProfileChange('shiftPreference', e.target.value)}
                      >
                        <option value="Day">Day Shift</option>
                        <option value="Night">Night Shift</option>
                        <option value="Both">Both Day & Night</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input
                        type="tel"
                        value={profileEditData.phone || ''}
                        onChange={(e) => handleProfileChange('phone', e.target.value)}
                        placeholder="555-123-4567"
                      />
                    </div>
                  </div>

                  {/* Department Oversight (Directors/Coordinators/Nursing Administrators Only) */}
                  {(profileEditData.role === 'Director' || profileEditData.role === 'Coordinator' || profileEditData.role === 'Nursing Administrator') && (
                    <div className="form-section">
                      <h4>Department Oversight</h4>
                      <p style={{fontSize: '0.9rem', color: '#666', marginBottom: '15px'}}>
                        Select which departments you oversee. You'll be able to view and manage staff in these departments.
                      </p>
                      <div style={{
                        maxHeight: '200px',
                        overflowY: 'auto',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        padding: '15px',
                        background: '#f8f9fa'
                      }}>
                        {(() => {
                          const allUsers = getUsers()
                          const pendingStaff = getPendingStaff()
                          const allDepartments = new Set()
                          
                          // Get all departments from the same hospital
                          allUsers.forEach(u => {
                            if (u.hospital === profileEditData.hospital) {
                              allDepartments.add(u.department)
                            }
                          })
                          pendingStaff.forEach(p => {
                            if (p.hospital === profileEditData.hospital && p.department) {
                              allDepartments.add(p.department)
                            }
                          })
                          
                          // Ensure supervisedDepartments is an array
                          if (!profileEditData.supervisedDepartments) {
                            profileEditData.supervisedDepartments = [profileEditData.department || '']
                          }
                          
                          return Array.from(allDepartments).sort().map(dept => (
                            <label key={dept} style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '8px',
                              cursor: 'pointer',
                              borderRadius: '4px',
                              marginBottom: '5px',
                              background: 'white',
                              border: '1px solid #e0e0e0'
                            }}>
                              <input
                                type="checkbox"
                                checked={profileEditData.supervisedDepartments.includes(dept)}
                                onChange={(e) => {
                                  const updated = e.target.checked
                                    ? [...profileEditData.supervisedDepartments, dept]
                                    : profileEditData.supervisedDepartments.filter(d => d !== dept)
                                  handleProfileChange('supervisedDepartments', updated)
                                }}
                                style={{marginRight: '10px', width: '18px', height: '18px'}}
                              />
                              <span style={{fontSize: '0.95rem'}}>{dept}</span>
                            </label>
                          ))
                        })()}
                      </div>
                      <small style={{display: 'block', marginTop: '10px', color: '#666', fontSize: '0.85rem'}}>
                        Your primary department is automatically selected and cannot be deselected.
                      </small>
                    </div>
                  )}

                  {/* Credentials */}
                  <div className="form-section">
                    <h4>License Information</h4>
                    <div className="form-row">
                      <div className="form-group">
                        <label>License Number</label>
                        <input
                          type="text"
                          value={profileEditData.licenseNumber || ''}
                          onChange={(e) => handleProfileChange('licenseNumber', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>License Expiration</label>
                        <input
                          type="date"
                          value={profileEditData.licenseExpiration || ''}
                          onChange={(e) => handleProfileChange('licenseExpiration', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* CPR Information */}
                  <div className="form-section">
                    <h4>CPR Certification</h4>
                    <div className="form-row">
                      <div className="form-group">
                        <label>CPR Number</label>
                        <input
                          type="text"
                          value={profileEditData.cprNumber || ''}
                          onChange={(e) => handleProfileChange('cprNumber', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>CPR Expiration</label>
                        <input
                          type="date"
                          value={profileEditData.cprExpiration || ''}
                          onChange={(e) => handleProfileChange('cprExpiration', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-buttons">
                  <button 
                    className="cancel-btn"
                    onClick={() => setShowProfileModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="submit-btn"
                    onClick={saveProfile}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add Staff Modal - Directors and Nursing Administrators */}
          {showAddStaffModal && canManageRoles() && (
            <div className="modal-overlay" onClick={() => setShowAddStaffModal(false)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h3>Add Staff Member</h3>
                <div className="modal-content">
                  <p style={{color: '#666', marginBottom: '20px'}}>
                    Add a staff member who hasn't signed up yet. When they register with matching email and phone, their account will be linked.
                  </p>
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      value={newStaffEmail}
                      onChange={(e) => setNewStaffEmail(e.target.value)}
                      placeholder="staff@example.com"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      value={newStaffPhone}
                      onChange={(e) => setNewStaffPhone(e.target.value)}
                      placeholder="555-123-4567"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Role</label>
                    <select
                      value={newStaffRole}
                      onChange={(e) => setNewStaffRole(e.target.value)}
                      required
                    >
                      <option value="">Select role</option>
                      <option value="Charge Nurse">Charge Nurse</option>
                      <option value="Nurse">Nurse</option>
                      <option value="PCT">PCT (Patient Care Technician)</option>
                      <option value="HUC">HUC (Health Unit Coordinator)</option>
                      <option value="Director">Director</option>
                      <option value="Coordinator">Coordinator</option>
                      <option value="Nursing Administrator">Nursing Administrator</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Department</label>
                    <input
                      type="text"
                      value={newStaffDepartment}
                      onChange={(e) => setNewStaffDepartment(e.target.value)}
                      placeholder="Enter department name"
                      required
                    />
                  </div>
                </div>
                <div className="modal-buttons">
                  <button 
                    className="cancel-btn"
                    onClick={() => {
                      setShowAddStaffModal(false)
                      setNewStaffName('')
                      setNewStaffEmail('')
                      setNewStaffPhone('')
                      setNewStaffRole('')
                      setNewStaffDepartment('')
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    className="submit-btn"
                    onClick={handleAddStaff}
                  >
                    Add Staff Member
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Pending Staff Modal */}
          {showEditPendingStaffModal && editingPendingStaff && (
            <div className="modal-overlay" onClick={() => setShowEditPendingStaffModal(false)}>
              <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
                <h3>Edit Pending Staff Information</h3>
                <div className="modal-content">
                  <p style={{marginBottom: '15px', color: '#666', fontSize: '0.9rem'}}>
                    Update information for pending staff member. Changes will take effect immediately.
                  </p>

                  {/* Personal Information */}
                  <div className="form-section">
                    <h4>Personal Information</h4>
                    <div className="form-group">
                      <label>Full Name</label>
                      <input
                        type="text"
                        value={editPendingStaffName}
                        onChange={(e) => setEditPendingStaffName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Email Address</label>
                        <input
                          type="email"
                          value={editPendingStaffEmail}
                          onChange={(e) => setEditPendingStaffEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Phone Number</label>
                        <input
                          type="tel"
                          value={editPendingStaffPhone}
                          onChange={(e) => setEditPendingStaffPhone(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Work Information */}
                  <div className="form-section">
                    <h4>Work Information</h4>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Role</label>
                        <select
                          value={editPendingStaffRole}
                          onChange={(e) => setEditPendingStaffRole(e.target.value)}
                          required
                        >
                          <option value="">Select role</option>
                          <option value="Charge Nurse">Charge Nurse</option>
                          <option value="Nurse">Nurse</option>
                          <option value="PCT">PCT (Patient Care Technician)</option>
                          <option value="HUC">HUC (Health Unit Coordinator)</option>
                          <option value="Director">Director</option>
                          <option value="Coordinator">Coordinator</option>
                          <option value="Nursing Administrator">Nursing Administrator</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Department</label>
                        <input
                          type="text"
                          value={editPendingStaffDepartment}
                          onChange={(e) => setEditPendingStaffDepartment(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Float & On-Call History */}
                  <div className="form-section">
                    <h4>Float & On-Call History</h4>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Last Float Date</label>
                        <input
                          type="date"
                          value={editPendingLastFloatDate}
                          onChange={(e) => setEditPendingLastFloatDate(e.target.value)}
                          placeholder="Select last float date"
                        />
                      </div>
                      <div className="form-group">
                        <label>Last On-Call Date</label>
                        <input
                          type="date"
                          value={editPendingLastOnCallDate}
                          onChange={(e) => setEditPendingLastOnCallDate(e.target.value)}
                          placeholder="Select last on-call date"
                        />
                      </div>
                    </div>
                    <small style={{display: 'block', marginTop: '5px', color: '#666', fontSize: '0.85rem'}}>
                      Leave empty if they've never floated or been on-call. Dates are used for rotation tracking.
                    </small>
                  </div>
                </div>
                <div className="modal-buttons">
                  <button 
                    className="cancel-btn"
                    onClick={() => {
                      setShowEditPendingStaffModal(false)
                      setEditingPendingStaff(null)
                      setEditPendingStaffName('')
                      setEditPendingStaffEmail('')
                      setEditPendingStaffPhone('')
                      setEditPendingStaffRole('')
                      setEditPendingStaffDepartment('')
                      setEditPendingLastFloatDate('')
                      setEditPendingLastOnCallDate('')
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    className="submit-btn"
                    onClick={handleSavePendingStaff}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Upload Schedule Modal - Director Only */}
          {showUploadModal && isUserDirector() && (
            <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
              <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
                <h3>📤 Upload Schedule</h3>
                
                {/* Toggle between file upload and Google Sheets */}
                <div style={{display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #e0e0e0', paddingBottom: '15px'}}>
                  <button 
                    className={uploadMethod === 'file' ? 'submit-btn' : 'cancel-btn'}
                    onClick={() => {
                      setUploadMethod('file')
                      setUploadedScheduleData(null)
                    }}
                    style={{flex: 1, padding: '10px', fontSize: '0.95rem'}}
                  >
                    📄 Upload File
                  </button>
                  <button 
                    className={uploadMethod === 'googlesheet' ? 'submit-btn' : 'cancel-btn'}
                    onClick={() => {
                      setUploadMethod('googlesheet')
                      setUploadedScheduleData(null)
                    }}
                    style={{flex: 1, padding: '10px', fontSize: '0.95rem'}}
                  >
                    📊 Import Google Sheet
                  </button>
                </div>

                <div className="modal-content">
                  <div style={{marginBottom: '20px', padding: '15px', background: '#e3f2fd', borderRadius: '8px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
                      <h4 style={{marginTop: 0}}>📋 Required Format:</h4>
                      <button 
                        onClick={downloadScheduleTemplate}
                        className="cancel-btn"
                        style={{padding: '8px 12px', fontSize: '0.85rem'}}
                      >
                        📥 Download Template
                      </button>
                    </div>
                    <p style={{margin: '5px 0', fontSize: '0.9rem'}}>
                      Your schedule should have these columns:
                    </p>
                    <ul style={{margin: '10px 0', paddingLeft: '20px', fontSize: '0.9rem'}}>
                      <li><strong>Name</strong> - Staff member's full name</li>
                      <li><strong>Email</strong> - Staff member's email address</li>
                      <li><strong>Date</strong> - Shift date (YYYY-MM-DD format)</li>
                      <li><strong>Shift Type</strong> - Day or Night</li>
                      <li><strong>Start Time</strong> - e.g., 07:00 or 19:00</li>
                      <li><strong>End Time</strong> - e.g., 19:00 or 07:00</li>
                    </ul>
                  </div>

                  {uploadMethod === 'file' ? (
                    <div className="form-group">
                      <label>Upload Schedule File</label>
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileUpload}
                        style={{
                          padding: '10px',
                          border: '2px dashed #ddd',
                          borderRadius: '8px',
                          width: '100%'
                        }}
                      />
                      <small style={{display: 'block', marginTop: '5px', color: '#666'}}>
                        Supported formats: Excel (.xlsx, .xls) or CSV files
                      </small>
                    </div>
                  ) : (
                    <div>
                      <div className="form-group">
                        <label>Google Sheets URL</label>
                        <input
                          type="text"
                          value={googleSheetUrl}
                          onChange={(e) => setGoogleSheetUrl(e.target.value)}
                          placeholder="https://docs.google.com/spreadsheets/d/..."
                          style={{
                            padding: '12px',
                            border: '2px solid #ddd',
                            borderRadius: '8px',
                            width: '100%',
                            fontSize: '0.95rem'
                          }}
                        />
                      </div>
                      <div style={{padding: '12px', background: '#fff3cd', borderRadius: '8px', border: '1px solid #ffc107', marginTop: '10px'}}>
                        <p style={{margin: '0', fontSize: '0.85rem', color: '#856404'}}>
                          <strong>📌 Important:</strong> The Google Sheet must be publicly accessible:<br/>
                          1. Click "Share" in the Google Sheet<br/>
                          2. Change access to "Anyone with the link"<br/>
                          3. Copy the URL and paste it above
                        </p>
                      </div>
                      <button 
                        className="submit-btn"
                        onClick={handleGoogleSheetImport}
                        disabled={!googleSheetUrl}
                        style={{width: '100%', marginTop: '15px', padding: '12px'}}
                      >
                        Import from Google Sheets
                      </button>
                    </div>
                  )}

                  {uploadedScheduleData && uploadedScheduleData.length > 0 && (
                    <div style={{
                      marginTop: '20px',
                      padding: '15px',
                      background: '#f0f9ff',
                      borderRadius: '8px',
                      border: '1px solid #0ea5e9'
                    }}>
                      <p style={{margin: '5px 0', fontWeight: 'bold'}}>
                        ✓ {uploadMethod === 'googlesheet' ? 'Google Sheet' : 'File'} imported successfully! {uploadedScheduleData.length} rows found.
                      </p>
                      <p style={{margin: '5px 0', fontSize: '0.85rem', color: '#666'}}>
                        Ready to import. Click "Import Schedule" below to add shifts to staff.
                      </p>
                    </div>
                  )}
                </div>
                <div className="modal-buttons">
                  <button 
                    className="cancel-btn"
                    onClick={() => {
                      setShowUploadModal(false)
                      setUploadedScheduleData(null)
                      setGoogleSheetUrl('')
                      setUploadMethod('file')
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    className="submit-btn"
                    onClick={importScheduleFromUpload}
                    disabled={!uploadedScheduleData || uploadedScheduleData.length === 0}
                  >
                    Import Schedule
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Import Staff Modal */}
          {showImportStaffModal && canManageRoles() && (
            <div className="modal-overlay" onClick={() => setShowImportStaffModal(false)}>
              <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
                <h3>📥 Import Staff Members</h3>
                
                {/* Toggle between file upload and Google Sheets */}
                <div style={{display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #e0e0e0', paddingBottom: '15px'}}>
                  <button 
                    className={importStaffMethod === 'file' ? 'submit-btn' : 'cancel-btn'}
                    onClick={() => setImportStaffMethod('file')}
                    style={{flex: 1, padding: '10px', fontSize: '0.95rem'}}
                  >
                    📄 Upload File
                  </button>
                  <button 
                    className={importStaffMethod === 'googlesheet' ? 'submit-btn' : 'cancel-btn'}
                    onClick={() => setImportStaffMethod('googlesheet')}
                    style={{flex: 1, padding: '10px', fontSize: '0.95rem'}}
                  >
                    📊 Import Google Sheet
                  </button>
                </div>

                <div className="modal-content">
                  <div style={{marginBottom: '20px', padding: '15px', background: '#e8f5e9', borderRadius: '8px'}}>
                    <h4 style={{marginTop: 0}}>📋 Required Format:</h4>
                    <p style={{margin: '5px 0', fontSize: '0.9rem'}}>
                      Your staff list should have these columns:
                    </p>
                    <ul style={{margin: '10px 0', paddingLeft: '20px', fontSize: '0.9rem'}}>
                      <li><strong>Name</strong> - Staff member's full name</li>
                      <li><strong>Email</strong> - Staff member's email address</li>
                      <li><strong>Phone</strong> - Phone number</li>
                      <li><strong>Role</strong> - Staff role (Charge Nurse, Nurse, PCT, HUC, Director, Coordinator, Nursing Administrator)</li>
                      <li><strong>Department</strong> (optional) - Defaults to current department if not specified</li>
                      <li><strong>Hospital</strong> (optional) - Defaults to your hospital if not specified</li>
                    </ul>
                  </div>

                  {importStaffMethod === 'file' ? (
                    <div className="form-group">
                      <label>Upload Staff File (Excel or CSV)</label>
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleImportStaffFile}
                        style={{
                          padding: '10px',
                          border: '2px dashed #ddd',
                          borderRadius: '8px',
                          width: '100%'
                        }}
                      />
                      <small style={{display: 'block', marginTop: '5px', color: '#666'}}>
                        Supported formats: Excel (.xlsx, .xls) or CSV files
                      </small>
                    </div>
                  ) : (
                    <div>
                      <div className="form-group">
                        <label>Google Sheets URL</label>
                        <input
                          type="text"
                          value={importStaffGoogleSheetUrl}
                          onChange={(e) => setImportStaffGoogleSheetUrl(e.target.value)}
                          placeholder="https://docs.google.com/spreadsheets/d/..."
                          style={{
                            padding: '12px',
                            border: '2px solid #ddd',
                            borderRadius: '8px',
                            width: '100%',
                            fontSize: '0.95rem'
                          }}
                        />
                        <small style={{display: 'block', marginTop: '5px', color: '#666'}}>
                          Make sure the Google Sheet is set to "Anyone with the link can view"
                        </small>
                      </div>
                      <button 
                        className="submit-btn"
                        onClick={handleImportStaffGoogleSheet}
                        disabled={!importStaffGoogleSheetUrl}
                        style={{width: '100%', marginTop: '15px', padding: '12px'}}
                      >
                        Import from Google Sheets
                      </button>
                    </div>
                  )}
                </div>
                <div className="modal-buttons">
                  <button 
                    className="cancel-btn"
                    onClick={() => {
                      setShowImportStaffModal(false)
                      setImportStaffGoogleSheetUrl('')
                      setImportStaffMethod('file')
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Time Off Request Modal */}
          {showTimeOffModal && (
            <div className="modal-overlay" onClick={() => setShowTimeOffModal(false)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h3>Request Time Off</h3>
                <div className="modal-content">
                  <div className="form-group">
                    <label>Date</label>
                    <input
                      type="date"
                      value={timeOffDate}
                      onChange={(e) => setTimeOffDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Type</label>
                    <select
                      value={timeOffType}
                      onChange={(e) => setTimeOffType(e.target.value)}
                    >
                      <option value="PTO">PTO (Paid Time Off)</option>
                      <option value="Unpaid">Unpaid</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Reason (Optional)</label>
                    <textarea
                      value={timeOffReason}
                      onChange={(e) => setTimeOffReason(e.target.value)}
                      placeholder="Enter reason for time off..."
                      rows="4"
                      style={{
                        padding: '12px 15px',
                        border: '2px solid #e0e0e0',
                        borderRadius: '10px',
                        fontSize: '1rem',
                        transition: 'all 0.3s',
                        fontFamily: 'inherit',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                </div>
                <div className="modal-buttons">
                  <button 
                    className="cancel-btn"
                    onClick={() => {
                      setShowTimeOffModal(false)
                      setTimeOffDate('')
                      setTimeOffReason('')
                      setTimeOffType('PTO')
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    className="submit-btn"
                    onClick={submitTimeOffRequest}
                  >
                    Submit Request
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Staff Credentials Modal */}
          {showEditStaffModal && editingStaff && (
            <div className="modal-overlay" onClick={() => setShowEditStaffModal(false)}>
              <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
                <h3>Edit Credentials for {editingStaff.name}</h3>
                <div className="modal-content">
                  <div className="form-section">
                    <h4>License & CPR</h4>
                    <div className="form-row">
                      <div className="form-group">
                        <label>License Expiration</label>
                        <input
                          type="date"
                          value={editLicenseExpiration}
                          onChange={(e) => setEditLicenseExpiration(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>CPR Expiration</label>
                        <input
                          type="date"
                          value={editCprExpiration}
                          onChange={(e) => setEditCprExpiration(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-section">
                    <h4>Float & On-Call History</h4>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Last Float Date</label>
                        <input
                          type="date"
                          value={editLastFloatDate}
                          onChange={(e) => setEditLastFloatDate(e.target.value)}
                          placeholder="Select last float date"
                        />
                      </div>
                      <div className="form-group">
                        <label>Last On-Call Date</label>
                        <input
                          type="date"
                          value={editLastOnCallDate}
                          onChange={(e) => setEditLastOnCallDate(e.target.value)}
                          placeholder="Select last on-call date"
                        />
                      </div>
                    </div>
                    <small style={{display: 'block', marginTop: '5px', color: '#666', fontSize: '0.85rem'}}>
                      Leave empty if they've never floated or been on-call. Dates are used for rotation tracking.
                    </small>
                  </div>

                  <div className="form-section">
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
                      <h4>Other Credentials</h4>
                      <button 
                        className="submit-btn"
                        onClick={() => {
                          setNewCredentialName('')
                          setNewCredentialExpiration('')
                          setEditingCredentialIndex(null)
                          setShowCredentialModal(true)
                        }}
                        style={{padding: '8px 15px', fontSize: '0.9rem'}}
                      >
                        + Add Credential
                      </button>
                    </div>
                    <div className="credentials-grid">
                      {editCredentials.map((credential, index) => (
                        <div key={index} className="credential-item" style={{position: 'relative'}}>
                          <label>{credential.name}</label>
                          <p className="credential-value">
                            {credential.expiration}
                          </p>
                          <div style={{display: 'flex', gap: '5px', marginTop: '5px'}}>
                            <button 
                              onClick={() => handleEditStaffCredential(index)}
                              style={{
                                padding: '4px 10px',
                                fontSize: '0.75rem',
                                background: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleRemoveStaffCredential(index)}
                              style={{
                                padding: '4px 10px',
                                fontSize: '0.75rem',
                                background: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                      {editCredentials.length === 0 && (
                        <p className="placeholder-text">No additional credentials. Click "+ Add Credential" to add one.</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="modal-buttons">
                  <button 
                    className="cancel-btn"
                    onClick={() => {
                      setShowEditStaffModal(false)
                      setEditingStaff(null)
                      setEditLicenseExpiration('')
                      setEditCprExpiration('')
                      setEditCredentials([])
                      setEditLastFloatDate('')
                      setEditLastOnCallDate('')
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    className="submit-btn"
                    onClick={handleSaveStaffCredentials}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Profile Editor Modal */}
          {showProfileModal && profileEditData && (
            <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
              <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
                <h3>Edit Profile</h3>
                <div className="modal-content profile-edit">
                  {/* Profile Picture Section */}
                  <div className="profile-picture-section">
                    {profilePicturePreview ? (
                      <img 
                        src={profilePicturePreview} 
                        alt="Profile" 
                        style={{
                          width: '150px',
                          height: '150px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '4px solid #007bff',
                          marginBottom: '10px'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '150px',
                        height: '150px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '48px',
                        color: 'white',
                        fontWeight: 'bold',
                        marginBottom: '10px'
                      }}>
                        {profileEditData.name ? profileEditData.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                    
                    <div style={{display: 'flex', gap: '10px', justifyContent: 'center', alignItems: 'center'}}>
                      <label style={{
                        padding: '8px 15px',
                        background: '#007bff',
                        color: 'white',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        display: 'inline-block'
                      }}>
                        📸 Upload Photo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePictureChange}
                          style={{display: 'none'}}
                        />
                      </label>
                      {profilePicturePreview && (
                        <button 
                          onClick={removeProfilePicture}
                          style={{
                            padding: '8px 15px',
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                          }}
                        >
                          🗑️ Remove
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Personal Information */}
                  <div className="form-section">
                    <h4>Personal Information</h4>
                    <div className="form-group">
                      <label>Full Name</label>
                      <input
                        type="text"
                        value={profileEditData.name || ''}
                        onChange={(e) => handleProfileChange('name', e.target.value)}
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Role</label>
                        <select
                          value={profileEditData.role || ''}
                          onChange={(e) => handleProfileChange('role', e.target.value)}
                          disabled={!canManageRoles()}
                          style={!canManageRoles() ? {cursor: 'not-allowed', background: '#f5f5f5'} : {}}
                          title={!canManageRoles() ? 'Only Directors and Nursing Administrators can change roles' : ''}
                        >
                          <option value="">Select role</option>
                          <option value="Charge Nurse">Charge Nurse</option>
                          <option value="Nurse">Nurse</option>
                          <option value="PCT">PCT (Patient Care Technician)</option>
                          <option value="HUC">HUC (Health Unit Coordinator)</option>
                          <option value="Director">Director</option>
                          <option value="Coordinator">Coordinator</option>
                          <option value="Nursing Administrator">Nursing Administrator</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Date of Birth</label>
                        <input
                          type="date"
                          value={profileEditData.dateOfBirth || ''}
                          onChange={(e) => handleProfileChange('dateOfBirth', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Work Information */}
                  <div className="form-section">
                    <h4>Work Information</h4>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Hospital</label>
                        <input
                          type="text"
                          value={profileEditData.hospital || ''}
                          onChange={(e) => handleProfileChange('hospital', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Department</label>
                        <input
                          type="text"
                          value={profileEditData.department || ''}
                          onChange={(e) => handleProfileChange('department', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Shift Preference</label>
                      <select
                        value={profileEditData.shiftPreference || 'Day'}
                        onChange={(e) => handleProfileChange('shiftPreference', e.target.value)}
                      >
                        <option value="Day">Day Shift</option>
                        <option value="Night">Night Shift</option>
                        <option value="Both">Both Day & Night</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input
                        type="tel"
                        value={profileEditData.phone || ''}
                        onChange={(e) => handleProfileChange('phone', e.target.value)}
                        placeholder="555-123-4567"
                      />
                    </div>
                  </div>

                  {/* Credentials */}
                  <div className="form-section">
                    <h4>License Information</h4>
                    <div className="form-row">
                      <div className="form-group">
                        <label>License Number</label>
                        <input
                          type="text"
                          value={profileEditData.licenseNumber || ''}
                          onChange={(e) => handleProfileChange('licenseNumber', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>License Expiration</label>
                        <input
                          type="date"
                          value={profileEditData.licenseExpiration || ''}
                          onChange={(e) => handleProfileChange('licenseExpiration', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-section">
                    <h4>CPR Information</h4>
                    <div className="form-group">
                      <label>CPR Expiration Date</label>
                      <input
                        type="date"
                        value={profileEditData.cprExpiration || ''}
                        onChange={(e) => handleProfileChange('cprExpiration', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-buttons">
                  <button 
                    className="cancel-btn"
                    onClick={() => {
                      setShowProfileModal(false)
                      setProfileEditData(null)
                      setProfilePicture(null)
                      setProfilePicturePreview(null)
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    className="submit-btn"
                    onClick={saveProfile}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add/Edit Credential Modal */}
          {showCredentialModal && (
            <div className="modal-overlay" onClick={() => setShowCredentialModal(false)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h3>{editingCredentialIndex !== null ? 'Edit Credential' : 'Add Credential'}</h3>
                <div className="modal-content">
                  <div className="form-group">
                    <label>Credential Name</label>
                    <input
                      type="text"
                      value={newCredentialName}
                      onChange={(e) => setNewCredentialName(e.target.value)}
                      placeholder="e.g., ACLS, PALS, BLS, etc."
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Expiration Date</label>
                    <input
                      type="date"
                      value={newCredentialExpiration}
                      onChange={(e) => setNewCredentialExpiration(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="modal-buttons">
                  <button 
                    className="cancel-btn"
                    onClick={() => {
                      setShowCredentialModal(false)
                      setNewCredentialName('')
                      setNewCredentialExpiration('')
                      setEditingCredentialIndex(null)
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    className="submit-btn"
                    onClick={() => {
                      if (showEditStaffModal) {
                        // We're editing staff credentials
                        if (editingCredentialIndex !== null) {
                          handleUpdateStaffCredential()
                        } else {
                          handleAddCredentialForStaff()
                        }
                      } else {
                        // We're editing own credentials
                        if (editingCredentialIndex !== null) {
                          updateCredential()
                        } else {
                          addCredential()
                        }
                      }
                    }}
                  >
                    {editingCredentialIndex !== null ? 'Update' : 'Add'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Create Unit Meeting Modal */}
          {showMeetingModal && (
            <div className="modal-overlay" onClick={() => setShowMeetingModal(false)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h3>Create Unit Meeting</h3>
                <div className="modal-content">
                  <p style={{marginBottom: '15px', color: '#666', fontSize: '0.9rem'}}>
                    This meeting will be added to all staff members in your department ({user.department})
                  </p>
                  <div className="form-group">
                    <label>Meeting Title *</label>
                    <input
                      type="text"
                      value={meetingTitle}
                      onChange={(e) => setMeetingTitle(e.target.value)}
                      placeholder="e.g., Staff Meeting, In-Service"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Date *</label>
                    <input
                      type="date"
                      value={meetingDate}
                      onChange={(e) => setMeetingDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Start Time *</label>
                      <input
                        type="time"
                        value={meetingTime}
                        onChange={(e) => setMeetingTime(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Duration (minutes) *</label>
                      <select
                        value={meetingDuration}
                        onChange={(e) => setMeetingDuration(e.target.value)}
                        required
                      >
                        <option value="30">30 minutes</option>
                        <option value="60">60 minutes</option>
                        <option value="90">90 minutes</option>
                        <option value="120">2 hours</option>
                        <option value="180">3 hours</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Description (Optional)</label>
                    <textarea
                      value={meetingDescription}
                      onChange={(e) => setMeetingDescription(e.target.value)}
                      placeholder="Enter meeting agenda or topics..."
                      rows="3"
                      style={{
                        padding: '12px 15px',
                        border: '2px solid #e0e0e0',
                        borderRadius: '10px',
                        fontSize: '1rem',
                        fontFamily: 'inherit',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                </div>
                <div className="modal-buttons">
                  <button 
                    className="cancel-btn"
                    onClick={() => {
                      setShowMeetingModal(false)
                      setMeetingDate('')
                      setMeetingTime('09:00')
                      setMeetingDuration('60')
                      setMeetingTitle('')
                      setMeetingDescription('')
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    className="submit-btn"
                    onClick={createUnitMeeting}
                    style={{background: '#10b981'}}
                  >
                    Create Meeting
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Login/Signup Page
  return (
    <div className="app">
      <div className="container">
        <div className="header">
          <div className="logo">
            <svg width="50" height="50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" stroke="currentColor" strokeWidth="2"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" fill="none"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" fill="none"/>
            </svg>
          </div>
          <h1>Nurse Scheduler</h1>
          <p className="tagline">Hospital Staff Scheduling Made Simple</p>
        </div>

        <div className="card">
          <div className="tabs">
            <button 
              className={`tab ${isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(true)}
            >
              Log In
            </button>
            <button 
              className={`tab ${!isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(false)}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={isLogin ? handleLogin : handleSignup} className="form signup-form">
            {!isLogin && (
              <>
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="role">Role</label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                  >
                    <option value="">Select your role</option>
                    <option value="Charge Nurse">Charge Nurse</option>
                    <option value="Nurse">Nurse</option>
                    <option value="PCT">PCT (Patient Care Technician)</option>
                    <option value="HUC">HUC (Health Unit Coordinator)</option>
                    <option value="Director">Director</option>
                    <option value="Coordinator">Coordinator</option>
                    <option value="Nursing Administrator">Nursing Administrator</option>
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="hospital">Hospital</label>
                    <input
                      id="hospital"
                      type="text"
                      value={hospital}
                      onChange={(e) => setHospital(e.target.value)}
                      required
                      placeholder="Enter hospital name"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="department">Department</label>
                    <input
                      id="department"
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      required
                      placeholder="Enter department"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="phoneNumber">Phone Number</label>
                  <input
                    id="phoneNumber"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    placeholder="e.g., 555-123-4567"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="dateOfBirth">Date of Birth</label>
                  <input
                    id="dateOfBirth"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="licenseNumber">License Number (Optional - Enter N/A if not applicable)</label>
                    <input
                      id="licenseNumber"
                      type="text"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      placeholder="Enter license number or N/A"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="licenseExpiration">License Expiration (Optional)</label>
                    <input
                      id="licenseExpiration"
                      type="date"
                      value={licenseExpiration}
                      onChange={(e) => setLicenseExpiration(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="cprExpiration">CPR Expiration (Optional)</label>
                  <input
                    id="cprExpiration"
                    type="date"
                    value={cprExpiration}
                    onChange={(e) => setCprExpiration(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="shiftPreference">Shift Preference</label>
                  <select
                    id="shiftPreference"
                    value={shiftPreference}
                    onChange={(e) => setShiftPreference(e.target.value)}
                    required
                  >
                    <option value="Day">Day Shift</option>
                    <option value="Night">Night Shift</option>
                    <option value="Both">Both Day & Night</option>
                  </select>
                </div>
              </>
            )}

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                minLength="6"
              />
            </div>

            {!isLogin && (
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm your password"
                  minLength="6"
                />
              </div>
            )}

            {isLogin && (
              <div className="form-options">
                <label className="checkbox-label">
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>
                <a href="#" className="forgot-link">Forgot password?</a>
              </div>
            )}

            <button type="submit" className="submit-button">
              {isLogin ? 'Log In' : 'Create Account'}
            </button>
          </form>

          <p className="footer-text">
            {isLogin ? (
              <>
                Don't have an account?{' '}
                <button onClick={() => setIsLogin(false)} className="link-button">
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button onClick={() => setIsLogin(true)} className="link-button">
                  Log in
                </button>
              </>
            )}
          </p>
        </div>

        <div className="features">
          <div className="feature">
            <span className="icon">📅</span>
            <h3>View Your Schedule</h3>
            <p>Access your shifts and work hours</p>
          </div>
          <div className="feature">
            <span className="icon">👥</span>
            <h3>Team Collaboration</h3>
            <p>Connect with your team members</p>
          </div>
          <div className="feature">
            <span className="icon">📱</span>
            <h3>Anywhere Access</h3>
            <p>Use on mobile, tablet, or desktop</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App

