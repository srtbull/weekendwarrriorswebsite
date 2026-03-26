using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using Oxide.Core;
using Oxide.Core.Libraries.Covalence;

namespace Oxide.Plugins
{
    [Info("VipInspector", "SrtBull", "0.2.0")]
    [Description("Inspects existing VIP groups, permissions, and (optionally) kits to feed a web store.")]
    public class VipInspector : CovalencePlugin
    {
        #region Config / Data / Logging

        private PluginConfig config;
        private PluginData data;

        private const string LogFileName = "VipInspector"; // oxide/logs/VipInspector.txt
        private const string CatalogDataFileName = "VipInspector_Catalog"; // oxide/data/VipInspector_Catalog.json

        private class VipTierMeta
        {
            [JsonProperty(PropertyName = "Group Name")]
            public string GroupName;

            [JsonProperty(PropertyName = "Tier Id")]
            public string TierId;

            [JsonProperty(PropertyName = "Display Name")]
            public string DisplayName;

            [JsonProperty(PropertyName = "Monthly Price")]
            public double MonthlyPrice;

            [JsonProperty(PropertyName = "Color Hex")]
            public string ColorHex = "#ffffff";

            [JsonProperty(PropertyName = "Sort Order")]
            public int SortOrder = 0;
        }

        private class PluginConfig
        {
            [JsonProperty(PropertyName = "VIP Group Name Prefixes")]
            public List<string> VipGroupPrefixes = new List<string>
            {
                "vip",
                "prime",
                "mythic",
                "vanguard",
                "champion"
            };

            [JsonProperty(PropertyName = "Scan Interval Minutes (0 = disabled)")]
            public int ScanIntervalMinutes = 15;

            [JsonProperty(PropertyName = "Enable Debug Logging")]
            public bool DebugLogging = true;

            [JsonProperty(PropertyName = "Try Read Kits Plugin Data")]
            public bool InspectKitsPlugin = true;

            [JsonProperty(PropertyName = "Kits Plugin Name")]
            public string KitsPluginName = "Kits";

            [JsonProperty(PropertyName = "VIP Tier Metadata")]
            public List<VipTierMeta> TierMetadata = new List<VipTierMeta>
            {
                new VipTierMeta
                {
                    GroupName = "vip1",
                    TierId = "vip1",
                    DisplayName = "VIP I",
                    MonthlyPrice = 9.99,
                    ColorHex = "#1abc9c",
                    SortOrder = 1
                },
                new VipTierMeta
                {
                    GroupName = "vip2",
                    TierId = "vip2",
                    DisplayName = "VIP II",
                    MonthlyPrice = 19.99,
                    ColorHex = "#3498db",
                    SortOrder = 2
                },
                new VipTierMeta
                {
                    GroupName = "vip3",
                    TierId = "vip3",
                    DisplayName = "VIP III",
                    MonthlyPrice = 29.99,
                    ColorHex = "#9b59b6",
                    SortOrder = 3
                },
                new VipTierMeta
                {
                    GroupName = "vip",
                    TierId = "vip_all",
                    DisplayName = "Global VIP",
                    MonthlyPrice = 39.99,
                    ColorHex = "#f1c40f",
                    SortOrder = 0
                }
            };
        }

        private class VipGroupInfo
        {
            public string GroupName;
            public List<string> Permissions = new List<string>();
            public List<string> Members = new List<string>();
        }

        private class VipSnapshot
        {
            public DateTime CapturedAtUtc;
            public List<VipGroupInfo> Groups = new List<VipGroupInfo>();
            public string KitsSummary;
        }

        private class PluginData
        {
            [JsonProperty(PropertyName = "Last Snapshot")]
            public VipSnapshot LastSnapshot = new VipSnapshot
            {
                CapturedAtUtc = DateTime.MinValue,
                Groups = new List<VipGroupInfo>(),
                KitsSummary = "No snapshot yet."
            };
        }

        private class VipTierCatalogEntry
        {
            public string TierId;
            public string DisplayName;
            public string GroupName;
            public double MonthlyPrice;
            public string ColorHex;
            public int SortOrder;

            public int MemberCount;
            public List<string> Permissions = new List<string>();
            public List<string> Kits = new List<string>();
        }

        private class VipCatalog
        {
            public DateTime GeneratedAtUtc;
            public List<VipTierCatalogEntry> Tiers = new List<VipTierCatalogEntry>();
        }

        protected override void LoadDefaultConfig()
        {
            config = new PluginConfig();
            SaveConfig();
            LogToFile(LogFileName, "Created default config.", this);
        }

        protected override void LoadConfig()
        {
            base.LoadConfig();
            try
            {
                config = Config.ReadObject<PluginConfig>();
                if (config == null)
                    throw new Exception("Config is null");

                SaveConfig(); // ensure new fields written
            }
            catch (Exception e)
            {
                LogError($"Config error: {e.Message}. Recreating default config.");
                LoadDefaultConfig();
            }
        }

        protected override void SaveConfig() => Config.WriteObject(config, true);

        private void LoadData()
        {
            try
            {
                data = Interface.Oxide.DataFileSystem.ReadObject<PluginData>(Name);
                if (data == null || data.LastSnapshot == null)
                {
                    data = new PluginData();
                }
            }
            catch
            {
                data = new PluginData();
            }
        }

        private void SaveData()
        {
            Interface.Oxide.DataFileSystem.WriteObject(Name, data);
        }

        private void SaveCatalog(VipCatalog catalog)
        {
            Interface.Oxide.DataFileSystem.WriteObject(CatalogDataFileName, catalog);
        }

        private void LogDebug(string msg)
        {
            if (!config.DebugLogging)
                return;

            LogToFile(LogFileName, $"[DEBUG] {msg}", this);
            Puts($"[VipInspector DEBUG] {msg}");
        }

        private void LogInfo(string msg)
        {
            LogToFile(LogFileName, $"[INFO] {msg}", this);
            Puts($"[VipInspector] {msg}");
        }

        private void LogError(string msg)
        {
            LogToFile(LogFileName, $"[ERROR] {msg}", this);
            PrintError($"[VipInspector] {msg}");
        }

        #endregion

        #region Hooks

        private void Init()
        {
            LoadConfig();
            LoadData();
        }

        private void OnServerInitialized()
        {
            LogInfo("Server initialized, performing initial VIP scan.");
            CaptureSnapshot();

            if (config.ScanIntervalMinutes > 0)
            {
                timer.Every(config.ScanIntervalMinutes * 60f, () =>
                {
                    CaptureSnapshot();
                });
                LogInfo($"Auto-scan scheduled every {config.ScanIntervalMinutes} minutes.");
            }
        }

        private void Unload()
        {
            SaveData();
            LogInfo("Unloaded. Data saved.");
        }

        #endregion

        #region Commands

        [Command("vipinspect")]
        private void CmdVipInspect(IPlayer player, string command, string[] args)
        {
            if (player != null && !player.IsAdmin)
                return;

            CaptureSnapshot(true);
            player?.Reply("[VipInspector] Manual snapshot captured. Check data + logs.");
        }

        #endregion

        #region Core Logic

        private void CaptureSnapshot(bool manual = false)
        {
            try
            {
                var snapshot = new VipSnapshot
                {
                    CapturedAtUtc = DateTime.UtcNow,
                    Groups = new List<VipGroupInfo>(),
                    KitsSummary = "Kits inspection disabled."
                };

                var allGroups = permission.GetGroups();
                LogDebug($"Found {allGroups.Length} groups in permission system.");

                foreach (var group in allGroups)
                {
                    if (!IsVipGroup(group))
                    {
                        LogDebug($"Skipping non-VIP group '{group}'.");
                        continue;
                    }

                    var info = new VipGroupInfo
                    {
                        GroupName = group,
                        Permissions = new List<string>(),
                        Members = new List<string>()
                    };

                    var perms = permission.GetGroupPermissions(group, true);
                    if (perms != null)
                    {
                        foreach (var perm in perms)
                            info.Permissions.Add(perm);
                    }

                    var users = permission.GetUsersInGroup(group);
                    if (users != null)
                    {
                        foreach (var user in users)
                            info.Members.Add(user);
                    }

                    snapshot.Groups.Add(info);
                }

                if (config.InspectKitsPlugin)
                {
                    snapshot.KitsSummary = InspectKits();
                }

                data.LastSnapshot = snapshot;
                SaveData();

                var catalog = BuildCatalogFromSnapshot(snapshot);
                SaveCatalog(catalog);

                var shortSummary = $"Snapshot at {snapshot.CapturedAtUtc:u}: " +
                                   $"{snapshot.Groups.Count} VIP groups, Kits: {snapshot.KitsSummary}. " +
                                   $"Catalog tiers: {catalog.Tiers.Count}.";
                LogInfo(shortSummary);

                if (manual)
                    LogDebug("Manual capture requested via /vipinspect.");
            }
            catch (Exception e)
            {
                LogError($"Error during snapshot: {e}");
            }
        }

        private VipCatalog BuildCatalogFromSnapshot(VipSnapshot snapshot)
        {
            var catalog = new VipCatalog
            {
                GeneratedAtUtc = snapshot.CapturedAtUtc,
                Tiers = new List<VipTierCatalogEntry>()
            };

            foreach (var group in snapshot.Groups)
            {
                var meta = config.TierMetadata.FirstOrDefault(m =>
                    string.Equals(m.GroupName, group.GroupName, StringComparison.OrdinalIgnoreCase));

                if (meta == null)
                {
                    LogDebug($"No TierMetadata entry for group '{group.GroupName}', skipping from catalog.");
                    continue;
                }

                var entry = new VipTierCatalogEntry
                {
                    TierId = meta.TierId,
                    DisplayName = meta.DisplayName,
                    GroupName = meta.GroupName,
                    MonthlyPrice = meta.MonthlyPrice,
                    ColorHex = meta.ColorHex,
                    SortOrder = meta.SortOrder,
                    MemberCount = group.Members?.Count ?? 0,
                    Permissions = new List<string>(group.Permissions),
                    Kits = ExtractKitsFromPermissions(group.Permissions)
                };

                catalog.Tiers.Add(entry);
            }

            catalog.Tiers.Sort((a, b) =>
            {
                var cmp = a.SortOrder.CompareTo(b.SortOrder);
                return cmp != 0 ? cmp : string.Compare(a.DisplayName, b.DisplayName, StringComparison.OrdinalIgnoreCase);
            });

            LogDebug($"Catalog built with {catalog.Tiers.Count} tiers.");
            return catalog;
        }

        private List<string> ExtractKitsFromPermissions(List<string> permissions)
        {
            var kits = new List<string>();
            if (permissions == null) return kits;

            foreach (var perm in permissions)
            {
                if (!perm.StartsWith("kits.", StringComparison.OrdinalIgnoreCase))
                    continue;

                var parts = perm.Split('.');
                if (parts.Length >= 2)
                {
                    var kitName = parts[1];
                    if (!kits.Contains(kitName))
                        kits.Add(kitName);
                }
            }

            return kits;
        }

        private bool IsVipGroup(string groupName)
        {
            if (string.IsNullOrEmpty(groupName))
                return false;

            foreach (var prefix in config.VipGroupPrefixes)
            {
                if (groupName.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
                    return true;
            }

            return false;
        }

        private string InspectKits()
        {
            var kitsPlugin = plugins.Find(config.KitsPluginName);
            if (kitsPlugin == null)
            {
                LogDebug($"Kits plugin '{config.KitsPluginName}' not found.");
                return "Kits plugin not found.";
            }

            LogDebug($"Kits plugin '{config.KitsPluginName}' detected (version {kitsPlugin.Version}).");
            return $"Kits plugin detected ({kitsPlugin.Version}). Detailed kit export not yet implemented.";
        }

        #endregion
    }
}

