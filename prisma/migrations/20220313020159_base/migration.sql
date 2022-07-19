BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Category] (
    [id] INT NOT NULL IDENTITY(1,1),
    [categoryName] VARCHAR(255) NOT NULL,
    [categoryDescription] VARCHAR(255) NOT NULL,
    CONSTRAINT [PK_Category] PRIMARY KEY ([id]),
    CONSTRAINT [Category_categoryName_key] UNIQUE ([categoryName])
);

-- CreateTable
CREATE TABLE [dbo].[Customer] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] VARCHAR(255) NOT NULL,
    [street] VARCHAR(255) NOT NULL,
    [town] VARCHAR(255) NOT NULL,
    [postCode] NVARCHAR(6) NOT NULL,
    [email] VARCHAR(255) NOT NULL,
    [telephone] VARCHAR(255) NOT NULL,
    [password] VARCHAR(255) NOT NULL,
    CONSTRAINT [PK_Customer] PRIMARY KEY ([id]),
    CONSTRAINT [UK_email] UNIQUE ([email]),
    CONSTRAINT [UK_telephone] UNIQUE ([telephone])
);

-- CreateTable
CREATE TABLE [dbo].[Order] (
    [id] INT NOT NULL IDENTITY(1,1),
    [customerId] INT NOT NULL,
    [comment] VARCHAR(255),
    [totalPrice] MONEY NOT NULL,
    [date] DATETIME NOT NULL,
    [workerId] INT,
    [orderStatusId] INT NOT NULL,
    CONSTRAINT [PK_Order] PRIMARY KEY ([id])
);

-- CreateTable
CREATE TABLE [dbo].[OrderProducts] (
    [id] INT NOT NULL IDENTITY(1,1),
    [orderId] INT NOT NULL,
    [productId] INT NOT NULL,
    [productQuantity] INT NOT NULL,
    CONSTRAINT [PK_OrderProducts] PRIMARY KEY ([id])
);

-- CreateTable
CREATE TABLE [dbo].[OrderStatus] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] VARCHAR(255) NOT NULL,
    CONSTRAINT [OrderStatus_pkey] PRIMARY KEY ([id]),
    CONSTRAINT [OrderStatus_name_key] UNIQUE ([name])
);

-- CreateTable
CREATE TABLE [dbo].[Product] (
    [id] INT NOT NULL IDENTITY(1,1),
    [categoryId] INT NOT NULL,
    [productName] VARCHAR(255) NOT NULL,
    [productPrice] MONEY NOT NULL,
    [productDescription] VARCHAR(255) NOT NULL,
    CONSTRAINT [PK_Product] PRIMARY KEY ([id]),
    CONSTRAINT [Product_productName_key] UNIQUE ([productName])
);

-- CreateTable
CREATE TABLE [dbo].[Session] (
    [id] NVARCHAR(1000) NOT NULL,
    [sid] NVARCHAR(1000) NOT NULL,
    [data] NVARCHAR(1000) NOT NULL,
    [expiresAt] DATETIME2 NOT NULL,
    CONSTRAINT [Session_pkey] PRIMARY KEY ([id]),
    CONSTRAINT [Session_sid_key] UNIQUE ([sid])
);

-- CreateTable
CREATE TABLE [dbo].[sysdiagrams] (
    [name] NVARCHAR(128) NOT NULL,
    [principal_id] INT NOT NULL,
    [diagram_id] INT NOT NULL IDENTITY(1,1),
    [version] INT,
    [definition] VARBINARY(max),
    CONSTRAINT [PK__sysdiagr__C2B05B613C791543] PRIMARY KEY ([diagram_id]),
    CONSTRAINT [UK_principal_name] UNIQUE ([principal_id],[name])
);

-- CreateTable
CREATE TABLE [dbo].[Worker] (
    [id] INT NOT NULL IDENTITY(1,1),
    [username] VARCHAR(255) NOT NULL,
    [password] VARCHAR(255) NOT NULL,
    [name] VARCHAR(255) NOT NULL,
    [canEditMenu] BIT NOT NULL,
    [canEditWorkers] BIT NOT NULL,
    [isActive] BIT NOT NULL,
    [isAdmin] BIT NOT NULL,
    CONSTRAINT [PK_Worker] PRIMARY KEY ([id]),
    CONSTRAINT [Worker_username_key] UNIQUE ([username])
);

-- AddForeignKey
ALTER TABLE [dbo].[Order] ADD CONSTRAINT [FK_Order_Customer] FOREIGN KEY ([customerId]) REFERENCES [dbo].[Customer]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Order] ADD CONSTRAINT [Order_orderStatusId_fkey] FOREIGN KEY ([orderStatusId]) REFERENCES [dbo].[OrderStatus]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Order] ADD CONSTRAINT [FK_Order_Worker] FOREIGN KEY ([workerId]) REFERENCES [dbo].[Worker]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[OrderProducts] ADD CONSTRAINT [FK_OrderProducts_Order] FOREIGN KEY ([orderId]) REFERENCES [dbo].[Order]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[OrderProducts] ADD CONSTRAINT [FK_OrderProducts_Product] FOREIGN KEY ([productId]) REFERENCES [dbo].[Product]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Product] ADD CONSTRAINT [FK_Product_Category] FOREIGN KEY ([categoryId]) REFERENCES [dbo].[Category]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
