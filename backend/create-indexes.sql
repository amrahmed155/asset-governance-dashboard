-- Performance indexes for Asset Governance Dashboard queries
-- Run this script once on your AssetsDB to prevent query timeouts

-- Asset_Valuations indexes
CREATE NONCLUSTERED INDEX IX_Asset_Valuations_gov_serial
  ON [dbo].[Asset_Valuations] ([gov_serial])
  INCLUDE ([authority_serial], [AssetTypeID]);

CREATE NONCLUSTERED INDEX IX_Asset_Valuations_authority_serial
  ON [dbo].[Asset_Valuations] ([authority_serial])
  INCLUDE ([gov_serial], [AssetTypeID]);

CREATE NONCLUSTERED INDEX IX_Asset_Valuations_AssetTypeID
  ON [dbo].[Asset_Valuations] ([AssetTypeID]);

-- Assets_col_unit indexes
CREATE NONCLUSTERED INDEX IX_Assets_col_unit_gov_serial
  ON [dbo].[Assets_col_unit] ([gov_serial])
  INCLUDE ([authority_serial], [AssetTypeID]);

CREATE NONCLUSTERED INDEX IX_Assets_col_unit_authority_serial
  ON [dbo].[Assets_col_unit] ([authority_serial])
  INCLUDE ([gov_serial], [AssetTypeID]);

CREATE NONCLUSTERED INDEX IX_Assets_col_unit_AssetTypeID
  ON [dbo].[Assets_col_unit] ([AssetTypeID]);

-- interactiveMapData indexes
CREATE NONCLUSTERED INDEX IX_interactiveMapData_gov_serial
  ON [dbo].[interactiveMapData] ([gov_serial])
  INCLUDE ([authority_serial], [AssetTypeID]);

CREATE NONCLUSTERED INDEX IX_interactiveMapData_authority_serial
  ON [dbo].[interactiveMapData] ([authority_serial])
  INCLUDE ([gov_serial], [AssetTypeID]);

CREATE NONCLUSTERED INDEX IX_interactiveMapData_AssetTypeID
  ON [dbo].[interactiveMapData] ([AssetTypeID]);

-- Authorities_Lookup index on AuthorityCode (used for joins)
CREATE NONCLUSTERED INDEX IX_Authorities_Lookup_AuthorityCode
  ON [dbo].[Authorities_Lookup] ([AuthorityCode])
  INCLUDE ([AuthorityName]);
