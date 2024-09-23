import { Plugin } from 'obsidian';
import type { ActivityHeatmapSettings } from './types'
import { ActivityHeatmapDataManager } from './dataManager'
import { DEFAULT_SETTINGS } from './constants'
import { ActivityHeatmapSettingTab } from './settings'

export default class ActivityHeatmapPlugin extends Plugin {
	settings: ActivityHeatmapSettings;
	dataManager: ActivityHeatmapDataManager;
	private updateInterval: number;

	async onload() {
		await this.loadSettings();
		this.dataManager = new ActivityHeatmapDataManager(this);
		console.log("ActivityHeatmapPlugin loaded");

		// Add settings tab
		this.addSettingTab(new ActivityHeatmapSettingTab(this.app, this));

		// Set up the interval based on settings
		this.setUpdateInterval();
	}

	async onunload() {
		console.log("Unloading ActivityHeatmapPlugin");
		if (this.updateInterval) {
			window.clearInterval(this.updateInterval);
		}
		await this.dataManager.saveData();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.setUpdateInterval(); 
	}

	private setUpdateInterval() { 
		if (this.updateInterval) {
			window.clearInterval(this.updateInterval);
		}
		this.updateInterval = window.setInterval(() => {
			this.updateMetrics();
		}, this.settings.updateInterval * 60 * 1000);
		this.registerInterval(this.updateInterval);
		console.log("Update interval set to " + this.settings.updateInterval + " minute(s)");
	}

	private updateMetrics() {
		console.log("Updating metrics");
		this.dataManager.updateMetrics().catch(error => {
			console.error("Error updating metrics:", error);
		});
	}
}




