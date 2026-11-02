/**
 * 读者留言 / 后台 API 客户端
 * ============================================================================
 * 与 widget 站同名文件同源，差别只在部署形态的判断：
 *
 *   自有域名（www.ahb.power-knowledge.tech） → 同源 ''，nginx 反代 /api/
 *   本地开发（localhost / 127.0.0.1）        → 同源 ''，由 vite server.proxy 转 127.0.0.1:8792
 *   GitHub Pages（*.github.io）              → **没有后端**，只提示到正式域名操作
 *
 * 为什么不学 widget 让 Pages 版跨域调正式站：
 *   留言可以跨域提交，但后台不行 —— 管理会话是 SameSite=Strict 的 Cookie，
 *   跨站一律不发送。Pages 版能提交、却永远进不去后台，这种"半可用"状态
 *   比明确告知不可用更容易让人误判。所以这里统一收紧：Pages 版直接说明。
 *
 * 第二个防御：后端未部署时，请求会被 nginx 的 `try_files … /index.html` 兜住，
 * 返回 **200 + HTML** 而不是 404。若只看 res.ok，前端会把整页 HTML 当 JSON 解析，
 * 或者更糟——在后台上显示"没有留言"，让人误以为数据丢了。
 * 因此 request() 强制校验 Content-Type，不是 JSON 就抛可读错误。
 */

const GITHUB_PAGES_HINT =
  '当前是 GitHub Pages 镜像站，没有留言后端。请到正式域名 www.ahb.power-knowledge.tech 提交或查看。'

export function isMirrorDeployment(): boolean {
  return typeof window !== 'undefined' && window.location.hostname.endsWith('.github.io')
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  { withCredentials = false }: { withCredentials?: boolean } = {},
): Promise<T> {
  if (isMirrorDeployment()) throw new ApiError(GITHUB_PAGES_HINT, 0)

  const res = await fetch(path, {
    ...init,
    credentials: withCredentials ? 'include' : 'same-origin',
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers || {}),
    },
  })

  const ctype = res.headers.get('content-type') || ''
  const text = await res.text()

  // 后端缺失时 nginx 回落 index.html —— 这里必须识别出来，否则会静默变成"空列表"
  if (ctype.indexOf('application/json') < 0) {
    throw new ApiError(
      res.ok
        ? '留言服务尚未就绪（接口返回的不是 JSON，可能被站点的单页回落规则兜住了）。'
        : `请求失败（HTTP ${res.status}）。`,
      res.status,
    )
  }

  let payload: unknown = null
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = null
    }
  }

  if (!res.ok) {
    let message = `请求失败（HTTP ${res.status}）`
    if (payload && typeof payload === 'object' && 'error' in payload) {
      const raw = (payload as { error: unknown }).error
      if (typeof raw === 'string' && raw) message = raw
    }
    throw new ApiError(message, res.status)
  }

  return payload as T
}

// ── 公开接口 ────────────────────────────────────────────────────────────────
export interface FeedbackPayload {
  page: string
  content: string
  contact?: string
  /** 蜜罐字段，正常用户不填；前端固定留空 */
  website?: string
}

export async function submitFeedback(payload: FeedbackPayload): Promise<void> {
  await request<{ ok: true }>('/api/feedback', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// ── 管理接口 ────────────────────────────────────────────────────────────────
export type MessageStatus = 'new' | 'read' | 'archived'

export interface AdminMessage {
  id: number
  page: string
  content: string
  contact: string | null
  status: MessageStatus
  created_at: string
}

export interface MessageListResult {
  items: AdminMessage[]
  total: number
  counts: { all: number; new: number; read: number; archived: number }
}

export async function adminLogin(username: string, password: string): Promise<{ username: string }> {
  return request<{ ok: true; username: string }>(
    '/api/admin/login',
    { method: 'POST', body: JSON.stringify({ username, password }) },
    { withCredentials: true },
  )
}

export async function adminLogout(): Promise<void> {
  await request('/api/admin/logout', { method: 'POST' }, { withCredentials: true })
}

export async function adminMe(): Promise<{ username: string }> {
  return request<{ username: string }>('/api/admin/me', {}, { withCredentials: true })
}

/**
 * 首次设定 / 重置密码：凭服务器上生成的一次性令牌。
 * 密码不经过任何中间环节，直接由使用者在浏览器里设定。
 */
export async function adminSetup(token: string, password: string, username?: string): Promise<{ username: string }> {
  return request<{ ok: true; username: string }>(
    '/api/admin/setup',
    { method: 'POST', body: JSON.stringify({ token, password, username }) },
    { withCredentials: true },
  )
}

export async function listMessages(
  status: MessageStatus | 'all',
  limit = 50,
  offset = 0,
): Promise<MessageListResult> {
  const qs = new URLSearchParams()
  if (status !== 'all') qs.set('status', status)
  qs.set('limit', String(limit))
  qs.set('offset', String(offset))
  return request<MessageListResult>(`/api/admin/messages?${qs}`, {}, { withCredentials: true })
}

export async function updateMessageStatus(id: number, status: MessageStatus): Promise<void> {
  await request(
    `/api/admin/messages/${id}`,
    { method: 'PATCH', body: JSON.stringify({ status }) },
    { withCredentials: true },
  )
}

export async function deleteMessage(id: number): Promise<void> {
  await request(`/api/admin/messages/${id}`, { method: 'DELETE' }, { withCredentials: true })
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await request(
    '/api/admin/password',
    { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) },
    { withCredentials: true },
  )
}
