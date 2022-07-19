BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[Change] DROP CONSTRAINT [Change_orderId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[Change] DROP CONSTRAINT [Change_workerId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[Order] DROP CONSTRAINT [Order_orderStatusId_fkey];

-- AddForeignKey
ALTER TABLE [dbo].[Order] ADD CONSTRAINT [FK_Order_OrderStatus] FOREIGN KEY ([orderStatusId]) REFERENCES [dbo].[OrderStatus]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Change] ADD CONSTRAINT [FK_Change_Order] FOREIGN KEY ([orderId]) REFERENCES [dbo].[Order]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Change] ADD CONSTRAINT [FK_Change_Worker] FOREIGN KEY ([workerId]) REFERENCES [dbo].[Worker]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
