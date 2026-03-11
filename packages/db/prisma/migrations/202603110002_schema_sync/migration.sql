-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('FIXED_FEE', 'PERCENTAGE', 'HAT', 'NEGOTIABLE');

-- AlterTable
ALTER TABLE "artist" ADD COLUMN     "city" TEXT,
ADD COLUMN     "isNegotiable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "postalCode" TEXT;

-- AlterTable
ALTER TABLE "venue" ADD COLUMN     "budgetMax" INTEGER,
ADD COLUMN     "budgetMin" INTEGER,
ADD COLUMN     "paymentTypes" "PaymentType"[] DEFAULT ARRAY[]::"PaymentType"[];

