const endpoint = import.meta.env.VITE_APPS_SCRIPT_URL

export const isDemo = !endpoint?.trim()

export async function request(action, payload = {}, token = '') {
  if (isDemo) return { demo: true }
  const mutation = ['create', 'update', 'batchPayments', 'batchCreate'].includes(action)
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 300000)
  let response
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, token, ...payload }),
      signal: controller.signal,
    })
  } catch (error) {
    const message = error.name === 'AbortError'
      ? 'Permintaan melewati batas 5 menit.'
      : 'Koneksi ke server terputus.'
    const failure = new Error(mutation
      ? `${message} Status transaksi belum dapat dipastikan. Jangan ubah isi transaksi; coba kirim ulang data yang sama agar server tidak mencatatnya dua kali.`
      : `${message} Periksa koneksi dan URL Apps Script.`)
    failure.uncertain = mutation
    throw failure
  } finally {
    window.clearTimeout(timeout)
  }
  let result
  try { result = await response.json() }
  catch {
    const failure = new Error('Server mengirim respons yang tidak valid. Status transaksi belum dapat dipastikan. Jangan ubah isi transaksi; muat ulang data sebelum mencoba lagi.')
    failure.uncertain = mutation
    throw failure
  }
  if (!response.ok || result.error) {
    const failure = new Error(result.error || `HTTP ${response.status}`)
    failure.uncertain = mutation && Boolean(result.uncertain || !response.ok)
    throw failure
  }
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
