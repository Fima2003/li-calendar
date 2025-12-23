import React from 'react';
import { DayData, Status, PostRule } from '@/types/calendar';

interface DayCellProps {
    date: Date;
    data?: DayData;
    onClick: () => void;
    isCurrentMonth: boolean;
}

const DayCell: React.FC<DayCellProps> = ({ date, data, onClick, isCurrentMonth }) => {
    if (!isCurrentMonth) {
        return <div className="bg-gray-100 border-r-2 border-b-2 border-gray-200 h-32 opacity-25"></div>;
    }

    // Neobrutalist colors based on status? Or just solid blocks?
    // Let's use status to determine border or accent.
    const getStatusColor = (status?: Status) => {
        switch (status) {
            case Status.CHOOSE_TOPIC: return 'bg-neo-white';
            case Status.THINK_OF_TEXT: return 'bg-neo-yellow';
            case Status.POLISH_TEXT: return 'bg-neo-blue';
            case Status.SCHEDULE: return 'bg-neo-pink';
            case Status.POST: return 'bg-neo-green';
            default: return 'bg-white';
        }
    };

    const dayNumber = date.getDate();

    return (
        <div
            onClick={onClick}
            className={`
        ${getStatusColor(data?.status)}
        border-r-4 border-b-4 border-neo-black
        h-32 p-2 cursor-pointer transition-all hover:bg-opacity-80 relative group
      `}
        >
            <span className="font-bold text-lg">{dayNumber}</span>

            {data && (
                <div className="flex flex-col gap-1 mt-1">
                    {data.status && (
                        <span className="text-xs font-bold uppercase border-2 border-black inline-block px-1 bg-white">
                            {data.status}
                        </span>
                    )}
                    {data.rule && (
                        <span className="absolute top-2 right-2 text-xs font-black text-gray-500">
                            {data.rule}
                        </span>
                    )}
                    {data.topic && (
                        <span className="text-xs truncate font-medium mt-1">
                            {data.topic}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

export default DayCell;
