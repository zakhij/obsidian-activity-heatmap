import { Plugin } from 'obsidian';
import type { ActivityHeatmapData, ActivityHeatmapSettings } from './types'
import { ActivityHeatmapDataManager } from './dataManager'
import { DEFAULT_SETTINGS } from './constants'
import { ActivityHeatmapSettingTab } from './settings'
import { HeatmapModal } from './components/heatmapModal';
import { DEV_BUILD } from './config';
import { TFile } from 'obsidian';
import { DataUpdater } from './dataUpdater';
import { dataReader } from './dataReader';
export default class ActivityHeatmapPlugin extends Plugin {
	settings: ActivityHeatmapSettings;
	dataUpdater: DataUpdater;
	dataReader: dataReader;

	async onload() {
		console.log("Loading ActivityHeatmapPlugin");

		await this.loadSettings();
		this.addSettingTab(new ActivityHeatmapSettingTab(this.app, this));

		this.dataUpdater = new DataUpdater(this);
		this.dataReader = new dataReader(this);

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
	 * Checks if data.json is null (which we assume indicates first-time plugin user)
	 * @returns true if data.json is null, false otherwise
	 */
	private async isFirstTimeUpdate(): Promise<boolean> {
		const legacyFile = await this.loadData();
		const hasLegacyData = legacyFile && 'checkpoints' in legacyFile && 'activityOverTime' in legacyFile;
		let v1_0_5Data: ActivityHeatmapData | null = null;
		try {
			v1_0_5Data = await this.app.vault.adapter.read(this.manifest.dir + '/activity_heatmap_data/v1_0_5.json').then(data => JSON.parse(data));
		} catch (error) {

		}
		return !hasLegacyData && !v1_0_5Data;
	}

	/**
	 * Writes "{keyTest: 4}" to TEST.json in the plugin directory
	 */
	async writeTestData() {
		const testData = { keyTest: 4 };
		await this.app.vault.adapter.write(this.manifest.dir + '/TEST2.json', JSON.stringify(testData));
		const testData2 = await this.app.vault.adapter.read(this.manifest.dir + '/TEST2.json');
		console.log('Test data:', testData2);
	}
}




