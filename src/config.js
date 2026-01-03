import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  databaseUrl: process.env.DATABASE_URL,
  llmProvider: process.env.LLM_PROVIDER || 'none',
  openaiApiKey: process.env.OPENAI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
};

export default config;
