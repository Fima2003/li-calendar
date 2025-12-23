import React from 'react';
import { CalendarMonthData, PostRule } from '@/types/calendar';

interface StatsWidgetProps {
    data: CalendarMonthData;
}

const StatsWidget: React.FC<StatsWidgetProps> = ({ data }) => {
    const totalPosts = Object.values(data).filter(day => day.rule).length;

    const getCount = (rule: PostRule) => Object.values(data).filter(day => day.rule === rule).length;

    const count70 = getCount(PostRule.RULE_70);
    const count20 = getCount(PostRule.RULE_20);
    const count10 = getCount(PostRule.RULE_10);

    const getPercentage = (count: number) => totalPosts === 0 ? 0 : Math.round((count / totalPosts) * 100);

    return (
        <div className="neo-box p-4 fixed top-4 right-4 z-50 flex gap-4 text-sm font-bold bg-white">
            <div className="text-neo-black">
                <span className="block text-xs uppercase text-gray-500">Value (70%)</span>
                <div className="flex items-end gap-1">
                    <span className="text-xl">{count70}</span>
                    <span className="text-xs text-gray-400 mb-1">({getPercentage(count70)}%)</span>
                </div>
            </div>
            <div className="text-neo-black">
                <span className="block text-xs uppercase text-gray-500">Personal (20%)</span>
                <div className="flex items-end gap-1">
                    <span className="text-xl">{count20}</span>
                    <span className="text-xs text-gray-400 mb-1">({getPercentage(count20)}%)</span>
                </div>
            </div>
            <div className="text-neo-black">
                <span className="block text-xs uppercase text-gray-500">Sales (10%)</span>
                <div className="flex items-end gap-1">
                    <span className="text-xl">{count10}</span>
                    <span className="text-xs text-gray-400 mb-1">({getPercentage(count10)}%)</span>
                </div>
            </div>
        </div>
    );
};

export default StatsWidget;
