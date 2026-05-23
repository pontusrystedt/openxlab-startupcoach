-- Enums
CREATE TYPE "Role" AS ENUM ('COACH', 'ENTREPRENEUR');
CREATE TYPE "SessionPhase" AS ENUM ('SOCIAL', 'IRL_CHECK', 'COACHING', 'PRIORITIZATION', 'CLOSING');
CREATE TYPE "FundingStatus" AS ENUM ('PLANNED', 'ACTIVE', 'CLOSED', 'NOT_DEFINED');

-- Startup
CREATE TABLE "Startup" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "sector" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Startup_pkey" PRIMARY KEY ("id")
);

-- User
CREATE TABLE "User" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "Role" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "startupId" TEXT,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Session
CREATE TABLE "Session" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "sessionNumber" INTEGER NOT NULL,
  "scheduledAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),
  "durationMin" INTEGER,
  "phase" "SessionPhase" NOT NULL DEFAULT 'COACHING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "startupId" TEXT NOT NULL,
  CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- Transcript
CREATE TABLE "Transcript" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "klangFileId" TEXT NOT NULL,
  "encryptedText" TEXT NOT NULL,
  "iv" TEXT NOT NULL,
  "authTag" TEXT NOT NULL,
  "durationSeconds" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sessionId" TEXT NOT NULL,
  CONSTRAINT "Transcript_pkey" PRIMARY KEY ("id")
);

-- SessionSummary
CREATE TABLE "SessionSummary" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "encryptedData" TEXT NOT NULL,
  "iv" TEXT NOT NULL,
  "authTag" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sessionId" TEXT NOT NULL,
  CONSTRAINT "SessionSummary_pkey" PRIMARY KEY ("id")
);

-- Todo
CREATE TABLE "Todo" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "text" TEXT NOT NULL,
  "priority" INTEGER NOT NULL,
  "agentSource" TEXT,
  "dueDate" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sessionId" TEXT NOT NULL,
  CONSTRAINT "Todo_pkey" PRIMARY KEY ("id")
);

-- TodoFeedback
CREATE TABLE "TodoFeedback" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "stars" INTEGER,
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "todoId" TEXT NOT NULL,
  CONSTRAINT "TodoFeedback_pkey" PRIMARY KEY ("id")
);

-- IrlProfile
CREATE TABLE "IrlProfile" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "crl" INTEGER NOT NULL,
  "trl" INTEGER NOT NULL,
  "brl" INTEGER NOT NULL,
  "iprl" INTEGER NOT NULL,
  "frl" INTEGER NOT NULL,
  "orl" INTEGER NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "startupId" TEXT NOT NULL,
  CONSTRAINT "IrlProfile_pkey" PRIMARY KEY ("id")
);

-- FundingRound
CREATE TABLE "FundingRound" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "quarter" TEXT NOT NULL,
  "amountSek" INTEGER,
  "roundType" TEXT,
  "status" "FundingStatus" NOT NULL DEFAULT 'PLANNED',
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "startupId" TEXT NOT NULL,
  CONSTRAINT "FundingRound_pkey" PRIMARY KEY ("id")
);

-- AgentLog
CREATE TABLE "AgentLog" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "agentName" TEXT NOT NULL,
  "agentVersion" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "inputHash" TEXT NOT NULL,
  "outputHash" TEXT NOT NULL,
  "latencyMs" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AgentLog_pkey" PRIMARY KEY ("id")
);

-- Unique constraints
ALTER TABLE "User" ADD CONSTRAINT "User_email_key" UNIQUE ("email");
ALTER TABLE "Transcript" ADD CONSTRAINT "Transcript_klangFileId_key" UNIQUE ("klangFileId");
ALTER TABLE "Transcript" ADD CONSTRAINT "Transcript_sessionId_key" UNIQUE ("sessionId");
ALTER TABLE "SessionSummary" ADD CONSTRAINT "SessionSummary_sessionId_key" UNIQUE ("sessionId");
ALTER TABLE "TodoFeedback" ADD CONSTRAINT "TodoFeedback_todoId_key" UNIQUE ("todoId");
ALTER TABLE "FundingRound" ADD CONSTRAINT "FundingRound_startupId_key" UNIQUE ("startupId");

-- Foreign keys
ALTER TABLE "User" ADD CONSTRAINT "User_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "Startup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "Startup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Transcript" ADD CONSTRAINT "Transcript_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SessionSummary" ADD CONSTRAINT "SessionSummary_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Todo" ADD CONSTRAINT "Todo_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TodoFeedback" ADD CONSTRAINT "TodoFeedback_todoId_fkey" FOREIGN KEY ("todoId") REFERENCES "Todo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "IrlProfile" ADD CONSTRAINT "IrlProfile_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "Startup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FundingRound" ADD CONSTRAINT "FundingRound_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "Startup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Indexes
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "Session_startupId_idx" ON "Session"("startupId");
CREATE INDEX "Transcript_klangFileId_idx" ON "Transcript"("klangFileId");
CREATE INDEX "Todo_sessionId_idx" ON "Todo"("sessionId");
CREATE INDEX "IrlProfile_startupId_idx" ON "IrlProfile"("startupId");
CREATE INDEX "AgentLog_sessionId_idx" ON "AgentLog"("sessionId");
CREATE INDEX "AgentLog_agentName_agentVersion_idx" ON "AgentLog"("agentName", "agentVersion");
