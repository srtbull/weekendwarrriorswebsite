using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using Oxide.Core;
using Oxide.Core.Libraries.Covalence;
using Oxide.Core.Plugins;

namespace Oxide.Plugins
{
    [Info("WebsiteHighlightsExport", "WeekenedWarriors", "1.1.0")]
    [Description("Exports all Oxide plugins to JSON. Edit oxide/data JSON: set hidden=true to hide a plugin on the website. Values persist across exports.")]
    public class WebsiteHighlightsExport : CovalencePlugin
    {
        private const string LogName = "WebsiteHighlightsExport";

        private class PluginConfig
        {
            [JsonProperty(PropertyName = "Output Data File Name (oxide/data, no .json)")]
            public string OutputDataFileName = "WebsiteHighlights";

            [JsonProperty(PropertyName = "Scan Interval Minutes (0 = only manual / server start)")]
            public int ScanIntervalMinutes = 30;

            [JsonProperty(PropertyName = "Enable Debug Logging")]
            public bool DebugLogging = false;
        }

        private class InstalledPluginDto
        {
            [JsonProperty("name")] public string Name { get; set; }
            [JsonProperty("title")] public string Title { get; set; }
            [JsonProperty("version")] public string Version { get; set; }

            /// <summary> If true, this plugin is omitted from the website Highlights line. Default false = shown. </summary>
            [JsonProperty("hidden")] public bool Hidden { get; set; }
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

        private Dictionary<string, bool> LoadPreviousHiddenByName()
        {
            var map = new Dictionary<string, bool>(StringComparer.OrdinalIgnoreCase);
            try
            {
                var existing = Interface.Oxide.DataFileSystem.ReadObject<HighlightsExportDto>(config.OutputDataFileName);
                if (existing?.InstalledPlugins == null) return map;

                foreach (var row in existing.InstalledPlugins)
                {
                    if (string.IsNullOrEmpty(row?.Name)) continue;
                    map[row.Name] = row.Hidden;
                }
            }
            catch (Exception ex)
            {
                if (config.DebugLogging)
                    LogToFile(LogName, $"[DEBUG] Could not read previous export for merge: {ex.Message}", this);
            }

            return map;
        }

        private void WriteExport()
        {
            try
            {
                var previousHidden = LoadPreviousHiddenByName();
                var installed = new List<InstalledPluginDto>();

                foreach (var p in Interface.Oxide.RootPluginManager.GetPlugins())
                {
                    if (p == null || string.IsNullOrEmpty(p.Name)) continue;

                    var hidden = previousHidden.TryGetValue(p.Name, out var wasHidden) && wasHidden;

                    var dto = new InstalledPluginDto
                    {
                        Name = p.Name,
                        Title = string.IsNullOrEmpty(p.Title) ? p.Name : p.Title,
                        Version = p.Version.ToString(),
                        Hidden = hidden
                    };
                    installed.Add(dto);
                }

                installed.Sort((a, b) => string.Compare(a.Name, b.Name, StringComparison.OrdinalIgnoreCase));

                var highlightLabels = installed
                    .Where(x => !x.Hidden)
                    .Select(x => x.Title)
                    .ToList();

                var payload = new HighlightsExportDto
                {
                    GeneratedAtUtc = DateTime.UtcNow,
                    InstalledPlugins = installed,
                    WebsiteHighlightLabels = highlightLabels
                };

                Interface.Oxide.DataFileSystem.WriteObject(config.OutputDataFileName, payload);

                var shown = highlightLabels.Count;
                var hiddenCount = installed.Count - shown;
                LogToFile(LogName,
                    $"[INFO] Export OK — {installed.Count} plugins ({shown} visible, {hiddenCount} hidden). File: oxide/data/{config.OutputDataFileName}.json — edit 'hidden' in that file to toggle website display.",
                    this);
                Puts($"[WebsiteHighlightsExport] Wrote oxide/data/{config.OutputDataFileName}.json ({installed.Count} plugins, {shown} shown on site).");

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
