"use client";

import React, { useState, useEffect } from 'react';
import { getCalendarData } from '@/services/calendarService';
import { CalendarMonthData } from '@/types/calendar';
import DayCell from './DayCell';
import StatsWidget from './StatsWidget';
// Will implement DayModal next
import DayModal from './DayModal';

const CalendarGrid = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [calendarData, setCalendarData] = useState<CalendarMonthData>({});
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            const data = await getCalendarData(currentDate.getMonth(), currentDate.getFullYear());
            setCalendarData(data);
        };
        fetchData();
    }, [currentDate]);

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const renderDays = () => {
        const totalDays = daysInMonth(currentDate.getFullYear(), currentDate.getMonth());
        const startDay = firstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
        const daysArray = [];

        // Empty cells for previous month
        for (let i = 0; i < startDay; i++) {
            daysArray.push(
                <DayCell
                    key={`empty-${i}`}
                    date={new Date(currentDate.getFullYear(), currentDate.getMonth(), 0 - (startDay - 1 - i))}
                    isCurrentMonth={false}
                    onClick={() => { }}
                />
            );
        }

        // Days of current month
        for (let i = 1; i <= totalDays; i++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
            const dateStr = date.toISOString().split('T')[0];
            const dayData = calendarData[dateStr];

            daysArray.push(
                <DayCell
                    key={i}
                    date={date}
                    data={dayData}
                    isCurrentMonth={true}
                    onClick={() => setSelectedDate(date)}
                />
            );
        }

        return daysArray;
    };

    const handleModalClose = () => {
        setSelectedDate(null);
        // Refresh data after modal closes to show updates
        const fetchData = async () => {
            const data = await getCalendarData(currentDate.getMonth(), currentDate.getFullYear());
            setCalendarData(data);
        };
        fetchData();
    };

    return (
        <div className="min-h-screen bg-neo-white p-8">
            <StatsWidget data={calendarData} />

            <div className="mb-8 flex justify-between items-center">
                <h1 className="text-4xl font-black uppercase text-neo-black shadow-neo-sm inline-block bg-neo-yellow px-4 py-2 border-4 border-black">
                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h1>
                <div className="flex gap-4">
                    <button
                        onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                        className="neo-button bg-white hover:bg-gray-100"
                    >
                        Prev
                    </button>
                    <button
                        onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                        className="neo-button bg-white hover:bg-gray-100"
                    >
                        Next
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 border-t-4 border-l-4 border-neo-black bg-white shadow-neo-lg">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="p-4 border-r-4 border-b-4 border-neo-black font-bold uppercase bg-neo-yellow text-center">
                        {day}
                    </div>
                ))}
                {renderDays()}
            </div>

            {/* Legend */}
            <div className="mt-8 flex flex-wrap gap-6 justify-center">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-neo-white border-2 border-black"></div>
                    <span className="font-bold text-lg">&mdash;</span>
                    <span className="font-bold">Choose Topic</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-neo-yellow border-2 border-black"></div>
                    <span className="font-bold text-lg">&mdash;</span>
                    <span className="font-bold">Think of text</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-neo-blue border-2 border-black"></div>
                    <span className="font-bold text-lg">&mdash;</span>
                    <span className="font-bold">Polish text</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-neo-pink border-2 border-black"></div>
                    <span className="font-bold text-lg">&mdash;</span>
                    <span className="font-bold">Schedule</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-neo-green border-2 border-black"></div>
                    <span className="font-bold text-lg">&mdash;</span>
                    <span className="font-bold">Post</span>
                </div>
            </div>

            {selectedDate && (
                <DayModal
                    date={selectedDate}
                    initialData={calendarData[selectedDate.toISOString().split('T')[0]]}
                    onClose={handleModalClose}
                />
            )}
        </div>
    );
};

export default CalendarGrid;
