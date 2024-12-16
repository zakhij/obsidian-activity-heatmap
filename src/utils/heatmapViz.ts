
/**
 * Generates the color scale configuration for the heatmap.
 * @param maxValue - The maximum value in the data.
 * @returns The color scale configuration object.
 */
export function generateColorScale(maxValue: number) {
    return {
        type: 'threshold' as const,
        range: ['#14432a', '#166b34', '#37a446', '#4dd05a'],
        domain: [0, Math.floor(maxValue / 3), Math.floor((2 * maxValue) / 3), maxValue],
    };
}


/**
 * Formats bytes into human readable file size.
 * @param bytes - The size in bytes.
 * @returns Formatted string with appropriate unit.
 */
function formatFileSize(bytes: number): string {
    const units = ['bytes', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }

    // Round to one decimal place
    return `${Math.round(size * 10) / 10} ${units[unitIndex]}`;
}

/**
 * Generates the tooltip text for the heatmap.
 * @param metricType - The type of metric being displayed.
 * @returns A function that generates the tooltip text.
 */
export function generateTooltipText(metricType: string) {
    return function(date: any, value: any, dayjsDate: any) {
        if (!value) {
            return `No changes on ${dayjsDate.format('MMMM D, YYYY')}`;
        }

        switch (metricType) {
            case 'wordCount':
                return `${value} word ${value === 1 ? 'change' : 'changes'} on ${dayjsDate.format('MMMM D, YYYY')}`;
            case 'fileSize':
                return `${formatFileSize(value)} worth of file changes on ${dayjsDate.format('MMMM D, YYYY')}`;
            default:
                return `${value} ${metricType} ${value === 1 ? 'change' : 'changes'} on ${dayjsDate.format('MMMM D, YYYY')}`;
        }
    };
}