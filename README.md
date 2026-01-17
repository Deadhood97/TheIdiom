# The Idiom 🌍

**The Archive of Human Thought.**
An immersive exploration of idioms, proverbs, and metaphors from around the world, visualized on a vintage map and generated on-demand by AI.

## ✨ Features

- **Global Idiom Map**: Interactive vintage-style map visualizing the geographic origin of idioms.
- **On-Demand Generation**: Create new idioms for any concept in *any* language using OpenAI (GPT-4o).
- **High-Fidelity Audio**: Native-grade pronunciation and English transliteration generated via OpenAI TTS.
- **Linguistic Depth**: Detailed breakdowns including Literal Translation, Cultural Context, and Origin Stories.
- **Vote & Resonance**: Community-driven validation system ("Resonates with me" / "Accurate").
- **Cloud Native**:
    - **Backend**: Serverless Node.js on AWS Lambda.
    - **Database**: PostgreSQL on NeonDB.
    - **Storage**: AWS S3 for audio assets.
    - **Frontend**: React (Vite) hosted on GitHub Pages.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Framer Motion, Leaflet.
- **Backend Service**: Node.js, Express, `serverless-http`.
- **Infrastructure**: AWS Lambda (Compute), AWS S3 (Storage).
- **Database**: Neon (Serverless PostgreSQL).
- **AI Integration**: OpenAI API (GPT-4o for logic, TTS-1 for audio).

## 🚀 Deployment

### 1. Backend (AWS Lambda)
The backend is stateless and deployed as a Lambda function.

1.  **Build**: `npm install --omit=dev` then zip `server/`, `node_modules/`, `package.json`.
2.  **Upload**: Upload zip to AWS Lambda (`nodejs20.x`).
3.  **Config**: Set Handler to `server/lambda.handler`.
4.  **Env Vars**:
    - `DATABASE_URL`: Connection string for NeonDB.
    - `OPENAI_API_KEY`: Your OpenAI Key.
    - `USE_S3`: `true`
    - `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME`.
5.  **Expose**: Create a **Function URL** (Auth: NONE).

### 2. Frontend (GitHub Pages)
The frontend is built and deployed via GitHub Actions.

1.  **Variable**: Set `VITE_API_URL` in GitHub Repository Secrets/Variables to your Lambda Function URL.
2.  **Push**: Pushing to `main` triggers the workflow defined in `.github/workflows/deploy.yml`.

## 📦 Project Structure

- `src/` - React Frontend code.
- `server/` - Node.js Backend & API logic.
- `server/services/s3Service.js` - AWS S3 integration.
- `_backup/` - Legacy scripts and data files.
- `.github/workflows/` - CI/CD pipeline.

## 📜 License

MIT
