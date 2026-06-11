-- CreateTable
CREATE TABLE "public"."media" (
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

-- CreateTable (implicit many-to-many Artist <-> Media)
CREATE TABLE "public"."_ArtistToMedia" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ArtistToMedia_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ArtistToMedia_B_index" ON "public"."_ArtistToMedia"("B" ASC);

-- AddForeignKey
ALTER TABLE "public"."media" ADD CONSTRAINT "media_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_ArtistToMedia" ADD CONSTRAINT "_ArtistToMedia_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."artist"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_ArtistToMedia" ADD CONSTRAINT "_ArtistToMedia_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."media"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
