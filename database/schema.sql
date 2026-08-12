CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

START TRANSACTION;

CREATE TABLE "AssetCategories" (
    "Id" uuid NOT NULL,
    "Name" character varying(100) NOT NULL,
    "Description" character varying(500),
    CONSTRAINT "PK_AssetCategories" PRIMARY KEY ("Id")
);

CREATE TABLE "OrganizationUnits" (
    "Id" uuid NOT NULL,
    "Name" character varying(100) NOT NULL,
    "Code" character varying(20) NOT NULL,
    "IsActive" boolean NOT NULL,
    "ParentId" uuid,
    "Path" character varying(1000) NOT NULL,
    "Level" integer NOT NULL,
    CONSTRAINT "PK_OrganizationUnits" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_OrganizationUnits_OrganizationUnits_ParentId" FOREIGN KEY ("ParentId") REFERENCES "OrganizationUnits" ("Id") ON DELETE RESTRICT
);

CREATE TABLE "Roles" (
    "Id" uuid NOT NULL,
    "Name" character varying(50) NOT NULL,
    CONSTRAINT "PK_Roles" PRIMARY KEY ("Id")
);

CREATE TABLE "Assets" (
    "Id" uuid NOT NULL,
    "AssetTag" character varying(20) NOT NULL,
    "Name" character varying(200) NOT NULL,
    "Description" character varying(1000),
    "Status" integer NOT NULL,
    "SerialNumber" character varying(100),
    "PurchaseDate" timestamp with time zone,
    "PurchaseCost" numeric(18,2),
    "WarrantyExpiryDate" timestamp with time zone,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone,
    "CategoryId" uuid NOT NULL,
    "OrganizationUnitId" uuid NOT NULL,
    CONSTRAINT "PK_Assets" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Assets_AssetCategories_CategoryId" FOREIGN KEY ("CategoryId") REFERENCES "AssetCategories" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_Assets_OrganizationUnits_OrganizationUnitId" FOREIGN KEY ("OrganizationUnitId") REFERENCES "OrganizationUnits" ("Id") ON DELETE RESTRICT
);

CREATE TABLE "Users" (
    "Id" uuid NOT NULL,
    "FullName" character varying(100) NOT NULL,
    "Email" character varying(200) NOT NULL,
    "PasswordHash" text NOT NULL,
    "IsActive" boolean NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "RoleId" uuid NOT NULL,
    "OrganizationUnitId" uuid,
    CONSTRAINT "PK_Users" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Users_OrganizationUnits_OrganizationUnitId" FOREIGN KEY ("OrganizationUnitId") REFERENCES "OrganizationUnits" ("Id") ON DELETE SET NULL,
    CONSTRAINT "FK_Users_Roles_RoleId" FOREIGN KEY ("RoleId") REFERENCES "Roles" ("Id") ON DELETE RESTRICT
);

CREATE TABLE "AssetDocuments" (
    "Id" uuid NOT NULL,
    "FileName" character varying(255) NOT NULL,
    "ContentType" character varying(100) NOT NULL,
    "FileSizeBytes" bigint NOT NULL,
    "StoragePath" character varying(500) NOT NULL,
    "DocumentType" integer NOT NULL,
    "UploadedAt" timestamp with time zone NOT NULL,
    "UploadedByUserId" uuid NOT NULL,
    "AssetId" uuid NOT NULL,
    CONSTRAINT "PK_AssetDocuments" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_AssetDocuments_Assets_AssetId" FOREIGN KEY ("AssetId") REFERENCES "Assets" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_AssetDocuments_Users_UploadedByUserId" FOREIGN KEY ("UploadedByUserId") REFERENCES "Users" ("Id") ON DELETE RESTRICT
);

CREATE TABLE "AssetHistories" (
    "Id" uuid NOT NULL,
    "ChangeType" integer NOT NULL,
    "OldValue" character varying(500),
    "NewValue" character varying(500),
    "Timestamp" timestamp with time zone NOT NULL,
    "AssetId" uuid NOT NULL,
    "ChangedByUserId" uuid NOT NULL,
    CONSTRAINT "PK_AssetHistories" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_AssetHistories_Assets_AssetId" FOREIGN KEY ("AssetId") REFERENCES "Assets" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_AssetHistories_Users_ChangedByUserId" FOREIGN KEY ("ChangedByUserId") REFERENCES "Users" ("Id") ON DELETE RESTRICT
);

CREATE UNIQUE INDEX "IX_AssetCategories_Name" ON "AssetCategories" ("Name");

CREATE INDEX "IX_AssetDocuments_AssetId" ON "AssetDocuments" ("AssetId");

CREATE INDEX "IX_AssetDocuments_UploadedByUserId" ON "AssetDocuments" ("UploadedByUserId");

CREATE INDEX "IX_AssetHistories_AssetId" ON "AssetHistories" ("AssetId");

CREATE INDEX "IX_AssetHistories_ChangedByUserId" ON "AssetHistories" ("ChangedByUserId");

CREATE UNIQUE INDEX "IX_Assets_AssetTag" ON "Assets" ("AssetTag");

CREATE INDEX "IX_Assets_CategoryId" ON "Assets" ("CategoryId");

CREATE INDEX "IX_Assets_OrganizationUnitId" ON "Assets" ("OrganizationUnitId");

CREATE UNIQUE INDEX "IX_OrganizationUnits_Code" ON "OrganizationUnits" ("Code");

CREATE INDEX "IX_OrganizationUnits_ParentId" ON "OrganizationUnits" ("ParentId");

CREATE UNIQUE INDEX "IX_Roles_Name" ON "Roles" ("Name");

CREATE UNIQUE INDEX "IX_Users_Email" ON "Users" ("Email");

CREATE INDEX "IX_Users_OrganizationUnitId" ON "Users" ("OrganizationUnitId");

CREATE INDEX "IX_Users_RoleId" ON "Users" ("RoleId");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260811200759_InitialCreate', '8.0.13');

COMMIT;

