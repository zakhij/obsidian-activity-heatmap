import { Plugin } from 'obsidian';
import type { ActivityHeatmapSettings } from './types'
import { ActivityHeatmapDataManager } from './dataManager'
import { DEFAULT_SETTINGS } from './constants'
import { ActivityHeatmapSettingTab } from './settings'
import { HeatmapModal } from './components/heatmapModal';
import { DEV_BUILD } from './config';
import { TFile } from 'obsidian';

export default class ActivityHeatmapPlugin extends Plugin {
	settings: ActivityHeatmapSettings;
	dataManager: ActivityHeatmapDataManager;

	async onload() {
		console.log("Loading ActivityHeatmapPlugin");

		await this.loadSettings();
		this.addSettingTab(new ActivityHeatmapSettingTab(this.app, this));

		this.dataManager = new ActivityHeatmapDataManager(this);

		this.app.workspace.onLayoutReady(async () => {
			await this.scanVault();
		});

		this.registerEvent(
			this.app.vault.on('modify', (file) => {
				if (file instanceof TFile && file.extension === 'md') {
					this.dataManager.updateMetricsForFile(file);
				}
			})
		);

		this.registerEvent(
			this.app.vault.on('delete', (file) => {
				if (file instanceof TFile && file.extension === 'md') {
					this.dataManager.removeFileMetrics(file.path);
				}
			})
		);

		this.addCommand({
			id: 'open-heatmap-modal',
			name: 'Open heatmap',
			callback: () => {
				new HeatmapModal(this.app, this).open();
			}
		});

		this.addRibbonIcon('calendar', 'Open activity heatmap', (evt: MouseEvent) => {
			new HeatmapModal(this.app, this).open();
		});

	}

	async onunload() {
		console.log("Unloading ActivityHeatmapPlugin");
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		if (!DEV_BUILD) {
			delete this.settings.useMockData;
		}
	}

	/**
	 * Saves the settings to the data.json file (without overwriting activity data)
	 */
	async saveSettings() {
		const activityData = await this.loadData();
		const dataToSave = {
			...activityData,
			...this.settings
		};
		await this.saveData(dataToSave);
	}

	/**
	 * Upon plugin init, does an initial scan of the vault to update the metrics for all existing files
	 */
	async scanVault() {
		const markdownFiles = this.app.vault.getMarkdownFiles();
		for (const file of markdownFiles) {
			await this.dataManager.updateMetricsForFile(file);
		}
	}
}




