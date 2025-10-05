# AI Image Gallery

A full-stack web application where users can upload images, get automatic AI-generated tags and descriptions, and search through their images using text or find similar images.

## Features

- 🔐 **Authentication**: Supabase Auth with email/password
- 📸 **Image Upload**: Drag & drop multiple images with real-time progress tracking
- 🤖 **AI Analysis**: Automatic tags, descriptions, and color extraction using OpenAI GPT-4 Vision
- 🔍 **Smart Search**: Text search by tags/description, similar image detection, color-based filtering
- 📱 **Responsive Design**: Mobile-first, fully responsive interface
- 🔒 **Secure**: Row Level Security (RLS) for multi-tenant data isolation
- 🎨 **Modern UI**: Clean interface with loading states, toasts, and smooth interactions

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: tRPC (type-safe APIs), Next.js API Routes
- **Database**: PostgreSQL via Supabase
- **Storage**: Supabase Storage
- **Authentication**: Supabase Auth
- **AI Service**: OpenAI GPT-4 Vision API
- **State Management**: Zustand
- **Image Processing**: Sharp (thumbnails)

---

## Setup Instructions

### Prerequisites

- Node.js 18+ and pnpm
- Supabase account ([supabase.com](https://supabase.com))
- OpenAI API key ([platform.openai.com](https://platform.openai.com))

### 1. Clone Repository

```bash
git clone <your-repo-url>
cd ai-image-gallery
pnpm install
```

### 2. Environment Setup

Create `.env.local` in the root directory:

```env
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI API (Required for AI image analysis)
OPENAI_API_KEY=your_openai_api_key
```

### 3. Supabase Database Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Navigate to **Settings > API** to get your URL and keys
3. Go to **SQL Editor** and run:

```sql
-- Copy and paste the entire contents of database-schema.sql
-- This creates tables, RLS policies, and indexes
```

4. Create storage bucket:
   - Go to **Storage** in Supabase dashboard
   - Create new public bucket named `images`
   - Enable public access for direct image URLs

### 4. OpenAI API Key

1. Sign up at [OpenAI Platform](https://platform.openai.com)
2. Navigate to **API keys** section
3. Create new secret key
4. Add to `.env.local`

### 5. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## API Keys Needed

| Service | Key | Purpose | Required |
|---------|-----|---------|----------|
| Supabase | `NEXT_PUBLIC_SUPABASE_URL` | Project URL | ✅ |
| Supabase | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public API key | ✅ |
| Supabase | `SUPABASE_SERVICE_ROLE_KEY` | Admin operations | ✅ |
| OpenAI | `OPENAI_API_KEY` | GPT-4 Vision API | ✅ |

---

## Architecture Decisions

### Frontend Architecture

- **Next.js 15 App Router**: Modern React framework with server components
- **tRPC**: End-to-end type safety between client and server
- **TypeScript**: Full type safety across the entire codebase
- **Zustand**: Lightweight state management (auth, gallery state)
- **Tailwind CSS**: Utility-first styling for rapid development

### Backend Architecture

- **tRPC Routers**: Type-safe API layer with three main routers:
  - `upload`: Image upload, deletion, metadata updates
  - `metadata`: Fetch images, find similar images
  - `search`: Text search, color filtering
- **Supabase**: PostgreSQL database with built-in auth and storage
- **Row Level Security (RLS)**: Database-level security ensuring users only access their own data

### Database Schema

```
images
├── id (primary key)
├── user_id (foreign key → auth.users)
├── filename
├── original_path
├── thumbnail_path
└── uploaded_at

image_metadata
├── id (primary key)
├── image_id (foreign key → images)
├── user_id (foreign key → auth.users)
├── description (AI-generated)
├── tags[] (AI-generated array)
├── colors[] (AI-extracted hex codes)
├── ai_processing_status
└── created_at
```

**RLS Policies**: Both tables have policies ensuring `auth.uid() = user_id`

### AI Service Selection

**Chosen: OpenAI GPT-4 Vision API**

After evaluating multiple AI services (Google Cloud Vision, Azure Computer Vision, AWS Rekognition), OpenAI GPT-4 Vision was selected for:

1. ✅ **Superior Quality**: Best natural language descriptions
2. ✅ **All-in-One**: Tags, descriptions, and colors in a single API call
3. ✅ **Flexibility**: Customizable via prompt engineering
4. ✅ **Easy Integration**: Simple REST API, excellent docs
5. ✅ **Proven Reliability**: High availability infrastructure

**Why not Azure?** Azure Computer Vision was considered but couldn't be implemented due to account setup/verification issues during development.

📄 **[Read full AI service comparison →](./AI_SERVICE_COMPARISON.md)**

### Image Processing Flow

1. User uploads image(s) via drag & drop
2. Frontend uploads to Supabase Storage
3. Server generates 300x300 thumbnail using Sharp
4. Database record created with "processing" status
5. OpenAI API called asynchronously for analysis
6. Metadata (tags, description, colors) stored in database
7. Status updated to "completed"

### Search Implementation

- **Text Search**: Case-insensitive partial matching on tags and descriptions
- **Color Filter**: RGB distance algorithm finds similar colors (threshold: 50)
- **Similar Images**: Array overlap matching on tags + color similarity

---

## Project Structure

```
ai-image-gallery/
├── src/
│   ├── app/
│   │   ├── api/               # Next.js API routes
│   │   │   ├── process-image/ # AI analysis endpoint
│   │   │   ├── generate-thumbnail/
│   │   │   └── trpc/         # tRPC handler
│   │   ├── gallery/          # Main gallery page
│   │   ├── login/            # Login page
│   │   ├── signup/           # Signup page
│   │   └── layout.tsx        # Root layout
│   ├── components/           # React components
│   │   ├── ImageUpload.tsx   # Drag & drop upload
│   │   ├── ImageModal.tsx    # Image detail modal
│   │   ├── SearchBar.tsx     # Search & filter UI
│   │   ├── ProtectedRoute.tsx
│   │   └── ToastContainer.tsx
│   ├── server/api/           # tRPC backend
│   │   ├── routers/
│   │   │   ├── upload.ts     # Upload logic
│   │   │   ├── metadata.ts   # Fetch & similar images
│   │   │   └── search.ts     # Search & filter
│   │   ├── trpc.ts           # tRPC configuration
│   │   └── context.ts        # Request context
│   ├── store/                # Zustand stores
│   │   ├── authStore.ts      # Auth state
│   │   └── galleryStore.ts   # Gallery state
│   ├── types/
│   │   └── index.ts          # TypeScript types
│   └── utils/                # Utilities
│       ├── trpc.ts           # tRPC client
│       └── supaBaseClient.ts
├── public/                   # Static assets
├── database-schema.sql       # Database schema
└── AI_SERVICE_COMPARISON.md  # Detailed AI comparison
```

---

## Features in Detail

### Authentication
- Email/password signup and login
- Protected routes with authentication guards
- User session management via Supabase Auth
- Automatic redirection for unauthenticated users

### Image Upload
- Drag & drop or click to select
- Multiple file upload support
- Real-time progress bars (0-100%)
- JPEG/PNG format support
- Automatic thumbnail generation (300x300)
- Upload status indicators

### AI Analysis
- Automatic processing after upload
- Generates 5-10 relevant tags
- Creates descriptive sentence
- Extracts top 3 dominant colors (hex codes)
- Background processing (non-blocking)
- Processing status indicators

### Search & Discovery
- **Text Search**: Find images by tags or description keywords
- **Color Filter**: Select color to find similar-colored images
- **Find Similar**: Discover images with similar tags/colors
- Real-time results without page refresh
- Clear search button to reset filters

### Gallery UI
- Responsive grid layout (2-5 columns based on screen size)
- Click image to view full details in modal
- Delete confirmation before removing images
- Pagination (20 images per page)
- Latest upload preview card with AI summary
- Help messages for user guidance

---

## Security

- ✅ **Row Level Security (RLS)**: Database-level isolation
- ✅ **Protected Routes**: Authentication required for gallery
- ✅ **Environment Variables**: Secure API key storage
- ✅ **User-Scoped Storage**: Files organized by user_id
- ✅ **Input Validation**: File type and size checks

---

## Potential Improvements

- [ ] Unit tests for components and API routes
- [ ] E2E tests with Playwright
- [ ] Tag editing capabilities
- [ ] Bulk image operations
- [ ] Dark mode toggle
- [ ] Export search results as JSON
- [ ] Image compression optimization
- [ ] Advanced vector similarity search
- [ ] Sharing functionality
- [ ] Deployment to Vercel/Railway

---

## License

MIT License
