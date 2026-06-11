export async function fetchUsers() {
  return Promise.resolve([])
}

export async function saveUser(user) {
  return Promise.resolve({ ...user, id: Date.now() })
}
