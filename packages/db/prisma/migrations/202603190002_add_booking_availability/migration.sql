-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REFUSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AvailabilityOwnerType" AS ENUM ('ARTIST', 'VENUE');

-- CreateEnum
CREATE TYPE "SlotType" AS ENUM ('UNAVAILABLE', 'OPEN', 'BOOKED');

-- CreateTable
CREATE TABLE "booking" (
    "_id" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "proposedDate" TIMESTAMP(3) NOT NULL,
    "proposedFee" INTEGER,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "initialMessage" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "availability_slot" (
    "_id" TEXT NOT NULL,
    "ownerType" "AvailabilityOwnerType" NOT NULL,
    "ownerId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "type" "SlotType" NOT NULL,
    "bookingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "availability_slot_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE INDEX "availability_slot_ownerType_ownerId_idx" ON "availability_slot"("ownerType", "ownerId");

-- CreateIndex
CREATE INDEX "availability_slot_ownerType_ownerId_startDate_endDate_idx" ON "availability_slot"("ownerType", "ownerId", "startDate", "endDate");

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "artist"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venue"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability_slot" ADD CONSTRAINT "availability_slot_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "booking"("_id") ON DELETE SET NULL ON UPDATE CASCADE;
