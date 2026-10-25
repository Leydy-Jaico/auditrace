CREATE SCHEMA IF NOT EXISTS "auditrace";
CREATE TABLE "auditrace"."Session" (
  "code" TEXT NOT NULL,
  "snapshot" JSONB NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Session_pkey" PRIMARY KEY ("code")
);
REVOKE ALL ON SCHEMA "auditrace" FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA "auditrace" FROM PUBLIC;
