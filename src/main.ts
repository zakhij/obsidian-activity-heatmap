import { App, Plugin } from 'obsidian';
import type { ActivityHeatmapSettings } from './types'
import { ActivityHeatmapDataManager } from './dataManager'
import { DEFAULT_SETTINGS } from './constants'

export default class ActivityHeatmapPlugin extends Plugin {
	settings: ActivityHeatmapSettings;
	dataManager: ActivityHeatmapDataManager;

	async onload() {
		await this.loadSettings();
		this.dataManager = new ActivityHeatmapDataManager(this);
		
		// Set up an interval to update metrics periodically
		this.registerInterval(
			window.setInterval(() => {
				this.dataManager.updateMetrics();
			}, 1 * 60 * 1000) // Placeholder: Convert minutes to milliseconds
		);
	}

	async onunload() {
		await this.dataManager.saveData();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}




