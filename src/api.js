const endpoint = import.meta.env.VITE_APPS_SCRIPT_URL

export const isDemo = !endpoint?.trim()

export async function request(action, payload = {}, token = '') {
  if (isDemo) return { demo: true }
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 60000)
  let response
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, token, ...payload }),
      signal: controller.signal,
    })
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('Permintaan melewati batas 60 detik. Periksa koneksi lalu muat ulang data sebelum mengirim ulang.')
    throw new Error('Koneksi ke server gagal. Periksa jaringan dan URL Apps Script.')
  } finally {
    window.clearTimeout(timeout)
  }
  let result
  try { result = await response.json() }
  catch { throw new Error('Server mengirim respons yang tidak valid. Periksa deployment Apps Script.') }
  if (!response.ok || result.error) throw new Error(result.error || `HTTP ${response.status}`)
  return result
}

async function optimizePhoto(file) {
  if (file.type === 'image/gif' || typeof createImageBitmap !== 'function') return file
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, 1920 / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.82))
    if (!blob || blob.size >= file.size) return file
    return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.webp`, { type: 'image/webp', lastModified: file.lastModified })
  } catch { return file }
}

export async function uploadPhoto(file, token, folder = 'assets') {
  const optimized = await optimizePhoto(file)
  if (optimized.size > 5 * 1024 * 1024) throw new Error('Ukuran foto melebihi 5 MB setelah optimasi. Pilih foto yang lebih kecil.')
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1])
    reader.onerror = () => reject(new Error('Foto tidak dapat dibaca.'))
    reader.readAsDataURL(optimized)
  })
  return request('uploadFile', {
    fileName: optimized.name,
    mimeType: optimized.type,
    base64,
    folder,
  }, token)
}
