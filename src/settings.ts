
import { App, PluginSettingTab, Setting } from 'obsidian'
import ActivityHeatmapPlugin from './main'


export class ActivityHeatmapSettingTab extends PluginSettingTab {
	plugin: ActivityHeatmapPlugin;

	constructor(app: App, plugin: ActivityHeatmapPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
            .setName('Metric Type')
            .setDesc('Choose the metric to use for the activity heatmap')
            .addDropdown(dropdown => dropdown
                .addOption('fileSize', 'File Size')
                .addOption('wordCount', 'Word Count')
                .setValue(this.plugin.settings.metricType)
                .onChange(async (value) => {
                    this.plugin.settings.metricType = value as 'fileSize' | 'wordCount';
                    await this.plugin.saveSettings();
                    //IN FUTURE: this.plugin.updateHeatmap();
                })
            );
		
		new Setting(containerEl)
			.setName('Update Interval')
			.setDesc('Choose how often to update the activity heatmap')
			.addDropdown(dropdown => dropdown
				.addOption('1', '1 minute')
				.addOption('5', '5 minutes')
				.addOption('10', '10 minutes')
				.addOption('30', '30 minutes')
				.addOption('60', '1 hour')
				.setValue(this.plugin.settings.updateInterval.toString())
				.onChange(async (value) => {
					this.plugin.settings.updateInterval = parseInt(value) as 5 | 10 | 30 | 60;
					await this.plugin.saveSettings();
				})
			);

		
	}
}