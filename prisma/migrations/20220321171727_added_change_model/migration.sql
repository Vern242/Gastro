/*
  Warnings:

  - You are about to drop the column `workerId` on the `Order` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[Order] DROP CONSTRAINT [FK_Order_Worker];

-- AlterTable
ALTER TABLE [dbo].[Order] DROP COLUMN [workerId];
ALTER TABLE [dbo].[Order] ADD [changeId] INT;

-- CreateTable
CREATE TABLE [dbo].[Change] (
    [id] INT NOT NULL IDENTITY(1,1),
    [orderId] INT NOT NULL,
    [workerId] INT NOT NULL,
    CONSTRAINT [Change_pkey] PRIMARY KEY ([id]),
    CONSTRAINT [Change_orderId_key] UNIQUE ([orderId])
);

-- AddForeignKey
ALTER TABLE [dbo].[Change] ADD CONSTRAINT [Change_orderId_fkey] FOREIGN KEY ([orderId]) REFERENCES [dbo].[Order]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Change] ADD CONSTRAINT [Change_workerId_fkey] FOREIGN KEY ([workerId]) REFERENCES [dbo].[Worker]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
