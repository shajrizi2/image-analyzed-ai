# AI Image Gallery

A web application where users can upload images, get automatic AI-generated tags and descriptions, and search through their images using text or find similar images.

## Features

- 🔐 **Authentication**: Supabase Auth with email/password
- 📸 **Image Upload**: Drag & drop with progress tracking
- 🤖 **AI Analysis**: Automatic tags, descriptions, and color extraction
- 🔍 **Smart Search**: Text search, similar images, and color filtering
- 📱 **Responsive Design**: Mobile-friendly interface
- 🔒 **Secure**: Row Level Security (RLS) for multi-tenant data

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: tRPC, Supabase
- **Database**: PostgreSQL (Supabase)
- **Storage**: Supabase Storage
- **AI Service**: OpenAI GPT-4 Vision API
- **State Management**: Zustand
- **Image Processing**: Sharp

## Prerequisites

- Node.js 18+ and pnpm
- Supabase account
- OpenAI API key (required for AI analysis)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd ai-image-gallery
pnpm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI API (Required for AI image analysis)
OPENAI_API_KEY=your_openai_api_key
```

### 3. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and keys
3. Run the SQL schema in your Supabase SQL editor:

```sql
-- Copy and paste the contents of database-schema.sql
```

4. Create a storage bucket named `images`:
   - Go to Storage in your Supabase dashboard
   - Create a new bucket called `images`
   - Set it to public if you want direct image access

### 4. OpenAI API Setup (Required)

1. Sign up at [OpenAI Platform](https://platform.openai.com)
2. Create an API key from the API keys section
3. Add it to your `.env.local` file

**Note**: The app will use mock data if no API key is provided, but AI analysis won't work.

### 5. Run the Application

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── gallery/           # Gallery page
│   ├── login/             # Login page
│   ├── signup/            # Signup page
│   └── utils/             # Utility functions
├── components/             # React components
├── server/                # tRPC server
│   └── api/               # tRPC routers
└── store/                 # Zustand stores
```

## API Keys Required

### Supabase (Required)

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key

### OpenAI (Required)

- `OPENAI_API_KEY`: Your OpenAI API key for GPT-4 Vision

## Architecture Decisions

### Why OpenAI GPT-4 Vision API?

After comparing multiple AI services, OpenAI GPT-4 Vision API was chosen because:

1. **Superior Quality**: Best-in-class natural language understanding and descriptions
2. **Complete Feature Set**: Provides all required features (tags, descriptions, colors) in one call
3. **Flexibility**: Customizable through prompt engineering for precise outputs
4. **Easy Integration**: Simple REST API with excellent documentation
5. **Reliable**: OpenAI's proven infrastructure with high availability

See `AI_SERVICE_COMPARISON.md` for detailed comparison.

### Database Design

- **images**: Stores image metadata and file paths
- **image_metadata**: Stores AI analysis results (tags, descriptions, colors)
- **Row Level Security**: Ensures users only see their own data
- **Indexes**: Optimized for search performance

### Security

- Row Level Security (RLS) policies on all tables
- User-specific file storage paths
- Protected routes with authentication guards
- Secure API key handling

## Development Status

- ✅ Authentication (login/signup)
- ✅ Protected routes
- ✅ Database schema with RLS
- ✅ AI service research and selection
- ✅ Image upload with progress tracking
- 🔄 Thumbnail generation (in progress)
- 🔄 AI processing integration
- 🔄 Search features
- 🔄 UI components
- 🔄 Error handling

## Potential Improvements

- [ ] Image download feature
- [ ] Tag editing capabilities
- [ ] Dark mode toggle
- [ ] Export search results as JSON
- [ ] Unit tests for core functions
- [ ] Image compression optimization
- [ ] Batch upload improvements
- [ ] Advanced similarity algorithms
- [ ] Image metadata editing
- [ ] Sharing functionality

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
