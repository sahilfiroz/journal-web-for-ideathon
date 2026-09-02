# Lumina — Mindful Journaling & AI Sanctuary

A serene, distraction-free journaling sanctuary featuring public community journals, private linewise chronological journal archives with calendar date picking, photo keepsakes, verified daily writing streaks, ambient procedural soundscapes, and Lumina AI assistance powered by Gemini with Firebase Firestore synchronization.

---

## 🌟 Comprehensive Feature Set

1. **Dual Top Assistant Section**:
   - **Lumina AI Companion**: A dedicated conversational AI prompt bar with quick reflection triggers to help articulate thoughts and generate journal prompts.
   - **Add Story (Journals) Quick Entry**: Fast linewise journal drafting with mood selection, today's date badge, guest protection, and 1-click expansion to the full rich editor.

2. **Public Community Feed & Full-Screen Reader**:
   - Real-time Firestore synchronization of shared community posts.
   - Optimistic interactions for likes, resonance reflections, and shareable link copying.
   - Full-Screen reading mode with dedicated "Upload Journal" modal supporting custom mood, tags, and location.

3. **Private Linewise Journal Archive & Live Streak**:
   - Chronological sequence displaying *Today*, *Yesterday*, *Day Before Yesterday*, and *3 Days Ago* connected by an organic visual timeline.
   - **Live Streak Tracking**: Accurately calculated from consecutive daily journal entries recorded in My Journals.
   - **Interactive Archive Calendar Widget**: Month navigation, date filtering, entry indicator dots, and direct journal creation for any selected historical or future date.
   - Rich reading modal with photo keepsakes and AI insight banners.

4. **Rich Journal Paper Canvas**:
   - Natural light aesthetic (`#FAF8F5` canvas, newsreader serif typography, soft sage green accents).
   - Zen Distraction-Free Focus Mode.
   - Photo attachment polaroid grid supporting drag-and-drop, file upload, paste, 90° rotation, and 5 vintage/warm/noir filters.
   - AI assistant dropdown: Mindful insight generation, poetic title creation, and prose refinement.

5. **Sanctuary Utilities**:
   - **Web Audio Ambient Soundscapes**: Procedural sound synthesis engine for Gentle Rain, Ocean Tide, Forest Wind, Crackling Fireplace, and Cozy Cafe.
   - **Multi-Device Cloud Sync & Backup**: Passkey-based cloud sync, local storage backup, and JSON / Markdown export/import.
   - **Mindful Writing Sparks**: AI-generated prompts customized to the user's emotional state.
   - **Pencil Graphite Shading Trail**: Smooth trailing graphite particles following mouse cursor with zero event blocking.

---

## 🛡️ Agentic Threat Modeling & Security Architecture

| Threat Zone | Threat Scenario | Countermeasure & Implementation |
| :--- | :--- | :--- |
| **Input Surfaces** | Untrusted user input / XSS injection in journal bodies, titles, or tags | Strict schema validation, parameterization, and React automatic HTML escaping. |
| **Planning & Reasoning** | Prompt injection via untrusted inputs to AI endpoints | System prompt boundary encapsulation with clear instruction delimiters; treating user reflection text strictly as passive data. |
| **Tool / Execution** | Unauthorized API calls / SSRF / Key leakage | All Gemini AI calls proxied strictly server-side via `/api/gemini/*` endpoints; zero client-side API key exposure. |
| **Memory & State** | Firestore data pollution or cross-user unauthorized access | Strict undefined-stripping (`sanitizePayload`) and owner-bound Firestore security rules (`request.auth.uid == userId`). |
| **Inter-System Communication** | Upstream Gemini API outages or rate limits (`429`/`503`) | Automated fallback ladder (`gemini-3.6-flash` → `gemini-3.1-flash-lite` → `gemini-flash-latest` → `gemini-3.7-flash`) with error resilience. |

---

## 🔒 Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profile and private journal isolation
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /journals/{journalId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }

    // Public community posts
    match /public_posts/{postId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if request.auth != null && resource.data.authorId == request.auth.uid;
    }
  }
}
```

---

## 🚀 Cloud Run Deployment & Configuration

### 1. Prerequisites
- Google Cloud SDK (`gcloud` CLI) installed and authenticated.
- Enable required Google Cloud APIs:
  ```bash
  gcloud services enable run.googleapis.com secretmanager.googleapis.com firestore.googleapis.com
  ```

### 2. Secret Management Setup
Store your Gemini API key in Google Cloud Secret Manager:
```bash
# Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# Grant the Cloud Run service account access to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 3. Build & Deploy to Cloud Run
```bash
# Build and deploy container to Cloud Run
gcloud run deploy lumina-sanctuary \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --port 3000
```

### 4. Challenge Verification Binding
```bash
gcloud run services update lumina-sanctuary \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 🧪 Functional Walkthrough & Test Guide

Every user interaction has been tested for functional stability:

1. **Authentication & Guest Mode**:
   - Test login with email/password, or click "Explore as Guest".
   - *Expected Result*: Successful authentication stores user profile and transitions directly to Sanctuary Dashboard.

2. **Top AI Assistant & Quick Journal Entry**:
   - Type a prompt in "What happened today..." (e.g. "I had a great morning walk") and press Send.
   - *Expected Result*: Opens Lumina AI Chat with reflection suggestions and 1-click journal synthesis card.
   - In "Add Story (journals)", enter a quick reflection, pick a mood, and click "Save Story".
   - *Expected Result*: Story instantly appears in the linewise sequence on the right with a "Saved!" confirmation and updates the streak.

3. **Linewise Sequence, Reading View & Calendar**:
   - View the chronological cards (*Today*, *Yesterday*, *Day Before Yesterday*, *3 Days Ago*).
   - Click "Read" or the card title to open the full reading modal.
   - In the Calendar widget, navigate months and click any day to filter entries or create a journal for that specific date.

4. **Rich Journal Canvas & Photo Keepsakes**:
   - Click "New Journal" → Add title, narrative, mood, weather, tags.
   - Upload or paste photos → Test 90° rotation, vintage/warm/noir filters, and handwritten captions.
   - Click "AI Lumina" → "Add Mindful AI Insight" or "Suggest Poetic Title".
   - Click "Save Entry" → Confetti animates and entry persists to Firestore & local storage.

5. **Public Community Feed**:
   - Click the heart icon to like, sparkle icon to resonate, or share icon to copy link.
   - Click "Upload Journal" to publish a community post.
   - Click the fullscreen icon to enter distraction-free community reading.

6. **Sanctuary Utilities (Navbar)**:
   - Click "Sounds" to toggle ambient procedural soundscapes (Rain, Ocean, Forest, Fireplace, Cafe) with volume controls.
   - Click "Sparks" to open AI-tailored writing prompts for your current emotional state.
   - Click "Cloud Vault" to manage passkeys, export JSON/Markdown archives, or restore backups.
