# CareerXpert — AI-Powered Career Mentor

CareerXpert is a full-stack AI-driven career mentoring platform built for the **HCLTech Hackathon**. It combines a **React + Vite** frontend with a **Spring Boot 3** backend powered by **Google Gemini AI**, **Spring AI**, **MySQL**, and **WebSockets**.

---

## 📁 Project Structure

```
HCLTech_Hackathon/
├── AiPoweredCareerMentor/   # Spring Boot backend
└── CareerXpert_Frontend/    # React + Vite + TypeScript frontend
```

---

## 🛠️ Prerequisites

Make sure the following are installed on your machine:

| Tool | Version |
|------|---------|
| Java (JDK) | 21+ |
| Maven | 3.8+ (or use included `mvnw`) |
| Node.js | 18+ |
| npm | 9+ |
| MySQL | 8.0+ |

---

## ⚙️ Backend Setup — Spring Boot

### 1. Create the MySQL Database

Open your MySQL client and run:

```sql
CREATE DATABASE careerxpert;
```

### 2. Configure `application.properties`

Navigate to `AiPoweredCareerMentor/src/main/resources/application.properties` and update the following values as needed:

```properties
# Server
server.port=2030

# Database
spring.datasource.url=jdbc:mysql://localhost:3306/careerxpert
spring.datasource.username=root
spring.datasource.password=root

# Google Gemini AI (via OpenAI-compatible endpoint)
spring.ai.openai.api-key=YOUR_GEMINI_API_KEY
spring.ai.openai.base-url=https://generativelanguage.googleapis.com/v1beta/openai
spring.ai.openai.chat.options.model=gemini-2.5-flash

# Twilio (SMS/OTP)
twilio.account-sid=YOUR_TWILIO_ACCOUNT_SID
twilio.auth-token=YOUR_TWILIO_AUTH_TOKEN
twilio.phone-number=YOUR_TWILIO_PHONE_NUMBER

# News API
news.api.key=YOUR_NEWS_API_KEY
```

> **Note:** Never commit real API keys to version control. Use environment variables or a `.env` file in production.

### 3. Run the Backend

From the `AiPoweredCareerMentor/` directory:

**Using Maven Wrapper (recommended):**
```bash
cd AiPoweredCareerMentor
./mvnw spring-boot:run
```

**On Windows:**
```cmd
cd AiPoweredCareerMentor
mvnw.cmd spring-boot:run
```

**Using system Maven:**
```bash
cd AiPoweredCareerMentor
mvn spring-boot:run
```

The backend will start at **http://localhost:2030**

**Swagger API Docs:** http://localhost:2030/swagger-ui/index.html

---

## 🎨 Frontend Setup — React + Vite

### 1. Install Dependencies

```bash
cd CareerXpert_Frontend
npm install
```

### 2. Configure API Base URL

The frontend communicates with the backend at `http://localhost:2030`. If you change the backend port, update it in:

```
CareerXpert_Frontend/src/lib/api.ts
```

### 3. Run the Development Server

```bash
cd CareerXpert_Frontend
npm run dev
```

The frontend will be available at **http://localhost:8080** (or the port shown in your terminal).

---

## 🚀 Running the Full Stack

Open **two terminal windows** and run both services simultaneously:

**Terminal 1 — Backend:**
```bash
cd AiPoweredCareerMentor
./mvnw spring-boot:run
```

**Terminal 2 — Frontend:**
```bash
cd CareerXpert_Frontend
npm run dev
```

Then open your browser at **http://localhost:8080**

---

## 📦 Building for Production

### Backend
```bash
cd AiPoweredCareerMentor
./mvnw clean package -DskipTests
java -jar target/AiPoweredCareerMentor-0.0.1-SNAPSHOT.jar
```

### Frontend
```bash
cd CareerXpert_Frontend
npm run build
```

The production build will be output to `CareerXpert_Frontend/dist/`.

---

## 🧪 Running Tests

### Backend Tests
```bash
cd AiPoweredCareerMentor
./mvnw test
```

### Frontend Tests
```bash
cd CareerXpert_Frontend
npm run test
```

---

## 🔑 Key Technologies

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui |
| State Management | TanStack Query, React Hook Form |
| Real-time | STOMP over WebSocket (SockJS) |
| Backend | Spring Boot 3.5, Spring AI 1.0, Spring Security |
| AI Model | Google Gemini 2.5 Flash (via OpenAI-compatible API) |
| Database | MySQL 8, Spring Data JPA / Hibernate |
| Auth | JWT (jjwt), Email & Twilio OTP Verification |
| Docs | SpringDoc OpenAPI (Swagger UI) |
| Resume Parsing | Apache PDFBox, Apache POI |

---

## 📌 Common Issues

**Port already in use:**
Change `server.port` in `application.properties` for the backend, or pass a `--port` flag to Vite for the frontend.

**Database connection failed:**
Ensure MySQL is running and the credentials in `application.properties` match your local setup.

**CORS errors:**
The backend is pre-configured to allow requests from the frontend. If you change the frontend port, update the CORS configuration in the backend.

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request
