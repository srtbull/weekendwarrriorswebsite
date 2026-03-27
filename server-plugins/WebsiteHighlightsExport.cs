using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using Oxide.Core;
using Oxide.Core.Libraries.Covalence;
using Oxide.Core.Plugins;

namespace Oxide.Plugins
{
    [Info("WebsiteHighlightsExport", "WeekenedWarriors", "1.0.0")]
    [Description("Exports installed Oxide plugins + optional website highlight labels to JSON (oxide/data).")]
    public class WebsiteHighlightsExport : CovalencePlugin
    {
        private const string LogName = "WebsiteHighlightsExport";

        private class HighlightRule
        {
            [JsonProperty(PropertyName = "Plugin Name (must match Oxide name, e.g. Kits)")]
            public string PluginName = "";

            [JsonProperty(PropertyName = "Include On Website")]
            public bool IncludeOnWebsite = false;

            [JsonProperty(PropertyName = "Display Label (optional, else plugin Title/Name)")]
            public string DisplayLabel = "";
        }

        private class PluginConfig
        {
            [JsonProperty(PropertyName = "Output Data File Name (oxide/data, no .json)")]
            public string OutputDataFileName = "WebsiteHighlights";

            [JsonProperty(PropertyName = "Scan Interval Minutes (0 = only manual / server start)")]
            public int ScanIntervalMinutes = 30;

            [JsonProperty(PropertyName = "Enable Debug Logging")]
            public bool DebugLogging = false;

            [JsonProperty(PropertyName = "Highlight Rules (only matching installed plugins can appear on site)")]
            public List<HighlightRule> HighlightRules = new List<HighlightRule>
            {
                new HighlightRule
                {
                    PluginName = "Kits",
                    IncludeOnWebsite = true,
                    DisplayLabel = "Kits"
                }
            };
        }

        private class InstalledPluginDto
        {
            [JsonProperty("name")] public string Name { get; set; }
            [JsonProperty("title")] public string Title { get; set; }
            [JsonProperty("version")] public string Version { get; set; }
            [JsonProperty("includeOnWebsite")] public bool IncludeOnWebsite { get; set; }
        }

        private class HighlightsExportDto
        {
            [JsonProperty("generatedAtUtc")] public DateTime GeneratedAtUtc { get; set; }
            [JsonProperty("installedPlugins")] public List<InstalledPluginDto> InstalledPlugins { get; set; }
            [JsonProperty("websiteHighlightLabels")] public List<string> WebsiteHighlightLabels { get; set; }
        }

        private PluginConfig config;

        protected override void LoadDefaultConfig()
        {
            config = new PluginConfig();
            SaveConfig();
            LogToFile(LogName, "Created default config.", this);
        }

        protected override void LoadConfig()
        {
            base.LoadConfig();
            try
            {
                config = Config.ReadObject<PluginConfig>();
                if (config == null) throw new Exception("null config");
                SaveConfig();
            }
            catch (Exception ex)
            {
                PrintError($"[WebsiteHighlightsExport] Config error: {ex.Message}. Recreating defaults.");
                LoadDefaultConfig();
            }
        }

        protected override void SaveConfig() => Config.WriteObject(config, true);

        private void Init()
        {
            LoadConfig();
        }

        private void OnServerInitialized()
        {
            WriteExport();

            if (config.ScanIntervalMinutes > 0)
            {
                timer.Every(config.ScanIntervalMinutes * 60f, WriteExport);
                Puts($"[WebsiteHighlightsExport] Auto-export every {config.ScanIntervalMinutes} minutes.");
            }
        }

        [Command("websitehighlights")]
        private void CmdWebsiteHighlights(IPlayer player, string command, string[] args)
        {
            if (player != null && !player.IsAdmin) return;
            WriteExport();
            player?.Reply("[WebsiteHighlightsExport] Wrote JSON to oxide/data.");
        }

        private void WriteExport()
        {
            try
            {
                var installed = new List<InstalledPluginDto>();
                var highlightLabels = new List<string>();
                var byName = new Dictionary<string, InstalledPluginDto>(StringComparer.OrdinalIgnoreCase);

                foreach (var p in Interface.Oxide.RootPluginManager.GetPlugins())
                {
                    if (p == null || string.IsNullOrEmpty(p.Name)) continue;

                    var dto = new InstalledPluginDto
                    {
                        Name = p.Name,
                        Title = string.IsNullOrEmpty(p.Title) ? p.Name : p.Title,
                        Version = p.Version.ToString(),
                        IncludeOnWebsite = false
                    };
                    installed.Add(dto);
                    byName[p.Name] = dto;
                }

                installed.Sort((a, b) => string.Compare(a.Name, b.Name, StringComparison.OrdinalIgnoreCase));

                foreach (var rule in config.HighlightRules)
                {
                    if (string.IsNullOrWhiteSpace(rule.PluginName) || !rule.IncludeOnWebsite) continue;

                    if (!byName.TryGetValue(rule.PluginName.Trim(), out var dto))
                    {
                        if (config.DebugLogging)
                            LogToFile(LogName, $"[DEBUG] Rule '{rule.PluginName}' — plugin not installed, skip.", this);
                        continue;
                    }

                    dto.IncludeOnWebsite = true;
                    var label = string.IsNullOrWhiteSpace(rule.DisplayLabel)
                        ? dto.Title
                        : rule.DisplayLabel.Trim();
                    highlightLabels.Add(label);
                }

                var payload = new HighlightsExportDto
                {
                    GeneratedAtUtc = DateTime.UtcNow,
                    InstalledPlugins = installed,
                    WebsiteHighlightLabels = highlightLabels
                };

                Interface.Oxide.DataFileSystem.WriteObject(config.OutputDataFileName, payload);

                LogToFile(LogName,
                    $"[INFO] Export OK — {installed.Count} plugins, {highlightLabels.Count} website highlight(s). Path: oxide/data/{config.OutputDataFileName}.json",
                    this);
                Puts($"[WebsiteHighlightsExport] Wrote oxide/data/{config.OutputDataFileName}.json ({installed.Count} plugins).");

                if (config.DebugLogging)
                {
                    var json = JsonConvert.SerializeObject(payload, Formatting.Indented);
                    LogToFile(LogName, "[DEBUG] JSON:\n" + json, this);
                }
            }
            catch (Exception ex)
            {
                PrintError($"[WebsiteHighlightsExport] Export failed: {ex}");
                LogToFile(LogName, $"[ERROR] {ex}", this);
            }
        }
    }
}
