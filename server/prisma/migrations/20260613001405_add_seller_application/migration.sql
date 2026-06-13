-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "seller_applications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "store_name" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "experience" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewed_by" TEXT,
    "review_note" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seller_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "seller_applications_user_id_key" ON "seller_applications"("user_id");

-- AddForeignKey
ALTER TABLE "seller_applications" ADD CONSTRAINT "seller_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
