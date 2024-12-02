import { migrate1_0_4To1_0_5 } from '../../migrations/1_0_4';
import { ActivityHeatmapDataLegacy1_0_4 } from '../../types';

describe('1.0.4 to 1.0.5 migration', () => {

    let mockDataJSON: ActivityHeatmapDataLegacy1_0_4;
    let incompleteDataJSON: ActivityHeatmapDataLegacy1_0_4;

    beforeEach(() => {
        jest.resetAllMocks();

        mockDataJSON = {
            checkpoints: {
                wordCount: {
                    'test1.md': 100,
                    'test2.md': 200
                },
                fileSize: {
                    'test1.md': 500,
                    'test2.md': 1000
                }
            },
            activityOverTime: {
                wordCount: {
                    '2024-01-01': 50,
                    '2024-01-02': 75
                },
                fileSize: {
                    '2024-01-01': 250,
                    '2024-01-02': 300
                }
            }
        } as ActivityHeatmapDataLegacy1_0_4;

        incompleteDataJSON = {
            checkpoints: {
                wordCount: { 'test1.md': 100 },
                fileSize: {}
            },
            activityOverTime: {
                wordCount: { '2024-01-01': 50 },
                fileSize: { '2024-01-01': 250 }
            }
        } as ActivityHeatmapDataLegacy1_0_4;
    });

    it('should correctly transform checkpoint structure', () => {
        const result = migrate1_0_4To1_0_5(mockDataJSON);
        
        expect(result.version).toBe('1.0.5');
        
        expect(result.checkpoints['test1.md']).toEqual({
            mtime: 0,
            wordCount: 100,
            fileSize: 500
        })
        
        expect(result.checkpoints['test2.md']).toEqual({
            mtime: 0,
            wordCount: 200,
            fileSize: 1000
        });
    });

    it('should correctly transform activity over time', () => {
        const result = migrate1_0_4To1_0_5(mockDataJSON);
        
        expect(result.activityOverTime['2024-01-01']).toEqual({
            wordCount: 50,
            fileSize: 250
        })
        expect(result.activityOverTime['2024-01-02']).toEqual({
            wordCount: 75,
            fileSize: 300
        })
    });

    it('should handle missing data gracefully', () => {
        const result = migrate1_0_4To1_0_5(incompleteDataJSON);
        expect(result.checkpoints['test1.md'].fileSize).toBe(0);
    });

    it('should preserve all files and dates', () => {
        const result = migrate1_0_4To1_0_5(mockDataJSON);
        
        const originalFiles = new Set(Object.keys(mockDataJSON.checkpoints.wordCount));
        const migratedFiles = new Set(Object.keys(result.checkpoints));
        expect(migratedFiles).toEqual(originalFiles);

        const originalDates = new Set(Object.keys(mockDataJSON.activityOverTime.wordCount));
        const migratedDates = new Set(Object.keys(result.activityOverTime));
        expect(migratedDates).toEqual(originalDates);
    });
});