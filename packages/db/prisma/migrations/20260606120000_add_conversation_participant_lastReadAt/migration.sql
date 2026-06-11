-- Add lastReadAt to conversation_participant for unread badge logic
ALTER TABLE "conversation_participant"
ADD COLUMN "lastReadAt" timestamp;
