import { Plugin } from 'obsidian';
import type { ActivityHeatmapSettings } from './types'
import { ActivityHeatmapDataManager } from './dataManager'
import { DEFAULT_SETTINGS } from './constants'
import { ActivityHeatmapSettingTab } from './settings'
import { HeatmapModal } from './components/heatmapModal';
import { DEV_BUILD } from './config';
import { TFile } from 'obsidian';
import { MigrationManager } from './migrationManager';

export default class ActivityHeatmapPlugin extends Plugin {
	settings: ActivityHeatmapSettings;
	dataManager: ActivityHeatmapDataManager;
	migrationManager: MigrationManager;

	async onload() {
		console.log("Loading ActivityHeatmapPlugin");

		await this.writeTestData();

		await this.loadSettings();
		this.addSettingTab(new ActivityHeatmapSettingTab(this.app, this));

		this.dataManager = new ActivityHeatmapDataManager(this);

		this.migrationManager = new MigrationManager(this);
		await this.migrationManager.migrateIfNeeded();

		this.app.workspace.onLayoutReady(async () => {
			await this.scanVault();
		});

		this.registerEvent(
			this.app.vault.on('modify', (file) => {
				if (file instanceof TFile && file.extension === 'md') {
					this.dataManager.updateFileData(file, false);
				}
			})
		);

		this.registerEvent(
			this.app.vault.on('delete', (file) => {
				if (file instanceof TFile && file.extension === 'md') {
					this.dataManager.removeFileData(file);
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
			await this.dataManager.updateFileData(file, isFirstTime);
		}
	}

	/**
	 * Checks if data.json is null (which we assume indicates first-time plugin user)
	 * @returns true if data.json is null, false otherwise
	 */
	private async isFirstTimeUpdate(): Promise<boolean> {
		const legacyFile = await this.loadData();
		const hasLegacyData = legacyFile && 'checkpoints' in legacyFile && 'activityOverTime' in legacyFile;
		const v1_0_5Data = await this.app.vault.adapter.read(this.manifest.dir + '/activity_heatmap_data/v1_0_5.json');
		return !hasLegacyData && !v1_0_5Data;
	}

	/**
	 * Writes "{keyTest: 4}" to TEST.json in the plugin directory
	 */
	async writeTestData() {
		const testData = { keyTest: 4 };
		await this.app.vault.adapter.write(this.manifest.dir + '/TEST2.json', JSON.stringify(testData));
		console.log(this.app.vault.adapter);
		const allFolders = this.app.vault.getAllFolders();
		console.log('All folders:', allFolders.map(f => f.path));
		const folder = this.app.vault.configDir;
		console.log('Config dir:', folder);
		const testData2 = await this.app.vault.adapter.read(this.manifest.dir + '/TEST2.json');
		console.log('Test data:', testData);
	}
}




