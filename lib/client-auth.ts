export async function logoutFromApp() {
  const response = await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "same-origin",
  })

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(data?.message || "Unable to sign out right now.")
  }
}
