const USERS_STORAGE_KEY = 'app_users'

// Get all registered users from localStorage
function getAllUsers() {
  const usersJson = localStorage.getItem(USERS_STORAGE_KEY)
  return usersJson ? JSON.parse(usersJson) : []
}

// Save user list to localStorage
function saveUsers(users) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
}

export async function signup(userData) {
  try {
    console.log('📝 Signup attempt:', userData)
    const { email, password, name, role } = userData
    
    if (!email || !password || !name) {
      return { success: false, error: 'All fields are required' }
    }

    const users = getAllUsers()
    console.log('📋 Current users in storage:', users)
    
    // Check if user already exists
    if (users.find(u => u.email === email)) {
      return { success: false, error: 'Email already registered' }
    }

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      email,
      password, // Note: In production, hash this!
      name,
      role: role || 'USER',
      createdAt: new Date().toISOString()
    }

    users.push(newUser)
    saveUsers(users)
    console.log('✅ User saved:', newUser)

    return {
      success: true,
      user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
    }
  } catch (error) {
    console.error('❌ Signup error:', error)
    return { success: false, error: error.message }
  }
}

export async function login(credentials) {
  try {
    console.log('🔐 Login attempt with:', credentials.email)
    const { email, password } = credentials
    
    if (!email || !password) {
      return { success: false, error: 'Email and password are required' }
    }

    const users = getAllUsers()
    console.log('📋 Checking against users:', users)
    const user = users.find(u => u.email === email && u.password === password)

    if (!user) {
      console.log('❌ No matching user found')
      return { success: false, error: 'Invalid email or password' }
    }

    console.log('✅ Login successful:', user.name)
    return {
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    }
  } catch (error) {
    console.error('❌ Login error:', error)
    return { success: false, error: error.message }
  }
}

export async function logout() {
  return Promise.resolve({ success: true })
}

export async function getCurrentUser() {
  return Promise.resolve({ id: 1, name: 'Admin' })
}
