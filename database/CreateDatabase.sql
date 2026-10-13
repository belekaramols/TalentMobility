-- Run: sqlcmd -S localhost\SQLEXPRESS -E -C -i CreateDatabase.sql
-- Schema is created by the API on startup (EF EnsureCreated + seed).
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'TalentMobility')
BEGIN
    CREATE DATABASE [TalentMobility];
END
GO
