import { App, Plugin } from 'obsidian';
import type { ActivityHeatmapSettings } from './types'
import { DataManager } from './dataManager'
import { DEFAULT_SETTINGS } from './constants'

export default class ActivityHeatmapPlugin extends Plugin {
	settings: ActivityHeatmapSettings;
	dataManager: DataManager;

	async onload() {
		await this.loadSettings();
		this.dataManager = new DataManager(this);
		await this.dataManager.loadData();
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




