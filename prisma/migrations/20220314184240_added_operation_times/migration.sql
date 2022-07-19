BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[OperationTimes] (
    [id] INT NOT NULL IDENTITY(1,1),
    [day] VARCHAR(255) NOT NULL,
    [start] TIME NOT NULL,
    [end] TIME NOT NULL,
    CONSTRAINT [OperationTimes_pkey] PRIMARY KEY ([id]),
    CONSTRAINT [OperationTimes_day_key] UNIQUE ([day])
);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
