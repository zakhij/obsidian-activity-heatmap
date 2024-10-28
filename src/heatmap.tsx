import CalHeatmap from 'cal-heatmap';
import Tooltip from 'cal-heatmap/plugins/Tooltip';
import 'cal-heatmap/cal-heatmap.css';
import LegendLite from 'cal-heatmap/plugins/LegendLite';
import { ActivityData, MetricType } from './types';
import React, { useEffect, useRef, memo } from "react";
import { 
    convertDataToArray, 
    calculateMaxValue, 
    calculateDateRange, 
    generateColorScale, 
    generateTooltipText 
} from './utils';

interface HeatmapProps {
    data: ActivityData;
    metricType: MetricType;
    year: string;
}

/**
 * React component for rendering the activity heatmap.
 * @param props - The component props.
 * @returns A React element representing the heatmap.
 */
const Heatmap: React.FC<HeatmapProps> = memo(({ data, metricType, year }) => {
    const calRef = useRef<CalHeatmap | null>(null);

    useEffect(() => {
        if (!calRef.current) {
            calRef.current = new CalHeatmap();
        }

        const cal = calRef.current;
        
        const dataArray = convertDataToArray(data)
            .filter(item => item.value !== 0); // Filter out zero values for visual purposes
        const maxValue = calculateMaxValue(dataArray);
        const { startDate, range } = calculateDateRange(year);

        cal.paint(
            {
                data: { 
                    source: dataArray, 
                    x: 'date', 
                    y: 'value'
                },
                date: { start: startDate },
                range: range,
                scale: {
                    color: generateColorScale(maxValue),
                },
                domain: {
                    type: 'month',
                    gutter: 4,
                    label: { text: 'MMM', textAlign: 'start', position: 'top' },
                },
                subDomain: { 
                    type: 'ghDay',
                    radius: 2,
                    width: 8,
                    height: 8,
                    gutter: 3
                },
                itemSelector: '#heatmap-container',
            },
            [
                [
                    Tooltip,
                    {
                        text: generateTooltipText(metricType)
                    }
                ],
                [
                    LegendLite,
                    {
                        itemSelector: '#heatmap-legend',
                        label: 'Contributions',
                        includeBlank: true,
                    }
                ],
            ]
        );

        return () => {
            cal.destroy();
            calRef.current = null;
        };
    }, [data, metricType, year]);

    return (
        <div>
            <div id="heatmap-container"></div>
            <div style={{ float: 'left', fontSize: 11, marginTop: '5px' }}>
            Less
            <div
                id="heatmap-legend"
                style={{ display: 'inline-block', margin: '0 8px' }}
            ></div>
            More
            </div>
        </div>
    );
})

export default Heatmap;
