import React, { useState, useEffect } from 'react';
import { DayData, Status, PostFormat, PostRule } from '@/types/calendar';
import { updateDay } from '@/services/calendarService';

interface DayModalProps {
    date: Date;
    initialData?: DayData;
    onClose: () => void;
}

const DayModal: React.FC<DayModalProps> = ({ date, initialData, onClose }) => {
    const [data, setData] = useState<DayData>(initialData || { date: date.toISOString().split('T')[0], status: Status.CHOOSE_TOPIC });
    const [loading, setLoading] = useState(false);

    // States for the wizard flow
    // "Choose Topic" -> "Think of text" -> "Polish text" -> "Schedule" -> "Post"

    const statusOrder = [
        Status.CHOOSE_TOPIC,
        Status.THINK_OF_TEXT,
        Status.POLISH_TEXT,
        Status.SCHEDULE,
        Status.POST
    ];

    const currentStatusIndex = statusOrder.indexOf(data.status);
    const isPostLocked = data.status === Status.POST;

    const handleSave = async (newData: DayData) => {
        // Optimistic update
        setData(newData);
        setLoading(true);
        await updateDay(newData);
        setLoading(false);
    };

    const canAdvance = () => {
        switch (data.status) {
            case Status.CHOOSE_TOPIC:
                return !!data.topic && data.topic.trim().length > 0;
            case Status.THINK_OF_TEXT:
                return !!data.notes && data.notes.trim().length > 0;
            case Status.POLISH_TEXT:
                return !!data.finalText && data.finalText.trim().length > 0;
            case Status.SCHEDULE:
                // Already checked finalText in previous step, but good to be safe
                return !!data.finalText && data.finalText.trim().length > 0;
            default:
                return true;
        }
    };

    const advanceStatus = () => {
        if (currentStatusIndex < statusOrder.length - 1 && canAdvance()) {
            const nextStatus = statusOrder[currentStatusIndex + 1];
            handleSave({ ...data, status: nextStatus });
        }
    };

    const retreatStatus = () => {
        if (currentStatusIndex > 0 && !isPostLocked) {
            const prevStatus = statusOrder[currentStatusIndex - 1];
            handleSave({ ...data, status: prevStatus });
        }
    };

    const handleChange = (field: keyof DayData, value: any) => {
        const newData = { ...data, [field]: value };
        setData(newData); // Immediate UI update
        // We can debounce saving if needed, but for now just dont await
        updateDay(newData);
    };

    const renderContent = () => {
        switch (data.status) {
            case Status.CHOOSE_TOPIC:
                return (
                    <div>
                        <label className="block font-bold mb-2">Topic {!canAdvance() && <span className="text-neo-red text-xs ml-2">(Required)</span>}</label>
                        <input
                            type="text"
                            className="neo-input w-full"
                            value={data.topic || ''}
                            onChange={(e) => handleChange('topic', e.target.value)}
                            placeholder="What is this post about?"
                        />
                    </div>
                );
            case Status.THINK_OF_TEXT:
                return (
                    <div>
                        <label className="block font-bold mb-2">Sketches / Notes {!canAdvance() && <span className="text-neo-red text-xs ml-2">(Required)</span>}</label>
                        <textarea
                            className="neo-input w-full h-32"
                            value={data.notes || ''}
                            onChange={(e) => handleChange('notes', e.target.value)}
                            placeholder="Draft your thoughts..."
                        />
                    </div>
                );
            case Status.POLISH_TEXT:
                return (
                    <div>
                        <label className="block font-bold mb-2">Final Text {!canAdvance() && <span className="text-neo-red text-xs ml-2">(Required)</span>}</label>
                        <textarea
                            className="neo-input w-full h-48"
                            value={data.finalText || ''}
                            onChange={(e) => handleChange('finalText', e.target.value)}
                            placeholder="Polish it up!"
                        />
                    </div>
                );
            case Status.SCHEDULE:
                return (
                    <div>
                        <div className="bg-neo-yellow p-4 border-4 border-black mb-4 font-bold">
                            Ready to Schedule?
                        </div>
                        <p className="mb-2">Final Text Review:</p>
                        <div className="neo-box p-4 bg-gray-50 mb-4 whitespace-pre-wrap">
                            {data.finalText || "No text yet."}
                        </div>
                    </div>
                );
            case Status.POST:
                return (
                    <div>
                        <div className="bg-neo-green p-4 border-4 border-black mb-4 font-bold">
                            POSTED / LOCKED
                        </div>
                        <p className="mb-2">Final Content:</p>
                        <div className="neo-box p-4 bg-gray-50 mb-4 whitespace-pre-wrap">
                            {data.finalText}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    // Auto-save on unmount or close? No, let's rely on Explicit "Next" or specific inputs.
    // Actually requirement says "All of the data should be stored, so I can move forwards and backwards without losing any data."
    // So maybe a save on any change? For simplicity, I'll add a "Save" button or save on navigation.
    // Let's save on navigation.

    // But we need rule and format selectors always available (except locked?)
    // "Rule: 70% | 20% | 10%. Select one per post. ... Format: ... Select one per post."
    // These seem distinct from the status flow but tied to the day.

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white border-4 border-neo-black shadow-neo-lg w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-black uppercase bg-neo-pink inline-block px-2 border-2 border-black">
                            {date.toDateString()}
                        </h2>
                        <div className="mt-2 flex gap-2">
                            <span className="text-sm font-bold bg-neo-blue border-2 border-black px-2 py-0.5">
                                {data.status}
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} className="neo-button bg-neo-red leading-none">X</button>
                </div>

                {/* Format & Rule Selectors */}
                <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 border-2 border-black">
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1">Format</label>
                        <select
                            className="neo-input w-full"
                            value={data.format || ''}
                            onChange={(e) => handleChange('format', e.target.value as PostFormat)}
                            disabled={isPostLocked}
                        >
                            <option value="">Select Format</option>
                            {Object.values(PostFormat).map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase mb-1">Rule</label>
                        <select
                            className="neo-input w-full"
                            value={data.rule || ''}
                            onChange={(e) => handleChange('rule', e.target.value as PostRule)}
                            disabled={isPostLocked}
                        >
                            <option value="">Select Rule</option>
                            {Object.values(PostRule).map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="mb-8 min-h-[200px]">
                    {renderContent()}
                </div>

                {/* Navigation Actions */}
                <div className="flex justify-between items-center border-t-4 border-black pt-4">
                    <button
                        onClick={retreatStatus}
                        disabled={currentStatusIndex === 0 || isPostLocked}
                        className="neo-button bg-gray-200 disabled:opacity-50"
                    >
                        Back
                    </button>

                    <div className="flex gap-2">
                        {!isPostLocked && (
                            <button
                                onClick={() => handleSave(data)}
                                className="neo-button bg-neo-blue"
                            >
                                Save
                            </button>
                        )}

                        {currentStatusIndex < statusOrder.length - 1 && (
                            <button
                                onClick={advanceStatus}
                                disabled={!canAdvance()}
                                className="neo-button bg-neo-yellow disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next: {statusOrder[currentStatusIndex + 1]}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DayModal;
