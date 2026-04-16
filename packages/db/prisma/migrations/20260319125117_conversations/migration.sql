-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('ARTIST', 'VENUE', 'MEDIA');

-- CreateTable
CREATE TABLE "media" (
    "_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "website" TEXT,
    "logoUrl" TEXT,
    "country" TEXT DEFAULT 'France',
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "conversation" (
    "_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversation_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "conversation_participant" (
    "_id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityType" "EntityType" NOT NULL,

    CONSTRAINT "conversation_participant_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "message" (
    "_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderType" "EntityType" NOT NULL,

    CONSTRAINT "message_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "_ArtistToMedia" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ArtistToMedia_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "conversation_participant_conversationId_entityId_entityType_key" ON "conversation_participant"("conversationId", "entityId", "entityType");

-- CreateIndex
CREATE INDEX "message_conversationId_idx" ON "message"("conversationId");

-- CreateIndex
CREATE INDEX "_ArtistToMedia_B_index" ON "_ArtistToMedia"("B");

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participant" ADD CONSTRAINT "conversation_participant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversation"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversation"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtistToMedia" ADD CONSTRAINT "_ArtistToMedia_A_fkey" FOREIGN KEY ("A") REFERENCES "artist"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtistToMedia" ADD CONSTRAINT "_ArtistToMedia_B_fkey" FOREIGN KEY ("B") REFERENCES "media"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
