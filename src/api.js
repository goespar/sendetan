const endpoint = import.meta.env.VITE_APPS_SCRIPT_URL

export const isDemo = !endpoint

export async function request(action, payload = {}, token = '') {
  if (isDemo) return { demo: true }
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, token, ...payload }),
  })
  const result = await response.json()
  if (!response.ok || result.error) throw new Error(result.error || `HTTP ${response.status}`)
  return result
}

export async function uploadPhoto(file, token, folder = 'assets') {
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1])
    reader.onerror = () => reject(new Error('Foto tidak dapat dibaca.'))
    reader.readAsDataURL(file)
  })
  return request('uploadFile', {
    fileName: file.name,
    mimeType: file.type,
    base64,
    folder,
  }, token)
}
