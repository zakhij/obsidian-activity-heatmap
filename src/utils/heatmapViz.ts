
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
 * Generates the tooltip text for the heatmap.
 * @param metricType - The type of metric being displayed.
 * @returns A function that generates the tooltip text.
 */
export function generateTooltipText(metricType: string) {
    return function(date: any, value: any, dayjsDate: any) {
        return value 
            ? `${value} ${metricType} changes on ${dayjsDate.format('MMMM D, YYYY')}` 
            : `No ${metricType} changes on ${dayjsDate.format('MMMM D, YYYY')}`;
    };
}