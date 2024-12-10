import { Plugin } from 'obsidian';
import type { ActivityHeatmapData, ActivityHeatmapSettings } from './types'
import { CURRENT_DATA_FILE, DATA_FOLDER, DEFAULT_SETTINGS } from './constants'
import { ActivityHeatmapSettingTab } from './settings'
import { HeatmapModal } from './components/heatmapModal';
import { DEV_BUILD } from './config';
import { TFile } from 'obsidian';
import { DataUpdater } from './dataUpdater';
import { DataReader } from './dataReader';
export default class ActivityHeatmapPlugin extends Plugin {
	settings: ActivityHeatmapSettings;
	dataUpdater: DataUpdater;
	dataReader: DataReader;

	async onload() {
		console.log("Loading ActivityHeatmapPlugin");

		await this.loadSettings();
		this.addSettingTab(new ActivityHeatmapSettingTab(this.app, this));

		this.dataUpdater = new DataUpdater(this);
		this.dataReader = new DataReader(this);

		this.app.workspace.onLayoutReady(async () => {
			await this.scanVault();
		});

		this.registerEvent(
			this.app.vault.on('modify', (file) => {
				if (file instanceof TFile && file.extension === 'md') {
					this.dataUpdater.updateFileData(file, false);
				}
			})
		);

		this.registerEvent(
			this.app.vault.on('delete', (file) => {
				if (file instanceof TFile && file.extension === 'md') {
					this.dataUpdater.removeFileData(file);
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
		console.log("Scanning vault...");
		const markdownFiles = this.app.vault.getMarkdownFiles();
		const isFirstTime = await this.isFirstTimeUpdate();
		for (const file of markdownFiles) {
			await this.dataUpdater.updateFileData(file, isFirstTime);
		}
	}

	/**
	 * Checks if data files (both current and legacy) are null (which we assume indicates first-time plugin user)
	 * @returns true if data is null, false otherwise
	 */
	private async isFirstTimeUpdate(): Promise<boolean> {
		const dataV0 = await this.loadData();
		const hasDataV0 = dataV0 && 'checkpoints' in dataV0 && 'activityOverTime' in dataV0;
		let dataV1: ActivityHeatmapData | null = null;
		try {
			dataV1 = await this.app.vault.adapter.read(this.manifest.dir + '/' + DATA_FOLDER + '/' + CURRENT_DATA_FILE).then(data => JSON.parse(data));
		} catch (error) {
			// Continue, dataV1 will be null
		}
		return !hasDataV0 && !dataV1;
	}

}




