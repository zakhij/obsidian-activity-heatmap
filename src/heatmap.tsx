import CalHeatmap from 'cal-heatmap';
import Tooltip from 'cal-heatmap/plugins/Tooltip';
import 'cal-heatmap/cal-heatmap.css';
import LegendLite from 'cal-heatmap/plugins/LegendLite';
import { ActivityData, ActivityHeatmapSettings } from './types';
import React, { useEffect, useRef, memo } from "react";

const Heatmap: React.FC<{ data: ActivityData, metricType: ActivityHeatmapSettings['metricType'], year: ActivityHeatmapSettings['year'] }> = memo(({ data, metricType, year }) => {
    const calRef = useRef<CalHeatmap | null>(null);

    useEffect(() => {
        if (!calRef.current) {
            calRef.current = new CalHeatmap();
        }

        const cal = calRef.current;
        
        const dataArray = Object.entries(data).map(([date, value]) => ({ date, value }));
        const maxValue = Math.max(...dataArray.map(item => item.value));

        // Calculate the cal start & range based on the year selected
        const startDate = new Date();
        let range: number;
        if (year === 'Past Year') {
            startDate.setFullYear(startDate.getFullYear() - 1);
            range = 13;
        } else {
            startDate.setFullYear(parseInt(year), 0, 1);
            range = 12;
        }

        cal.paint(
            {
                data: { source: dataArray, x: 'date', y: 'value' },
                date: { start: startDate },
                range: range,
                scale: {
                    color: {
                        type: 'threshold',
                        range: ['#14432a', '#166b34', '#37a446', '#4dd05a'],
                        domain: [0, Math.floor(maxValue / 3), Math.floor((2 * maxValue) / 3), maxValue],
                    },
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
                        text: function(date: any, value: any, dayjsDate: any) {
                            return value ? `${value} ${metricType} changes on ${dayjsDate.format('MMMM D, YYYY')}` : `No ${metricType} changes on ${dayjsDate.format('MMMM D, YYYY')}`;
                        }
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
