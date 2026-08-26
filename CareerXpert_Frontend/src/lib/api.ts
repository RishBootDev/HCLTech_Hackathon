const API_BASE = "http://localhost:2030";

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
  const contentType = res.headers.get("content-type");
  if (contentType?.includes("application/json")) return res.json();
  
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

// ─── AUTH ──────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    request<{ token: string; user: { id: number; userId: number; fullName: string; email: string; role: string } }>("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }),
  signup: (data: Record<string, unknown>) =>
    request<string>("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
};

// ─── PROFILE ───────────────────────────────────────────────────────────────
export const profileApi = {
  getById: (id: number) => request<Record<string, unknown>>(`/api/profile/${id}`),
  getByEmail: (email: string) => request<Record<string, unknown>>(`/api/profile/email/${encodeURIComponent(email)}`),
  getQuizResults: (id: number) => request<Array<Record<string, unknown>>>(`/api/profile/${id}/quizzes`),
  getMentor: (id: number) => request<Record<string, unknown>>(`/api/profile/${id}/mentorship`),
  getCourseRecommendation: (id: number) => request<Record<string, unknown>>(`/api/profile/${id}/course`),
  submitForCourse: (id: number, data: Record<string, unknown>) =>
    request<Record<string, unknown>>(`/api/profile/${id}/getCourse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  recommendColleges: (id: number, city: string) =>
    request<Array<Record<string, unknown>>>(`/api/profile/${id}/recommendColleges?city=${encodeURIComponent(city)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }),
  getColleges: (id: number) => request<Array<Record<string, unknown>>>(`/api/profile/${id}/getColleges`),
};

// ─── COURSES ───────────────────────────────────────────────────────────────
export const courseApi = {
  getAll: () => request<Array<Record<string, unknown>>>("/courses/all"),
  getById: (id: number) => request<Record<string, unknown>>(`/courses/get/${id}`),
  getByName: (name: string) => request<Array<Record<string, unknown>>>(`/courses/${encodeURIComponent(name)}/get`),
  create: (data: Record<string, unknown>, mentorId: number) =>
    request<Record<string, unknown>>(`/courses/create?mentorId=${mentorId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  getByMentor: (mentorId: number) =>
    request<Array<Record<string, unknown>>>(`/courses/mentor/${mentorId}`),
  delete: (id: number) => request<string>(`/courses/delete/${id}`, { method: "DELETE" }),
};

// ─── QUIZ ──────────────────────────────────────────────────────────────────
export const quizApi = {
  getAll: () => request<Array<Record<string, unknown>>>("/api/quiz/all"),
  getForUser: (profileId: number) => request<Array<Record<string, unknown>>>(`/api/quiz/for/${profileId}`),
  getMyQuizzes: (profileId: number) => request<Array<Record<string, unknown>>>(`/api/quiz/my/${profileId}`),
  getById: (id: number) => request<Record<string, unknown>>(`/api/quiz/${id}`),
  submitResult: (profileId: number, data: Record<string, unknown>) =>
    request<Record<string, unknown>>(`/answer/getResult/${profileId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  generateQuiz: (data: Record<string, unknown>, difficulty: string) =>
    request<Record<string, unknown>>(`/ai/generateQuiz?difficulty=${encodeURIComponent(difficulty)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  removeQuestion: (quizId: number, questionId: number) =>
    request<string>(`/api/quiz/${quizId}/question/${questionId}`, { method: "DELETE" }),
};

// ─── VERIFIED ARTICLES (RSS News & Fact-checking) ───────────────────────────
export const satornApi = {
  getAll: (page = 0, size = 10, category?: string, profileId?: number) => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (category) params.set("category", category);
    if (profileId) params.set("profileId", String(profileId));
    return request<Array<Record<string, unknown>>>(`/api/articles?${params}`);
  },
  getTrending: () => request<Array<Record<string, unknown>>>("/api/articles/trending"),
  getTopCredible: () => request<Array<Record<string, unknown>>>("/api/articles/top-credible"),
  getByCategory: (category: string, profileId?: number) => {
    const params = new URLSearchParams();
    if (profileId) params.set("profileId", String(profileId));
    return request<Array<Record<string, unknown>>>(`/api/articles/category/${encodeURIComponent(category)}?${params}`);
  },
  getById: (id: number) => request<Record<string, unknown>>(`/api/articles/${id}`),
  saveArticle: (id: number, profileId: number, notes?: string) => {
    const params = new URLSearchParams({ profileId: String(profileId) });
    if (notes) params.set("notes", notes);
    return request<string>(`/api/articles/${id}/save?${params}`, { method: "POST" });
  },
  getSavedArticles: (profileId: number) =>
    request<Array<Record<string, unknown>>>(`/api/articles/saved?profileId=${profileId}`),
  submitArticle: (profileId: number, title: string, content: string, sourceUrl?: string, author?: string) => {
    const params = new URLSearchParams({ profileId: String(profileId), title, content });
    if (sourceUrl) params.set("sourceUrl", sourceUrl);
    if (author) params.set("author", author);
    return request<Record<string, unknown>>(`/api/articles/submit?${params}`, { method: "POST" });
  },
  quickVerifyUrl: (profileId: number, url: string) =>
    request<Record<string, unknown>>(
      `/api/articles/submit/url?profileId=${profileId}&url=${encodeURIComponent(url)}`,
      { method: "POST" }
    ),
  getVerificationProgress: (id: number) =>
    request<Record<string, unknown>>(`/api/articles/${id}/progress`),
  verifyArticle: (id: number) =>
    request<Record<string, unknown>>(`/api/articles/${id}/verify`, { method: "POST" }),
  getTopNews: (query: string) =>
    request<{ msg: string; data: any[] }>("/api/articles/top-news", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ msg: query }),
    }),
};

// ─── AI NEWS CHAT (NewsAI Fact-Checking Chatbot) ──────────────────────────
export const newsAiChatApi = {
  chat: (profileId: number, message: string, sessionId?: number) => {
    const params = new URLSearchParams({ profileId: String(profileId), message });
    if (sessionId) params.set("sessionId", String(sessionId));
    return request<{ sessionId: number; intent: string; message: string }>(
      `/api/newsai/chat?${params}`,
      { method: "POST" }
    );
  },
  getSessions: (profileId: number, limit = 10) =>
    request<Array<Record<string, unknown>>>(`/api/newsai/sessions/${profileId}?limit=${limit}`),
  getSessionHistory: (profileId: number, sessionId: number) =>
    request<Array<Record<string, unknown>>>(`/api/newsai/sessions/${profileId}/${sessionId}/history`),
};

// ─── LEGACY NEWS CHAT (used by news page) ───────────────────────────────
export const satornChatApi = {
  chat: (profileId: number, message: string, articleId?: number) => {
    const params = new URLSearchParams({ profileId: String(profileId), question: message });
    if (articleId) params.set("articleId", String(articleId));
    const url = articleId ? `/smartlearn/tutor/ask-about-news?${params}` : `/smartlearn/tutor/ask?profileId=${profileId}&question=${encodeURIComponent(message)}`;
    return request<string>(url, { method: "POST" });
  },
};



// ─── CAREER COACH (PivotPath RAG-based) ───────────────────────────────────
export const careerCoachApi = {
  chat: (message: string, chatId: string) =>
    request<string>(`/api/coach/chat?message=${encodeURIComponent(message)}&chatId=${encodeURIComponent(chatId)}`, {
      method: "POST",
    }),
  analyzeGap: (jobDescription: string) =>
    request<Record<string, unknown>>(`/api/coach/analyze-gap`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(jobDescription),
    }),
  getHistory: (chatId: string) =>
    request<Array<Record<string, unknown>>>(`/api/coach/history/${encodeURIComponent(chatId)}`),
};

// ─── SMARTLEARN (AI tutoring & adaptive quizzes) ──────────────────────────
export const smartLearnApi = {
  // Modules
  getModulesByCourse: (courseId: number) =>
    request<Array<Record<string, unknown>>>(`/smartlearn/course/${courseId}/modules`),
  addModule: (courseId: number, title: string, description: string) =>
    request<Record<string, unknown>>(
      `/smartlearn/course/${courseId}/module?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}`,
      { method: "POST" }
    ),
  // Lessons
  getLessonsByModule: (moduleId: number) =>
    request<Array<Record<string, unknown>>>(`/smartlearn/module/${moduleId}/lessons`),
  getLessonById: (lessonId: number) =>
    request<Record<string, unknown>>(`/smartlearn/lesson/${lessonId}`),
  addLesson: (moduleId: number, title: string, content?: string, videoUrl?: string, durationMinutes?: number, file?: File) => {
    const formData = new FormData();
    formData.append("title", title);
    if (content) formData.append("content", content);
    if (videoUrl) formData.append("videoUrl", videoUrl);
    if (durationMinutes !== undefined) formData.append("durationMinutes", durationMinutes.toString());
    if (file) formData.append("file", file);
    return request<Record<string, unknown>>(`/smartlearn/module/${moduleId}/lesson`, {
      method: "POST",
      body: formData,
    });
  },
  // Tutor
  askTutor: (profileId: number, question: string, lessonId?: number, mode = "DOUBT") => {
    const params = new URLSearchParams({ profileId: String(profileId), question, modeStr: mode });
    if (lessonId) params.set("lessonId", String(lessonId));
    return request<string>(`/smartlearn/tutor/ask?${params}`, { method: "POST" });
  },
  askTutorAboutNews: (profileId: number, articleId: number, question: string) => {
    const params = new URLSearchParams({ profileId: String(profileId), articleId: String(articleId), question });
    return request<string>(`/smartlearn/tutor/ask-about-news?${params}`, { method: "POST" });
  },
  // Recommendations
  getNextLesson: (profileId: number) =>
    request<Record<string, unknown>>(`/smartlearn/recommendation/next-lesson/${profileId}`),
  // Quizzes
  generateQuizFromLesson: (lessonId: number) =>
    request<string>(`/smartlearn/quiz/generate/${lessonId}`),
  generateQuizFromArticle: (articleId: number) =>
    request<string>(`/smartlearn/quiz/generate-from-news/${articleId}`),
  saveAttempt: (profileId: number, lessonId: number, score: number, totalQuestions?: number, correctAnswers?: number) => {
    let url = `/smartlearn/quiz/attempt?profileId=${profileId}&lessonId=${lessonId}&score=${score}`;
    if (totalQuestions !== undefined && correctAnswers !== undefined) {
      url += `&totalQuestions=${totalQuestions}&correctAnswers=${correctAnswers}`;
    }
    return request<Record<string, unknown>>(url, { method: "POST" });
  },
  saveVideoProgress: (profileId: number, lessonId: number, videoProgress: number, lastTimestampSeconds: number) =>
    request<Record<string, unknown>>(
      `/smartlearn/lesson/video/progress?profileId=${profileId}&lessonId=${lessonId}&videoProgress=${videoProgress}&lastTimestampSeconds=${lastTimestampSeconds}`,
      { method: "POST" }
    ),
  generateSkillQuiz: (skillName: string) =>
    request<string>(`/smartlearn/quiz/generate-from-skill/${encodeURIComponent(skillName)}`),
  saveSkillAttempt: (profileId: number, skillName: string, score: number) =>
    request<Record<string, unknown>>(
      `/smartlearn/quiz/attempt-skill?profileId=${profileId}&skillName=${encodeURIComponent(skillName)}&score=${score}`,
      { method: "POST" }
    ),
  // Progress
  getLessonAttempts: (profileId: number) =>
    request<Array<Record<string, unknown>>>(`/smartlearn/progress/${profileId}`),
  getCourseProgress: (profileId: number) =>
    request<Array<Record<string, unknown>>>(`/smartlearn/progress/courses/${profileId}`),
  // Tutorials
  addTutorial: (courseId: number, data: Record<string, unknown>) =>
    request<Record<string, unknown>>(`/smartlearn/course/${courseId}/tutorial`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
};

// ─── SKILL PROGRESS ────────────────────────────────────────────────────────
export const skillProgressApi = {
  getAll: (profileId: number) =>
    request<Array<Record<string, unknown>>>(`/api/skill-progress/${profileId}`),
  getMastered: (profileId: number) =>
    request<Array<Record<string, unknown>>>(`/api/skill-progress/${profileId}/mastered`),
  getInProgress: (profileId: number) =>
    request<Array<Record<string, unknown>>>(`/api/skill-progress/${profileId}/in-progress`),
  getSkill: (profileId: number, skillName: string) =>
    request<Record<string, unknown>>(`/api/skill-progress/${profileId}/skill/${encodeURIComponent(skillName)}`),
  updateSkill: (profileId: number, skillName: string, category: string, masteryScore: number) =>
    request<Record<string, unknown>>(`/api/skill-progress/${profileId}/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skillName, category, masteryScore }),
    }),
  deleteProgress: (progressId: number) =>
    request<string>(`/api/skill-progress/${progressId}`, { method: "DELETE" }),
};

// ─── DIRECT CHAT (Student <-> Mentor) ─────────────────────────────────────
export const humanChatApi = {
  getHistory: (user1Id: number, user2Id: number) =>
    request<Array<Record<string, any>>>(`/api/chat/history?user1Id=${user1Id}&user2Id=${user2Id}`),
  getUnread: (recipientId: number) =>
    request<Array<Record<string, any>>>(`/api/chat/unread/${recipientId}`),
  getUnreadCount: (recipientId: number) =>
    request<{ unreadCount: number }>(`/api/chat/unread-count/${recipientId}`),
  markAsRead: (recipientId: number, senderId: number) =>
    request<{ markedAsRead: number }>(`/api/chat/mark-read?recipientId=${recipientId}&senderId=${senderId}`, {
      method: "PUT",
    }),
};

// ─── AI CHAT (streaming) ───────────────────────────────────────────────────
export async function streamAIChat(
  profileId: number,
  message: string,
  onChunk: (chunk: string) => void
): Promise<void> {
  const body = new URLSearchParams();
  body.append("profileId", String(profileId));
  body.append("message", message);

  const res = await fetch(`${API_BASE}/ai/text`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", ...getAuthHeaders() },
    body,
  });
  if (!res.ok) throw new Error(`${res.status}`);
  if (!res.body) throw new Error("No stream");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value, { stream: true }));
  }
}

export async function streamFreeChat(
  currentCourse: string,
  message: string,
  onChunk: (chunk: string) => void
): Promise<void> {
  const body = new URLSearchParams();
  body.append("message", message);

  const res = await fetch(`${API_BASE}/ai/${encodeURIComponent(currentCourse)}/free`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`${res.status}`);
  if (!res.body) throw new Error("No stream");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value, { stream: true }));
  }
}

export async function streamAIDescribe(
  query: string,
  files: File[],
  onChunk: (chunk: string) => void
): Promise<void> {
  const formData = new FormData();
  formData.append("query", query);
  if (files.length === 1) {
    formData.append("file", files[0]);
  } else {
    files.forEach((f) => formData.append("files", f));
  }
  const url = files.length === 1 ? "/ai/describe" : "/ai/multiImages";

  const res = await fetch(`${API_BASE}${url}`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: formData,
  });
  if (!res.ok) throw new Error(`${res.status}`);
  if (!res.body) throw new Error("No stream");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value, { stream: true }));
  }
}

export async function streamLearningRoadmap(
  profileId: number,
  targetRole: string,
  onChunk: (chunk: string) => void
): Promise<void> {
  const res = await fetch(
    `${API_BASE}/ai/learning-roadmap/${profileId}?targetRole=${encodeURIComponent(targetRole)}`,
    { method: "GET", headers: getAuthHeaders() }
  );
  if (!res.ok) throw new Error(`${res.status}`);
  if (!res.body) throw new Error("No stream");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value, { stream: true }));
  }
}

export async function streamSkillGap(
  profileId: number,
  onChunk: (chunk: string) => void
): Promise<void> {
  const res = await fetch(`${API_BASE}/ai/skill-gap/${profileId}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`${res.status}`);
  if (!res.body) throw new Error("No stream");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value, { stream: true }));
  }
}

// ─── AI CHAT HISTORY ──────────────────────────────────────────────────────
export const chatApi = {
  getHistory: (profileId: number) =>
    request<Array<Record<string, unknown>>>(`/ai/history/${profileId}`),
};

// ─── CAREER TOOLS (AI-powered features) ──────────────────────────────────
export const careerToolsApi = {
  generateMockInterview: (role: string, experience: string = "Entry Level") =>
    request<Array<Record<string, unknown>>>(
      `/ai/mock-interview?role=${encodeURIComponent(role)}&experience=${encodeURIComponent(experience)}`
    ),
  getSkillGap: (profileId: number) =>
    request<Record<string, unknown>>(`/ai/skill-gap/${profileId}`),
  reviewResume: (file: File, role?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    if (role) formData.append("role", role);
    return request<Record<string, unknown>>(`/ai/resume-review`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: formData,
    });
  },
  resumeCompatibility: (file: File, jobDescription: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("jobDescription", jobDescription);
    return request<Record<string, unknown>>(`/ai/resume-compatibility`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: formData,
    });
  },
};

// ─── MENTORS ───────────────────────────────────────────────────────────────
export const mentorApi = {
  register: (data: Record<string, unknown>) =>
    request<Record<string, unknown>>("/app/mentor/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  login: (email: string, password: string) =>
    request<{ token: string; user: { id: number; fullName: string; email: string; role: string } }>("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }),
  getByEmail: (email: string) => request<Record<string, unknown>>(`/app/mentor/email/${encodeURIComponent(email)}`),
  getAll: () => request<Array<Record<string, unknown>>>("/app/mentor/all"),
  getAvailable: () => request<Array<Record<string, unknown>>>("/app/mentor/available"),
  getByCourse: (courseId: number) => request<Array<Record<string, unknown>>>(`/app/mentor/course/${courseId}`),
  assign: (mentorId: number, profileId: number) =>
    request<string>(`/app/mentor/assign?mentorId=${mentorId}&profileId=${profileId}`, { method: "POST" }),
  getStudents: (mentorId: number) => request<Array<Record<string, unknown>>>(`/app/mentor/students/${mentorId}`),
  updateAvailability: (mentorId: number, available: boolean) =>
    request<Record<string, unknown>>(`/app/mentor/availability/${mentorId}?available=${available}`, { method: "PUT" }),
  update: (mentorId: number, data: Record<string, unknown>) =>
    request<Record<string, unknown>>(`/app/mentor/${mentorId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
};

// ─── INGESTION (PivotPath: Upload resume/catalog to vector store) ─────────
export const ingestionApi = {
  uploadResume: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<string>("/api/ingestion/upload", {
      method: "POST",
      headers: getAuthHeaders(),
      body: formData,
    });
  },
  refreshCatalog: () =>
    request<string>("/api/ingestion/admin/refresh-catalog", { method: "POST" }),
};
